/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { getContractState, getTokenBalance, getTokenPrice } from '../data';
import usePromise from '../hooks/use-promise';
import useWallet from '../hooks/use-wallet';

function ExchangePage() {
  const { address, Component: WalletConnect } = useWallet();
  const [tokenBalance] = usePromise(() => getTokenBalance(address), {
    dependencies: [address],
  });
  const [contractState] = usePromise(() => getContractState(address), {
    defaultValue: {},
  });

  const [tokenPrice] = usePromise(() => getTokenPrice());

  return (
    <div className="add-price-form">

      <h1 className="title">Exchange</h1>
      <div className="subtitle">
        Mint or burn  <code>$STABLE</code>  tokens in exchange for <code>$SZR</code>
        <br />
        You can exchange 1USD worth of SZR for 1USD worth of STABLE
      </div>
      <hr />

      {!address && (
        <WalletConnect />
      )}

      {address && (
        <>
          <div>
            Your are connected to <code>{address}</code>
          </div>
          <div>
            Your SZR Balance: {tokenBalance && tokenBalance.SZR}
          </div>
          <div>
            Your STABLE Balance: {tokenBalance && tokenBalance.STABLE}
          </div>
          <div>
            SZR Price: {tokenPrice && tokenPrice.SZR} USD
          </div>
          <div>
            STABLE Price: {tokenPrice && tokenPrice.STABLE} USD
          </div>
          <div>
            STABLE Redeemable: {contractState.totalStablesRedeemable}
          </div>
          <div>
            Over Collateralization Ratio: {contractState.overCollateralizationRatio}%
          </div>
          <div>
            Mintable STABLE: {contractState.mintableStableTokenCount}
          </div>

          <br />

          <div>
          </div>
        </>
      )}

    </div>
  );
}

export default ExchangePage;
