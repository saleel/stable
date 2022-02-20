/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import { useLocalStorage } from '@rehooks/local-storage';
import { getProductsWithWeightage, getAggregationRoundId, submitPrices } from '../data';
import usePromise from '../hooks/use-promise';
import useWallet from '../hooks/use-wallet';

function SubmitPricePage() {
  const { address, Component: WalletConnect } = useWallet();

  const [message, setMessage] = useState();

  const [pricesToAdd, setPricesToAdd] = useState({});
  const [country] = useLocalStorage('country', 'US');

  const [aggregationRoundId] = usePromise(() => getAggregationRoundId(country), {
    conditions: [country],
  });
  const [products] = usePromise(() => getProductsWithWeightage({ country }), {
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

  async function onSubmitPrices(e) {
    e.target.classList.add('is-loading');
    e.target.setAttribute('disabled', true);

    try {
      await submitPrices({
        address, country, priceMapping: pricesToAdd, source: 'manual',
      });
      setMessage('Prices submitted successfully');
      setPricesToAdd({});
    } catch (err) {
      setMessage(err.message);
    }

    e.target.classList.remove('is-loading');
    e.target.removeAttribute('disabled');
  }

  if (!aggregationRoundId) {
    return null;
  }

  return (
    <div className="add-price-page">

      <h1 className="title">Add Prices</h1>
      <div className="subtitle">
        Current Aggregation Round: {aggregationRoundId.toString()}
      </div>
      <hr />

      {!address && (
        <WalletConnect />
      )}

      {address && (
        <div className="add-price-form">
          <div className="info-box mb-5">
            Wallet connected. Address:<code>{address}</code>
          </div>

          <hr />

          <div className="columns">
            <div className="column is-6">
              <label className="label">Product</label>
            </div>
            <div className="column is-6">
              <label className="label">Price in USD (without decimals)</label>
            </div>
          </div>

          {Object.keys(pricesToAdd).map((productId) => (
            <div key={productId} className="added-product columns">
              <div className="column is-6">{products.find((p) => p.id === productId).name}</div>
              <div className="column is-6">{pricesToAdd[productId].price}</div>
            </div>
          ))}

          <form onSubmit={onSubmit}>
            <div className="columns">

              <div className="column is-6">
                <div className="field">
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
            <button type="button" onClick={onSubmitPrices} className="button btn-submit-prices is-medium is-centered">
              {`Submit ${numberOfPricesAdded} Prices`}
            </button>
          )}

          {message && (
            <div className="message mt-5">{message}</div>
          )}
        </div>
      )}

    </div>
  );
}

export default SubmitPricePage;
