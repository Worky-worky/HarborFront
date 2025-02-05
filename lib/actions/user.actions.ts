'use server';

import { ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { parseStringify } from "../utils";

export const signIn = async ({email, password}: signInProps) => {
  try {
    const { account } = await createAdminClient();

    // Create session
    const session = await account.createEmailPasswordSession(email, password);

    // Set session cookie
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    // Return session data
    return parseStringify(session);
  } catch (error) {
    console.error('Error', error);
    return null;
  }
};



export const signUp = async (userData: SignUpParams) => {
  const {email, password, firstName, lastName} = userData;

  try {
    const { account } = await createAdminClient();

    // Create new user account
    const newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`
    );

    // Create session
    const session = await account.createEmailPasswordSession(email, password);

    // Set secure cookie
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    // Return the new user data
    return newUserAccount;
  } catch (error) {
    throw new Error('Failed to create user account');
  }
}



export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const session = await account.getSession('current');
    
    if (!session) {
      return null;
    }
    
    const user = await account.get();
    return parseStringify(user);
  } catch (error) {
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
