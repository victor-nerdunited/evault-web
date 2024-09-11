"use client";

import React, { FC, Suspense, useEffect, useState } from "react";
import Pagination from "@/shared/Pagination/Pagination";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import SectionSliderCollections from "@/components/SectionSliderLargeProduct";
import SectionPromo1 from "@/components/SectionPromo1";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/data/data";
import TabFilters from "@/components/TabFilters";
import { useCommerce } from "@/hooks/useCommerce";
import { Sku } from "@commercelayer/sdk";
import { getPrices } from "@/utils/priceUtil";
import { Bars } from "react-loader-spinner";
import { PriceWarning } from "@/components/PriceWarning";
import { MobileView } from "react-device-detect";
import { isCheckoutDisabled } from "@/utils/util";

/* this is a copy of collection/page.tsx */
const PageCollection = ({}) => {
  const commerceLayer = useCommerce();

  const [products, setProducts] = useState<Sku[] | null>(null);

  useEffect(() => {
    if (!commerceLayer) return;

    const fetchProducts = async () => {
      const products = await commerceLayer?.skus.list({ include: ["prices"] });
      setProducts(products ?? []);
    };
    fetchProducts();
  }, [commerceLayer]);

  // pre-load prices
  useEffect(() => {
    getPrices();
  }, []);

  return (
    <div className={`nc-PageCollection`}>
      {isCheckoutDisabled ? 
        <MobileView>
          <div className="alert warning">
            <div className="alertClose">X</div>
            <div className="alertText">
              Please note, mobile ordering <br />is currently unavailable. <br />
              Visit the website on your desktop to order.
            </div>
          </div>
        </MobileView> : null}
      <div className="container py-16 lg:pb-28 lg:pt-20 space-y-16 sm:space-y-20 lg:space-y-28">
        <div className="space-y-10 lg:space-y-14">
          {products ?
          <main>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-8 gap-y-10 mt-8 lg:mt-10">
              {products?.map((item, index) => (
                <ProductCard data={item} key={index} />
              ))}
            </div>
          </main>
          : <div className="flex flex-col align-center items-center"><Bars /><br/><p>Loading...</p></div>
          }
        </div>
      </div>
    </div>
  );
};

export default PageCollection;
