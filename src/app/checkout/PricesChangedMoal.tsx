import React, { FC } from "react";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import ButtonSecondary from "@/shared/Button/ButtonSecondary";
import NcModal from "@/shared/NcModal/NcModal";

export interface PricesChangedModalProps {
  show: boolean;
  onCloseModal: () => void;
}

const PricesChangedModal: FC<PricesChangedModalProps> = ({ show, onCloseModal }) => {
  const renderContent = () => {
    return (
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-200">
          Prices have changed
        </h3>
        <span className="text-sm">
          Prices have changed. Click OK to refresh.
        </span>
        <div className="mt-4 space-x-3">
          <ButtonPrimary type="button" onClick={onCloseModal}>
            OK
          </ButtonPrimary>
        </div>
      </div>
    );
  };

  const renderTrigger = () => {
    return null;
  };

  return (
    <NcModal
      isOpenProp={show}
      onCloseModal={onCloseModal}
      contentExtraClass="max-w-screen-sm"
      renderContent={renderContent}
      renderTrigger={renderTrigger}
      modalTitle=""
    />
  );
};

export default PricesChangedModal;
