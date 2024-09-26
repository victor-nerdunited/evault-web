"use client";
import { getTokenPrice } from "@/utils/tokenPrice";
import { useEffect, useState } from "react";
import { usePaymentToken } from "./usePaymentToken";
import { useLogger } from "@/utils/useLogger";

export const useTokenPrice = () => {
  const logger = useLogger("useTokenPrice");
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const { paymentToken } = usePaymentToken();

  useEffect(() => {
    logger.debug("[useTokenPrice] payment token changed", { paymentToken });
    const fetchTokenPrice = async () => {
      const price = await getTokenPrice(paymentToken);
      setTokenPrice(price ?? 0);
    }
    fetchTokenPrice();
  }, [paymentToken]);

  const refreshTokenPrice = async () => {
    const price = await getTokenPrice();
    setTokenPrice(price ?? 0);
  }
    
  return {
    tokenPrice,
    /** Refreshes the token price */
    refreshTokenPrice,
  };
}
