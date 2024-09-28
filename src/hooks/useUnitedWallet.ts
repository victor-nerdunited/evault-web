import { ELMT_TOKEN_ADDRESS, GROW_TOKEN_ADDRESS, IZE_TOKEN_ADDRESS, SWITCH_TOKEN_ADDRESS } from "@/lib/web3/constants";
import { useEffect, useState } from "react";
import { useAccount, useBalance, UseBalanceReturnType } from "wagmi";

export const useUnitedWallet = () => {
  const [ethBalance, setEthBalance] = useState(0);
  const [elmtBalance, setElmtBalance] = useState(0);
  const [growBalance, setGrowBalance] = useState(0);
  const [izeBalance, setIzeBalance] = useState(0);
  const [switchBalance, setSwitchBalance] = useState(0);
  const account = useAccount();

  const formatNumber = (balance: UseBalanceReturnType) => 
    Number((Number(balance?.data?.value) / (10 ** Number(balance?.data?.decimals))).toFixedDecimal())
  
  const ethTokenBalance = useBalance({ address: account?.address });
  useEffect(() => {
    setEthBalance(formatNumber(ethTokenBalance));
  }, [ethTokenBalance?.data?.value]);

  const elmtTokenBalance = useBalance({ address: account?.address, token: ELMT_TOKEN_ADDRESS });
  useEffect(() => {
    setElmtBalance(formatNumber(elmtTokenBalance));
  }, [elmtTokenBalance?.data?.value]);

  const growTokenBalance = useBalance({ address: account?.address, token: GROW_TOKEN_ADDRESS });
  useEffect(() => {
    setGrowBalance(formatNumber(growTokenBalance));
  }, [growTokenBalance?.data?.value]);

  const izeTokenBalance = useBalance({ address: account?.address, token: IZE_TOKEN_ADDRESS });
  useEffect(() => {
    setIzeBalance(formatNumber(izeTokenBalance));
  }, [izeTokenBalance?.data?.value]);

  const switchTokenBalance = useBalance({ address: account?.address, token: SWITCH_TOKEN_ADDRESS });
  useEffect(() => {
    setSwitchBalance(formatNumber(switchTokenBalance));
  }, [switchTokenBalance?.data?.value]);

  return {
    ethBalance,
    elmtBalance,
    growBalance,
    izeBalance,
    switchBalance
  }
};