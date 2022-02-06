import React from 'react';
import { useParams } from 'react-router';
import MetricBox from '../components/metric-box';
import Chart from '../components/chart';
import { getProduct, getUSDRate, getPriceSubmissions } from '../data';
import useLocalStorage from '../hooks/use-local-storage';
import usePromise from '../hooks/use-promise';
import { calculatePriceChange, formatContractDate, formatContractDateWithYear } from '../utils';
import Table from '../components/table';
import { Countries } from '../constants';
import ProductImage from '../components/product-image';

function ProductPage() {
  const { productId } = useParams();
  const [country] = useLocalStorage('country', 'US');

  const [product] = usePromise(() => getProduct(productId), {
    dependencies: [productId],
    conditions: [productId],
  });

  const [priceSubmissions] = usePromise(() => getPriceSubmissions(productId, country), {
    dependencies: [productId],
    conditions: [productId],
    defaultValue: [],
  });

  if (!product) {
    return null;
  }

  const pricesForCurrentCountry = product.prices.filter((p) => p.country === country);
  const latestPrice = pricesForCurrentCountry[0];
  const priceChange24 = calculatePriceChange(pricesForCurrentCountry[1], latestPrice);
  const priceChange7D = calculatePriceChange(pricesForCurrentCountry[6], latestPrice);
  const priceChange30D = calculatePriceChange(pricesForCurrentCountry[29], latestPrice);

  function priceHistoryView() {
    return (
      <>
        <div className="price-history-chart mb-3">
          <Chart
            data={[...pricesForCurrentCountry].reverse()}
            xAxisKey="createdAt"
            yAxisKeys={['value']}
            xAxisFormatter={formatContractDate}
            yAxisFormatter={(d) => (d / 100).toFixed(2)}
          />
        </div>

        <Table
          data={pricesForCurrentCountry}
          fields={{
            createdAt: (value) => formatContractDateWithYear(value),
            value: (value, row) => `${row.currency} ${value}`,
          }}
          labels={{
            createdAt: 'Date',
            value: 'Price',
          }}
        />

      </>
    );
  }

  function priceComparisonView() {
    const pricesPerCountries = product.prices.map((p) => ({
      ...p,
      [p.country]: +(p.value / 100).toFixed(2),
      usdEquivalent: +getUSDRate(p.currency, p.value / 100).toFixed(2),
    })).reverse();

    const latestPricesForCountry = Object.keys(Countries).map((c) => pricesPerCountries.find((p) => p.country === c));

    return (
      <>
        <div className="price-history-chart mb-3">
          <Chart
            data={pricesPerCountries}
            xAxisKey="createdAt"
            yAxisKeys={Object.keys(Countries)}
            xAxisFormatter={formatContractDate}
            yAxisFormatter={(d) => d.toFixed(2)}
          />
        </div>

        <Table
          data={latestPricesForCountry}
          fields={{
            country: (value) => Countries[value],
            value: (_, row) => `${row.currency} ${row[row.country]}`,
            usdEquivalent: (value) => `${value}`,
          }}
          labels={{
            country: 'Country',
            value: 'Price',
            usdEquivalent: 'USD Equivalent',
          }}
        />

      </>
    );
  }

  function priceSubmissionsView() {
    return (
      <Table
        data={priceSubmissions}
        fields={{
          createdAt: (value) => formatContractDateWithYear(value),
          price: (value, row) => `${row.currency} ${(value / 100).toFixed(2)}`,
          createdBy: (value) => `${value.slice(0, 5)}...${value.slice(-5)}`,
        }}
        labels={{
          createdAt: 'Date',
          createdBy: 'User',
          value: 'Price',
        }}
      />
    );
  }

  return (
    <div className="container product-page">

      <div className="is-flex" justifyContent>
        <ProductImage product={product} width={60} />
        <div className="pl-3">
          <h1 className="title">{product.name}</h1>
          <div className="subtitle is-6">
            {product.description}
          </div>
        </div>
      </div>

      <hr />

      {!latestPrice && (
        <div>
          {`No price data found for ${product.name} in ${country}`}
        </div>
      )}

      <div className="metrics">
        {latestPrice && (
          <>
            <MetricBox
              label={`Latest Price in ${country}`}
              value={latestPrice.value}
              unit={latestPrice.currency}
            />
            <MetricBox
              label="24H Change"
              showChangeIndicator
              value={priceChange24}
              unit={priceChange24 ? '%' : ''}
              style={{ ...priceChange24 && { backgroundColor: priceChange24 > 0 ? 'var(--red-200)' : 'var(--green-200)' } }}
            />
            <MetricBox
              label="7D Change"
              showChangeIndicator
              value={priceChange7D || '-'}
              unit={priceChange7D ? '%' : ''}
              style={{ ...priceChange7D && { backgroundColor: priceChange7D > 0 ? 'var(--red-200)' : 'var(--green-200)' } }}
            />
            <MetricBox
              label="30D Change"
              showChangeIndicator
              value={priceChange30D || '-'}
              unit={priceChange30D ? '%' : ''}
              style={{ ...priceChange30D && { backgroundColor: priceChange30D > 0 ? 'var(--red-200)' : 'var(--green-200)' } }}
            />
          </>
        )}
      </div>

      {pricesForCurrentCountry && priceHistoryView()}
      {pricesForCurrentCountry && priceComparisonView()}

      {priceSubmissionsView()}
    </div>
  );
}

export default ProductPage;
