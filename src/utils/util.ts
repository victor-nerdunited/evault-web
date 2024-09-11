"use client";
import { isMobile } from "react-device-detect";

export const isMobileCheckoutEnabled = process.env.NEXT_PUBLIC_MOBILE_CHECKOUT_ENABLED === "true" && isMobile;