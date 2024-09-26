"use client";
import { useEffect, useState } from "react";
import { getPrices, MineralPrices } from "@/utils/priceUtil";
import { create } from "zustand";

export const usePrices = () => {
  const { prices, setPrices } = usePriceStore();
  
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

interface PriceStoreState {
  prices: MineralPrices;
  setPrices: (prices: MineralPrices) => void;
}
const usePriceStore = create<PriceStoreState>((set) => ({
  prices: { goldPrice: 0, silverPrice: 0 },
  setPrices: (prices: MineralPrices) => set({ prices })
}));