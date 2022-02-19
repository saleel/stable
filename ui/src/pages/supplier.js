/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { getSupplier, getTokenBalance, getTokenPrice } from '../data';
import usePromise from '../hooks/use-promise';
import useWallet from '../hooks/use-wallet';

function SupplierPage() {
  const { address, Component: WalletConnect } = useWallet();
  const [supplier, { isFetching }] = usePromise(() => getSupplier(address), {
    conditions: [address], dependencies: [address],
  });

  const isSupplier = !isFetching && !!supplier.name;

  return (
    <div className="add-price-form">

      <h1 className="title">Supplier</h1>
      <div className="subtitle">
        Borrow SZR by staking reputation to promise supply of products in exchange for <code>STABLE</code> token.
      </div>
      <hr />

      {!address && (
        <WalletConnect />
      )}

      {!isFetching && !isSupplier && (
        <div className="message-warning">
          Address: <code>{address}</code>
          <br />
          <br />
          You are not a Supplier now.
          <br />
          You can create a proposal at StableDAO to become a Supplier.
        </div>
      )}

      {address && isSupplier && (
        <>
          <div>
            Address: <code>{address}</code>
          </div>
          <div>
            Name: {supplier.name}
          </div>
          <div>
            STABLE redeemable: {supplier.stablesRedeemable}
          </div>
          <div>
            STABLE redeemed: {supplier.stablesRedeemed}
          </div>
          <div>
            Claim percentage: {supplier.claimPercent}
          </div>
          <div>
            SZR Rewards per redemption: {supplier.szrRewardsPerRedemption}
          </div>
          <div>
            SZR Withdrawable: {supplier.szrWithdrawable}
          </div>
        </>
      )}

    </div>
  );
}

export default SupplierPage;
