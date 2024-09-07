"use client";

import Label from "@/components/Label/Label";
import React, { FC, useEffect, useState } from "react";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Input from "@/shared/Input/Input";
import Radio from "@/shared/Radio/Radio";
import Select from "@/shared/Select/Select";
import { Controller, SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";
import { AddressType, IContactInfo, IShippingAddress, useCheckout, useCheckoutDispatch } from "@/lib/CheckoutProvider";
import { AddressCreate, OrderUpdate, ShipmentUpdate } from "@commercelayer/sdk";
import { useCommerce } from "@/hooks/useCommerce";
import { useTokenPrice } from "@/hooks/useTokenprice";
import { usePrices } from "@/hooks/usePrices";
import { useLogger } from "@/utils/logger";

interface Props {
  //checkoutId: string | null;
  contactInfo: IContactInfo | null;
  isActive: boolean;
  onCloseActive: (data: IShippingAddress) => void;
  onOpenActive: () => void;
}

const ShippingAddress: FC<Props> = ({
  //checkoutId,
  contactInfo,
  isActive,
  onCloseActive,
  onOpenActive,
}) => {
  const logger = useLogger("shipping-address");
  const { cart } = useCheckout();
  const { dispatchShippingAddress } = useCheckoutDispatch();
  const commerceLayer = useCommerce();
  const { tokenPrice } = useTokenPrice();
  const { prices } = usePrices();

  const { handleSubmit, control, watch, setValue } = useForm<IShippingAddress>({
    defaultValues: {
      firstName: contactInfo?.firstName ?? "",
      lastName: contactInfo?.lastName ?? "",
      address1: "",
      city: "",
      country: "",
      state: "",
      postalCode: "",
      addressType: AddressType.home,
    },
    values: {
      firstName: contactInfo?.firstName ?? "",
      lastName: contactInfo?.lastName ?? "",
      address1: "",
      city: "",
      country: "US",
      state: "",
      postalCode: "",
      addressType: AddressType.home,
    }
  })

  const [availableCountries, setAvailableCountries] = useState<{name: string, code: string}[]>([]);

  const isCompleted = watch("firstName") 
    && watch("lastName") 
    && watch("address1") 
    && watch("city") 
    && watch("country") 
    && watch("state") 
    && watch("postalCode") 
    && watch("addressType");

  useEffect(() => {
    const fetchCountries = async () => {
      const data = [
        { name: "United States", code: "US" },
        // { name: "Canada", code: "CA" },
        // { name: "United Kingdom", code: "GB" },
        // { name: "Australia", code: "AU" },
        // { name: "Germany", code: "DE" },
        // { name: "France", code: "FR" },
        // { name: "Japan", code: "JP" },
        // { name: "China", code: "CN" },
        // { name: "India", code: "IN" },
      ]
      setAvailableCountries(data);
    };
    fetchCountries();
  }, []);

  const onSubmit: SubmitHandler<IShippingAddress> = async (data) => {
    await addOrderAddresses(data);
    await addShippingMethod();
    dispatchShippingAddress(data);
    onCloseActive(data);
  };

  const addOrderAddresses = async (shippingAddress: IShippingAddress) => {
    const addressCreate: AddressCreate = {
      first_name: shippingAddress.firstName,
      last_name: shippingAddress.lastName,
      line_1: shippingAddress.address1,
      city: shippingAddress.city,
      state_code: shippingAddress.state,
      zip_code: shippingAddress.postalCode,
      country_code: shippingAddress.country,
      phone: contactInfo!.phone
    }
    const address = await commerceLayer?.addresses.create(addressCreate);
    //cart.billing_address = address;

    const orderUpdate: OrderUpdate = {
      id: cart!.id,
      billing_address: address,
      customer_email: contactInfo!.email,
      shipping_address: address,
      metadata: {
        token_price: tokenPrice,
        gold_price: prices?.goldPrice,
        silver_price: prices?.silverPrice,
      }
    };
    let order = await commerceLayer?.orders.update(orderUpdate);
    logger.log("[addOrderAddresses] added billing/shipping address to order", order);
  }

  const addShippingMethod = async () => {
    const orderShipments = await commerceLayer!.orders.shipments(cart!.id, {
      include: ["available_shipping_methods"]
    });
    logger.log("[checkout] orderWithShippingMethods", orderShipments);
    const orderShipment = orderShipments.first();
    const shippingMethod = orderShipment!.available_shipping_methods![0];

    const shipmentUpdate: ShipmentUpdate = {
      id: orderShipment!.id,
      shipping_method: shippingMethod
    }
    const shipment = await commerceLayer!.shipments.update(shipmentUpdate)
    logger.log("[addShippingMethod] shipment", shipment);
  }

  const onError: SubmitErrorHandler<IShippingAddress> = (errors) => {
    logger.log(errors);
  };
  
  const renderShippingAddress = () => {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl ">
        <div className="p-6 flex flex-col sm:flex-row items-start">
          <span className="hidden sm:block">
            <svg
              className="w-6 h-6 text-slate-700 dark:text-slate-400 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.1401 15.0701V13.11C12.1401 10.59 14.1801 8.54004 16.7101 8.54004H18.6701"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.62012 8.55005H7.58014C10.1001 8.55005 12.1501 10.59 12.1501 13.12V13.7701V17.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.14008 6.75L5.34009 8.55L7.14008 10.35"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.8601 6.75L18.6601 8.55L16.8601 10.35"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <div className="sm:ml-8">
            <h3 className=" text-slate-700 dark:text-slate-300 flex ">
              <span className="uppercase">SHIPPING ADDRESS</span>
              <svg style={{ display: isCompleted ? "" : "none" }}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-5 h-5 ml-3 text-slate-900 dark:text-slate-100"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </h3>
            <div className="mt-1 text-sm" hidden={isActive}>
              <div className="mt-3">
                <div>{watch("firstName")} {watch("lastName")}</div>
                <div>{watch("address1")}</div>
                <div>{watch("city")} {watch("state")} {watch("postalCode")}</div>
                <div>{watch("country")}</div>
              </div>
            </div>
          </div>
          <button
            className="py-2 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 mt-5 sm:mt-0 sm:ml-auto text-sm font-medium rounded-lg"
            onClick={onOpenActive}
            hidden={isActive}
          >
            Change
          </button>
        </div>
        <div
          className={`border-t border-slate-200 dark:border-slate-700 px-6 py-7 space-y-4 sm:space-y-6 ${
            isActive ? "block" : "hidden"
          }`}
        >
          <form onSubmit={handleSubmit(onSubmit, onError)}>
            {/* ============ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
              <div>
                <Label className="text-sm">First name</Label>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: "First name is required" }}
                  render={({ field, fieldState }) =>
                    <Input 
                      {...field} 
                      className="mt-1.5" 
                      aria-invalid={fieldState.error ? "true" : "false"}
                      placeholder={fieldState.error?.message}
                    />
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Last name</Label>
                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: "Last name is required" }}
                  render={({ field, fieldState }) =>
                    <Input 
                      {...field} 
                      className="mt-1.5" 
                      aria-invalid={fieldState.error ? "true" : "false"}
                      placeholder={fieldState.error?.message}
                    />
                  }
                />
              </div>
            </div>

            {/* ============ */}
            <div className="sm:flex space-y-4 sm:space-y-0 sm:space-x-3">
              <div className="flex-1">
                <Label className="text-sm">Address</Label>
                <Controller
                  name="address1"
                  control={control}
                  rules={{ required: "Address is required" }}
                  render={({ field, fieldState }) =>
                    <Input 
                      {...field} 
                      className="mt-1.5" 
                      aria-invalid={fieldState.error ? "true" : "false"}
                      placeholder={fieldState.error?.message}
                    />
                  }
                />
              </div>
              <div className="sm:w-1/3">
                <Label className="text-sm">Apt/Suite</Label>
                <Input className="mt-1.5" />
              </div>
            </div>

            {/* ============ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
              <div>
                <Label className="text-sm">City</Label>
                <Controller
                  name="city"
                  control={control}
                  rules={{ required: "City is required" }}
                  render={({ field, fieldState }) =>
                    <Input 
                      {...field} 
                      className="mt-1.5" 
                      aria-invalid={fieldState.error ? "true" : "false"}
                      placeholder={fieldState.error?.message}
                    />
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Country</Label>
                <Controller
                  name="country"
                  control={control}
                  rules={{ required: "Country is required" }}
                  render={({ field, fieldState }) =>
                    <Select 
                      {...field} 
                      className="mt-1.5" 
                      aria-invalid={fieldState.error ? "true" : "false"}
                      onChange={(e) => setValue("country", e.target.value)}
                    >
                      <option defaultValue="">-- Select a country --</option>
                      {availableCountries.map((country, index) => (
                        <option key={index} value={country.code}>{country.name}</option>
                      ))}
                    </Select>
                  }
                />
              </div>
            </div>

            {/* ============ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
              <div>
                <Label className="text-sm">State/Province</Label>
                <Controller
                  name="state"
                  control={control}
                  rules={{ required: "State is required" }}
                  render={({ field, fieldState }) =>
                    <Input 
                      {...field} 
                      className="mt-1.5" 
                      aria-invalid={fieldState.error ? "true" : "false"}
                      placeholder={fieldState.error?.message}
                    />
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Postal code</Label>
                <Controller
                  name="postalCode"
                  control={control}
                  rules={{ required: "Postal code is required" }}
                  render={({ field, fieldState }) =>
                    <Input 
                      {...field} 
                      className="mt-1.5" 
                      aria-invalid={fieldState.error ? "true" : "false"}
                      placeholder={fieldState.error?.message}
                    />
                  }
                />
              </div>
            </div>

            {/* ============ */}
            <div>
              <Label className="text-sm">Address type</Label>
              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <Radio
                  label={`<span class="text-sm font-medium">Home</span>`}
                  id={AddressType.home}
                  name="Address-type"
                  defaultChecked
                  onChange={(e) => setValue("addressType", e as AddressType)}
                />
                <Radio
                  label={`<span class="text-sm font-medium">Office</span>`}
                  id={AddressType.office}
                  name="Address-type"
                  onChange={(e) => setValue("addressType", e as AddressType)}
                />
              </div>
            </div>

            {/* ============ */}
            <div className="flex flex-col sm:flex-row pt-6">
              <ButtonPrimary
                className="sm:!px-7 shadow-none"
                type="submit"
                //onClick={onCloseActive}
              >
                Save
              </ButtonPrimary>
              {/* <ButtonSecondary
                className="mt-3 sm:mt-0 sm:ml-3"
                onClick={onCloseActive}
              >
                Cancel
              </ButtonSecondary> */}
            </div>
          </form>
        </div>
      </div>
    );
  };
  return renderShippingAddress();
};

export default ShippingAddress;

