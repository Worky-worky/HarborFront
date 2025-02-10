import React from 'react'
import HeaderBox from '@/components/HeaderBox'
import TotalBalanceBox from '@/components/TotalBalanceBox'
import RightSidebar from '@/components/RightSidebar'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'

const Home = async ({ searchParams }: { searchParams: { id?: string; page?: string } }) => {
  const user = await getLoggedInUser();
  
  const accounts = await getAccounts({
    userId: user?.$id
  });

  const accountsData = accounts?.data || [];
  const defaultBankId = accountsData[0]?.appwriteItemId;
  const selectedBankId = defaultBankId;  // Remove searchParams reference for now

  const selectedAccount = await getAccount({ appwriteItemId: selectedBankId });

  // Add these logs to track data flow
  console.log('Selected Account:', selectedAccount);
  console.log('AccountsData:', accountsData);

  return (
    <section className='home'>
      <div className='home-content'>
        <header className='home-header'>
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={user?.firstName || 'Guest'}
            subtext="Access and manage your account and transactions efficiently"
          />
          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />
        </header>
        <div className="transactions-section">
          RECENT TRANSACTIONS
        </div>
      </div>

      <RightSidebar
        user={user}
        transactions={selectedAccount?.transactions || []}
        banks={accountsData}
      />
    </section>
  );
};

export default Home;


