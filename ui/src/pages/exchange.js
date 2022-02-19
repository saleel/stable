/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import {
  burnStables,
  getContractState, getTokenBalance, getTokenPrice, mintStables,
} from '../data';
import usePromise from '../hooks/use-promise';
import useWallet from '../hooks/use-wallet';
import { trimAddress } from '../utils';

function ExchangePage() {
  const { address, Component: WalletConnect } = useWallet();

  const [stablesToMint, setStablesToMint] = React.useState('');
  const [mintMessage, setMintMessage] = React.useState('');
  const [mintHash, setMintHash] = React.useState('');
  const [isMintValid, setIsMintValid] = React.useState(true);

  const [stablesToBurn, setStablesToBurn] = React.useState('');
  const [burnMessage, setBurnMessage] = React.useState('');
  const [burnHash, setBurnHash] = React.useState('');
  const [isBurnValid, setIsBurnValid] = React.useState(true);

  const [tokenBalance] = usePromise(() => getTokenBalance(address), {
    dependencies: [address], defaultValue: {},
  });
  const [contractState] = usePromise(() => getContractState(address), {
    defaultValue: {},
  });
  const [tokenPrice] = usePromise(() => getTokenPrice());

  let szrRequiredToMint = 0;
  if (stablesToMint && tokenPrice) {
    szrRequiredToMint = +((stablesToMint * tokenPrice.STABLE) / tokenPrice.SZR).toFixed(2);
  }

  React.useEffect(() => {
    if (!stablesToMint) {
      setMintMessage('Enter the number of STABLE tokens to mint.');
    } else if (szrRequiredToMint > tokenBalance.SZR) {
      setIsMintValid(false);
      setMintMessage('You do not have sufficient SZR balance.');
    } else if (stablesToMint > contractState.mintableStableTokenCount) {
      setIsMintValid(false);
      setMintMessage('Amount is greater than maximum mintable.');
    } else {
      setIsMintValid(true);
      setMintMessage(`You are minting ${stablesToMint} STABLE by burning ${szrRequiredToMint} SZR.`);
    }
  }, [stablesToMint, szrRequiredToMint, tokenBalance, contractState]);

  async function onMintSubmit(e) {
    e.preventDefault();
    try {
      const hash = await mintStables(address, stablesToMint);
      setMintMessage(`You have successfully minted ${stablesToMint} STABLE token(s).
      It should appear in your wallet soon.`);
      setMintHash(hash);
    } catch (error) {
      setMintMessage(error.message);
    }
  }

  let szrReceivedForBurn = 0;
  if (stablesToBurn && tokenPrice) {
    szrReceivedForBurn = +((stablesToBurn * tokenPrice.STABLE) / tokenPrice.SZR).toFixed(2);
  }

  React.useEffect(() => {
    if (!stablesToBurn) {
      setBurnMessage('Enter the number of STABLE tokens to burn.');
    } else if (stablesToBurn > tokenBalance.STABLE) {
      setIsBurnValid(false);
      setBurnMessage('You do not have sufficient STABLE balance.');
    } else {
      setIsBurnValid(true);
      setBurnMessage(`You are burning ${stablesToBurn} STABLE and minting ${szrReceivedForBurn} SZR.`);
    }
  }, [stablesToBurn, szrReceivedForBurn, tokenBalance]);

  async function onBurnSubmit(e) {
    e.preventDefault();
    try {
      const hash = await burnStables(address, stablesToBurn);
      setBurnMessage(`You have successfully burned ${stablesToMint} STABLE tokens.
      ${szrReceivedForBurn} SZR should appear in your wallet soon.`);
      setBurnHash(hash);
    } catch (error) {
      setBurnMessage(error.message);
    }
  }

  return (
    <div className="exchange-page">

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
          <nav className="level mb-6">
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">SZR Balance</p>
                <p className="title">{tokenBalance && tokenBalance.SZR?.toFixed(2)}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">STABLE Balance</p>
                <p className="title">{tokenBalance && tokenBalance.STABLE?.toFixed(2)}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">SZR Price</p>
                <p className="title">{tokenPrice && tokenPrice.SZR?.toFixed(2)}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">STABLE Price</p>
                <p className="title">{tokenPrice && tokenPrice.STABLE?.toFixed(2)}</p>
              </div>
            </div>
            <div className="level-item has-text-centered">
              <div>
                <p className="heading">STABLE Mintable/Collateralized</p>
                <p className="title">{contractState.mintableStableTokenCount} / {contractState.totalStablesRedeemable}</p>
              </div>
            </div>
          </nav>

          <div className="info-box">
            Wallet connected. Address:<code>{address}</code>
          </div>
          <br />

          <div className="columns">
            <div className="column">
              <form className="exchange-form" onSubmit={onMintSubmit}>
                <h4 className="subtitle">Mint STABLE</h4>
                <div className="field">
                  <div className="control">
                    <input
                      id="stableAmount"
                      name="price"
                      type="number"
                      step="1"
                      className="input is-medium"
                      placeholder="Number of STABLE to mint"
                      value={stablesToMint}
                      onChange={(e) => { setStablesToMint(e.target.value); }}
                    />
                  </div>
                </div>

                <div className={mintHash ? 'message success' : 'message'}>
                  {mintMessage}
                  {mintHash && (
                    <>
                      <br />
                      Transaction Hash:
                      <a
                        rel="noreferrer"
                        target="_blank"
                        className="ml-3"
                        href={`${process.env.REACT_APP_BLOCKCHAIN_EXPLORER_URL}/tx/${mintHash}`}
                      >{trimAddress(mintHash)}
                      </a>
                    </>
                  )}
                </div>

                <button disabled={!isMintValid || !stablesToMint} className="button btn-submit-prices is-medium is-centered" type="submit">Mint</button>
              </form>
            </div>

            <hr />

            <div className="column">
              <form className="exchange-form" onSubmit={onBurnSubmit}>
                <h4 className="subtitle">Burn STABLE</h4>
                <div className="field">
                  <div className="control">
                    <input
                      id="stableAmount"
                      name="price"
                      type="number"
                      step="1"
                      className="input is-medium"
                      placeholder="Number of STABLE to burn"
                      value={stablesToBurn}
                      onChange={(e) => { setStablesToBurn(e.target.value); }}
                    />
                  </div>
                </div>

                <div className={burnHash ? 'message success' : 'message'}>
                  {burnMessage}
                  {burnHash && (
                    <>
                      <br />
                      Transaction Hash:
                      <a
                        rel="noreferrer"
                        target="_blank"
                        className="ml-3"
                        href={`${process.env.REACT_APP_BLOCKCHAIN_EXPLORER_URL}/tx/${burnHash}`}
                      >{trimAddress(burnHash)}
                      </a>
                    </>
                  )}
                </div>

                <button disabled={!isBurnValid || !stablesToBurn} className="button btn-submit-prices is-medium is-centered" type="submit">Burn</button>
              </form>
            </div>
          </div>

        </>
      )}

    </div>
  );
}

export default ExchangePage;
