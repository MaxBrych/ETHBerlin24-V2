"use client";
import { Key, useEffect, useState } from "react";
import { init, useQuery } from "@airstack/airstack-react";
import GET_PROFILE_INFO from "@/app/graphql/query";
import CastsList from "@/components/CastsList";
import { usePublications, PublicationType, LimitType } from "@lens-protocol/react-web";

export default function ProfilePage() {
  const [apiInitialized, setApiInitialized] = useState(false);
  const identity = "0x648aa14e4424e0825a5ce739c8c68610e143fb79";

  useEffect(() => {
    if (typeof window !== "undefined") {
      init(process.env.NEXT_PUBLIC_AIRSTACK_API_KEY as string);
      setApiInitialized(true);
    }
  }, []);

  const { data, loading, error } = useQuery(
    apiInitialized ? GET_PROFILE_INFO : "",
    apiInitialized ? { identity } : null
  );

  useEffect(() => {
    if (apiInitialized) {
      console.log("Query being sent:", GET_PROFILE_INFO);
      console.log("Variables being sent:", { identity });
    }
  }, [apiInitialized]);

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

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-20">Error: {error.message}</div>;

  const renderProfileSection = (title, profile) => (
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
        data.farcasterSocials.Social.map((profile: any, index: Key | null | undefined) => (
          <div key={index} className="w-full max-w-2xl">
            {renderProfileSection("Farcaster Profile", profile)}
          </div>
        ))}

      {data?.FarcasterCasts?.Cast && <CastsList casts={data.FarcasterCasts.Cast} />}
    </div>
  );
}
