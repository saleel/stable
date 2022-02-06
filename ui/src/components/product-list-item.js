import React from 'react';
import { Line, LineChart } from 'recharts';
import { calculatePriceChange } from '../utils';
import ProductImage from './product-image';

function ProductListItem(props) {
  const { product, onClick } = props;

  const { prices = [] } = product;

  const todaysPrice = prices[0] || {};
  const yesterdaysPrice = prices[1] || {};
  const oldestPrice = prices[prices.length - 1] || {};

  const currentPrice = todaysPrice.value !== undefined ? (todaysPrice.value / 100).toFixed(2) : '-';
  const currency = prices[0]?.currency ?? '';

  const priceChange24 = calculatePriceChange(yesterdaysPrice, todaysPrice);

  let priceTrendColor = 'var(--gray-200)';
  if (oldestPrice.value < todaysPrice.value) {
    priceTrendColor = 'var(--red-300)';
  }
  if (oldestPrice.value > todaysPrice.value) {
    priceTrendColor = 'var(--green-300)';
  }

  return (
    <div className="product-list-item columns" onClick={onClick}>
      <div className="column is-1 pli-image">
        <ProductImage product={product} />
      </div>
      <div className="column is-5">
        <div className="pli-name">{product.name}</div>
        <div className="pli-id">
          {product.id}
          {' - '}
          {product.description}
        </div>
      </div>
      <div className="column is-3">
        <div className="pli-price">
          {currentPrice}
        </div>
        <div className="pli-currency">
          {currency}
        </div>
      </div>
      <div className="column is-3 pli-change-container">
        <div>
          <div className={priceChange24 > 0 ? 'pli-change pli-change-up' : 'pli-change pli-change-down'}>
            {priceChange24 > 0 && (<span className="pli-icon-up" />)}
            {priceChange24 < 0 && (<span className="pli-icon-down" />)}
            {Math.abs(priceChange24)}
            <span style={{ fontSize: '0.9rem', fontWeight: '500', marginLeft: '3px' }}>%</span>
          </div>
          <div className="pli-label">
            24H Change
          </div>
        </div>

        <div>
          <LineChart width={100} height={40} data={[...prices].reverse()}>
            <Line
              dot={false}
              isAnimationActive={false}
              type="monotone"
              dataKey="value"
              stroke={priceTrendColor}
              strokeWidth={2}
            />
          </LineChart>
        </div>
      </div>
    </div>
  );
}

export default ProductListItem;
