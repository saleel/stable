import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getAggregationRoundId, addPrices } from '../data';
import { useLocalStorage } from '@rehooks/local-storage';
import usePromise from '../hooks/use-promise';
import { formatContractDate } from '../utils';

function AddPricePage() {
  const navigate = useNavigate();

  const [pricesToAdd, setPricesToAdd] = useState({});
  const [country] = useLocalStorage('country', 'US');

  const [aggregationRoundId] = usePromise(() => getAggregationRoundId(country), {
    conditions: [country],
  });
  const [products] = usePromise(() => getProducts(country), {
    defaultValue: [],
    conditions: [country],
  });

  const productsNotAdded = products.filter((p) => !pricesToAdd[p.id]);
  const numberOfPricesAdded = Object.keys(pricesToAdd).length;

  function onSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.target);

    const productId = data.get('productId');
    const price = data.get('price');

    if (!productId || !price) return;

    setPricesToAdd((p) => ({ ...p, [productId]: { price } }));

    e.target.reset();
  }

  async function submitPrices(e) {
    e.target.classList.add('is-loading');
    e.target.setAttribute('disabled', true);

    try {
      await addPrices({ country, priceMapping: pricesToAdd, source: 'test' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      // eslint-disable-next-line no-alert
      window.alert('Error ocurred while submitting price');
    }

    e.target.classList.remove('is-loading');
    e.target.removeAttribute('disabled');

    // eslint-disable-next-line no-alert
    window.alert('Prices submitted successfully');

    navigate('/');
  }

  if (!aggregationRoundId) {
    return null;
  }

  return (
    <div className="add-price-form">

      <h1 className="title">Add Prices</h1>
      <div className="subtitle">
        Date:
        {' '}
        {formatContractDate(aggregationRoundId)}
      </div>
      <hr />

      {Object.keys(pricesToAdd).map((productId) => (
        <div key={productId} className="added-product columns">
          <div className="column is-6">{products.find((p) => p.id === productId).name}</div>
          <div className="column is-6">{pricesToAdd[productId].price}</div>
        </div>
      ))}
      <hr />

      <form onSubmit={onSubmit}>
        <div className="columns">

          <div className="column is-6">
            <div className="field">
              <label className="label">Product</label>
              <div className="control">
                <div className="select">
                  <select name="productId">
                    <option value="">Select Product</option>
                    {productsNotAdded.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="column is-5">
            <div className="field">
              <label className="label">Price (USD)</label>
              <div className="control">
                <input name="price" type="number" step=".01" className="input" placeholder="Price" />
              </div>
            </div>
          </div>

          <div className="column is-flex is-align-items-flex-end">
            <div className="field">
              <button className="button btn-add-product" type="submit">+</button>
            </div>
          </div>
        </div>

      </form>

      <hr />

      {numberOfPricesAdded > 0 && (
        <button type="button" onClick={submitPrices} className="button btn-submit-prices is-medium is-centered">
          {`Submit ${numberOfPricesAdded} Prices`}
        </button>
      )}

    </div>
  );
}

export default AddPricePage;
