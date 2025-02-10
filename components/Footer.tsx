import { logoutAccount } from '@/lib/actions/user.actions'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'

const Footer = ({ user, type = 'desktop' }: FooterProps) => {
  const router = useRouter();

  const handleLogOut = async () => {
    const loggedOut = await logoutAccount();

    if(loggedOut) router.push('/sign-in')
  }

  return (
    <footer className="footer flex flex-col">
      <div className="flex items-center">
        <div className={type === 'mobile' ? 'footer_name-mobile' : 'footer_name'}>
          <p className="text-xl font-bold text-gray-700">
            {user?.firstName[0]}
          </p>
        </div>

        <div className={type === 'mobile' ? 'footer_email-mobile' : 'footer_email'}>
          <h1 className="text-14 truncate text-gray-700 font-semibold">
            {user?.firstName}
          </h1>
          <p className="text-14 truncate font-normal text-gray-600">
            {user?.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 cursor-pointer 
        mt-4 w-full text-black" 
        onClick={handleLogOut}
      >
        <Image
          src="icons/logout.svg"
          width={24}
          height={24}
          alt="logout"
        />
        <span className="text-gray-700">Logout</span>
      </div>
    </footer>
  )
}

export default Footer