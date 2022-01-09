const { ethers } = require("ethers");
const stableAbi = require("../core/artifacts/contracts/Stable.sol/Stable.json");

const stableAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function generate() {
  const provider = new ethers.providers.JsonRpcProvider();
  const signer = provider.getSigner();

  console.log("Staring at block", await provider.getBlockNumber());

  const stableContract = new ethers.Contract(
    stableAddress,
    stableAbi.abi,
    provider
  );

  const contractWithSigner = await stableContract.connect(signer);

  console.log(
    "Contract loaded. Currency:",
    await contractWithSigner.currency()
  );

  let currentDate = await contractWithSigner.currentDate();

  await contractWithSigner.submitPrices(currentDate, [
    {
      itemId: 0,
      price: 275,
    },
    {
      itemId: 1,
      price: 2750,
    },
    {
      itemId: 2,
      price: 1575,
    },
    {
      itemId: 3,
      price: 5750,
    },
    {
      itemId: 4,
      price: 9575,
    },
  ]);

  await contractWithSigner.calculate();
  currentDate++;

  await contractWithSigner.submitPrices(currentDate, [
    {
      itemId: 1,
      price: 1100,
    },
    {
      itemId: 2,
      price: 575,
    },
  ]);

  await contractWithSigner.calculate();

  const totalItems = await contractWithSigner.totalItems();

  for (let i = 0; i < totalItems; i++) {
    console.log(i, await contractWithSigner.prices(i));
  }
}

generate();

//
