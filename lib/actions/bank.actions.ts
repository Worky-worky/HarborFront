"use server";

import {
  ACHClass,
  CountryCode,
  TransferAuthorizationCreateRequest,
  TransferCreateRequest,
  TransferNetwork,
  TransferType,
} from "plaid";

import { plaidClient } from "../plaid";
import { parseStringify } from "../utils";

// import { getTransactionsByBankId } from "./transaction.actions";
import { getBanks, getBank } from "./user.actions";

// Get multiple bank accounts
export const getAccounts = async ({ userId }: getAccountsProps) => {
    try {
      console.log('Fetching banks for userId:', userId);
      const banks = await getBanks({ userId });
      console.log('Banks fetched:', banks);
  
      if (!banks || banks.length === 0) {
        console.log('No banks found for user');
        return parseStringify({
          data: [],
          totalBanks: 0,
          totalCurrentBalance: 0
        });
      }
  
      const accounts = await Promise.all(
        banks.map(async (bank: Bank) => {
          console.log('Processing bank:', bank.$id);
          const accountsResponse = await plaidClient.accountsGet({
            access_token: bank.accessToken,
          });
          
          const accountData = accountsResponse.data.accounts[0];
          console.log('Plaid account data received:', accountData.account_id);
  
          const institution = await getInstitution({
            institutionId: accountsResponse.data.item.institution_id!,
          });
  
          return {
            id: accountData.account_id,
            availableBalance: accountData.balances.available!,
            currentBalance: accountData.balances.current!,
            institutionId: institution.institution_id,
            name: accountData.name,
            officialName: accountData.official_name,
            mask: accountData.mask!,
            type: accountData.type as string,
            subtype: accountData.subtype! as string,
            appwriteItemId: bank.$id,        
            sharaebleId: bank.sharableId,
          };
        })
      );
  
      const totalBanks = accounts.length;
      const totalCurrentBalance = accounts.reduce((total, account) =>
        total + account.currentBalance, 0
      );
  
      console.log('Final accounts data:', accounts);
      return parseStringify({
        data: accounts,
        totalBanks,
        totalCurrentBalance
      });
    } catch (error) {
      console.error("An error occurred while getting the accounts:", error);
      return parseStringify({
        data: [],
        totalBanks: 0,
        totalCurrentBalance: 0
      });
    }
  };
  
// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
    // Return early if no appwriteItemId provided
    if (!appwriteItemId) {
      return parseStringify({
        data: null,
        transactions: [],
      });
    }
  
    try {
      const bank = await getBank({ documentId: appwriteItemId });
      
      // Handle case when bank is not found
      if (!bank) {
        return parseStringify({
          data: null,
          transactions: [],
        });
      }
  
      const accountsResponse = await plaidClient.accountsGet({
        access_token: bank.accessToken,
      });
      const accountData = accountsResponse.data.accounts[0];
  
      const transferTransactionsData = await getTransactionsByBankId({
        bankId: bank.$id,
      });
  
      const transferTransactions = transferTransactionsData.documents.map(
        (transferData: Transaction) => ({
          id: transferData.$id,
          name: transferData.name!,
          amount: transferData.amount!,
          date: transferData.$createdAt,
          paymentChannel: transferData.channel,
          category: transferData.category,
          type: transferData.senderBankId === bank.$id ? "debit" : "credit",
        })
      );
  
      const institution = await getInstitution({
        institutionId: accountsResponse.data.item.institution_id!,
      });
  
      const transactions = await getTransactions({
        accessToken: bank.accessToken,
      });
  
      const account = {
        id: accountData.account_id,
        availableBalance: accountData.balances.available!,
        currentBalance: accountData.balances.current!,
        institutionId: institution.institution_id,
        name: accountData.name,
        officialName: accountData.official_name,
        mask: accountData.mask!,
        type: accountData.type as string,
        subtype: accountData.subtype! as string,
        appwriteItemId: bank.$id,
      };
  
      const allTransactions = [...transactions, ...transferTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  
      return parseStringify({
        data: account,
        transactions: allTransactions,
      });
    } catch (error) {
      return parseStringify({
        data: null,
        transactions: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

// Get bank info
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });

    const intitution = institutionResponse.data.institution;

    return parseStringify(intitution);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};

// Get transactions
export const getTransactions = async ({
  accessToken,
}: getTransactionsProps) => {
  let hasMore = true;
  let transactions: any = [];

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
      });

      const data = response.data;

      transactions = response.data.added.map((transaction) => ({
        id: transaction.transaction_id,
        name: transaction.name,
        paymentChannel: transaction.payment_channel,
        type: transaction.payment_channel,
        accountId: transaction.account_id,
        amount: transaction.amount,
        pending: transaction.pending,
        category: transaction.category ? transaction.category[0] : "",
        date: transaction.date,
        image: transaction.logo_url,
      }));

      hasMore = data.has_more;
    }

    return parseStringify(transactions);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};