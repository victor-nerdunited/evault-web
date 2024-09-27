"use server";

import Moralis from "moralis";
import { useLogger } from "./useLogger";
import cache from "./cache";
import { PaymentToken } from "@/types/payment-token";
import { getTokenAddress } from "./priceUtil";

Moralis.start({
  apiKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjA4NzIwN2NhLTg4MDctNDJlYy05ZTg0LTNhY2U4NWQ0YjBjZCIsIm9yZ0lkIjoiNDA2NTc1IiwidXNlcklkIjoiNDE3Nzc5IiwidHlwZUlkIjoiOTg2NzhhZjAtMzI0NC00NDJhLWIyMjctMGQ0NDE3MGE1ODQxIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MjUxMjAzODYsImV4cCI6NDg4MDg4MDM4Nn0.IjKCIPDbdI1jthSqPDDyjxqTWJ0k5md-HALn0T-efI0",
});

/** Gets ELMT USD price*/
export async function getTokenPrice(token: PaymentToken = PaymentToken.ELMT, forceRefresh: boolean = false) {
  const logger = useLogger("tokenPrice");
  try {
    const cacheKey = `tokenprice:${token}`;
    const cacheEntry = cache.get<number>(cacheKey);
    if (cacheEntry && !forceRefresh) {
      logger.info("[getTokenPrice] returning cached price", { token, cacheEntry });
      return cacheEntry;
    }

    const response = await Moralis.EvmApi.token.getTokenPrice({
      chain: "0x1",
      address: getTokenAddress(token),
    });

    const price = response.raw.usdPrice;
    cache.set<number>(cacheKey, price, 30); // 30s
    logger.info(`[getTokenPrice] price ${price} token ${token}`, { price })

    return price;
  } catch (e) {
    logger.error("[getTokenPrice] failed to get token price", { error: e });
    return 0;
  }
}
