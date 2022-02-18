/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
require('dotenv').config();
const assert = require('assert');
const { ethers } = require('ethers');
const axios = require('axios');
const stableAbi = require('./abis/Stable.json');
const szrAbi = require('./abis/StabilizerToken.json');
const countryTrackerAbi = require('./abis/CountryTracker.json');

const SLEEP_INTERVAL = 180;

const sleep = (sec = SLEEP_INTERVAL) => new Promise((resolve) => {
  setTimeout(resolve, sec * 1000);
});

// Assume that contract priceAggregationMethod is "TOP3_AVG"
// TODO: Need to explicitly check priceAggregationMethod
function calculateAveragePrice({ priceSubmissions, minPriceConfirmations }) {
  const productPrices = {};

  const priceOccurrences = {};

  for (const submission of priceSubmissions) {
    const { price, product: { id: productId } } = submission;

    if (!priceOccurrences[productId]) {
      priceOccurrences[productId] = {};
    }

    priceOccurrences[productId][price] = (priceOccurrences[productId][price] || 0) + 1;
  }

  for (const productId of Object.keys(priceOccurrences)) {
    const prices = priceOccurrences[productId];

    const p = Object.entries(prices)
      .filter((e) => e[1] >= minPriceConfirmations)
      .sort((a, b) => b[1] - a[1]);

    if (p.length === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const thirdMostConfirmation = p?.[2]?.[1] ?? p[0][1];

    const topPrices = p.filter((x, i) => i < 3 || x[1] >= thirdMostConfirmation)
      .map((a) => Number(a[0]));

    const average = topPrices.reduce((acc, i) => acc + i, 0) / topPrices.length;

    if (average === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }

    productPrices[productId] = Math.round(average);
  }

  return productPrices;
}

async function calculatePriceIndex({ productBasket, contract, productPrices }) {
  let totalPrice = 0;
  let weightageSum = 0;

  for (const basketItem of productBasket) {
    const { productId, weightage } = basketItem;

    let price = productPrices[productId];
    if (!price) {
      // eslint-disable-next-line no-await-in-loop
      price = await contract.prices(productId);
    }

    if (!price) {
      // eslint-disable-next-line no-continue
      continue;
    }

    totalPrice += price * weightage;
    weightageSum += weightage;
  }

  if (weightageSum === 0) {
    return 0;
  }

  return Math.round(totalPrice / weightageSum);
}

/**
 *
 * @param {{ contract: import("./typechain-types/CountryTracker").CountryTracker}} contract
 * @returns
 */
async function startAggregationForCountry({ contract, minPriceConfirmations }) {
  const currency = await contract.currency();
  const country = await contract.country();
  const aggregationRoundId = await contract.aggregationRoundId();
  const aggregationRoundEndTime = await contract.aggregationRoundEndTime();

  console.log(`Updating prices for ${country} and date ${new Date(aggregationRoundId * 1000).toISOString()}`);

  const query = `
    {
      countryTracker (id: "${country}-${currency}") {
        productBasket {
          productId
          weightage
        }
      }
      priceSubmissions(where: { country: "${country}" createdAt_gte: ${aggregationRoundId}, createdAt_lt: ${aggregationRoundEndTime} }, first: 1000) {
        country
        currency
        price
        product {
          id
          name
        }
        source
        createdBy
        createdAt
      }
    }
  `;

  const { data } = await axios({
    url: process.env.GRAPH_API,
    method: 'POST',
    data: {
      query,
    },
  });

  if (data.errors) {
    throw new Error(`Error from GraphQL \n${JSON.stringify(data.errors, null, 2)}`);
  }

  const { priceSubmissions, countryTracker } = data.data;
  const { productBasket } = countryTracker;

  console.log(`Found ${priceSubmissions.length} submissions for ${country} between ${aggregationRoundId} and ${aggregationRoundEndTime}`);
  const productPrices = calculateAveragePrice({ priceSubmissions, minPriceConfirmations });

  if (Object.keys(productPrices).length === 0) {
    console.log('Nothing to update');
    return false;
  }

  const priceIndex = await calculatePriceIndex({ productBasket, contract, productPrices });

  console.log(`New Price Index for ${country} is ${priceIndex}`);

  try {
    await contract.updatePrices(aggregationRoundId, Object.keys(productPrices), Object.values(productPrices), priceIndex);
  } catch (error) {
    if (!error.message.includes('Price already updated')) {
      throw error;
    }
  }

  console.log(`Price and Price Index updated for ${country}`);

  return true;
}

async function beginAggregation() {
  const provider = new ethers.providers.JsonRpcProvider({
    url: process.env.RPC_URL,
  });
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  /** @type {import("./typechain-types/Stable").Stable} */
  const stableContract = new ethers.Contract(process.env.STABLE_CONTRACT, stableAbi, provider).connect(wallet);

  /** @type {import("./typechain-types/SZRToken").SZRToken} */
  const srzContract = new ethers.Contract(await stableContract.szrToken(), szrAbi, provider).connect(wallet);

  console.log(`Address: ${wallet.address.toLowerCase()}`);
  console.log(`Balance ETH: ${await wallet.getBalance()}`);
  console.log(`Balance SZR: ${await srzContract.balanceOf(wallet.address.toLowerCase())}`);

  const countries = ['UK', 'US', 'IN'];

  // Prepare country contracts
  /** @type{Record<string, import("./typechain-types/CountryTracker").CountryTracker >} */
  const countryContracts = {};
  for (const country of countries) {
    // eslint-disable-next-line no-await-in-loop
    const address = await stableContract.countryTrackers(country);
    const countryContract = new ethers.Contract(address, countryTrackerAbi, provider);
    countryContracts[country] = countryContract.connect(wallet);
  }

  // Check aggregation status/role
  if ((await stableContract.currentAggregator()).toLowerCase() !== wallet.address.toLowerCase().toLowerCase()) {
    console.log('Not an aggregator now');

    const lockedAmount = await stableContract.aggregatorLockedAmounts(wallet.address.toLowerCase());
    if (lockedAmount === 0) {
      console.log('Enrolling as aggregator');
      await srzContract.approve(process.env.STABLE_CONTRACT, 1000);
      await stableContract.enrollAsAggregator(20);
    }

    const canClaimAggregationRound = await stableContract.canClaimNextAggregationRound(wallet.address.toLowerCase());

    if (canClaimAggregationRound) {
      console.log('Trying to become aggregator');
      await stableContract.claimNextAggregationRound();
    } else {
      console.log('Cannot become aggregator');
      return;
    }
  }

  await sleep(10);

  assert.strictEqual((await stableContract.currentAggregator()).toLowerCase(), wallet.address.toLowerCase());

  const aggregationEndTime = await countryContracts.US.aggregationRoundEndTime();
  const currentTime = Math.round(new Date().getTime() / 1000);

  if (currentTime < aggregationEndTime) {
    console.log('Aggregation round not due');
    return;
  }

  console.log('Starting aggregation');

  const minPriceConfirmations = await stableContract.mininumPriceConfirmations();

  let updatedCount = 0;
  for (const [country, contract] of Object.entries(countryContracts)) {
    console.log(`Starting aggregation for country ${country}`);
    const result = await startAggregationForCountry({ contract, minPriceConfirmations });
    await sleep(10);

    if (result) {
      updatedCount += 1;
    }
  }

  if (updatedCount) {
    await sleep(10);
    await stableContract.completeAggregation();
    console.log('Aggregation round completed');
  }

  console.log('Sleeping... \n\n\n');

  // Sleep and check aggregation again
  await sleep();

  await beginAggregation();
}

beginAggregation()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
