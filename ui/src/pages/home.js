import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductListItem from '../components/product-list-item';
import MetricBox from '../components/metric-box';
import { getGlobalPriceIndex, getPriceIndex, getProducts } from '../data';
import useLocalStorage from '../hooks/use-local-storage';
import usePromise from '../hooks/use-promise';
import Intro from '../components/intro';

function HomePage() {
  const navigate = useNavigate();

  const [country, setCountry] = useLocalStorage('country', 'US');
  const [searchInput, setSearchInput] = React.useState('');

  const [products] = usePromise(() => getProducts(country), {
    defaultValue: [], dependencies: [country],
  });

  const [priceIndex] = usePromise(() => getPriceIndex(country), {
    dependencies: country,
  });

  const [globalPriceIndex] = usePromise(() => getGlobalPriceIndex(), {});

  let filteredProducts = products;
  if (searchInput) {
    filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchInput.toLowerCase())
      || p.description.toLowerCase().includes(searchInput.toLowerCase()));
  }

  return (
    <div className="home-page">
      <Intro />

      <div className="metrics">
        <MetricBox style={{ backgroundColor: '#C6F6D5' }} label="Global Price Index" value={globalPriceIndex} />
        <MetricBox label="USA Price Index" value={priceIndex} />
        <MetricBox label="SZR" value="75" unit="USD" />
        <MetricBox label="USA Price Index" value="75" />
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

      <div className="product-list">
        {filteredProducts.map((product) => (
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
