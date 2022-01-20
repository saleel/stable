const { ethers } = require('ethers');
const products = require('./products.json');
const stableFactoryAbi = require('../core/artifacts/contracts/Stable.sol/StableFactory.json');
const stableAbi = require('../core/artifacts/contracts/Stable.sol/Stable.json');

const stableFactoryAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

async function generate() {
  const args = process.argv.slice(2);

  const [endDateStr, avgInflation] = args;

  console.log('Generating sample data', {
    endDate: endDateStr, avgInflation,
  });

  const provider = new ethers.providers.JsonRpcProvider();
  const signer = provider.getSigner();

  const stableFactoryContract = new ethers.Contract(
    stableFactoryAddress,
    stableFactoryAbi.abi,
    provider,
  );

  const usAddress = await stableFactoryContract.childContracts('US');

  console.log("US Adress", usAddress);

  const stableContract = new ethers.Contract(
    usAddress,
    stableAbi.abi,
    provider,
  );

  const contractWithSigner = await stableContract.connect(signer);

  console.log('Staring at block', await provider.getBlockNumber());

  // let currentDate = await contractWithSigner.currentDate();
  // const endDate = Number(endDateStr);
  // const dailyIncrement = avgInflation / (endDate - currentDate);

  // while (currentDate <= endDate) {
  //   for (const product of products) {
  //     const lastPrice = await contractWithSigner.prices(product.id) || (Math.round(Math.random() * 1000));
  //     const newPrice = lastPrice * (1 + (dailyIncrement * (Math.random() + 0.5)));

  //     console.log(product.name, lastPrice, newPrice);
  //   }

  //   currentDate++;
  // }

  let currentDate = await contractWithSigner.currentDate();

  await contractWithSigner.submitPrices(currentDate, ["ZW", "ZC"], [275, 575]);
  await contractWithSigner.calculate();
  currentDate++;

  await contractWithSigner.submitPrices(currentDate, ["ZW", "ZC"], [1275, 975]);
  await contractWithSigner.calculate();
}

generate();

//
