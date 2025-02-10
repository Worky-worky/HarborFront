'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { count } from "console";
import { plaidClient } from "@/lib/plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;




export const getUserInfo = async ({ userId }: 
  getUserInfoProps) => {
    try {
      const { database } = await createAdminClient();
      const user = await database.listDocuments(
        DATABASE_ID!,
        USER_COLLECTION_ID!,
        [Query.equal('userid', [userId])]
      )
  
      return parseStringify(user.documents[0]);
    } catch (error) {
      console.error(error);
    }
  }

export const signIn = async ({email, password}: signInProps) => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);
      
    const cookieStore = (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      });
  
      console.log('Session cookie set');
      const user = await getUserInfo({userId: session.userId});
      return parseStringify(user);
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    }
  };

export const signUp = async ({ password, ...userData}: SignUpParams) => {
  const {email, firstName, lastName} = userData;
  let newUserAccount;
 
  try {
    const { account, database } = await createAdminClient();

    // Create new user account
    newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`
    );

    if (!newUserAccount) {
      throw new Error('User account creation failed');
    }

    const dwollaCustomerUrl = await createDwollaCustomer({
      ...userData,
      type: 'personal',
    });

    if (!dwollaCustomerUrl) {
      throw new Error('Dwolla customer creation failed');
    }
 
    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        name: `${firstName} ${lastName}`,
        userid: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrll: dwollaCustomerUrl, 
      }
    );

    // Create session
    const session = await account.
    createEmailPasswordSession(email, password);

    // Set session cookie
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(newUser);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`User account creation failed: ${errorMessage}`);
  }
};

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();    
    
    const user = await getUserInfo({ userId: result.$id})
  
    return parseStringify(user);
  } catch (error) {
    console.log(error)
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();

    (await cookies()).delete('appwrite-session');

    await account.deleteSession("current");

  } catch (error) {
    return null;
  }
}

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id,
      },
     client_name: `${user.firstName} ${user.lastName}`,
     products: ['auth'] as Products[],
     language: 'en',
     country_codes: ['US'] as CountryCode[],
    };

    const response = await plaidClient.linkTokenCreate(tokenParams);

    return parseStringify({ linkToken: response.data.link_token});
  } catch (error) {
    console.log('error');
  }
}

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  sharableId,
}: createBankAccountProps) => {
  try {
    console.log('Creating bank account with data:', {
      userId,
      bankId,
      accountId,
      fundingSourceUrl,
      sharableId
    });

    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl: fundingSourceUrl || '',
        shareableId: sharableId
      }
    );

    console.log('Successfully created bank record:', bankAccount);
    return parseStringify(bankAccount);
  } catch (error) {
    console.log('Bank creation details:', error);
    throw error;
  }
};


export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    const processorToken = await plaidClient.processorTokenCreate({
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: ProcessorTokenCreateRequestProcessorEnum.Dwolla
    });

    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken: processorToken.data.processor_token,
      bankName: accountData.name,
    });

    // Using the document $id as the userId for consistent querying
    const bankAccount = await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl: fundingSourceUrl || '',
      sharableId: encryptId(accountData.account_id),
    });

    console.log('Created bank account:', bankAccount);
    revalidatePath('/');
    return bankAccount;
  } catch (error) {
    console.log('Token exchange details:', error);
    throw error;
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();
    
    // Get the user document first
    const user = await database.getDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      userId
    );

    // Query banks using the document ID
    const userBanks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('userId', user.$id)]
    );
    
    console.log('Querying banks for user:', user.$id);
    console.log('Bank records found:', userBanks.documents);

    return parseStringify(userBanks.documents);
  } catch (error) {
    console.log('Bank fetch details:', error);
    return [];
  }
};

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const { database } = await createAdminClient();
    const bank = await database.getDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      documentId
    );
    
    return parseStringify(bank);
  } catch (error) {
    return null;
  }
};


