import React from 'react';
import { getProducts } from './data';
import usePromise from './hooks/use-promise';

function App() {
  const [products] = usePromise(() => getProducts(), {
    defaultValue: [],
  });

  

  return (
    <div className="">
      {products.map(product => (
        <div>
          {product.name}
          {product.price}
        </div>
      ))}
    </div>
  );
}

export default App;
