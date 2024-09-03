"use client";

import { useCheckout, useCheckoutDispatch } from "@/lib/CheckoutProvider";

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
