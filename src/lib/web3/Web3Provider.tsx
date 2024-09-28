"use client";

import '@rainbow-me/rainbowkit/styles.css';
import {
  connectorsForWallets,
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
  rainbowWallet, coinbaseWallet, metaMaskWallet,
  uniswapWallet
} from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig, http } from 'wagmi';
import {
  mainnet,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, uniswapWallet, rainbowWallet],
    },
  ],
  {
    appName: 'Element EVault',
    projectId: '9ecb3ec31f707e04be21e1174316fb01',
  }
);

// const config = getDefaultConfig({
//   appName: 'Element EVault',
//   projectId: '9ecb3ec31f707e04be21e1174316fb01',
//   chains: [mainnet],
//   ssr: true, // If your dApp uses server side rendering (SSR)
//   // transports: {
//   //   [mainnet.id]: http(Math.trunc(Math.random() * 10) % 2 === 0 
//   //     ? 'https://site1.moralis-nodes.com/eth/9d73272ea2ed481b857ffc729a5e127c'
//   //     : 'https://site2.moralis-nodes.com/eth/9d73272ea2ed481b857ffc729a5e127c'),
//   // }
//   transports: {
//     [mainnet.id]: http('https://cloudflare-eth.com'),
//   }
// });

const rpcNode = Math.trunc(Math.random() * 10) % 2 === 0 
  ? 'https://site1.moralis-nodes.com/eth/9d73272ea2ed481b857ffc729a5e127c'
  : 'https://site2.moralis-nodes.com/eth/9d73272ea2ed481b857ffc729a5e127c';

const config = createConfig({
  connectors,
  chains: [mainnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
  transports: {
    //[mainnet.id]: http('https://cloudflare-eth.com'),
    [mainnet.id]: http(rpcNode),
  }
});

const queryClient = new QueryClient();
export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize='compact'>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};