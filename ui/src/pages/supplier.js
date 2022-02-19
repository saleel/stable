/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { getSupplier, withdrawSZR } from '../data';
import usePromise from '../hooks/use-promise';
import useWallet from '../hooks/use-wallet';
import { trimAddress } from '../utils';

function SupplierPage() {
  const [szrToWithdraw, setSZRToWithdraw] = React.useState('');
  const [withdrawMessage, setWithdrawMessage] = React.useState('');
  const [withdrawHash, setWithdrawHash] = React.useState('');
  const [isWithdrawalValid, setIsWithdrawalValid] = React.useState(true);

  const { address, Component: WalletConnect } = useWallet();
  const [supplier, { isFetching }] = usePromise(() => getSupplier(address), {
    conditions: [address], dependencies: [address],
  });

  const isSupplier = !isFetching && !!supplier?.name;

  React.useEffect(() => {
    if (!szrToWithdraw) {
      setWithdrawMessage('Enter the number of SZR tokens to withdraw.');
    } else if (szrToWithdraw > supplier?.szrWithdrawable) {
      setIsWithdrawalValid(false);
      setWithdrawMessage('You do not have sufficient SZR balance.');
    } else {
      setIsWithdrawalValid(true);
      setWithdrawMessage(`You are withdrawing ${szrToWithdraw} SZR.`);
    }
  }, [szrToWithdraw, supplier]);

  async function onWithdrawSubmit(e) {
    e.preventDefault();
    try {
      const hash = await withdrawSZR(address, szrToWithdraw);
      setWithdrawMessage(`You have successfully withdrawn ${szrToWithdraw} SZR token(s).
      It should appear in your wallet soon.`);
      setWithdrawHash(hash);
    } catch (error) {
      setWithdrawMessage(error.message);
    }
  }

  return (
    <div className="supplier-page">

      <h1 className="title">Supplier</h1>
      <div className="subtitle">
        Borrow SZR by staking reputation to promise supply of products in exchange for <code>STABLE</code> token.
      </div>
      <hr />

      {!address && (
        <WalletConnect />
      )}

      {!isFetching && !isSupplier && (
        <div className="message warning">
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
          <nav className="level mb-6">

            <div className="level-item has-text-centered">
              <div>
                <p className="heading">STABLE Redeemable</p>
                <p className="title">{supplier.stablesRedeemable?.toFixed(2)}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">STABLE Redeemed</p>
                <p className="title">{supplier.stablesRedeemed?.toFixed(2)}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">SZR Withdrawable</p>
                <p className="title">{supplier.szrWithdrawable?.toFixed(2)}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">SZR Withdrawn</p>
                <p className="title">{supplier.szrWithdrawn?.toFixed(2)}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Claim Percent / Rewards</p>
                <p className="title">{supplier.claimPercent}<span className="is-size-5">%</span> / {supplier.szrRewardsPerRedemption?.toFixed(1)}</p>
              </div>
            </div>
          </nav>

          <div className="info-box">
            <div>Wallet connected. Address:<code>{address}</code></div>
            <div className="mt-2">Supplier Name: <strong>{supplier.name}</strong></div>
          </div>
          <br />

          <div className="columns">
            <div className="column is-7-desktop">
              <form className="exchange-form" onSubmit={onWithdrawSubmit}>
                <h4 className="subtitle">Borrow / Withdraw SZR</h4>
                <div className="field">
                  <div className="control">
                    <input
                      id="stableAmount"
                      name="price"
                      type="number"
                      step="1"
                      className="input is-medium"
                      placeholder="Number of SZR to borrow"
                      value={szrToWithdraw}
                      onChange={(e) => { setSZRToWithdraw(e.target.value); }}
                    />
                  </div>
                </div>

                <div className={withdrawHash ? 'message success' : 'message'}>
                  {withdrawMessage}
                  {withdrawHash && (
                    <>
                      <br />
                      Transaction Hash:
                      <a
                        rel="noreferrer"
                        target="_blank"
                        className="ml-3"
                        href={`${process.env.REACT_APP_BLOCKCHAIN_EXPLORER_URL}/tx/${withdrawHash}`}
                      >{trimAddress(withdrawHash)}
                      </a>
                    </>
                  )}
                </div>

                <button disabled={!isWithdrawalValid || !szrToWithdraw} className="button btn-submit-prices is-medium is-centered" type="submit">Withdraw</button>
              </form>
            </div>
          </div>

        </>
      )}

    </div>
  );
}

export default SupplierPage;
