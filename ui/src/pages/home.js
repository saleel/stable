import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@rehooks/local-storage';
import ProductListItem from '../components/product-list-item';
import MetricBox from '../components/metric-box';
import {
  getGlobalPriceIndex, getPriceIndex, getProducts, getTokenPrice,
} from '../data';
import usePromise from '../hooks/use-promise';
import Intro from '../components/intro';
import { Countries } from '../constants';

function HomePage() {
  const navigate = useNavigate();

  const [country] = useLocalStorage('country', 'US');
  const [searchInput, setSearchInput] = React.useState('');

  const [products, { isFetching: isFetchingProducts }] = usePromise(() => getProducts(country), {
    defaultValue: [], dependencies: [country],
  });

  const [tokenPrice, { isFetching: isFetchingTokenPrice }] = usePromise(() => getTokenPrice(), {
    dependencies: country,
  });

  const [priceIndex, { isFetching: isFetchingPI }] = usePromise(() => getPriceIndex(country), {
    dependencies: country,
  });

  const [globalPriceIndex, { isFetching: isFetchingGPI }] = usePromise(() => getGlobalPriceIndex(), {});

  let filteredProducts = products;
  if (searchInput) {
    filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchInput.toLowerCase())
      || p.description.toLowerCase().includes(searchInput.toLowerCase()));
  }

  const productCategories = {
    Food: products.length ? [] : Array(10).fill({}),
    Futures: products.length ? [] : Array(10).fill({}),
    Energy: products.length ? [] : Array(10).fill({}),
    Alcohol: products.length ? [] : Array(10).fill({}),
    Cryptocurrency: products.length ? [] : Array(10).fill({}),
  };

  if (products.length && filteredProducts.length) {
    for (const p of filteredProducts) {
      productCategories[p.category].push(p);
    }
  }

  return (
    <div className="home-page">
      <Intro />

      <div className="metrics">
        <MetricBox loading={isFetchingGPI} style={{ backgroundColor: '#C6F6D5' }} label="Global Price Index" value={globalPriceIndex} />
        <MetricBox loading={isFetchingPI} label={`${Countries[country]} Price Index`} value={priceIndex} />
        <MetricBox loading={isFetchingTokenPrice} label="SZR Price" value={tokenPrice?.SZR} unit="USD" />
        <MetricBox loading={isFetchingTokenPrice} label="Stable Price" value={tokenPrice?.STABLE} unit="USD" />
      </div>

      <div className="product-search">
        <input
          className="input input-product-search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search product"
        />

        <div className="product-tracking-summary">
          <span>
            {`${products.length} products`}
          </span>
          <span>
            {`${products.length} in ${country} basket`}
          </span>
        </div>
      </div>

      {Object.keys(productCategories).map((category) => (
        <div key={category} className="product-list">
          <div className="product-category">{category}</div>
          {productCategories[category].map((product, i) => (
            <ProductListItem
              key={product.id ? (category + product.id) : (category + i)}
              loading={isFetchingProducts}
              product={product}
              onClick={() => { navigate(`/products/${product.id}`); }}
            />
          ))}
        </div>
      ))}

    </div>
  );
}

export default HomePage;
