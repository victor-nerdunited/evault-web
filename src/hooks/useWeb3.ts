"use client";

import { ethers } from "ethers";
import { useEffect, useState } from "react";

class Web3 {
  private _signer: ethers.Signer | null = null;

  constructor(private provider: ethers.BrowserProvider) {
  }

  async connect(): Promise<boolean> {
    try {
      if (this._signer) {
        return true;
      }
      
      const signer = await this.provider.getSigner();
      this._signer = signer;
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}

export const useWeb3 = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setWeb3(new Web3(provider));
    }
  }, []);

  return { web3 };
};
