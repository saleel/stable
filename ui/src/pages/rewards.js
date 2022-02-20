/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { getRewardAmount, getTokenBalance, withdrawRewards } from '../data';
import usePromise from '../hooks/use-promise';
import useWallet from '../hooks/use-wallet';
import { trimAddress } from '../utils';

function RewardsPage() {
  const [szrToWithdraw, setSZRToWithdraw] = React.useState('');
  const [withdrawMessage, setWithdrawMessage] = React.useState('');
  const [withdrawHash, setWithdrawHash] = React.useState('');
  const [isWithdrawalValid, setIsWithdrawalValid] = React.useState(true);

  const { address, Component: WalletConnect } = useWallet();
  const [tokenBalance] = usePromise(() => getTokenBalance(address), {
    dependencies: [address], defaultValue: {},
  });
  const [rewardAmount] = usePromise(() => getRewardAmount(address), {
    conditions: [address], dependencies: [address],
  });

  React.useEffect(() => {
    if (!szrToWithdraw) {
      setWithdrawMessage('Enter the number of SZR tokens to withdraw.');
    } else if (szrToWithdraw > rewardAmount) {
      setIsWithdrawalValid(false);
      setWithdrawMessage('You do not have sufficient withdrawable SZR.');
    } else {
      setIsWithdrawalValid(true);
      setWithdrawMessage(`You are withdrawing ${szrToWithdraw} SZR.`);
    }
  }, [szrToWithdraw, rewardAmount]);

  async function onWithdrawSubmit(e) {
    e.preventDefault();
    try {
      const hash = await withdrawRewards(address, szrToWithdraw);
      setWithdrawMessage(`You have successfully withdrawn ${szrToWithdraw} SZR token(s).
      It should appear in your wallet soon.`);
      setWithdrawHash(hash);
    } catch (error) {
      setWithdrawMessage(error.message);
    }
  }

  return (
    <div className="supplier-page">

      <h1 className="title">Rewards</h1>
      <div className="subtitle">
        Claim your <code>$SZR</code> rewards.
      </div>
      <hr />

      {!address && (
        <WalletConnect />
      )}

      {address && (
        <>
          <nav className="level mb-6">

            <div className="level-item has-text-centered">
              <div>
                <p className="heading">SZR Rewards</p>
                <p className="title">{rewardAmount?.toFixed(2)}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">Current SZR Balance</p>
                <p className="title">{tokenBalance.SZR?.toFixed(2)}</p>
              </div>
            </div>
          </nav>

          <div className="info-box">
            <div>Wallet connected. Address:<code>{address}</code></div>
          </div>
          <br />

          <div className="columns">
            <div className="column is-7-desktop">
              <form className="exchange-form" onSubmit={onWithdrawSubmit}>
                <h4 className="subtitle">Withdraw SZR</h4>
                <div className="field">
                  <div className="control">
                    <input
                      id="stableAmount"
                      name="price"
                      type="number"
                      step="1"
                      className="input is-medium"
                      placeholder="Number of SZR to withdraw"
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

export default RewardsPage;
