"use client";
import { useLogger } from "@/utils/useLogger";
import { useEffect, useState } from "react";
import { useConnectors, useEstimateFeesPerGas, usePublicClient, useConfig } from "wagmi";
import { estimateGas } from "@wagmi/core";
import * as ethers from "ethers";
import { ELMT_TOKEN_ABI, ELMT_TOKEN_ADDRESS } from "@/lib/web3/constants";
import { useCheckout } from "@/lib/CheckoutProvider";
import { PaymentToken } from "@/types/payment-token";
import { mainnet } from "viem/chains";

export const useEstimateGasFee = (subtotal: number) => {
  const logger = useLogger("useEstimateGasFee");
  const publicClient = usePublicClient();
  const estimatedFees = useEstimateFeesPerGas();
  const { paymentToken } = useCheckout();
  const config = useConfig();
  const connectors = useConnectors();

  const [gasCost, setGasCost] = useState(0);

  useEffect(() => {
    const callEstimateGas = async () => {
      if (subtotal > 0 && subtotal < Infinity && estimatedFees.data) {
        if (paymentToken === PaymentToken.ETH) {
          const gas = await estimateGas(config, {
            account: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            chainId: mainnet.id,
            connector: connectors.at(0),
            to: process.env.NEXT_PUBLIC_ELMT_WALLET_ADDRESS,
            value: ethers.parseEther(subtotal.toFixedDecimal())
          });
          const gasFloat = parseFloat(ethers.formatEther(gas))
          const maxFeePerGas = estimatedFees.data.maxFeePerGas!;
          const feeFloat = parseFloat(ethers.formatEther(maxFeePerGas));
          const gasCost = gasFloat * feeFloat * (10 ** 18);
          setGasCost(gasCost);
          return;
        }

        const gas = await publicClient.estimateContractGas({
          address: ELMT_TOKEN_ADDRESS,
          abi: ELMT_TOKEN_ABI,
          functionName: 'transfer',
          args: [process.env.NEXT_PUBLIC_ELMT_WALLET_ADDRESS, BigInt(Math.trunc(subtotal) * 10 ** 8)],
          account: ELMT_TOKEN_ADDRESS //account.address
        })
        const maxFeePerGas = estimatedFees.data.maxFeePerGas!;
        const gasFloat = parseFloat(ethers.formatEther(gas));
        const feeFloat = parseFloat(ethers.formatEther(maxFeePerGas));
        const gasCost = gasFloat * feeFloat * (10 ** 18);
        logger.debug("[useEstimateGasFee] gas estimate", gasCost, gasFloat, feeFloat);
        setGasCost(gasCost * 1.5);  // show higher estimate
      }
    }
    callEstimateGas();
  }, [subtotal, estimatedFees.data]);

  return {
    gasCost,
  }
}