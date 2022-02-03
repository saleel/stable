import React from 'react';
import { useParams } from 'react-router';
import { Line, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getProduct } from '../data';
import usePromise from '../hooks/use-promise';
import { formatContractDate } from '../utils';

function ProductPage() {
  const { productId } = useParams();

  const [product] = usePromise(() => getProduct(productId), {
    dependencies: [productId],
    conditions: [productId]
  });

  if (!product) {
    return null;
  }

  console.log(product)

  return (
    <div>

      <div className='is-flex is-justify-content-space-between'>
        <div>
          <h1 className="title mb-5">{product.name}</h1>
          <div className="subtitle is-6">
            <code>{product.id}</code>
            <span className="px-3">{product.description}</span>
          </div>
        </div>

        <div className='tag is-light is-large'>
          <h2 className='title is-3'>${product?.latestPrice?.[0]?.price}</h2>
        </div>
      </div>
      <hr />

      {product.priceHistory ? (
        <>
          <h3 className="title is-5">Price history</h3>

          <ComposedChart width={1000} height={300} data={product.priceHistory} margin={{ top: 25, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#129a74" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={formatContractDate} />
            <YAxis />
            <Tooltip />
            <CartesianGrid vertical={false} stroke="#DDD" />

            <Line type="monotone" unit="$" strokeLinecap="round" strokeWidth={2}
              // style={{ strokeDasharray: `40% 60%` }}
              dataKey="price"
              stroke="#006991"
              dot={false}
              legendType="none"
            />
            <Area type="monotone" dataKey="price" tooltipType='none' stroke={false} strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" />
          </ComposedChart>

          <hr />

          <table className="table product-table w-100">
            <thead>
              <tr className="">
                <th>Date</th>
                <th>Price</th>
                <th>Confirmations</th>
              </tr>
            </thead>

            <tbody>
              {(product.priceHistory || []).map(history => (
                <tr key={history.id}>
                  <td>{history.date}</td>
                  <td>{history.price}</td>
                  <td>{history.confirmations}</td>
                  <td></td>
                </tr>
              )
              )}
            </tbody>
          </table>

        </>
      ) : (
        <div>No price history found for {product.name}</div>
      )}


    </div>
  );
}

export default ProductPage;
