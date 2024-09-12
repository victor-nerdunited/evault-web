import React from "react";
import ButtonClose from "@/shared/ButtonClose/ButtonClose";

export enum AlertType {
  default = "default",
  warning = "warning",
  info = "info",
  success = "success",
  error = "error"
}
export interface AlertProps {
  containerClassName?: string;
  type: AlertType;
  children?: React.ReactNode;
  showClose: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  children = "Alert Text",
  containerClassName = "",
  type = AlertType.default,
  showClose = false,
  ...args
}) => {
  return (
    <div className={"alert " + type + " " + containerClassName} {...args}>
      <div hidden={!showClose} className="alertClose">X</div>
      <div className="alertText">
        {children}
      </div>
    </div>
  );
};
