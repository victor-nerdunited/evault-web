"use client";

import { useCheckout, useCheckoutDispatch } from "@/lib/CheckoutProvider";

// new

import CommerceLayer, { CommerceLayerClient, Order, RequestObj, ResponseObj } from '@commercelayer/sdk'
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
          "client_id": process.env.COMMERCE_LAYER_CLIENT_ID,
          "scope": process.env.COMMERCE_LAYER_SCOPE
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
        const commerceLayer = CommerceLayer({
          organization: 'element-united',
          accessToken: token
        });
        commerceLayer.addResponseInterceptor(responseInterceptor);
        setCommerceLayer(commerceLayer);
        return;
      }
    }

    fetchAccessToken();
  }, []);
  
  return commerceLayer;
}

const responseInterceptor = async (response: ResponseObj): Promise<ResponseObj> => {
  if (response.status === 200 && /.*skus.*/.test(response.url)) {
    const jsonObj = await response.json();
    if (jsonObj?.data[0]?.meta?.mode === "test") {
      localStorage.setItem('is_test_mode', 'true');
    } else {
      localStorage.removeItem('is_test_mode');
    }
    return new Response(JSON.stringify(jsonObj));
  }
  return response;
}
