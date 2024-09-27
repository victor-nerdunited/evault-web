"use client";

import { PaymentToken } from "@/types/payment-token";
import { useLogger } from "@/utils/useLogger";
import { useEffect, useState } from "react";
import { getToken } from "@wagmi/core";
import { useConfig } from "wagmi";
import { mainnet } from "viem/chains";
import { getTokenAddress } from "@/utils/priceUtil";
import { create } from "zustand";

export type ChainToken = {
  address: `0x${string}`
  decimals: number
  name: string | undefined
  symbol: string | undefined
  totalSupply: {
    formatted: string
    value: bigint
  }
}

export function usePaymentToken() {
  const logger = useLogger("usePaymentToken");
  const { paymentToken, setPaymentToken } = usePaymentTokenStore();
  const [chainToken, setChainToken] = useState<ChainToken | null>(null);
  const config = useConfig();

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getToken(config, {
        chainId: mainnet.id,
        address: getTokenAddress(paymentToken),
      });
      setChainToken(token);
    };
    fetchToken();
  }, [paymentToken]);

  const changePaymentToken = (newPaymentToken: PaymentToken) => {
    logger.log("[usePaymentToken] token changed", { paymentToken, newPaymentToken });
    setPaymentToken(newPaymentToken);
  }

  return {
    chainToken,
    paymentToken,
    changePaymentToken,
  }
}

interface PaymentTokenState {
  paymentToken: PaymentToken;
  setPaymentToken: (paymentToken: PaymentToken) => void;
}
const usePaymentTokenStore = create<PaymentTokenState>((set) => ({
  paymentToken: PaymentToken.ELMT,
  setPaymentToken: (paymentToken: PaymentToken) => set({ paymentToken })
}));