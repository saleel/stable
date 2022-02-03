import React from 'react';

function ProductListItem(props) {
  const { product, onClick } = props;

  return (
    <div className="product-list-item columns" onClick={onClick}>
      <div className="column is-6">
        <div className="pli-name">{product.name}</div>
        <div className="pli-id">
          {product.id}
          {' - '}
          {product.description}
        </div>
      </div>
      <div className="column is-3">{product.latestPrice?.[0]?.price ?? '-'}</div>
      <div className="column is-3">{product.latestPrice?.[0]?.price ?? '-'}</div>
    </div>
  );
}

export default ProductListItem;
