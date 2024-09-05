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
      localStorage.setItem('token_expires', JSON.stringify({
        expires: new Date(Date.now() + authJson.expires_in * 1000).toISOString(),
        token: authJson.access_token
      }));
    }

    const token_expires = localStorage.getItem('token_expires');
    if (token_expires) {
      const { expires, token } = JSON.parse(token_expires);
      if (expires && new Date(expires) > new Date()) {
        setCommerceLayer(CommerceLayer({
          organization: 'element-united',
          accessToken: token
        }));
        return;
      }
    }

    fetchAccessToken();
  }, []);
  
  return commerceLayer;
}
