import { ELMT_TOKEN_ADDRESS, GROW_TOKEN_ADDRESS } from "@/lib/web3/constants";
import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";

export const useUnitedWallet = () => {
  const [ethBalance, setEthBalance] = useState(0);
  const [elmtBalance, setElmtBalance] = useState(0);
  const [growBalance, setGrowBalance] = useState(0);
  const account = useAccount();
  
  const ethTokenBalance = useBalance({ address: account?.address });
  useEffect(() => {
    setEthBalance(Math.trunc(Number(ethTokenBalance?.data?.value) / (10 ** Number(ethTokenBalance?.data?.decimals))));
  }, [ethTokenBalance?.data?.value]);

  const elmtTokenBalance = useBalance({ address: account?.address, token: ELMT_TOKEN_ADDRESS });
  useEffect(() => {
    setElmtBalance(Math.trunc(Number(elmtTokenBalance?.data?.value) / (10 ** Number(elmtTokenBalance?.data?.decimals))));
  }, [elmtTokenBalance?.data?.value]);

  const growTokenBalance = useBalance({ address: account?.address, token: GROW_TOKEN_ADDRESS });
  useEffect(() => {
    setGrowBalance(Math.trunc(Number(growTokenBalance?.data?.value) / (10 ** Number(growTokenBalance?.data?.decimals))));
  }, [elmtTokenBalance?.data?.value]);

  return {
    ethBalance,
    elmtBalance,
    growBalance,
  }
};