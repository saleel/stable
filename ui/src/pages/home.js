import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductListItem from '../components/product-list-item';
import MetricBox from '../components/metric-box';
import { getPriceIndex, getProducts } from '../data';
import usePromise from '../hooks/use-promise';
import Intro from '../components/intro';

function HomePage() {
  const navigate = useNavigate();

  const [country, setCountry] = useState('US');

  const [products] = usePromise(() => getProducts(country), {
    defaultValue: [],
  });

  const [priceIndex] = usePromise(() => getPriceIndex(country));

  return (
    <div className="home-page">
      <Intro />

      <div className="metrics">
        <MetricBox style={{ backgroundColor: '#C6F6D5'}} label="Global Price Index" value="133" />
        <MetricBox label="USA Price Index" value="75" />
        <MetricBox label="SZR" value="75" unit="USD" />
        <MetricBox label="USA Price Index" value="75" />
      </div>

      <div className="product-search">
        <input className="input input-product-search" value="" placeholder="Search product" />

        <div className="product-tracking-summary">
          <span>
            {`${products.length} products`}
          </span>
          <span>
            {`${products.length} in ${country} basket`}
          </span>
        </div>
      </div>

      <div className="product-list">

        {products.map((product) => (
          <ProductListItem
            key={product.id}
            product={product}
            onClick={() => { navigate(`/products/${product.id}`); }}
          />
        ))}
      </div>
    </div>
  );
}

export default HomePage;
