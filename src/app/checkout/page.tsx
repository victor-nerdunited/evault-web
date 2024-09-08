"use client";

import Label from "@/components/Label/Label";
import NcInputNumber from "@/components/NcInputNumber";
import Prices from "@/components/Prices";
import { Product, PRODUCTS } from "@/data/data";
import { useEffect, useMemo, useState } from "react";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Input from "@/shared/Input/Input";
import ContactInfo from "./ContactInfo";
import PaymentMethod from "./PaymentMethod";
import Image from "next/image";
import Link from "next/link";
import { IShippingAddress, useCheckout, useCheckoutDispatch } from "@/lib/CheckoutProvider";
import ShippingAddress from "./ShippingAddress";
import { useAccount, useAccountEffect, useBalance, useConfig, useSendTransaction, useWriteContract } from "wagmi";
import { getTransactionReceipt, waitForTransactionReceipt } from "@wagmi/core";
import { ELMT_TOKEN_ABI, ELMT_TOKEN_ADDRESS, ELMT_WALLET_ADDRESS } from "@/lib/web3/constants";
import { AddressCreate, Customer, CustomerCreate, LineItem, Order, OrderUpdate, QueryParamsList, ShipmentCreate, ShipmentUpdate, WireTransferCreate } from "@commercelayer/sdk";
import { useCommerce } from "@/hooks/useCommerce";
import { getPrice, getPrices, isGold, isSilver } from "@/utils/priceUtil";
import { usePrices } from "@/hooks/usePrices";
import { useTokenPrice } from "@/hooks/useTokenprice";
import { ContractFunctionExecutionError } from "viem";
import { getTokenPrice } from "@/utils/tokenPrice";
import NcModal from "@/shared/NcModal/NcModal";
import PricesChangedModal from "./PricesChangedMoal";
import { useRouter } from "next/navigation";
import { useElmtBalance } from "@/hooks/useElmtBalance";
import { useLogger } from "@/utils/logger";
import { useEstimateGasFee } from "@/hooks/useEstimateGasFee";


const CheckoutPage = () => {
  const logger = useLogger("checkout");
  const [tabActive, setTabActive] = useState<
    "ContactInfo" | "ShippingAddress" | "PaymentMethod"
  >("ContactInfo");

  //const [contactInfo, setContactInfo] = useState<IContactFormInputs | null>(null);
  //const [shippingAddress, setShippingAddress] = useState<IShippingAddress | null>(null);
  // const [cart, setCart] = useState<Cart | null>(null);
  const { cart, contactInfo, shippingAddress, removeItem, updateQuantity } = useCheckout()!;
  const { dispatchCart } = useCheckoutDispatch()!;
  const commerceLayer = useCommerce()!;
  //const [checkoutTokenId, setCheckoutTokenId] = useState<string | null>(null);
  const account = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  let { 
    data: transactionHash, 
    error: transactionError, 
    isPending: transactionPending, 
    status: transactionStatus, 
    writeContract 
  } = useWriteContract();

  const config = useConfig();
  const token = useBalance({ address: account?.address, token: ELMT_TOKEN_ADDRESS });
  const { prices, refreshPrices } = usePrices();
  const { tokenPrice, refreshTokenPrice } = useTokenPrice();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [submittingTransaction, setSubmittingTransaction] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [pricesChanged, setPricesChanged] = useState(false);
  const router = useRouter();
  const elmtBalance = useElmtBalance();
  const [isDebug, setIsDebug] = useState(false);

  const { gasCost } = useEstimateGasFee(subtotal);

  //const fromToken = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC
  const fromToken = 'eth'; // ETH
  const toToken = ELMT_TOKEN_ADDRESS;
  //const swapUrl = `https://portfolio.metamask.io/swap?fromAddress=${fromToken}&toAddress=${toToken}`;
  const swapUrl = `https://app.uniswap.org/#/swap?inputCurrency=${fromToken}&outputCurrency=${toToken}&exactAmount=${subtotal}&exactField=output`;

  useEffect(() => {
    if (!cart) return;

    const _subtotal = cart.line_items?.reduce((acc, item) => {
      const price = getPrice(prices!, item.name!, item.sku?.description ?? "", item.sku_code ?? "", tokenPrice);
      return acc + price * item.quantity;
    }, 0) ?? 0;
    setSubtotal(_subtotal);
  }, [cart, tokenPrice, prices]);

  useEffect(() => {
    const isDebug = new URLSearchParams(window.location.search).get("debug") !== null;
    setIsDebug(isDebug);
  }, []);

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

  const sendToken = (to: string, nativeAmount: bigint) => {
    if (!token.data) throw new Error("Token data not found");

    writeContract({ 
        abi: ELMT_TOKEN_ABI,
        address: ELMT_TOKEN_ADDRESS,
        functionName: 'transfer',
        args: [
          to,
          nativeAmount,
        ],
        account: account.address,
    });
  }

  const ensurePrices = async () => {
    const localPrices = await getPrices(true);
    const localTokenPrice = await getTokenPrice(true);

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
    const hasGoldItem = cart?.line_items?.some(item => isGold(item.name ?? "", item.sku?.description ?? "", item.sku_code ?? ""));
    const hasSilverItem = cart?.line_items?.some(item => isSilver(item.name ?? "", item.sku?.description ?? "", item.sku_code ?? ""));
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
    await refreshTokenPrice();
  }

  const handlePlaceOrder= async (): Promise<void> => {
    if (!cart) return;
    if (!shippingAddress) return;
    if (!contactInfo) return;
    if (!token.data) return;
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
        BigInt(subtotal * 10 ** token.data.decimals)
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
    if (!token.data) return;
    if (!account.address) return;
    if (!transactionHash) return;

    try {
      setPlacingOrder(true);

      const addPaymentInfo = async () => {
        const wireTransferCreate: WireTransferCreate = {
          order: cart
        }
        const wireTransfer = await commerceLayer.wire_transfers.create(wireTransferCreate);
        logger.log("[checkout] wireTransfer", wireTransfer);

        const paymentMethods = await commerceLayer.orders.available_payment_methods(cart.id);
        logger.log("[checkout] paymentMethods", paymentMethods);

        const orderUpdate: OrderUpdate = {
          id: cart.id,
          payment_source: wireTransfer,
          payment_method: paymentMethods.first(),
          metadata: {
            wallet_address: account.address,
            transaction_hash: transactionHash,
            token_price: tokenPrice,
            gold_price: prices?.goldPrice,
            silver_price: prices?.silverPrice,
            amount: subtotal,
          }
        };
        const order = await commerceLayer?.orders.update(orderUpdate);
        logger.log("[checkout] order", order);
      }
      await addPaymentInfo();
        
      const orderUpdate = {
        id: cart!.id,
        _place: true,
      };
      const order = await commerceLayer?.orders.update(orderUpdate);
      logger.log("[checkout] order", order);
      router.push(`/order-confirmation?orderid=${order?.number}&total=${subtotal}&hash=${transactionHash}`);
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
    const price = getPrice(prices, item.name ?? "", item.sku?.description ?? "", item.sku_code ?? "", tokenPrice);
    const { image_url, name } = item;
    const quantityOptions = Array.from({ length: item.sku?.metadata?.max_purchase_quantity || 3 }, (_, i) => ({
      value: i + 1,
      label: i + 1
    }));

    return (
      <div key={index} className="relative flex py-7 first:pt-0 last:pb-0">
        <div className="relative h-36 w-24 sm:w-28 flex-shrink-0 overflow-hidden rounded-xl">
          <Image
            src={image_url || ""}
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
                    {quantityOptions.map(option => <option value={option.value}>{option.label}</option>)}
                  </select>
                  <Prices
                    contentClass="py-1 px-2 md:py-1.5 md:px-2.5 text-sm font-medium h-full"
                    price={price || 0}
                  />
                </div>
              </div>

              <div className="hidden flex-1 sm:flex justify-end">
                <Prices price={price || 0} className="mt-0.5" />
              </div>
            </div>
          </div>

          <div className="flex mt-auto pt-4 items-end justify-between text-sm">
            <div className="hidden sm:block text-center relative">
              <NcInputNumber
                className="relative z-10"
                max={item.sku?.metadata?.max_purchase_quantity || 3}
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
      <main className="container py-16 lg:pb-28 lg:pt-20 ">
        <div className="mb-16">
          <h2 className="block text-2xl sm:text-3xl lg:text-4xl font-semibold ">
            Checkout
          </h2>
          {/* <div className="block mt-3 sm:mt-5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-400">
            <Link href={"/"} className="">
              Homepage
            </Link>
            <span className="text-xs mx-1 sm:mx-1.5">/</span>
            <Link href={"/collection-2"} className="">
              Clothing Categories
            </Link>
            <span className="text-xs mx-1 sm:mx-1.5">/</span>
            <span className="underline">Checkout</span>
          </div> */}
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="flex-1">{renderLeft()}</div>

          <div className="flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 my-10 lg:my-0 lg:mx-10 xl:lg:mx-14 2xl:mx-16 "></div>

          <div className="w-full lg:w-[36%] ">
            <h3 className="text-lg font-semibold">Order summary</h3>
            <div className="mt-8 divide-y divide-slate-200/70 dark:divide-slate-700 ">
              {cart?.line_items?.filter(item => item.item_type === "skus").map(renderProduct)}
            </div>

            <div className="mt-10 pt-6 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-700 dark:text-slate-400 divide-y divide-slate-200/70 dark:divide-slate-700/80">
              {/* <div>
                <Label className="text-sm">Discount code</Label>
                <div className="flex mt-1.5">
                  <Input sizeClass="h-10 px-4 py-3" className="flex-1" />
                  <button className="text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 rounded-2xl px-4 ml-3 font-medium text-sm bg-neutral-200/70 dark:bg-neutral-700 dark:hover:bg-neutral-800 w-24 flex justify-center items-center transition-colors">
                    Apply
                  </button>
                </div>
              </div> */}

              <div className="flex justify-between pb-4">
                <span>Total</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {subtotal.toLocaleString()} ELMT
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
                  {gasCost.toFixed(6)} ETH
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
                You don't have enough ELMT to place this order.
                <div>
                  To obtain more ELMT, please swap some tokens 
                  using <Link style={{ textDecoration: "underline" }} href={new URL(swapUrl)} target="_blank" rel="noopener noreferrer">Uniswap</Link>&nbsp;
                  or your favorite exchange.
                </div>
              </p>
            </div>
          </div>
        </div>
      </main>
      <PricesChangedModal show={pricesChanged} onCloseModal={() => refreshAllPrices} />
    </div>
  );
};

export default CheckoutPage;

