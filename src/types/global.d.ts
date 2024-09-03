import { ethers } from "ethers";
import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'

declare global {
  interface Window {
    ethereum: ethers.providers.Web3Provider;
  }
}

declare module 'wagmi' {
  interface Register {
    config: Config<chains, transports>
  }
}

export {};