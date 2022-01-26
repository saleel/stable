/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
const { ethers } = require('ethers');
const products = require('./products.json');
const stableFactoryAbi = require('../core/artifacts/contracts/Stable.sol/StableFactory.json');
const stableAbi = require('../core/artifacts/contracts/Stable.sol/Stable.json');

const stableFactoryAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

function generateRandomPrice(product) {
  return Math.round(Math.random() * 1000); // Price with no decimals
}

async function generate() {
  const args = process.argv.slice(2);

  const [endDateStr = 20220101, avgInflation = 5] = args;

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

  const countries = ['US', 'UK', 'IN'];

  for (const country of countries) {
    const contractAddress = await stableFactoryContract.childContracts(country);

    const stableContract = new ethers.Contract(
      contractAddress,
      stableAbi.abi,
      provider,
    );

    const contractWithSigner = await stableContract.connect(signer);

    let currentDate = await contractWithSigner.currentDate();
    const endDate = Number(endDateStr);
    const dateDiff = (endDate - currentDate);

    // Required daily increment needed for expected inflation over period
    const dailyIncrement = (100 ** (dateDiff - 1) * (100 + avgInflation)) ** (1 / dateDiff) / 100;

    const productIds = products.map((p) => p.id);

    while (currentDate <= endDate) {
      const prices = [];

      for (const product of products) {
        const lastPrice = await contractWithSigner.prices(product.id);

        let newPrice;

        if (lastPrice) {
          // A random number between 0.95 and 1.05 to be apply a +-5% diff
          const variant = (Math.random() * (1.05 - 0.95)) + 0.9;
          newPrice = lastPrice * dailyIncrement * variant;
        } else {
          newPrice = generateRandomPrice(product);
        }

        console.log(country, currentDate, product.name, lastPrice, newPrice);
        prices.push(Math.round(newPrice));
      }

      console.log('/n/nSubmitting...', currentDate);
      await contractWithSigner.submitPrices(currentDate, productIds, prices, 'manual');

      currentDate += 1;
    }
  }
}

generate();
