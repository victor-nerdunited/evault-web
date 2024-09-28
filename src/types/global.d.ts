import { ethers } from "ethers";
import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'

declare global {
  interface Window {
    ethereum: ethers.providers.Web3Provider;
  }

  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_ELMT_WALLET_ADDRESS: `0x${string}`
    }
  }

  interface Number {
    toFixedDecimal: (decimalsToRight: number = 2) => string;
  }
}

declare module 'wagmi' {
  interface Register {
    config: Config<chains, transports>
  }
}

export {};