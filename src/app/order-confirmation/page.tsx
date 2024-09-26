"use client";

import { useCheckout } from "@/lib/CheckoutProvider";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const OrderConfirmation = async () => {
  const searchParams = useSearchParams();
  const { clearOrder } = useCheckout();

  useEffect(() => {
    clearOrder();
  }, []);

  return (
    <div className="nc-OrderConfirmationPage">
      <main className="container py-16 lg:pb-28 lg:pt-20 ">
        <div className="mb-16">
          <h2 className="block text-2xl sm:text-3xl lg:text-4xl font-semibold ">
            Order Confirmation
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
          {/* <div className="flex-1">{renderLeft()}</div> */}

          <div className="w-full">
            <h3 className="text-lg font-semibold">
              Congratulations! Your order has been placed.
            </h3>
            {/* <div className="mt-8 divide-y divide-slate-200/70 dark:divide-slate-700 ">
            {cart?.line_items?.map(renderProduct)}
          </div> */}

            <div className="mt-10 pt-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex justify-between text-slate-900 dark:text-slate-200 text-base pt-4">
                <span className="font-semibold">Order Number</span>
                <span>{searchParams.get("orderid")}</span>
              </div>
              <div className="flex justify-between text-slate-900 dark:text-slate-200 text-base pt-4">
                <span className="font-semibold">Order total</span>
                <span>
                  {Number(searchParams.get("total")).toFixedDecimal()} {searchParams.get("token")}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 dark:text-slate-200 text-base pt-4">
                <span className="font-semibold">Transaction</span>
                <span>
                  <a
                    style={{ textDecoration: "underline" }}
                    href={`https://etherscan.io/tx/${searchParams.get("hash")}`}
                    target="_blank"
                  >
                    {searchParams.get("hash")}
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const OrderConfirmationPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderConfirmation />
    </Suspense>
  );
};

export default OrderConfirmationPage;
