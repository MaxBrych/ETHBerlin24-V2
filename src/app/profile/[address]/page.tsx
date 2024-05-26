"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { init, useQuery } from "@airstack/airstack-react";
import GET_PROFILE_INFO from "@/app/graphql/query";
import CastsList from "@/components/CastsList";
import {
  ConnectWallet,
  useAddress,
  useContract,
  useContractWrite,
  useStorageUpload,
} from "@thirdweb-dev/react";

const themes = {
  light: `
    body { background-color: red; color: black; }
    .bg { background-color: white; }
    .text { color: black; }
  `,
  dark: `
    body { background-color: blue; color: white; }
    .bg { background-color: black; }
    .text { color: white; }
  `,
  highContrast: `
    body { background-color: yellow; color: blue; }
    .bg { background-color: yellow; }
    .text { color: blue; }
  `,
};

export default function ProfilePage() {
  const [currentTheme, setCurrentTheme] = useState("light");
  const [themeCSS, setThemeCSS] = useState("");
  const address = useAddress();
  const [apiInitialized, setApiInitialized] = useState(false);
  const { address: walletAddress } = useParams(); // Fetch wallet address from URL
  const { mutateAsync: upload } = useStorageUpload();

  // Smart contract information
  const contractAddress = "0x7b0Be0B88762f0b9c2526A1B87E5E95A0a47EF55";
  const { contract } = useContract(contractAddress);
  const { mutateAsync: setThemeCID } = useContractWrite(contract, "setThemeCID");

  const saveThemeToIPFS = async (theme) => {
    const file = new File([theme], "theme.css");
    const uris = await upload({ data: [file] });
    return uris[0]; // Return the URI of the uploaded file
  };

  const loadThemeFromIPFS = async (cid) => {
    const response = await fetch(cid);
    return await response.text();
  };

  const changeTheme = async (theme) => {
    const css = themes[theme];
    setThemeCSS(css);
    setCurrentTheme(theme);
    const cid = await saveThemeToIPFS(css);
    console.log(`Theme saved with CID: ${cid}`);
    saveCIDOnChain(cid);
  };

  const saveCIDOnChain = async (cid) => {
    try {
      const tx = await setThemeCID({ args: [cid] });
      console.log("CID saved on-chain:", cid);
    } catch (error) {
      console.error("Error saving CID on-chain:", error);
    }
  };

  const loadCIDFromChain = async () => {
    try {
      const cid = await contract.call("getThemeCID", walletAddress);
      if (cid) {
        const themeCSS = await loadThemeFromIPFS(cid);
        setThemeCSS(themeCSS);
        console.log("Loaded theme from IPFS:", themeCSS);
      }
    } catch (error) {
      console.error("Error loading CID from chain:", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      init(process.env.NEXT_PUBLIC_AIRSTACK_API_KEY as string);
      setApiInitialized(true);
    }
  }, []);

  const { data, loading, error } = useQuery(
    apiInitialized && walletAddress ? GET_PROFILE_INFO : "",
    apiInitialized && walletAddress ? { identity: walletAddress } : null
  );

  useEffect(() => {
    if (apiInitialized && walletAddress) {
      console.log("Query being sent:", GET_PROFILE_INFO);
      console.log("Variables being sent:", { identity: walletAddress });
    }
  }, [apiInitialized, walletAddress]);

  useEffect(() => {
    if (error) {
      console.error("Error fetching data:", error);
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      console.log("Resolved data:", data);
    }
  }, [data]);

  useEffect(() => {
    if (walletAddress) {
      loadCIDFromChain();
    }
  }, [walletAddress]);

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-20">Error: {error.message}</div>;

  const renderProfileSection = (profile) => (
    <div className="bg-gray-800 text-white rounded-lg shadow-md p-6 mt-6 w-full max-w-2xl">
      <div className="flex items-center space-x-4">
        <img
          src={profile.profileImage}
          alt={profile.profileName}
          className="w-24 h-24 rounded-full"
        />
        <div>
          <h2 className="text-xl font-bold">{profile.profileDisplayName}</h2>
          <p className="text-gray-400">@{profile.profileHandle}</p>
          <p className="mt-2">{profile.profileBio}</p>
          <p className="mt-1 text-sm text-gray-400">
            Followers: {profile.followerCount} | Following: {profile.followingCount}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mt-6">Profile Info</h1>
      <style>{themeCSS}</style>
      <div className={currentTheme}>
        {!address ? (
          <ConnectWallet btnTitle="Sign In" theme="dark" />
        ) : (
          walletAddress.toLowerCase() === address.toLowerCase() && (
            <div className="mt-4">
              <p>Connected with: {address}</p>
              <button onClick={() => changeTheme("light")} className="mr-2">
                Light Theme
              </button>
              <button onClick={() => changeTheme("dark")} className="mr-2">
                Dark Theme
              </button>
              <button onClick={() => changeTheme("highContrast")}>High Contrast</button>
            </div>
          )
        )}
      </div>
      {data?.Wallet && (
        <div className="bg-gray-800 text-white rounded-lg shadow-md p-6 mt-6 w-full max-w-2xl text-center">
          <img
            src={data.Wallet.primaryDomain?.avatar}
            alt={data.Wallet.primaryDomain?.name}
            className="w-24 h-24 rounded-full mx-auto"
          />
          <h2 className="text-xl font-bold mt-2">{data.Wallet.primaryDomain?.name}</h2>
          <p className="mt-2">Address: {data.Wallet.addresses[0]}</p>
          <p className="mt-1 text-sm text-gray-400">
            XMTP: {data.Wallet.xmtp[0]?.isXMTPEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>
      )}
      {data?.farcasterSocials?.Social &&
        data.farcasterSocials.Social.map((profile, index) => (
          <div key={index} className="w-full max-w-2xl">
            {renderProfileSection(profile)}
          </div>
        ))}
      {data?.FarcasterCasts?.Cast && <CastsList casts={data.FarcasterCasts.Cast} />}
    </div>
  );
}
