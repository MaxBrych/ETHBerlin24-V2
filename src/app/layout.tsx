"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AirstackProvider } from "@airstack/airstack-react/provider";
import Providers from "@/components/provider";
import {
  ThirdwebProvider,
  coinbaseWallet,
  metamaskWallet,
  localWallet,
  walletConnect,
} from "@thirdweb-dev/react";
import Navbar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

const client = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ThirdwebProvider
        clientId={client}
        activeChain="base"
        supportedWallets={[
          metamaskWallet({ recommended: true }),

          coinbaseWallet({ recommended: true }),
          walletConnect(),
          localWallet(),
        ]}
      >
        <body className={inter.className}>
          <main>
            <Navbar />
            {children}
          </main>
        </body>
      </ThirdwebProvider>
    </html>
  );
}
