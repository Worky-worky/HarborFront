import Image from "next/image";
import Link from "next/link";
import React from "react";
import BankCard from "./BankCard";

const RightSidebar = ({ user, transactions, banks }: RightSidebarProps) => {
  // Add this console log to verify data
  console.log("Banks before mapping:", banks);

  const transformedBanks = banks?.map(bank => {
    // Add this to debug individual bank data
    console.log("Processing bank:", bank);
    
    return {
      id: bank.accountId,
      availableBalance: 1000, // Set a test value to verify display
      currentBalance: 1000,   // Set a test value to verify display
      officialName: bank.bankId,
      mask: bank.sharableId?.slice(-4) || '1234',
      institutionId: bank.bankId,
      name: bank.bankId,
      type: 'checking',
      subtype: 'checking',
      appwriteItemId: bank.$id,
      sharableId: bank.sharableId
    };
  });

  // Add this to verify transformed data
  console.log("Transformed banks:", transformedBanks);

  return (
    <aside className="right-sidebar">
      <section className="flex flex-col pb-8">
        <div className="profile-banner" />
        <div className="profile">
          <div className="profile-img">
            <span className="text-5xl font-bold text-blue-500">
              {user.firstName[0]}
            </span>
          </div>

          <div className="profile-details">
            <h1 className="profile-name">
              {user.firstName} {user.lastName}
            </h1>
            <p className="profile-email">
              {user?.email || "No email provided"}
            </p>
          </div>
        </div>
      </section>

      <section className="Banks">
        <div className="flex w-full justify-between mb-8">
          <h2 className="header-2 ml-6">My Banks</h2>
          <Link href="/link-bank" className="flex gap-2">
            <Image src="/icons/plus.svg" width={20} height={20} alt="plus" />
            <h2 className="text-14 font-semibold text-gray-600 mr-4">
              Add Bank
            </h2>
          </Link>
        </div>

        <div className="relative min-h-[200px] w-full px-4">
          {transformedBanks && transformedBanks.length > 0 ? (
            transformedBanks.map((bank, index) => (
              <div
                key={bank.id}
                className={`absolute ${
                  index === 0 ? "top-0 w-full" : "top-9 w-[95%]"
                } left-1/2 -translate-x-1/2 transform`}
                style={{ 
                  zIndex: transformedBanks.length - index,
                  visibility: 'visible', // Force visibility
                  opacity: 1 // Ensure full opacity
                }}
              >
                <BankCard
                  account={bank}
                  userName={`${user.firstName} ${user.lastName}`}
                  showBalance={true}
                />
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 mt-4">
              No banks connected yet
            </div>
          )}
        </div>
      </section>
    </aside>
  );
};


export default RightSidebar;
