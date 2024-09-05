import { ELMT_TOKEN_ADDRESS } from "@/lib/web3/constants";
import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";

export const useElmtBalance = () => {
  const [elmtBalance, setElmtBalance] = useState(0);
  const account = useAccount();
  const tokenBalance = useBalance({ address: account?.address, token: ELMT_TOKEN_ADDRESS });

  useEffect(() => {
    setElmtBalance(Number(tokenBalance?.data?.value) / (10 ** Number(tokenBalance?.data?.decimals)));
  }, [tokenBalance?.data?.value]);

  return elmtBalance;
};