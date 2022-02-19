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
        <h4 className="subtitle">Connect your ETH wallet</h4>
        <div className="subtitle">
          <button type="button" onClick={onConnectClick}>
            Connect
          </button>
        </div>
      </>
    );
  }

  return {
    isLoading, signer, provider, address, Component,
  };
}

export default useWallet;
