import React from 'react'
import HeaderBox from '@/components/HeaderBox'
import TotalBalanceBox from '@/components/TotalBalanceBox'
import RightSidebar from '@/components/RightSidebar'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation';

const Home = async () => {
  const user = await getLoggedInUser();
 
  if (!user) {
    redirect('/sign-up');
  }

  // Sample bank data to display cards
  const sampleBanks = [
    {
      $id: '1',
      currentBalance: 580000.00,
      mask: '6473'
    },
    {
      $id: '2',
      currentBalance: 930000.00,
      mask: '8901'
    }
  ];

  return (
    <section className='home'>
      <div className='home-content'>
        <header className='home-header'>
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={user?.name || 'Guest'}
            subtext="Access and manage your account and transactions efficiently"
          />
          <TotalBalanceBox
            accounts={sampleBanks}
            totalBanks={sampleBanks.length}
            totalCurrentBalance={sampleBanks.reduce((acc, bank) => acc + bank.currentBalance, 0)}
          />
        </header>

        RECENT TRANSACTIONS
      </div>

      <RightSidebar
        user={user}
        transactions={[]}
        banks={sampleBanks}
      />
    </section>
  )
}

export default Home
