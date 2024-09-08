"use client";
import { useLogger } from "@/utils/logger";
import { useEffect, useState } from "react";
import { useEstimateFeesPerGas, usePublicClient } from "wagmi";
import * as ethers from "ethers";
import { ELMT_TOKEN_ABI, ELMT_TOKEN_ADDRESS, ELMT_WALLET_ADDRESS } from "@/lib/web3/constants";

export const useEstimateGasFee = (subtotal: number) => {
  const logger = useLogger("useEstimateGasFee");
  const publicClient = usePublicClient();
  const estimatedFees = useEstimateFeesPerGas();

  const [gasCost, setGasCost] = useState(0);

  useEffect(() => {
    const callEstimateGas = async () => {
      if (subtotal > 0 && estimatedFees.data) {
        // const gasEstimate = await estimateGas(config, {
        //   to: ELMT_WALLET_ADDRESS,
        //   value: BigInt(subtotal * 10 ** token.data.decimals),
        // });
        // logger.log("[cart] gas estimate", gasEstimate, estimatedFees.data.maxFeePerGas, estimatedFees.data.maxFeePerGas);

        const gas = await publicClient.estimateContractGas({
          address: ELMT_TOKEN_ADDRESS,
          abi: ELMT_TOKEN_ABI,
          functionName: 'transfer',
          args: [ELMT_WALLET_ADDRESS, BigInt(subtotal * 10 ** 8)],
          account: ELMT_TOKEN_ADDRESS //account.address
        })
        const maxFeePerGas = estimatedFees.data.maxFeePerGas!;
        const gasFloat = parseFloat(ethers.formatEther(gas));
        const feeFloat = parseFloat(ethers.formatEther(maxFeePerGas));
        const gasCost = gasFloat * feeFloat * (10 ** 18);
        logger.log("[useEstimateGasFee] gas estimate", gasCost, gasFloat, feeFloat);
        setGasCost(gasCost * 2);  // doubling to show higher estimate
      }
    }
    callEstimateGas();
  }, [subtotal, estimatedFees.data]);

  return {
    gasCost,
  }
}