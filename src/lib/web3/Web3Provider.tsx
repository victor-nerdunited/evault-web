"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { structuralSharing } from "wagmi/query";

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet],
    transports: {
      // RPC URL for each chain
      [mainnet.id]: http(
        //`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`,
        "https://cloudflare-eth.com"
      ),
    },

    // Required API Keys
    walletConnectProjectId: "9ecb3ec31f707e04be21e1174316fb01", // process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,

    // Required App Info
    appName: "eVault",

    // Optional App Info
    appDescription: "Gold, silver, minerals digital exchange",
    appUrl: "https://elmt.store", // your app's url
    appIcon: "https://elmt.shop/store.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      structuralSharing: false,
    },
  },
});

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};