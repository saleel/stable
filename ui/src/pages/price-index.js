/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { useLocalStorage } from '@rehooks/local-storage';
import Chart from '../components/chart';
import { getGlobalPriceIndexHistory, getPriceIndexHistory, getUSDRate } from '../data';
import usePromise from '../hooks/use-promise';
import { formatContractDate, formatContractDateWithYear, formatPrice } from '../utils';
import Table from '../components/table';
import Loading from '../components/loading';
import { Countries, Currencies } from '../constants';

const Tabs = {
  PriceIndex: 'Price Index',
  PriceIndexComparison: 'Price Index Comparison',
};

function PriceIndexPAge() {
  const [country] = useLocalStorage('country', 'US');

  const [activeTab, setActiveTab] = React.useState(Tabs.PriceIndex);

  const [priceIndexHistory, { isFetching: isFetchingPI }] = usePromise(() => getPriceIndexHistory(), {
    defaultValue: [],
  });

  const [globalPriceIndexHistory, { isFetching: isFetchingGPI }] = usePromise(() => getGlobalPriceIndexHistory(), {
    defaultValue: [],
  });

  if (!priceIndexHistory.length || isFetchingPI || isFetchingGPI) {
    return <Loading />;
  }

  const priceIndexHistoryForCurrentCountry = priceIndexHistory.filter((p) => p.country === country);

  function priceIndexView() {
    return (
      <>
        <div className="price-history-chart mb-3">
          <Chart
            data={priceIndexHistoryForCurrentCountry}
            xAxisKey="createdAt"
            yAxisKeys={['value']}
            xAxisFormatter={formatContractDate}
            yAxisFormatter={formatPrice}
          />
        </div>

        <Table
          data={priceIndexHistoryForCurrentCountry}
          fields={{
            createdAt: formatContractDateWithYear,
            value: formatPrice,
          }}
          labels={{
            createdAt: 'Date',
            value: 'Price Index',
          }}
        />

      </>
    );
  }

  function priceIndexComparisonView() {
    const pricesIndexCountryMapping = {};

    for (const priceIndex of priceIndexHistory) {
      if (!pricesIndexCountryMapping[priceIndex.createdAt]) {
        pricesIndexCountryMapping[priceIndex.createdAt] = { createdAt: priceIndex.createdAt };

        const global = globalPriceIndexHistory.find((g) => g.createdAt === priceIndex.createdAt);
        if (global) {
          pricesIndexCountryMapping[priceIndex.createdAt].global = formatPrice(global.value);
        }
      }
      pricesIndexCountryMapping[priceIndex.createdAt][priceIndex.country] = formatPrice(
        getUSDRate(Currencies[priceIndex.country], priceIndex.value),
      );
    }

    const pricesIndexPerCountries = Object.values(pricesIndexCountryMapping);

    // First item would be the latest
    const latestPricesForCountry = Object.keys(Countries).map((c) => priceIndexHistory.find((p) => p.country === c));

    return (
      <>
        <div className="price-history-chart mb-3">
          <Chart
            data={pricesIndexPerCountries}
            xAxisKey="createdAt"
            yAxisKeys={[...Object.keys(Countries), 'global']}
            xAxisFormatter={formatContractDate}
          />
        </div>

        <Table
          data={latestPricesForCountry}
          fields={{
            country: (value) => Countries[value],
            value: (_, row) => `${formatPrice(row.value)}`,
            usdEquivalent: (_, row) => `${formatPrice(getUSDRate(Currencies[row.country], row.value))}`,
          }}
          labels={{
            country: 'Country',
            value: 'Latest Price',
            usdEquivalent: 'USD Equivalent',
          }}
        />

      </>
    );
  }

  return (
    <div className="price-index-page">

      <h1 className="title">Price Index of {Countries[country]}</h1>
      <div className="subtitle">
        <div>Price Index is weighted average of prices all products in the {Countries[country]} basket choose by the DAO.</div>
        Price Index can be seen as a measure of inflation.
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

      {activeTab === Tabs.PriceIndex && priceIndexView()}
      {activeTab === Tabs.PriceIndexComparison && priceIndexComparisonView()}

    </div>
  );
}

export default PriceIndexPAge;
