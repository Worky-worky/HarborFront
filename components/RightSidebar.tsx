import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import BankCard from './BankCard'

const RightSidebar = ({user, transactions, banks}: 
    RightSidebarProps) => {
  return (
    <aside className='right-sidebar'>
      <section className='flex flex-col pb-8'>
        <div className='profile-banner'/>
        <div className='profile'>
          <div className='profile-img'>
            <span className='text-5xl font-bold text-blue-500'>
              {user.firstName[0]}
            </span>
          </div>

          <div className='profile-details'>
            <h1 className='profile-name'>
              {user.firstName} {user.lastName}
            </h1>
            <p className='profile-email'>
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <section className='Banks'>
        <div className='flex w-full justify-between mb-8'>
          <h2 className='header-2 ml-6'>My Banks</h2>
          <Link href="/" className='flex gap-2'>
            <Image 
              src="/icons/plus.svg"
              width={20}
              height={20}
              alt='plus'
            />
            <h2 className='text-14 font-semibold text-gray-600 mr-4'>
              Add Bank
            </h2>
          </Link>
        </div>

        {banks?.length > 0 && (
          <div className='relative h-[200px] w-full px-4 ml-4'>
            {banks[1] && (
              <div className='absolute top-9 left-1/2 -translate-x-1/2 w-[95%] transform '>
                <BankCard 
                  key={banks[1].$id}
                  account={banks[1]}
                  userName={`${user.firstName} ${user.lastName}`}
                  showBalance={false}
                />
              </div>
            )}
            <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full transform '>
              <BankCard 
                key={banks[0].$id}
                account={banks[0]}
                userName={`${user.firstName} ${user.lastName}`}
                showBalance={false}
              />
            </div>
          </div>
        )}
      </section>
    </aside>
  )
}

export default RightSidebar
