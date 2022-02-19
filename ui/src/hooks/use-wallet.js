import React from 'react';
import { providers } from 'ethers';

const provider = new providers.Web3Provider(window.ethereum);

function useWallet() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [signer, setSigner] = React.useState(provider.getSigner());
  const [address, setAddress] = React.useState();

  React.useEffect(() => {
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

    return (
      <>
        <h4 className="subtitle">Connect to your ETH wallet using Metamask (or similar) to interact with the Stable contract.</h4>
        <div className="mt-3 mb-5">
          <img src="https://images.ctfassets.net/9sy2a0egs6zh/4zJfzJbG3kTDSk5Wo4RJI1/1b363263141cf629b28155e2625b56c9/mm-logo.svg" alt="Metamas" />
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
