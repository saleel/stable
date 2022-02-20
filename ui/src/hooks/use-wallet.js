import React from 'react';
import { providers } from 'ethers';

const provider = window.ethereum && new providers.Web3Provider(window.ethereum);

function useWallet() {
  const [isLoading, setIsLoading] = React.useState(!!provider);
  const [signer, setSigner] = React.useState(provider && provider.getSigner());
  const [address, setAddress] = React.useState();

  React.useEffect(() => {
    if (!provider) {
      return;
    }

    if (signer) {
      signer.getAddress().then((add) => setAddress(add));
    }
    setIsLoading(false);

    window.ethereum.on('accountsChanged', (([account1]) => {
      setAddress(account1.toLowerCase());
    }));

    // window.ethereum.on('chainChanged', console.log);
  }, [signer]);

  async function onConnectClick() {
    await provider.send('eth_requestAccounts', []);

    setSigner(provider.getSigner());
    const account = await provider.getSigner().getAddress();
    setAddress(account.toLowerCase());
  }

  function Component() {
    if (isLoading) return null;

    if (!provider) {
      return (
        <>
          <h4 className="subtitle">Cannot find a Wallet provider.</h4>
          <div className="mt-3 mb-5">
            You need to have <a target="_blank" href="https://metamask.io/" rel="noreferrer">Metamask</a>
            {' '} or other similar browser plugin installed in order to interact with the Stable contract
          </div>
        </>
      );
    }

    return (
      <>
        <h4 className="subtitle">Connect to your ETH wallet using Metamask (or similar) to interact with the Stable contract.</h4>
        <div className="mt-3 mb-5">
          <img src="https://images.ctfassets.net/9sy2a0egs6zh/4zJfzJbG3kTDSk5Wo4RJI1/1b363263141cf629b28155e2625b56c9/mm-logo.svg" alt="Metamask" />
        </div>
        <button className="button btn-submit-prices is-medium" type="button" onClick={onConnectClick}>
          Connect
        </button>

      </>
    );
  }

  return {
    isLoading, signer, provider, address, Component,
  };
}

export default useWallet;
