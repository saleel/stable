import React, { useState } from 'react';
import { getProducts, getContractCurrentDate, addPrices } from '../data';
import usePromise from '../hooks/use-promise';
import { formatContractDate } from '../utils';

function AddPricePage() {
  const [pricesToAdd, setPricesToAdd] = useState({});
  const [contractCurrentDate] = usePromise(() => getContractCurrentDate());
  const [products] = usePromise(() => getProducts(), {
    defaultValue: [],
  });

  const productsNotAdded = products.filter(p => !pricesToAdd[p.id]);
  const numberOfPricesAdded = Object.keys(pricesToAdd).length;


  function onSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.target);

    const productId = data.get("productId");
    const price = data.get("price");

    if (!productId || !price) return;

    setPricesToAdd(e => ({ ...e, [productId]: { price } }));
  }

  async function submitPrices() {
    console.log(pricesToAdd);
    await addPrices(contractCurrentDate, pricesToAdd);
    console.log('Done');
  }


  if (!contractCurrentDate) {
    return null;
  }

  return (
    <div className='add-price-form'>


      <h1 className='title'>Add Prices</h1>
      <div className='subtitle'>Date: {formatContractDate(contractCurrentDate)}</div>
      <hr />

      {Object.keys(pricesToAdd).map((productId) => (
        <div key={productId} className='columns'>
          <div className='column is-6'>{productId}</div>
          <div className='column is-6'>{pricesToAdd[productId].price}</div>
          <hr />
        </div>
      ))}

      <form onSubmit={onSubmit}>
        <div className='columns'>

          <div className='column is-6'>
            <div className="field">
              <label className="label">Product</label>
              <div className="control">
                <div className="select">
                  <select name="productId">
                    <option value="">Select Product</option>
                    {productsNotAdded.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className='column is-5'>
            <div className="field">
              <label className="label">Price (USD)</label>
              <div className="control">
                <input name="price" type="number" className="input" placeholder="Price" />
              </div>
            </div>
          </div>

          <div className='column'>
            <div className="field">
              <button className='button is-primary' type='submit'>+</button>
            </div>
          </div>
        </div>

      </form>

      <hr />

      {numberOfPricesAdded > 0 && (
        <button type='button' onClick={submitPrices} className='button is-success is-medium is-centered'>
          Submit {numberOfPricesAdded} Prices
        </button>
      )}


    </div >
  );
}

export default AddPricePage;
