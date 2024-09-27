"use client";
import { getTokenPrice } from "@/utils/tokenPrice";
import { useEffect, useState } from "react";
import { usePaymentToken } from "./usePaymentToken";
import { useLogger } from "@/utils/useLogger";
import { create } from "zustand";
import { PaymentToken } from "@/types/payment-token";

export const useTokenPrice = () => {
  const logger = useLogger("useTokenPrice");
  //const [tokenPrice, setTokenPrice] = useState<number>(0);
  const { tokenPrice, setTokenPrice } = useTokenPriceStore();
  const { paymentToken } = usePaymentToken();

  useEffect(() => {
    logger.debug("[useTokenPrice] payment token changed", { paymentToken });
    // const fetchTokenPrice = async () => {
    //   const price = await getTokenPrice(paymentToken);
    //   setTokenPrice(price ?? 0);
    // }
    // fetchTokenPrice();
    setTokenPrice(paymentToken, false);
  }, [paymentToken]);

  const refreshTokenPrice = async (refresh: boolean = false) => {
    logger.log("[useTokenPrice] refresh price", { paymentToken, refresh });
    await setTokenPrice(paymentToken, refresh);
  }
    
  return {
    tokenPrice,
    /** Refreshes the token price */
    refreshTokenPrice,
  };
}

interface TokenPriceState {
  tokenPrice: number;
  setTokenPrice: (paymentToken: PaymentToken, refresh: boolean) => Promise<void>;
}
const useTokenPriceStore = create<TokenPriceState>((set) => ({
  tokenPrice: 0,
  setTokenPrice: async (paymentToken: PaymentToken, refresh: boolean = false) => {
    const tokenPrice = await getTokenPrice(paymentToken, refresh);
    set({ tokenPrice });
  }
}));