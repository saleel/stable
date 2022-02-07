/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { useParams } from 'react-router';
import MetricBox from '../components/metric-box';
import Chart from '../components/chart';
import { getProduct, getUSDRate, getPriceSubmissions } from '../data';
import useLocalStorage from '../hooks/use-local-storage';
import usePromise from '../hooks/use-promise';
import {
  calculatePriceChange, formatContractDate, formatContractDateWithYear, formatPrice,
} from '../utils';
import Table from '../components/table';
import { Countries } from '../constants';
import ProductImage from '../components/product-image';

const Tabs = {
  PriceHistory: 'Price History',
  PriceComparison: 'Price Comparison',
  PriceSubmissions: 'Price Submissions',
};

function ProductPage() {
  const { productId } = useParams();
  const [country] = useLocalStorage('country', 'US');

  const [activeTab, setActiveTab] = React.useState(Tabs.PriceHistory);

  const [product] = usePromise(() => getProduct(productId), {
    dependencies: [productId],
    conditions: [productId],
  });

  const [priceSubmissions] = usePromise(() => getPriceSubmissions({ productId, country }), {
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
            yAxisLabels={['Price']}
            xAxisFormatter={formatContractDate}
            yAxisFormatter={formatPrice}
          />
        </div>

        <Table
          data={pricesForCurrentCountry}
          fields={{
            createdAt: (value) => formatContractDateWithYear(value),
            value: (value, row) => `${row.currency} ${formatPrice(value)}`,
            change: (_, row, i) => `${calculatePriceChange(pricesForCurrentCountry[i + 1], row)}%`,
          }}
          labels={{
            createdAt: 'Date',
            value: 'Price',
            change: 'Change',
          }}
        />

      </>
    );
  }

  function priceComparisonView() {
    const pricesPerCountries = product.prices.map((p) => ({
      ...p,
      [p.country]: formatPrice(p.value),
      usdEquivalent: formatPrice(getUSDRate(p.currency, p.value)),
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
            yAxisFormatter={formatPrice}
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

  function renderSubmissionUser(props) {
    const { address, transactionId } = props;
    return (
      <>
        <span>{`${address.slice(0, 5)}...${address.slice(-5)}`}</span>
        <a rel="noreferrer" target="_blank" className="ml-3" href={`${process.env.BLOCKCHAIN_EXPLORER_URL}/${transactionId}`}>tx</a>
      </>
    );
  }

  function priceSubmissionsView() {
    return (
      <Table
        data={priceSubmissions}
        fields={{
          createdAt: (value) => formatContractDateWithYear(value),
          price: (value, row) => `${row.currency} ${formatPrice(value)}`,
          createdBy: (value, row) => renderSubmissionUser({ address: value, transactionId: row.transactionId }),
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
    <div className="product-page">

      <div className="is-flex">
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

      <div>
        <ul className="product-tabs">
          {Object.entries(Tabs).map(([tabKey, tabValue]) => (
            <li key={tabKey} className={tabValue === activeTab ? 'active' : ''}>
              <a role="button" tabIndex={0} onClick={() => setActiveTab(tabValue)}>
                {tabValue}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {activeTab === Tabs.PriceHistory && priceHistoryView()}
      {activeTab === Tabs.PriceComparison && priceComparisonView()}
      {activeTab === Tabs.PriceSubmissions && priceSubmissionsView()}

    </div>
  );
}

export default ProductPage;
