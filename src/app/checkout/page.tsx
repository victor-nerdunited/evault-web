"use client";

import NcInputNumber from "@/components/NcInputNumber";
import Prices from "@/components/Prices";
import { useEffect, useMemo, useState } from "react";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import ContactInfo from "./ContactInfo";
import PaymentMethod from "./PaymentMethod";
import Image from "next/image";
import Link from "next/link";
import { useCheckout, useCheckoutDispatch } from "@/lib/CheckoutProvider";
import ShippingAddress from "./ShippingAddress";
import { useAccount, useAccountEffect, useConfig, useSendTransaction, useWriteContract } from "wagmi";
import { ELMT_TOKEN_ABI, ELMT_TOKEN_ADDRESS, ELMT_WALLET_ADDRESS } from "@/lib/web3/constants";
import { Order, useCommerce } from "@/hooks/useCommerce";
import { getPrices, isGold, isSilver } from "@/utils/priceUtil";
import { usePrices } from "@/hooks/usePrices";
import { ContractFunctionExecutionError } from "viem";
import { getTokenPrice } from "@/utils/tokenPrice";
import PricesChangedModal from "./PricesChangedMoal";
import { useRouter } from "next/navigation";
//import { useElmtBalance } from "@/hooks/useElmtBalance";
import { useLogger } from "@/utils/useLogger";
import { useEstimateGasFee } from "@/hooks/useEstimateGasFee";
import { simulateContract } from "viem/actions";
import { LineItem } from "@/hooks/types/commerce";
import { useUnitedWallet } from "@/hooks/useUnitedWallet";
import { PaymentToken } from "@/types/payment-token";
import { parseEther } from "ethers";
import { useTokenPrice } from "@/hooks/useTokenprice";


const CheckoutPage = () => {
  const logger = useLogger("checkout");
  const [tabActive, setTabActive] = useState<
    "ContactInfo" | "ShippingAddress" | "PaymentMethod"
  >("ContactInfo");

  //const [contactInfo, setContactInfo] = useState<IContactFormInputs | null>(null);
  //const [shippingAddress, setShippingAddress] = useState<IShippingAddress | null>(null);
  // const [cart, setCart] = useState<Cart | null>(null);
  const { cart, contactInfo, shippingAddress, tokenPrice, paymentToken, chainToken, removeItem, updateOrder, updateQuantity, updateTokenPrice } = useCheckout()!;

  const { dispatchCart } = useCheckoutDispatch()!;
  const commerceLayer = useCommerce()!;
  //const [checkoutTokenId, setCheckoutTokenId] = useState<string | null>(null);
  const account = useAccount();
  const { 
    data: txHashNative, 
    error: txErrorNative,
    isPending: txPendingNative,
    status: txStatusNative,
    sendTransaction } = useSendTransaction();
  const { 
    data: txHashToken, 
    error: txErrorToken, 
    isPending: txPendingToken, 
    status: txStatusToken, 
    writeContract,
  } = useWriteContract();
  
  const config = useConfig();
  //const token = useBalance({ address: account?.address, token: ELMT_TOKEN_ADDRESS });
  const { prices, refreshPrices } = usePrices();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [submittingTransaction, setSubmittingTransaction] = useState(false);
  //const [subtotal, setSubtotal] = useState(0);
  const [pricesChanged, setPricesChanged] = useState(false);
  const router = useRouter();
  //const elmtBalance = useElmtBalance();
  const { elmtBalance } = useUnitedWallet();
  const [isDebug, setIsDebug] = useState(false);
  const subtotal = useMemo(() => {
    const totalNumber = parseFloat(cart?.total ?? "0");
    logger.log("[checkout/subtotal]", totalNumber);
    return totalNumber;
  }, [cart?.total]);

  const { gasCost } = useEstimateGasFee(subtotal);

  const swapUrl = `https://app.uniswap.org/#/swap?inputCurrency=eth&outputCurrency=${ELMT_TOKEN_ADDRESS}&exactAmount=${subtotal}&exactField=output`;
  const [ethTokenPrice, setEthTokenPrice] = useState(0);
  useEffect(() => {
    logger.log("[checkout/useEffect/chainToken]", chainToken);

    (async () => {
      setEthTokenPrice(await getTokenPrice(PaymentToken.ETH, true));
    })();
  }, []);

  useEffect(() => {
    const isDebug = new URLSearchParams(window.location.search).get("debug") !== null;
    setIsDebug(isDebug);
  }, []);

  useEffect(() => {
    if (shippingAddress && contactInfo) {
      setTabActive("PaymentMethod");
    } else if (contactInfo) {
      setTabActive("ShippingAddress")
    }
  }, [contactInfo, shippingAddress]);

  useAccountEffect({
    onConnect: async (data) => {
      logger.log("Connected to Ethereum network", data);

    },
    onDisconnect: () => {
      logger.log("Disconnected from Ethereum network");
    },
  });

  const readyToOrder = useMemo(() => {
    return account?.address && contactInfo && shippingAddress && (elmtBalance >= subtotal || isDebug);
  }, [account?.address, contactInfo, shippingAddress, subtotal, elmtBalance, isDebug]);

  const transactionHash = useMemo(() => txHashToken || txHashNative, [txHashToken, txHashNative]);
  const transactionPending = useMemo(() => txPendingToken && txPendingNative, [txPendingToken, txPendingNative]);
  const transactionError = useMemo(() => txErrorToken || txErrorNative, [txErrorToken, txErrorNative]);
  const transactionStatus = useMemo(() => {
    return paymentToken === PaymentToken.ETH
      ? txStatusNative
      : txStatusToken;

  }, [txStatusToken, txStatusNative]);

  const sendToken = async(to: `0x${string}`, amount: number) => {
    if (!chainToken) throw new Error("Token data not found");

    if (paymentToken === PaymentToken.ETH) {
      sendTransaction({ to, value: parseEther(amount.toFixed(18)) });
    } else {
      const nativeAmount = BigInt(amount * 10 ** chainToken.decimals);

      const simulationResults = await simulateContract(config.getClient(), {
        abi: ELMT_TOKEN_ABI,
        address: chainToken.address,
        functionName: 'transfer',
        args: [
          to,
          nativeAmount,
        ],
        account: account.address,
      });
      logger.log("[sendToken] simulationResults", simulationResults);
      if (simulationResults.result) {
        writeContract(simulationResults.request);
      }
    }
  }

  const ensurePrices = async () => {
    const localPrices = await getPrices(true);
    const localTokenPrice = await getTokenPrice(paymentToken, true);

    const minGoldPrice = localPrices.goldPrice * 0.99;
    const maxGoldPrice = localPrices.goldPrice * 1.01;
    const minSilverPrice = localPrices.silverPrice * 0.99;
    const maxSilverPrice = localPrices.silverPrice * 1.01;

    const minTokenPrice = localTokenPrice * 0.99;
    const maxTokenPrice = localTokenPrice * 1.01;

    let tokenPriceChanged = false, itemPriceChanged = false;
    if (tokenPrice < minTokenPrice || tokenPrice > maxTokenPrice) {
      tokenPriceChanged = true;
    }
    const hasGoldItem = cart?.line_items?.some(item => isGold(item.name ?? "", item.sku ?? ""));
    const hasSilverItem = cart?.line_items?.some(item => isSilver(item.name ?? "", item.sku ?? ""));
    if (hasGoldItem) {
      itemPriceChanged ||= prices.goldPrice < minGoldPrice || prices.goldPrice > maxGoldPrice;
    }
    if (hasSilverItem) {
      itemPriceChanged ||= prices.silverPrice < minSilverPrice || prices.silverPrice > maxSilverPrice;
    }

    if (tokenPriceChanged || itemPriceChanged) {
      setPricesChanged(true);
      throw new Error("Prices changed more than 1%");
    }
  }

  const refreshAllPrices = async () => {
    await refreshPrices();
    //await updateTokenPrice();
    updateTokenPrice();
    setPricesChanged(false);
  }

  const handlePlaceOrder= async (): Promise<void> => {
    if (!cart) return;
    if (!shippingAddress) return;
    if (!contactInfo) return;
    if (!chainToken) return;
    if (!account.address) return;

    if (isDebug) {
      logger.log("[handlePlaceOrder] Debug mode enabled, not actually sending token");
      router.push(`/order-confirmation?orderid=${cart?.id}&total=${subtotal}&hash=faketxhash${Date.now()}`);
      return;
    }

    await ensurePrices();

    try {
      setPlacingOrder(true);
      setSubmittingTransaction(true);

      await sendToken(
        ELMT_WALLET_ADDRESS, 
        subtotal,
        //BigInt(10 * 10 ** token.data.decimals)
      );
    } catch (error: unknown) {
      if (error instanceof ContractFunctionExecutionError 
        && /user rejected/i.test(error.shortMessage)) {
        return;
      }
      logger.error("Error sending token", error);
      throw error;
    } finally {
      setPlacingOrder(false);
      setSubmittingTransaction(false);
    }
  }

  const submitOrder = async () => {
    if (!cart) return;
    if (!shippingAddress) return;
    if (!contactInfo) return;
    if (!chainToken) return;
    if (!account.address) return;
    if (!transactionHash) return;

    try {
      setPlacingOrder(true);

      const orderUpdate: Partial<Order & { set_paid: boolean }> = {
        id: cart.id,
        status: "on-hold",
        payment_method: "ELMT",
        set_paid: true,
        transaction_id: transactionHash,
        meta_data: [
          ...cart.meta_data,
          { key: "wallet_address", value: account.address },
          { key: "transaction_hash", value: transactionHash },
          { key: "token_price", value: tokenPrice },
          { key: "gold_price", value: prices.goldPrice },
          { key: "silver_price", value: prices.silverPrice },
          { key: "amount", value: subtotal },
        ]
      }
      await updateOrder(orderUpdate);
      router.push(`/order-confirmation?orderid=${cart?.id}&total=${subtotal}&token=${paymentToken}&hash=${transactionHash}`);
    } catch (error) {
      logger.error("Error placing order", error);

    } finally {
      setPlacingOrder(false);
    }
  }

  useEffect(() => {
    if (transactionPending) return;
    if (!transactionHash) return;
    if (transactionStatus !== "success") return;

    submitOrder();
  }, [transactionHash, transactionStatus, transactionPending, transactionError]);

  const handleScrollToEl = (id: string) => {
    const element = document.getElementById(id);
    setTimeout(() => {
      element?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const renderProduct = (item: LineItem, index: number) => {
    //const price = item.unit_amount_float;
    //const price = getPrice(prices, item.name ?? "", item.sku ?? "", tokenPrice);
    const { image, name, price } = item;
    const priceNumber = price;
    const maxPurchaseQuantity = parseInt(item.meta_data.find(x => x.key === "max_purchase_quantity")?.value);
    const quantityOptions = Array.from({ length: maxPurchaseQuantity || 3 }, (_, i) => ({
      value: i + 1,
      label: i + 1
    }));

    return (
      <div key={index} className="relative flex py-7 first:pt-0 last:pb-0">
        <div className="relative h-36 w-24 sm:w-28 flex-shrink-0 overflow-hidden rounded-xl">
          <Image
            src={image.src || ""}
            fill
            alt={name || ""}
            className="h-full w-full object-contain object-center"
            sizes="150px"
          />
          {/* <Link href="/product-detail" className="absolute inset-0"></Link> */}
        </div>

        <div className="ml-3 sm:ml-6 flex flex-1 flex-col">
          <div>
            <div className="flex justify-between ">
              <div className="flex-[1.5] ">
                <h3 className="text-base font-semibold">
                  {/* <Link href="/product-detail">{name}</Link> */}
                  {name}
                </h3>

                <div className="mt-3 flex justify-between w-full sm:hidden relative">
                  <select
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                    value={item.quantity}
                    name="qty"
                    id="qty"
                    className="form-select text-sm rounded-md py-1 border-slate-200 dark:border-slate-700 relative z-10 dark:bg-slate-800 "
                  >
                    {quantityOptions.map((option, index) => <option key={index} value={option.value}>{option.label}</option>)}
                  </select>
                  <Prices
                    contentClass="py-1 px-2 md:py-1.5 md:px-2.5 text-sm font-medium h-full"
                    price={priceNumber || 0}
                    paymentToken={paymentToken}
                  />
                </div>
              </div>

              <div className="hidden flex-1 sm:flex justify-end">
                <Prices 
                  price={priceNumber || 0} 
                  className="mt-0.5"
                  paymentToken={paymentToken} />
              </div>
            </div>
          </div>

          <div className="flex mt-auto pt-4 items-end justify-between text-sm">
            <div className="hidden sm:block text-center relative">
              <NcInputNumber
                className="relative z-10"
                max={maxPurchaseQuantity || 3}
                defaultValue={item.quantity}
                onChange={(value) => updateQuantity(item.id, value)}
              />
            </div>

            <a
              href="##"
              className="relative z-10 flex items-center mt-3 font-medium text-primary-6000 hover:text-primary-500 text-sm "
            >
              <span onClick={() => removeItem(item.id)}>Remove</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  const renderLeft = () => {
    return (
      <div className="space-y-8">
        <div id="ContactInfo" className="scroll-mt-24">
          <ContactInfo
            isActive={tabActive === "ContactInfo"}
            onOpenActive={() => {
              setTabActive("ContactInfo");
              handleScrollToEl("ContactInfo");
            }}
            onCloseActive={(contactInfo) => {
              //setContactInfo(contactInfo);
              setTabActive("ShippingAddress");
              handleScrollToEl("ShippingAddress");
            }}
          />
        </div>

        <div id="ShippingAddress" className="scroll-mt-24">
          <ShippingAddress
            isActive={tabActive === "ShippingAddress"}
            contactInfo={contactInfo}
            onOpenActive={() => {
              setTabActive("ShippingAddress");
              handleScrollToEl("ShippingAddress");
            }}
            onCloseActive={(data) => {
              //setShippingAddress(data);
              setTabActive("PaymentMethod");
              handleScrollToEl("PaymentMethod");
            }}
          />
        </div>

        <div id="PaymentMethod" className="scroll-mt-24">
          <PaymentMethod
            isActive={tabActive === "PaymentMethod"}
            onOpenActive={() => {
              setTabActive("PaymentMethod");
              handleScrollToEl("PaymentMethod");
            }}
            onCloseActive={() => setTabActive("PaymentMethod")}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="nc-CheckoutPage">
      <main className="container py-10 md:py-12 lg:pb-28">
        <div className="mb-8 md:mb-10">
          <h2 className="block text-2xl sm:text-3xl lg:text-4xl font-semibold ">
            Checkout
          </h2>
          <div className="block mt-6 sm:mt-5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-400">
            <Link href={"/"} className="">
              Back to products
            </Link>
            {/* <span className="text-xs mx-1 sm:mx-1.5">/</span>
            <Link href={"/collection-2"} className="">
              Clothing Categories
            </Link>
            <span className="text-xs mx-1 sm:mx-1.5">/</span>
            <span className="underline">Checkout</span> */}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="flex-1">{renderLeft()}</div>

          <div className="flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 my-10 lg:my-0 lg:mx-10 xl:lg:mx-14 2xl:mx-16 "></div>

          <div className="w-full lg:w-[36%] ">
            <h3 className="text-lg font-semibold">Order summary</h3>
            <div className="mt-8 divide-y divide-slate-200/70 dark:divide-slate-700 ">
              {cart?.line_items?.map(renderProduct)}
            </div>

            <div className="mt-10 pt-6 text-sm text-slate-500 border-t border-slate-200/70 dark:border-slate-700 dark:text-slate-400 divide-y divide-slate-200/70 dark:divide-slate-700/80">
              {/* <div>
                <Label className="text-sm">Discount code</Label>
                <div className="flex mt-1.5">
                  <Input sizeClass="h-10 px-4 py-3" className="flex-1" />
                  <button className="text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 rounded-2xl px-4 ml-3 font-medium text-sm bg-neutral-200/70 dark:bg-neutral-700 dark:hover:bg-neutral-800 w-24 flex justify-center items-center transition-colors">
                    Apply
                  </button>
                </div>
              </div> */}

              <div className="flex justify-between">
                <span>Total</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {subtotal.toFixedDecimal()} {paymentToken}
                  <div className="text-right">
                    <span className="text-xs text-slate-400">
                      ~${(subtotal * tokenPrice).toFixedDecimal(0)}
                    </span>
                  </div>
                </span>
              </div>
              {/* <div className="flex justify-between py-2.5">
                <span>Shipping estimate</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  $5.00
                </span>
              </div> */}
              {/* <div className="flex justify-between py-2.5">
                <span>Tax estimate</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  $24.90
                </span>
              </div> */}
              {/* <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-200 text-base pt-4">
                <span>Order total</span>
                <span>{subtotal.toLocaleString()} ELMT</span>
              </div> */}
              <div className="flex justify-between py-4">
                <span>Estimated gas fee</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {gasCost.toFixedDecimal()} ETH
                  <div className="text-right">
                    <span className="text-xs text-slate-400">
                      ~${(gasCost * ethTokenPrice).toFixedDecimal()}
                    </span>
                  </div>
                </span>
              </div>
            </div>
            <ButtonPrimary 
              className="mt-8 w-full" 
              disabled={!readyToOrder || placingOrder} 
              onClick={handlePlaceOrder}
              loading={placingOrder}
            >
              {placingOrder 
                ? submittingTransaction ? "Submitting transaction, see your wallet" : "Placing order..." 
                : "Place order"}
            </ButtonPrimary>
            <div className="w-full text-center mt-8">
              Need more ELMT?&nbsp;
              <Link 
                style={{ textDecoration: "underline" }} 
                href={new URL(`https://app.uniswap.org/#/swap?inputCurrency=eth&outputCurrency=${ELMT_TOKEN_ADDRESS}`)} 
                target="_blank" rel="noopener noreferrer">Buy Here</Link>
            </div>
            <div className="w-full text-center mt-8 text-sm">
              * All sales are final. No refunds. By placing this order you agree to the &nbsp;
              <a style={{textDecoration: "underline"}} href="/terms.html" target="_blank">Terms & Conditions</a>
            </div>
            {/* {account.address}<br />
            {elmtBalance}<br />
            {subtotal}<br /> */}
            <div style={{ display: (account.address && elmtBalance < subtotal) ? "block" : "none" }} className="mt-5 text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center">
              <p className="block relative pl-5">
                {/* <svg
                  className="w-4 h-4 absolute -left-1 top-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 8V13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.9945 16H12.0035"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Learn more{` `}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="##"
                  className="text-slate-900 dark:text-slate-200 underline font-medium"
                >
                  Taxes
                </a>
                <span>
                  {` `}and{` `}
                </span>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="##"
                  className="text-slate-900 dark:text-slate-200 underline font-medium"
                >
                  Shipping
                </a>
                {` `} infomation */}
                {/* You don't have enough ELMT to place this order.
                <div>
                  To obtain more ELMT, please swap some tokens 
                  using <Link style={{ textDecoration: "underline" }} href={new URL(swapUrl)} target="_blank" rel="noopener noreferrer">Uniswap</Link>&nbsp;
                  or your favorite exchange.
                </div> */}
              </p>
            </div>
          </div>
        </div>
      </main>
      <PricesChangedModal show={pricesChanged} onCloseModal={refreshAllPrices} />
    </div>
  );
};

export default CheckoutPage;

