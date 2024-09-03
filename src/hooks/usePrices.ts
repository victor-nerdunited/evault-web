"use client";
import { useEffect, useState } from "react";
import { getPrices, MineralPrices } from "@/utils/priceUtil";

export const usePrices = () => {
  const [prices, setPrices] = useState<MineralPrices>({ goldPrice: 0, silverPrice: 0 });
  
  useEffect(() => {
    const fetchPrices = async () => {
      const prices = await getPrices();
      //const price = await getPrice(prices, name, description ?? "", code ?? "", tokenPrice);
      setPrices(prices);
    }
    fetchPrices();
  }, []);

  const refreshPrices = async () => {
    const prices = await getPrices(true);
    setPrices(prices);
  }

  return {
    prices,
    refreshPrices,
  };
}