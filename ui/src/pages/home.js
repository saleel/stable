import React from 'react';
import { useNavigate } from "react-router-dom";
import { getProducts } from '../data';
import usePromise from '../hooks/use-promise';

function HomePage() {
  const navigate = useNavigate();

  const [products] = usePromise(() => getProducts(), {
    defaultValue: [],
  });

  return (
    <table className="table product-table w-100">
      <thead>
        <tr className="">
          <th width="10%">ID</th>
          <th width="auto">Name</th>
          <th width="20%">Price</th>
          <th width="20%">7D Trend</th>
        </tr>
      </thead>

      <tbody>
        {products.map(product => (
          <tr key={product.id} onClick={() => { navigate("/products/" + product.id); }}>
            <td>{product.id}</td>
            <td>{product.name}</td>
            <td>{product.price || '-'}</td>
            <td></td>
          </tr>
        )
        )}
      </tbody>
    </table>
  );
}

export default HomePage;
