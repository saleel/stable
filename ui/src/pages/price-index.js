/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { useLocalStorage } from '@rehooks/local-storage';
import Chart from '../components/chart';
import { getPriceIndexHistory } from '../data';
import usePromise from '../hooks/use-promise';
import { formatContractDate, formatContractDateWithYear, formatPrice } from '../utils';
import Table from '../components/table';
import Loading from '../components/loading';
import { Countries } from '../constants';

function PriceIndexPAge() {
  const [country] = useLocalStorage('country', 'US');

  const [priceIndexHistory, { isFetching }] = usePromise(() => getPriceIndexHistory({ country }), {
    dependencies: [country],
    conditions: [country],
    defaultValue: [],
  });

  if (!priceIndexHistory.length || isFetching) {
    return <Loading />;
  }

  return (
    <div className="price-index-page">

      <h1 className="title">Price Index of {Countries[country]}</h1>
      <div className="subtitle">
        <div>Price Index is weighted average of prices all products in the {Countries[country]} basket choose by the DAO.</div>
        Price Index can be seen as a measure of inflation.
      </div>

      <hr />

      <div className="price-history-chart mb-3">
        <Chart
          data={priceIndexHistory}
          xAxisKey="createdAt"
          yAxisKeys={['value']}
          xAxisFormatter={formatContractDate}
          yAxisFormatter={formatPrice}
        />
      </div>

      <Table
        data={priceIndexHistory}
        fields={{
          createdAt: formatContractDateWithYear,
          value: formatPrice,
        }}
        labels={{
          createdAt: 'Date',
          value: 'Price Index',
        }}
      />

    </div>
  );
}

export default PriceIndexPAge;
