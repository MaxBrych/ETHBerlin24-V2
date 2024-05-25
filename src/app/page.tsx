"use client";
import Image from "next/image";

import { ConnectWallet, useAddress } from "@thirdweb-dev/react";
import { useRouter } from "next/navigation";

const client = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

export default function Home() {
  const address = useAddress();

  const router = useRouter();

  const handleProfileRedirect = () => {
    if (address) {
      router.push(`/profile/${address}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {!address ? (
        <ConnectWallet btnTitle="Sign In" theme="dark" />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-center">Welcome to your new app!</h1>
          <button
            onClick={handleProfileRedirect}
            className="mt-8 px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Go to your profile
          </button>
        </div>
      )}
    </main>
  );
}
