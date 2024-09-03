"use client";
import { getTokenPrice } from "@/utils/tokenPrice";
import { useEffect, useState } from "react";

export const useTokenPrice = () => {
  const [tokenPrice, setTokenPrice] = useState<number>(0);

  useEffect(() => {
    const fetchTokenPrice = async () => {
      const price = await getTokenPrice();
      setTokenPrice(price ?? 0);
    }
    fetchTokenPrice();
  }, []);

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