// "use client";
// import { createWeb3Modal } from '@web3modal/wagmi/react'
// import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'

// import { WagmiProvider } from 'wagmi'
// import { mainnet } from 'wagmi/chains'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ELMT_TOKEN_ADDRESS } from './constants';

// // 0. Setup queryClient
// const queryClient = new QueryClient()

// // 1. Get projectId from https://cloud.walletconnect.com
// const projectId = '9ecb3ec31f707e04be21e1174316fb01'

// let url = 'https://elmt.store';
// if (process.env.NEXT_PUBLIC_DEPLOY_STAGE === 'staging') {
//   url = 'https://stage.elmt.store';
// } else if (process.env.NEXT_PUBLIC_DEPLOY_STAGE === 'local') {
//   url = 'http://localhost:3000';
// }

// // 2. Create wagmiConfig
// const metadata = {
//   name: 'EVault',
//   description: 'Gold, silver, minerals digital exchange',
//   url, // origin must match your domain & subdomain
//   icons: ['https://elmt.store/logo.png']
// }

// const chains = [mainnet] as const
// const config = defaultWagmiConfig({
//   chains,
//   projectId,
//   metadata,
// })

// // 3. Create modal
// createWeb3Modal({
//   metadata,
//   wagmiConfig: config,
//   projectId,
//   enableAnalytics: true, // Optional - defaults to your Cloud configuration
//   enableOnramp: false,
//   tokens: {
//     1: {
//       address: ELMT_TOKEN_ADDRESS,
//       image: "https://s2.coinmarketcap.com/static/img/coins/64x64/28368.png",
//     },
//   },
// });

// export function Web3Provider({ children }: { children: React.ReactNode }) {
//   return (
//     <WagmiProvider config={config}>
//       <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
//     </WagmiProvider>
//   )
// }