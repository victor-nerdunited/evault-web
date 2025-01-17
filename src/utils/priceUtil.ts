import { PaymentToken } from "@/types/payment-token";
import { useLogger } from "./useLogger";
import { ELMT_TOKEN_ADDRESS, GROW_TOKEN_ADDRESS, IZE_TOKEN_ADDRESS, SWITCH_TOKEN_ADDRESS, USDC_TOKEN_ADDRESS, WETH_TOKEN_ADDRESS } from "@/lib/web3/constants";
import { LineItem } from "@/hooks/types/commerce";

const PRICE_MULTIPLIER_GOLD = 1.0;
const PRICE_MULTIPLIER_SILVER = 1.0;

const logger = useLogger("mineral-prices");

export interface MineralPrices {
  goldPrice: number;
  silverPrice: number;
}

export const isGold = (name: string, sku: string) => {
  return /gold/i.test(name ?? "") || /gold/i.test(sku ?? "");
}

export const isSilver = (name: string, sku: string) => {
  return /silver/i.test(name ?? "") || /silver/i.test(sku ?? "");
}

export const getLineItemPrice = (prices: MineralPrices, tokenPrice: number, productPrice: number, item: LineItem) => {
  const currencyMeta = item.meta_data?.find(x => x.key === "currency");
  if (currencyMeta?.value === PaymentToken.USDC) {
    // keep USD price exact
    return productPrice;
  }
  return getPrice(prices, item.name, item.sku ?? "", tokenPrice, productPrice);
}

export const getPrice = (prices: MineralPrices, name: string, sku: string, tokenPrice: number, productPrice: number) => {
  logger.debug("[priceUtil/getPrice] prices", { prices, tokenPrice });
  if (tokenPrice === 0) return 0;

  let price = productPrice;
  if (isGold(name, sku)) {
    price = Number(prices.goldPrice);
  } else if (isSilver(name, sku)) {
    price = Number(prices.silverPrice);
  }

  const result = Number((price / tokenPrice).toFixedDecimal());
  logger.debug("[priceUtil/getPrice] result", result, price, tokenPrice);
  return result;
}

export const getPrices = async (forceRefresh: boolean = false): Promise<MineralPrices> => {
  if (["staging", "local"].includes(process.env.NEXT_PUBLIC_DEPLOY_STAGE ?? "production")) {
    const factor = 1 // (Math.random() * 100000 % 100);
    return {
      goldPrice: 0.005 * factor,
      silverPrice: 0.001 * factor,
    };
  }

  const cacheKey = "goldprice";
  const cacheEntry = localStorage.getItem(cacheKey);
  if (cacheEntry && !forceRefresh) {
    const cacheData = JSON.parse(cacheEntry);
    if (Date.now() - cacheData.ts < 1000 * 60 * 15) { // cache for 15 minutes
      return toPrices(cacheData);
    }
  }

  const data = await fetchPrices();
  localStorage.setItem(cacheKey, JSON.stringify(data));

  return toPrices(data);
}

const toPrices = (data: any): MineralPrices => {
  return {
    goldPrice: data.items[0].xauPrice * PRICE_MULTIPLIER_GOLD,
    silverPrice: data.items[0].xagPrice * PRICE_MULTIPLIER_SILVER,
  };
}

const fetchPrices = async () => {
  const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
    body: null,
    method: "GET",
  });
  const data = await response.json();
  return data;
}

export function getTokenAddress(token: PaymentToken): `0x${string}` {
  switch(token) {
    case PaymentToken.ETH:
      return WETH_TOKEN_ADDRESS;
    case PaymentToken.GROW:
      return GROW_TOKEN_ADDRESS;
    case PaymentToken.SWITCH:
      return SWITCH_TOKEN_ADDRESS;
    case PaymentToken.IZE:
      return IZE_TOKEN_ADDRESS;
    case PaymentToken.USDC:
      return USDC_TOKEN_ADDRESS;
    case PaymentToken.ELMT:
    default:
      return ELMT_TOKEN_ADDRESS;
  }
}
