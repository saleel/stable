import { format } from 'date-fns';
import React from 'react';
import { useParams } from 'react-router';
import MetricBox from '../components/metric-box';
import Chart from '../components/chart';
import { getProduct } from '../data';
import useLocalStorage from '../hooks/use-local-storage';
import usePromise from '../hooks/use-promise';
import { calculatePriceChange, formatContractDate } from '../utils';
import Table from '../components/table';

function ProductPage() {
  const { productId } = useParams();
  const [country] = useLocalStorage('country', 'US');

  const [product] = usePromise(() => getProduct(productId), {
    dependencies: [productId],
    conditions: [productId],
  });

  if (!product) {
    return null;
  }

  const pricesForCurrentCountry = product.prices.filter((p) => p.country === country);
  const latestPrice = pricesForCurrentCountry[0];
  const priceChange24 = calculatePriceChange(pricesForCurrentCountry[1], latestPrice);
  const priceChange7D = calculatePriceChange(pricesForCurrentCountry[6], latestPrice);
  const priceChange30D = calculatePriceChange(pricesForCurrentCountry[29], latestPrice);

  console.log(country, latestPrice);

  return (
    <div className="container product-page">

      <div>
        <h1 className="title">{product.name}</h1>
        <div className="subtitle is-6">
          {product.description}
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

      {pricesForCurrentCountry && (
        <>
          <h3 className="title is-5">Price history</h3>

          <div className="price-history-chart mb-3">
            <Chart
              data={[...pricesForCurrentCountry].reverse()}
              xAxisKey="createdAt"
              yAxisKey="value"
              xAxisFormatter={formatContractDate}
              yAxisFormatter={(d) => (d / 100).toFixed(2)}
            />
          </div>

          <Table
            data={pricesForCurrentCountry}
            fields={{
              createdAt: (value) => formatContractDate(value),
              value: (value, row) => `${row.currency} ${value}`,
            }}
            labels={{
              createdAt: 'Date',
              value: 'Price',
            }}
          />

        </>
      )}

    </div>
  );
}

export default ProductPage;
