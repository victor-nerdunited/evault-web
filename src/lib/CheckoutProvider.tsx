"use client";

import { createContext, Dispatch, useContext, useEffect, useReducer, useState } from 'react';

import { Order, useCommerce } from '@/hooks/useCommerce';
import { getCookie, removeCookie, setCookie } from 'typescript-cookie';
import { LineItem } from '@/hooks/types/commerce';

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
  clearOrder: () => void;
  createOrder: () => Promise<Order>;
  removeItem: (itemId: number) => Promise<void>;
  updateOrder: (order: Partial<Order>) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
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
  clearOrder: () => {},
  createOrder: (): Promise<Order> => Promise.resolve({} as Order),
  removeItem: () => Promise.resolve(),
  updateOrder: (order: Partial<Order>) => Promise.resolve(),
  updateQuantity: () => Promise.resolve(),
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
  // const [tasks, dispatch] = useReducer(
  //   tasksReducer,
  //   initialTasks
  // );
  
  // const jsonCart = localStorage.getItem('cart');
  // const initialCart: ICart = jsonCart ? JSON.parse(jsonCart) : { items: [], timestamp: Date.now() };
  const commerceLayer = useCommerce();
  
  const [cart, dispatchCart] = useReducer(cartReducer, null as unknown as Order);
  const [contactInfo, dispatchContactInfo] = useReducer(contactInfoReducer, null as unknown as IContactInfo);
  const [shippingAddress, dispatchShippingAddress] = useReducer(shippingAddressReducer, null as unknown as IShippingAddress);

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
      const cart = await commerceLayer.getOrder(orderId);
      dispatchCart(cart);
    }
    fetchCart();
  }, []);

  const clearOrder = (): void => {
    if (!commerceLayer) return;

    removeCookie('orderId');
    dispatchCart(null as unknown as Order);
  }

  const createOrder = async (): Promise<Order> => {
    const order = await commerceLayer.createOrder();
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
    const order = await commerceLayer.updateOrder(orderUpdate as Partial<Order>);
    dispatchCart(order as unknown as Order);
  };

  const updateOrder = async(order: Partial<Order>): Promise<void> => {
    const result = await commerceLayer.updateOrder(order);
    result && dispatchCart(result);
  }

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!commerceLayer) return;
    if (quantity > 3) return;

    // const lineItemUpdate: LineItemUpdate = {
    //   id: itemId,
    //   quantity: quantity,
    // };
    // await commerceLayer.line_items.update(lineItemUpdate);
    // const order = await commerceLayer.orders.retrieve(cart.id, {include: ["line_items", "line_items.sku"]});
    const lineIndex = cart.line_items.findIndex(x => x.id === itemId);
    if (lineIndex > -1) {
      cart.line_items[lineIndex].quantity = quantity;
    }
    const order = await commerceLayer.updateOrder(cart);
    order && dispatchCart(order);
  };

  const providerValue = {
    cart,
    contactInfo,
    shippingAddress,
    clearOrder,
    createOrder,
    removeItem,
    updateOrder,
    updateQuantity,
  }

  return (
    // <TasksContext.Provider value={tasks}>
    //   <TasksDispatchContext.Provider value={dispatch}>
    //     {children}
    //   </TasksDispatchContext.Provider>
    // </TasksContext.Provider>
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

// export function useTasksDispatch() {
//   return useContext(CheckoutDispatchContext);
// }

// function tasksReducer(tasks, action) {
//   switch (action.type) {
//     case 'added': {
//       return [...tasks, {
//         id: action.id,
//         text: action.text,
//         done: false
//       }];
//     }
//     case 'changed': {
//       return tasks.map(t => {
//         if (t.id === action.task.id) {
//           return action.task;
//         } else {
//           return t;
//         }
//       });
//     }
//     case 'deleted': {
//       return tasks.filter(t => t.id !== action.id);
//     }
//     default: {
//       throw Error('Unknown action: ' + action.type);
//     }
//   }
// }

function cartReducer(state: Order, newState: Order): Order {
  // localStorage.setItem('cart', JSON.stringify(newState));
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

// const initialTasks = [
//   { id: 0, text: 'Philosopher’s Path', done: true },
//   { id: 1, text: 'Visit the temple', done: false },
//   { id: 2, text: 'Drink matcha', done: false }
// ];