import {
  useAddress,
  useDisconnect,
  useNetworkMismatch,
  useSwitchChain,
  useChainId,
  ConnectWallet,
} from "@thirdweb-dev/react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { Base } from "@thirdweb-dev/chains";

export default function Navbar() {
  const address = useAddress();
  const disconnect = useDisconnect();
  const isMismatched = useNetworkMismatch();
  const switchChain = useSwitchChain();
  const chainId = useChainId();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensRecords, setEnsRecords] = useState<Record<string, string>>({});
  const [isLoading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (address) {
      const providerUrl = process.env.NEXT_PUBLIC_PROVIDER_URL;
      if (!providerUrl) {
        console.error("Provider URL is not set in environment variables");
        return;
      }

      const provider = new ethers.providers.JsonRpcProvider(providerUrl);

      const fetchEnsDetails = async () => {
        try {
          const ensNameLookup = await provider.lookupAddress(address);
          if (ensNameLookup) {
            setEnsName(ensNameLookup);

            const client = new ApolloClient({
              uri: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
              cache: new InMemoryCache(),
            });

            const query = gql`
              {
                domains(where: { name: "${ensNameLookup}" }) {
                  id
                  name
                  resolver {
                    texts
                  }
                }
              }
            `;

            const result = await client.query({ query });
            if (result.data && result.data.domains.length > 0 && result.data.domains[0].resolver) {
              const resolver = await provider.getResolver(ensNameLookup);
              if (resolver) {
                const texts = result.data.domains[0].resolver.texts || [];

                const textRecords = await Promise.all(
                  texts.map((key: string) => resolver.getText(key))
                );
                const newRecords: Record<string, string> = {};
                texts.forEach((text: string, index: number) => {
                  newRecords[text] = textRecords[index];
                });

                setEnsRecords(newRecords);
              }
              setLoading(false);
            }
          }
        } catch (error) {
          console.error("Error fetching ENS details:", error);
        }
      };

      fetchEnsDetails();
    }
  }, [address]);

  useEffect(() => {
    console.log("Chain ID from useChainId:", chainId);
    console.log("Expected Chain ID:", Base.chainId);
    if (chainId && chainId === Base.chainId) {
      console.log("Networks match!");
    } else {
      console.warn("Network mismatch detected.");
    }
  }, [chainId]);

  const handleProfileRedirect = () => {
    if (address) {
      router.push(`/profile/${address}`);
    }
  };

  return (
    <div className="w-full rounded-xl py-2">
      <div className="justify-between align-middle">
        <div className="align-items-center flex gap-2">
          {!address ? (
            <ConnectWallet
              theme={"light"}
              btnTitle={"Sign in"}
              modalTitle={"Choose Wallet"}
              auth={{ loginOptional: false }}
              switchToActiveChain={true}
              modalSize={"compact"}
            />
          ) : isMismatched ? (
            <button
              className="px-4 text-sm font-semibold bg-white text-black rounded-full h-9"
              onClick={() => switchChain(Base.chainId)}
            >
              Switch Network
            </button>
          ) : (
            <div className="flex gap-1 align-middle">
              <button
                onClick={handleProfileRedirect}
                className="mt-8 px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Go to your profile
              </button>
              <div className="flex gap-1 align-middle">
                <button className="text-decoration-none text-md" onClick={handleProfileRedirect}>
                  <Image
                    src={ensRecords.avatar || avatarUrl || ""}
                    alt="Avatar"
                    height={48}
                    width={48}
                    className="border border-gray-300 rounded-full"
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}