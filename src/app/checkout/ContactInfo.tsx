import Label from "@/components/Label/Label";
import React, { FC, useMemo, useState } from "react";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import ButtonSecondary from "@/shared/Button/ButtonSecondary";
import Checkbox from "@/shared/Checkbox/Checkbox";
import Input from "@/shared/Input/Input";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import {
  IContactInfo,
  useCheckout,
  useCheckoutDispatch,
} from "@/lib/CheckoutProvider";
import { Customer, CustomerCreate, CustomerUpdate } from "@commercelayer/sdk";
import { useCommerce } from "@/hooks/useCommerce";
import { useLogger } from "@/utils/logger";

interface Props {
  isActive: boolean;
  onOpenActive: () => void;
  onCloseActive: (contactInfo: IContactInfo) => void;
}

const ContactInfo: FC<Props> = ({ isActive, onCloseActive, onOpenActive }) => {
  const logger = useLogger("contact-info");
  const { contactInfo } = useCheckout();
  const { dispatchContactInfo } = useCheckoutDispatch();
  const commerceLayer = useCommerce();

  const { handleSubmit, control, watch } = useForm<IContactInfo>({
    defaultValues: contactInfo ?? {
      firstName: "",
      phone: "",
      email: "",
      // name: "Chuck Norris",
      // phone: "15555555555",
      // email: "vponce@nerdunited.com",
    },
  });

  const isCompleted =
    watch("firstName") && watch("lastName") && watch("phone") && watch("email");

  const onSubmit: SubmitHandler<IContactInfo> = async (data) => {
    await addOrUpdateCustomer(data);
    dispatchContactInfo(data);
    onCloseActive(data);
  };

  const addOrUpdateCustomer = async (contactInfo: IContactInfo) => {
    try {
      const customerCreate: CustomerCreate = {
        email: contactInfo.email,
        metadata: {
          //wallet_address: account.address,
          full_name: contactInfo.firstName,
          first_name: contactInfo.firstName.split(" ")[0],
          last_name: contactInfo.firstName.split(" ")[1],
          phone: contactInfo.phone,
        },
      };

      await commerceLayer!.customers.create(customerCreate);
    } catch (error) {
      logger.error("Error creating customer", error);
    }
  };

  const renderAccount = () => {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden z-0">
        <div className="flex flex-col sm:flex-row items-start p-6 ">
          <span className="hidden sm:block">
            <svg
              className="w-6 h-6 text-slate-700 dark:text-slate-400 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.71997 11.28 8.71997 9.50998C8.71997 7.69998 10.18 6.22998 12 6.22998C13.81 6.22998 15.28 7.69998 15.28 9.50998C15.27 11.28 13.88 12.72 12.12 12.78Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="sm:ml-8">
            <h3 className=" text-slate-700 dark:text-slate-300 flex ">
              <span className="uppercase tracking-tight">CONTACT INFO</span>
              <svg
                style={{ display: isCompleted ? "" : "none" }}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-5 h-5 ml-3 text-slate-900 dark:text-slate-100 "
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </h3>
            <div className="mt-1 text-sm" hidden={isActive}>
              <div className="mt-3">{watch("firstName")} {watch("lastName")}</div>
              <div className="tracking-tighter">{watch("phone")}</div>
              <div className="tracking-tighter">{watch("email")}</div>
            </div>
          </div>
          <button
            hidden={isActive}
            className="py-2 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 mt-5 sm:mt-0 sm:ml-auto text-sm font-medium rounded-lg"
            onClick={() => onOpenActive()}
          >
            Change
          </button>
        </div>
        <div
          className={`border-t border-slate-200 dark:border-slate-700 px-6 py-7 space-y-4 sm:space-y-6 ${
            isActive ? "block" : "hidden"
          }`}
        >
          <div className="flex justify-between flex-wrap items-baseline">
            {/* <span className="block text-sm my-1 md:my-0">
              Do not have an account?{` `}
              <a href="##" className="text-primary-500 font-medium">
                Log in
              </a>
            </span> */}
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
              <div>
                <Label className="text-sm">First name</Label>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: "First name is required" }}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      className="mt-1.5"
                      aria-invalid={fieldState.error ? "true" : "false"}
                      placeholder={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              <div>
                  <Label className="text-sm">Last name</Label>
                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: "Last name is required" }}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      className="mt-1.5"
                      aria-invalid={fieldState.error ? "true" : "false"}
                      placeholder={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </div>
            <div className="max-w-lg">
              <Label className="text-sm">Your phone number</Label>
              <Controller
                name="phone"
                control={control}
                rules={{
                  required: "Phone is required",
                  pattern: {
                    value: /^\+?[1-9][0-9]{7,15}$/,
                    message: "Invalid phone number",
                  },
                }}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    className="mt-1.5"
                    type={"tel"}
                    pattern="^\+?[1-9][0-9]{7,14}$"
                    minLength={7}
                    maxLength={14}
                    aria-invalid={fieldState.error ? "true" : "false"}
                    placeholder={fieldState.error?.message ?? "15555555555"}
                  />
                )}
              />
            </div>
            <div className="max-w-lg">
              <Label className="text-sm">Email address</Label>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Invalid email address",
                  },
                }}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    className="mt-1.5"
                    type={"email"}
                    aria-invalid={fieldState.error ? "true" : "false"}
                    placeholder={fieldState.error?.message}
                  />
                )}
              />
            </div>
            {/* <div>
              <Checkbox
                className="!text-sm"
                name="uudai"
                label="Email me news and offers"
                defaultChecked
              />
            </div> */}

            {/* ============ */}
            <div className="flex flex-col sm:flex-row pt-6">
              <ButtonPrimary
                className="sm:!px-7 shadow-none"
                // onClick={() => onCloseActive()}
                type="submit"
              >
                Save
              </ButtonPrimary>
              {/* <ButtonSecondary
                className="mt-3 sm:mt-0 sm:ml-3"
                onClick={() => onCloseActive()}
              >
                Cancel
              </ButtonSecondary> */}
            </div>
          </form>
        </div>
      </div>
    );
  };

  return renderAccount();
};

export default ContactInfo;
