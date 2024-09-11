"use client";
import { isMobile } from "react-device-detect";

export const isCheckoutDisabled = process.env.NEXT_PUBLIC_MOBILE_CHECKOUT_DISABLED === "true" && isMobile;