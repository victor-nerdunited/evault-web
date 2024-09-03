"use client";

import React, { FC, useEffect, useState } from "react";
import Pagination from "@/shared/Pagination/Pagination";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import SectionSliderCollections from "@/components/SectionSliderLargeProduct";
import SectionPromo1 from "@/components/SectionPromo1";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/data/data";
import TabFilters from "@/components/TabFilters";
import { useCommerce } from "@/utils/commercejs";
import { Sku } from "@commercelayer/sdk";
import { getPrices } from "@/utils/priceUtil";

/* this is a copy of collection/page.tsx */
const PageCollection = ({}) => {
  const commerceLayer = useCommerce();

  const [products, setProducts] = useState<Sku[]>([]);

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
      <div className="container py-16 lg:pb-28 lg:pt-20 space-y-16 sm:space-y-20 lg:space-y-28">
        <div className="space-y-10 lg:space-y-14">
          {/* HEADING */}
          <main>
            {/* LOOP ITEMS */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 mt-8 lg:mt-10">
              {products?.map((item, index) => (
                <ProductCard data={item} key={index} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PageCollection;
