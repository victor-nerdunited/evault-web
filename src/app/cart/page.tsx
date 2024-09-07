"use client";

import { NoSymbolIcon, CheckIcon } from "@heroicons/react/24/outline";
import NcInputNumber from "@/components/NcInputNumber";
import Prices from "@/components/Prices";
import { Product, PRODUCTS } from "@/data/data";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Image from "next/image";
import Link from "next/link";
import { useCommerce, } from "@/utils/commercejs";
import { useCheckout, useCheckoutDispatch } from "@/lib/CheckoutProvider";
import { LineItem, LineItemUpdate, Order } from "@commercelayer/sdk";
import { getPrice } from "@/utils/priceUtil";
import { usePrices } from "@/hooks/usePrices";
import { useTokenPrice } from "@/hooks/useTokenprice";
import { useEffect, useState } from "react";
import { PriceWarning } from "@/components/PriceWarning";

const CartPage = () => {
  // const [cart, setCart] = useState<Cart | null>(null);

  // useEffect(() => {
  //   const fetchCart = async () => {
  //     const cart = await getCart();
  //     setCart(cart);
  //     console.log("cart cart", cart);
  //   };
  //   fetchCart();
  // }, []);
  const { cart, contactInfo, shippingAddress, removeItem, updateQuantity } = useCheckout();
  const {dispatchCart: cartDispatch} = useCheckoutDispatch();
  const commerceLayer = useCommerce()!;
  const { prices } = usePrices();
  const { tokenPrice } = useTokenPrice();

  const [subtotal, setSubtotal] = useState(0);
  useEffect(() => {
    console.log("[cart] cart", cart);
    if (!cart) return;

    const _subtotal = cart.line_items?.reduce((acc, item) => {
      const price = getPrice(prices!, item.name!, item.sku?.description ?? "", item.sku_code ?? "", tokenPrice);
      console.log("[cart] price", price);
      return acc + price * item.quantity;
    }, 0) ?? 0;
    setSubtotal(_subtotal);
  }, [cart, tokenPrice, prices]);
  
  const renderStatusSoldout = () => {
    return (
      <div className="rounded-full flex items-center justify-center px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <NoSymbolIcon className="w-3.5 h-3.5" />
        <span className="ml-1 leading-none">Sold Out</span>
      </div>
    );
  };

  const renderStatusInstock = () => {
    return (
      // <div className="rounded-full flex items-center justify-center px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      //   <CheckIcon className="w-3.5 h-3.5" />
      //   <span className="ml-1 leading-none">In Stock</span>
      // </div>
      <div></div>
    );
  };

  const renderProduct = (item: LineItem, index: number) => {
    const price = getPrice(prices, item.name ?? "", item.sku?.description ?? "", item.sku_code ?? "" , tokenPrice);
    const { image_url, name, quantity } = item;

    return (
      <div
        key={index}
        className="relative flex py-8 sm:py-10 xl:py-12 first:pt-0 last:pb-0"
      >
        <div className="relative h-36 w-24 sm:w-32 flex-shrink-0 overflow-hidden rounded-xl">
          <Image
            fill
            src={image_url || ""}
            alt={name || ""}
            sizes="300px"
            className="h-full w-full object-contain object-center"
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
                    value={quantity}
                    name="qty"
                    id="qty"
                    className="form-select text-sm rounded-md py-1 border-slate-200 dark:border-slate-700 relative z-10 dark:bg-slate-800 "
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                  <Prices
                    contentClass="py-1 px-2 md:py-1.5 md:px-2.5 text-sm font-medium h-full"
                    price={price || 0}
                  />
                </div>
              </div>

              <div className="hidden sm:block text-center relative">
                <NcInputNumber
                  className="relative z-10"
                  max={3}
                  defaultValue={quantity}
                  onChange={(value) => updateQuantity(item.id, value)}
                />
              </div>

              <div className="hidden flex-1 sm:flex justify-end">
                <Prices price={price || 0} className="mt-0.5" />
              </div>
            </div>
          </div>

          <div className="flex mt-auto pt-4 items-end justify-between text-sm">
            {/* {Math.random() > 0.6
              ? renderStatusSoldout()
              : renderStatusInstock()} */}
            {renderStatusInstock()}

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

  return (
    <div className="nc-CartPage">
      <main className="container py-16 lg:pb-28 lg:pt-20 ">
        <div className="mb-12 sm:mb-16">
          <h2 className="block text-2xl sm:text-3xl lg:text-4xl font-semibold ">
            Shopping Cart
          </h2>
        </div>

        <hr className="border-slate-200 dark:border-slate-700 my-10 xl:my-12" />

        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-[60%] xl:w-[55%] divide-y divide-slate-200 dark:divide-slate-700 ">
            {cart && cart.line_items?.length
              ? cart?.line_items?.filter(item => item.item_type === "skus").map(renderProduct)
              : <div>No items in cart</div>
            }
          </div>
          <div className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 my-10 lg:my-0 lg:mx-10 xl:mx-16 2xl:mx-20 flex-shrink-0"></div>
          <div className="flex-1">
            <div className="sticky top-28">
              <h3 className="text-lg font-semibold ">Order Summary</h3>
              <div className="mt-7 text-sm text-slate-500 dark:text-slate-400 divide-y divide-slate-200/70 dark:divide-slate-700/80">
                <div className="flex justify-between pb-4">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {subtotal.toLocaleString()} ELMT
                  </span>
                </div>
                {/* <div className="flex justify-between py-4">
                  <span>Shpping estimate</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    $5.00 (remove this?)
                  </span>
                </div> */}
                {/* <div className="flex justify-between py-4">
                  <span>Tax estimate</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    $24.90
                  </span>
                </div> */}
                <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-200 text-base pt-4">
                  <span>Order total</span>
                  <span>{subtotal.toLocaleString()} ELMT</span>
                </div>
              </div>
              <ButtonPrimary href="/checkout" className="mt-8 w-full">
                Checkout
              </ButtonPrimary>
              {/* <div className="mt-5 text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center">
                <p className="block relative pl-5">
                  <svg
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
                  {` `} infomation
                </p>
              </div> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CartPage;

function dispatchCart(order: Order) {
  throw new Error("Function not implemented.");
}

