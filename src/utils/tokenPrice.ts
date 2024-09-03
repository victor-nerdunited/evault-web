"use client";

import Moralis from "moralis";

Moralis.start({
  apiKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA4NzIwN2NhLTg4MDctNDJlYy05ZTg0LTNhY2U4NWQ0YjBjZCIsIm9yZ0lkIjoiNDA2NTc1IiwidXNlcklkIjoiNDE3Nzc5IiwidHlwZUlkIjoiOTg2NzhhZjAtMzI0NC00NDJhLWIyMjctMGQ0NDE3MGE1ODQxIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MjUxMjAzODYsImV4cCI6NDg4MDg4MDM4Nn0.IjKCIPDbdI1jthSqPDDyjxqTWJ0k5md-HALn0T-efI0",
});

/** Gets ELMT USD price*/
export async function getTokenPrice(forceRefresh: boolean = false) {
  try {
    const cacheKey = "tokenprice";
    const cacheEntry = localStorage.getItem(cacheKey);
    if (cacheEntry && !forceRefresh) {
      const cacheData = JSON.parse(cacheEntry);
      if (Date.now() - cacheData.ts < 1000 * 60 * 15) { // cache for 15 minutes
        return cacheData.price;
      }
    }

    const response = await Moralis.EvmApi.token.getTokenPrice({
      chain: "0x1",
      address: "0x600D601D8b9EB5DE5Ac90fEfC68d0d08801bFd3f",
    });

    const price = response.raw.usdPrice;
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), price }));

    return price;
  } catch (e) {
    console.error(e);
  }
}
