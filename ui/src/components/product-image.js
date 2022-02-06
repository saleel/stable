import React from 'react';

function ProductImage(props) {
  const { product, width } = props;

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
