import { ELMT_TOKEN_ADDRESS } from "@/lib/web3/constants";
import { useState } from "react";
import { useAccountEffect, useConfig } from "wagmi";
import { getBalance } from "@wagmi/core";

export const useElmtBalance = () => {
  const config = useConfig();
  const [elmtBalance, setElmtBalance] = useState(0);
  
  useAccountEffect({
    onConnect: async (data) => {
      console.log("Connected to Ethereum network", data);
      const balance = await getBalance(config, {
        address: data.address,
        token: ELMT_TOKEN_ADDRESS
      });
      //console.log("balance", balance);
      setElmtBalance(Number(balance.value) / (10 ** Number(balance.decimals)));
    },
    onDisconnect: () => {
      //console.log("Disconnected from Ethereum network");
      setElmtBalance(0);
    },
  });

  return elmtBalance;
};