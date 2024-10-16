"use client";

import { createContext, Dispatch, useContext, useEffect, useReducer, useState } from 'react';

import { Order, useCommerce } from '@/hooks/useCommerce';
import { getCookie, removeCookie, setCookie } from 'typescript-cookie';
import { LineItem, MetaDatum, Product } from '@/hooks/types/commerce';
import { usePrices } from '@/hooks/usePrices';
import { useLogger } from '@/utils/useLogger';
import { PaymentToken } from '@/types/payment-token';
import { ChainToken, usePaymentToken } from '@/hooks/usePaymentToken';
import { useTokenPrice } from '@/hooks/useTokenprice';

export interface IContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  country: string;
  state: string;
  postalCode: string;
  addressType: AddressType;
}

export enum AddressType {
  home = "home",
  office = "office",
}

interface CheckoutContextType {
  cart: Order | null;
  contactInfo: IContactInfo | null;
  shippingAddress: IShippingAddress | null;
  paymentToken: PaymentToken;
  chainToken: ChainToken | null;
  tokenPrice: number;

  addItem: (product: Product) => Promise<void>;
  clearOrder: () => void;
  createOrder: () => Promise<Order>;
  removeItem: (itemId: number) => Promise<void>;
  updateOrder: (order: Partial<Order>) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  updatePaymentToken: (newPaymentToken: PaymentToken) => Promise<void>;
  updateTokenPrice: () => Promise<void>;
}

const CheckoutContext = createContext<CheckoutContextType>({
  cart: null,
  contactInfo: null,
  shippingAddress: null,
  paymentToken: PaymentToken.ELMT,
  chainToken: null,
  tokenPrice: 0,

  addItem: (product: Product) => Promise.resolve(),
  clearOrder: () => {},
  createOrder: (): Promise<Order> => Promise.resolve({} as Order),
  removeItem: () => Promise.resolve(),
  updateOrder: (order: Partial<Order>) => Promise.resolve(),
  updateQuantity: () => Promise.resolve(),
  updatePaymentToken: (newPaymentToken: PaymentToken) => Promise.resolve(),
  updateTokenPrice: () => Promise.resolve(),
});
const CheckoutDispatchContext = createContext<{
  dispatchCart: Dispatch<Order>, 
  dispatchContactInfo: Dispatch<IContactInfo>, 
  dispatchShippingAddress: Dispatch<IShippingAddress>
}>({
  dispatchCart: () => {},
  dispatchContactInfo: () => {},
  dispatchShippingAddress: () => {}
});

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logger = useLogger("CheckoutProvider");
  const commerceLayer = useCommerce();
  
  const [cart, dispatchCart] = useReducer(cartReducer, null as unknown as Order);
  const [contactInfo, dispatchContactInfo] = useReducer(contactInfoReducer, null as unknown as IContactInfo);
  const [shippingAddress, dispatchShippingAddress] = useReducer(shippingAddressReducer, null as unknown as IShippingAddress);

  const { prices, refreshPrices } = usePrices();
  const { tokenPrice, refreshTokenPrice } = useTokenPrice();
  const { paymentToken, chainToken, changePaymentToken } = usePaymentToken();

  useEffect(() => {
    if (!cart || !commerceLayer) return;
    logger.debug("[CheckoutProvider/useEffect] updating cart total", { tokenPrice, prices });

    commerceLayer.updateCartPricesAsync(cart, paymentToken).then((order) => {
      logger.debug("[CheckoutProvider/useEffect] cart total", cart.total);
      dispatchCart(JSON.parse(JSON.stringify(order)));
    });
  }, [prices, tokenPrice, paymentToken]);

  useEffect(() => {
    if (!commerceLayer) return;
    const orderId = getCookie('orderId');
    if (!orderId)  return;
    if (/[a-zA-Z]+/.test(orderId)) {
      removeCookie("orderId");
      return;
    }

    const fetchCart = async () => {
      //const cart = await commerceLayer.orders.retrieve(orderId, {include: ["line_items", "line_items.sku"]});
      const cart = await commerceLayer.getOrder(orderId, paymentToken);
      dispatchCart(cart);

      const orderPaymentToken = cart.meta_data.find(x => x.key === "payment_token")?.value;
      if (orderPaymentToken) {
        await updatePaymentToken(orderPaymentToken);
      }

      if (!contactInfo) {
        dispatchContactInfo({
          firstName: cart.billing.first_name,
          lastName: cart.billing.last_name,
          email: cart.billing.email,
          phone: cart.billing.phone,
        });
      }

      if (!shippingAddress) {
        dispatchShippingAddress({
          addressType: AddressType.home,
          firstName: cart.shipping.first_name,
          lastName: cart.shipping.last_name,
          address1: cart.shipping.address_1,
          city: cart.shipping.city,
          state: cart.shipping.state,
          country: cart.shipping.country,
          postalCode: cart.shipping.postcode,
        })
      }
    }
    fetchCart();
  }, []);

  const clearOrder = (): void => {
    if (!commerceLayer) return;

    removeCookie('orderId');
    dispatchCart(null as unknown as Order);
    dispatchContactInfo(null as unknown as IContactInfo);
    dispatchShippingAddress(null as unknown as IShippingAddress);
  }

  const createOrder = async (): Promise<Order> => {
    const order = await commerceLayer!.createOrder();
    dispatchCart(order);
    return order;
  }

  const removeItem = async (itemId: number) => {
    const orderUpdate = {
      id: cart.id,
      line_items: [] as Partial<LineItem>[]
    };
    const lineIndex = cart.line_items.findIndex(x => x.id === itemId);
    if (lineIndex > -1) {
      orderUpdate.line_items!.push({
        id: cart.line_items[lineIndex].id,
        name: cart.line_items[lineIndex].name,
        sku: cart.line_items[lineIndex].sku,
        quantity: 0
      });
    }
    await updateOrder(orderUpdate as Order);
  };

  const updateOrder = async(order: Partial<Order>): Promise<void> => {
    order.currency = paymentToken;
    order.currency_symbol = paymentToken;
    if (!order.line_items) {
      order.line_items = cart.line_items.map(x => ({
        id: x.id,
        sku: x.sku,
        name: x.name,
        quantity: x.quantity
      } as LineItem))
    };
    const result = await commerceLayer!.updateOrder(order, paymentToken);
    result && dispatchCart(result);
  }

  const addItem = async (product: Product) => {
    const maxPurchaseQuantity = parseInt(product.attributes.find(x => x.name === "max_purchase_quantity")?.options[0] ?? "");

    const orderUpdate: Partial<Order> = {
      line_items: [],
      meta_data: [
        { key: "token_price", value: tokenPrice },
        { key: "gold_price", value: prices.goldPrice },
        { key: "silver_price", value: prices.silverPrice },
      ]
    };
    const currency = product.attributes.find(x => x.name === "currency");
    if (currency) {
      await updatePaymentToken(currency.options[0] as PaymentToken);
      orderUpdate.meta_data!.push({ key: "payment_token", value: currency.options[0] });
    }
    if (!cart) {
      const result = await createOrder();
      orderUpdate.id = result.id;
    } else {
      orderUpdate.id = cart.id;
      orderUpdate.line_items = cart.line_items.map(x => {
        return {
          id: x.id,
          price: x.price,
          quantity: x.quantity,
          sku: x.sku,
        };
      }) as LineItem[];
    }

    let lineItem: Partial<LineItem> | undefined = orderUpdate.line_items!.find(x => x.sku === product.sku);
    if (lineItem) {
      // check max quantity able to add
      if (!isNaN(maxPurchaseQuantity) && maxPurchaseQuantity <= lineItem.quantity!) return;

      lineItem.quantity!++;
    } else {
      lineItem = {
        price: parseFloat(product.price),
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        meta_data: [
          { key: "price", value: product.price.toString() } as MetaDatum,
        ]
      }
      if (maxPurchaseQuantity) {
        lineItem.meta_data?.push({ key: "max_purchase_quantity", value: maxPurchaseQuantity.toString() });
      }
      for(const attribute of product.attributes) {
        lineItem.meta_data?.push({ key: attribute.name, value: attribute.options.join(",") });
      }
      orderUpdate.line_items!.push(lineItem as LineItem);
    }
    await updateOrder(orderUpdate);
  }

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!commerceLayer) return;
    if (quantity > 3) return;

    const orderUpdate: Partial<Order> = {
      id: cart.id,
      discount_total: "0",
      coupon_lines: [],
      line_items: cart.line_items.map(x => ({
        id: x.id,
        name: x.name,
        price: x.price,
        quantity: x.quantity,
        sku: x.sku,
      })) as LineItem[]
    };
    const lineItem = orderUpdate.line_items?.find(x => x.id === itemId);
    if (lineItem) {
      lineItem.quantity = quantity;
      await updateOrder(orderUpdate);
    }
  };

  const updatePaymentToken = async (newPaymentToken: PaymentToken): Promise<void> => {
    // const newTokenPrice = await getTokenPrice(newPaymentToken, true);
    await refreshTokenPrice(true);
    changePaymentToken(newPaymentToken);
  }

  const updateTokenPrice = async(): Promise<void> => {
    //const tokenPrice = await getTokenPrice(paymentToken, true);
    await refreshTokenPrice(true);
  }

  const providerValue = {
    cart,
    contactInfo,
    shippingAddress,
    paymentToken,
    chainToken,
    tokenPrice,

    addItem,
    clearOrder,
    createOrder,
    removeItem,
    updateOrder,
    updateQuantity,
    updatePaymentToken,
    updateTokenPrice,
  }

  return (
    <CheckoutContext.Provider value={providerValue}>
      <CheckoutDispatchContext.Provider value={{dispatchCart, dispatchContactInfo, dispatchShippingAddress}}>
        {children}
      </CheckoutDispatchContext.Provider>
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  return useContext(CheckoutContext);
}
export function useCheckoutDispatch() {
  return useContext(CheckoutDispatchContext);
}

function cartReducer(state: Order, newState: Order): Order {
  if (newState) {
    setCookie('orderId', newState.id);
  }
  return newState;
}
function contactInfoReducer(state: IContactInfo, newState: IContactInfo): IContactInfo {
  return newState;
}
function shippingAddressReducer(state: IShippingAddress, newState: IShippingAddress): IShippingAddress {
  return newState;
}
