"use client";

import { useCheckout, useCheckoutDispatch } from "@/lib/CheckoutProvider";
import Commerce from "@chec/commerce.js";
import { Cart } from "@chec/commerce.js/types/cart";

const checPublicKey = process.env.NEXT_PUBLIC_CHEC_PUBLIC_KEY + "";
const devEnvironment = process.env.NODE_ENV === "development";

if (devEnvironment && !checPublicKey) {
  throw Error(
    "A Chec public API key must be provided as an environment variable named NEXT_PUBLIC_CHEC_PUBLIC_KEY. Retrieve your Chec public key in your Chec Dashboard account by navigating to Setup > Developer, or can be obtained with the Chec CLI via with the command chec whoami"
  );
}

export const commerce = new Commerce(checPublicKey, devEnvironment);

// new

import CommerceLayer, { CommerceLayerClient, Order } from '@commercelayer/sdk'
import { useEffect, useState } from "react";

export function useCommerce() {
  const [commerceLayer, setCommerceLayer] = useState<CommerceLayerClient | null>(null);

  useEffect(() => {
    const fetchAccessToken = async () => {
      const authResponse = await fetch('https://auth.commercelayer.io/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "grant_type": "client_credentials",
          "client_id": "mOvv1ULcTmNBqSoQEbxzL8h7Ss7G2c9FI7gXzbx4zvg",
          "scope": "market:id:bgOEQhDVoZ"
        }),
      });
      const authJson = await authResponse.json();
      setCommerceLayer(CommerceLayer({
        organization: 'element-united',
        accessToken: authJson.access_token

      }));
    }
    fetchAccessToken();
  }, []);
  
  return commerceLayer;
}
