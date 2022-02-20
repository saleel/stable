/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import Chart from '../components/chart';
import { getGlobalPriceIndexHistory } from '../data';
import usePromise from '../hooks/use-promise';
import {
  formatContractDate, formatContractDateWithYear, formatPrice, sortByContractDate,
} from '../utils';
import Table from '../components/table';
import Loading from '../components/loading';

function GlobalPriceIndexPAge() {
  const [globalPriceIndexHistory, { isFetching }] = usePromise(() => getGlobalPriceIndexHistory(), {
    defaultValue: [],
  });

  if (!globalPriceIndexHistory.length || isFetching) {
    return <Loading />;
  }

  const history = sortByContractDate(globalPriceIndexHistory, 'id');

  return (
    <div className="global-price-index-page">

      <h1 className="title">Global Price Index</h1>
      <div className="subtitle">
        <div>Global Price Index is weighted average of Price Index all countries.</div>
        Global Price Index can be seen as a measure of global inflation.
      </div>

      <hr />

      <div className="price-history-chart mb-3">
        <Chart
          data={[...history].reverse()}
          xAxisKey="id"
          yAxisKeys={['value']}
          xAxisFormatter={formatContractDate}
          yAxisFormatter={formatPrice}
        />
      </div>

      <Table
        data={history}
        fields={{
          id: formatContractDateWithYear,
          value: formatPrice,
        }}
        labels={{
          id: 'Date',
          value: 'Global Price Index',
        }}
      />

    </div>
  );
}

export default GlobalPriceIndexPAge;
