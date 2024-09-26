"use client";

import { createContext, Dispatch, useContext, useEffect, useReducer, useState } from 'react';

import { Order, useCommerce } from '@/hooks/useCommerce';
import { getCookie, removeCookie, setCookie } from 'typescript-cookie';
import { LineItem } from '@/hooks/types/commerce';
import { usePrices } from '@/hooks/usePrices';
import { getPrice, getPrices, MineralPrices } from '@/utils/priceUtil';
//import { usePaymentToken } from '@/hooks/usePaymentToken';
import { useLogger } from '@/utils/useLogger';
import { PaymentToken } from '@/types/payment-token';
import { getTokenPrice } from '@/utils/tokenPrice';
import { ChainToken, usePaymentToken } from '@/hooks/usePaymentToken';

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

  clearOrder: () => void;
  createOrder: () => Promise<Order>;
  removeItem: (itemId: number) => Promise<void>;
  updateOrder: (order: Partial<Order>) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  updatePaymentToken: (newPaymentToken: PaymentToken) => Promise<void>;
  updateTokenPrice: () => Promise<void>;
}

// enum CartActionType {
//   UpdateCart = 'initialized'
// }

// interface CartAction {
//   type: CartActionType;
//   cart: Cart;
// }

const CheckoutContext = createContext<CheckoutContextType>({
  cart: null,
  contactInfo: null,
  shippingAddress: null,
  paymentToken: PaymentToken.ELMT,
  chainToken: null,
  tokenPrice: 0,

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
  //const { tokenPrice, refreshTokenPrice } = useTokenPrice();
  //const { paymentToken, changePaymentToken } = usePaymentToken();
  const [tokenPrice, setTokenPrice] = useState(0);
  //const [paymentToken, setPaymentToken] = useState(PaymentToken.ELMT);
  const { paymentToken, chainToken, changePaymentToken } = usePaymentToken();

  useEffect(() => {
    if (!cart || !commerceLayer) return;
    logger.log("[CheckoutProvider/useEffect] updating cart total", { tokenPrice, prices });

    commerceLayer.updateCartPricesAsync(cart, paymentToken).then((order) => {
      logger.log("[CheckoutProvider/useEffect] cart total", cart.total);
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
      //orderUpdate.line_items![lineIndex].quantity = 0;
      orderUpdate.line_items!.push({
        id: cart.line_items[lineIndex].id,
        quantity: 0
      });
    }
    // await commerceLayer.line_items.delete(itemId);
    // const order = await commerceLayer.orders.retrieve(cart.id, {include: ["line_items", "line_items.sku"]});
    const order = await commerceLayer!.updateOrder(orderUpdate as Partial<Order>, paymentToken);
    dispatchCart(order as unknown as Order);
  };

  const updateOrder = async(order: Partial<Order>): Promise<void> => {
    const result = await commerceLayer!.updateOrder(order, paymentToken);
    result && dispatchCart(result);
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
        total: x.total
      })) as LineItem[]
    };
    const lineItem = orderUpdate.line_items!.find(x => x.id === itemId);
    if (lineItem) {
      const prices = await getPrices();
      const tokenPrice = await getTokenPrice(paymentToken);
      lineItem.price = await getPrice(prices, lineItem.name, lineItem.sku, tokenPrice);
      lineItem.quantity = quantity;
      lineItem.total = (lineItem.price * quantity).toString();
    }
    const order = await commerceLayer.updateOrder(orderUpdate, paymentToken);
    order && dispatchCart(order);
  };

  const updatePaymentToken = async (newPaymentToken: PaymentToken): Promise<void> => {
    const newTokenPrice = await getTokenPrice(newPaymentToken, true);
    setTokenPrice(newTokenPrice);
    changePaymentToken(newPaymentToken);
  }

  const updateTokenPrice = async(): Promise<void> => {
    const tokenPrice = await getTokenPrice(paymentToken, true);
    setTokenPrice(tokenPrice);
  }

  const providerValue = {
    cart,
    contactInfo,
    shippingAddress,
    paymentToken,
    chainToken,
    tokenPrice,

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
