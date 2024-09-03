// 'use client'

// import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// // 1. Get projectId from https://cloud.walletconnect.com
// const projectId = '9ecb3ec31f707e04be21e1174316fb01'

// // 2. Set chains
// const mainnet = {
//   chainId: 1,
//   name: 'Ethereum',
//   currency: 'ETH',
//   explorerUrl: 'https://etherscan.io',
//   rpcUrl: 'https://cloudflare-eth.com'
// }

// // 3. Create a metadata object
// const metadata = {
//   name: 'eVault',
//   description: 'Gold, silver, minerals digital exchange',
//   url: 'https://evault.elementunited.com',
//   icons: ['https://avatars.mywebsite.com/']
// }
// // 4. Create Ethers config
// const ethersConfig = defaultConfig({
//   /*Required*/
//   metadata,

//   /*Optional*/
//   enableEIP6963: true, // true by default
//   enableInjected: true, // true by default
//   enableCoinbase: true, // true by default
//   rpcUrl: '...', // used for the Coinbase SDK
//   defaultChainId: 1 // used for the Coinbase SDK
// })

// // 5. Create a AppKit instance
// createWeb3Modal({
//   ethersConfig,
//   featuredWalletIds: [],
//   chains: [mainnet],
//   projectId,
//   enableAnalytics: true, // Optional - defaults to your Cloud configuration
//   tokens: {
//     1: {
//       address: '0x600D601D8b9EB5DE5Ac90fEfC68d0d08801bFd3f',
//       image: 'https://etherscan.io/token/images/elmt_32.png'
//     },
//     137: {
//       address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
//     }
//   }
// })

// export function AppKit({ children }: { children: React.ReactNode }) {
//   return children
// }