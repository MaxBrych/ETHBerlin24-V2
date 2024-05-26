import {
  useAddress,
  useDisconnect,
  useNetworkMismatch,
  useSwitchChain,
  useChainId,
  ConnectWallet,
} from "@thirdweb-dev/react";
import { Base } from "@thirdweb-dev/chains";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const address = useAddress();
  const walletAddress = useAddress();
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
    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_PROVIDER_URL);

    const fetchEnsDetails = async () => {
      if (walletAddress) {
        const ensNameLookup = await provider.lookupAddress(walletAddress);
        if (ensNameLookup) {
          setEnsName(ensNameLookup);

          const client = new ApolloClient({
            uri: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
            cache: new InMemoryCache(),
          });

          const query = gql`
              {
                domains(where:{name:"${ensNameLookup}"}) {
                  id
                  name
                  resolver {
                    texts
                  }
                }
              }
            `;

          const result = await client.query({
            query,
          });
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
      }
    };
    if (walletAddress) {
      fetchEnsDetails();
    }
  }, [walletAddress]);

  const handleProfileRedirect = () => {
    if (address) {
      router.push(`/profile/${address}`);
    }
  };

  return (
    <div className="w-full rounded-xl py-2">
      <div className="justify-between align-middle">
        <div className="aligm-items-center flex gap-2">
          {!walletAddress ? (
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
              onClick={() => disconnect()}
            >
              Switch Network
            </button>
          ) : (
            <div className="flex gap-1 align-middle">
              <ConnectWallet
                theme={"light"}
                btnTitle={"Sign in"}
                modalTitle={"Choose Wallet"}
                auth={{ loginOptional: false }}
                switchToActiveChain={true}
                modalSize={"compact"}
              />
              <div className="flex gap-1 align-middle">
                <button className="text-decoration-none text-md" onClick={handleProfileRedirect}>
                  <Image
                    src={
                      ensRecords.avatar ||
                      avatarUrl ||
                      "https://cdn.discordapp.com/attachments/911669935363752026/1235130482258350080/Ellipse_3.png?ex=66334066&is=6631eee6&hm=53326069028bf630c903aea356fe319f841413db48782ecb39a9f53cc518c66b&"
                    }
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
