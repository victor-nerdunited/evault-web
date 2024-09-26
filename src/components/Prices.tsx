import { useCheckout } from "@/lib/CheckoutProvider";
import React, { FC } from "react";

export interface PricesProps {
  className?: string;
  price?: number;
  contentClass?: string;
}

const Prices: FC<PricesProps> = ({
  className = "",
  price = 0,
  contentClass = "py-1 px-2 md:py-1.5 md:px-2.5 text-sm font-medium",
}) => {
  const { paymentToken } = useCheckout();
  return (
    <div className={`${className}`}>
      <div
        className={`flex items-center border-2 border-green-500 rounded-lg ${contentClass}`}
      >
        <span className="text-green-500 !leading-none">{price.toFixedDecimal()} {paymentToken}</span>
      </div>
    </div>
  );
};

export default Prices;
