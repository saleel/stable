import React from 'react';

function ProductImage(props) {
  const { product, width } = props;

  if (product.category === 'Futures') {
    return (
      <div className="futures-icon">
        <div>{product.id}</div>
        <div>=F</div>
      </div>
    );
  }

  return (
    <img
      src={`/assets/${product.id}.png`}
      alt={product.name}
      width={width}
      onError={function onError(e) {
        if (e.target.src !== '/assets/default-product.png') {
          e.target.src = '/assets/default-product.png';
        }
      }}
    />
  );
}

export default ProductImage;
