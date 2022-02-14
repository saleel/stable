require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");
const stableAbi = require("./abis/Stable.json");
const szrAbi = require("./abis/StabilizerToken.json");
const countryTrackerAbi = require("./abis/CountryTracker.json");
const { assert } = require("chai");


async function claimAggregationRound() {

}

async function beginAggregation() {
  const account = process.env.ACCOUNT;
  const provider = new ethers.providers.JsonRpcProvider({
    url: process.env.RPC_URL
  });
  const signer = provider.getSigner(account);

  /** @type {import("./typechain-types/Stable").Stable} */
  const stableContract = new ethers.Contract(process.env.STABLE_CONTRACT, stableAbi, provider).connect(signer);

  /** @type {import("./typechain-types/SZRToken").SZRToken} */
  const srzContract = new ethers.Contract(await stableContract.szrToken(), szrAbi, provider).connect(signer);

  let countries = ["UK", "US", "IN"];

  // Prepare country contracts
  /** @type{Record<string, import("./typechain-types/CountryTracker").CountryTracker >} */
  let countryContracts = {};
  for (const country of countries) {
    const address = await stableContract.countryTrackers(country);
    const countryContract = new ethers.Contract(address, countryTrackerAbi, provider);
    countryContracts[country] = countryContract.connect(signer);
  }

  // Check aggregation status/role
  if (await stableContract.currentAggregator() !== account) {
    console.log("Not an aggregator now");

    const lockedAmount = await stableContract.aggregatorLockedAmounts(account);
    if (lockedAmount === 0) {
      console.log("Enrolling as aggregator");
      await srzContract.approve(process.env.STABLE_CONTRACT, 1000);
      await stableContract.enrollAsAggregator(20);
    }

    const canClaimAggregationRound = await stableContract.canClaimNextAggregationRound(account);

    if (canClaimAggregationRound) {
      console.log("Trying to become aggregator");
      await stableContract.claimNextAggregationRound();
    } else {
      console.log("Cannot become aggregator");
      return;
    }
  }

  assert((await stableContract.currentAggregator()).toLowerCase() === account, "Not aggregator");

  const aggregationEndTime = await countryContracts["US"].aggregationRoundEndTime();
  const currentTime = new Date().getTime() / 1000;

  if (currentTime < aggregationEndTime) {
    console.log("Aggregation round not due");
    return;
  }

  console.log("Starting aggregation");

  for (const [country, contract] of Object.entries(countryContracts)) {
    await updatePrice(contract);
  }

  await stableContract.completeAggregation();

  console.log("Aggregation round completed");
}

/**
 * 
 * @param {import("./typechain-types/CountryTracker").CountryTracker} contract 
 * @returns 
 */
async function updatePrice(contract) {
  const currency = await contract.currency();
  const country = await contract.country();
  const aggregationRoundId = await contract.aggregationRoundId();

  console.log(`Updating prices for ${country} and date ${new Date(aggregationRoundId * 1000).toISOString()}`);

  const graphAggregationRoundId = country + "-" + currency + "-" + aggregationRoundId;

  const query = `
    {
      stable (id: "${country}-${currency}") {
        productBasket {
          productId
          weightage
        }
      }
      prices(where: { country: "${country}" }) {
        product {
          id
        }
        value
      }
      priceSubmissions(where: { aggregationRound: "${graphAggregationRoundId}" }, first: 1000) {
        country
        currency
        price
        aggregationRound {
          id
        }
        product {
          id
          name
        }
        stable {
          productBasket {
            productId
            weightage
          }
        }
        source
        createdBy
        createdAt
      }
    }
  `;

  const { data } = await axios({
    url: "http://127.0.0.1:8000/subgraphs/name/stable",
    method: "POST",
    data: {
      query
    }
  });

  const { priceSubmissions, stable, latestPrices } = data.data;
  const { productBasket } = stable;

  const productPrices = calculatePrices(priceSubmissions, aggregationRoundId);

  console.log(aggregationRoundId);

  if (Object.keys(productPrices).length === 0) {
    console.log("Nothing to update");
    return;
  }

  const priceIndex = calculatePriceIndex(productBasket, latestPrices, productPrices);

  await contract.updatePrices(aggregationRoundId, Object.keys(productPrices), Object.values(productPrices), priceIndex);

  console.log("Price and Price Index updated for ", country);
}

const MIN_CONFIRMATIONS = 1;

// TOP3_AVG
function calculatePrices(submissions, aggregationRoundId) {
  const productPrices = {};

  const priceOccurrences = {}

  for (const submission of submissions) {
    const { price, product: { id: productId }, currency } = submission;

    if (!priceOccurrences[productId]) {
      priceOccurrences[productId] = {};
    }

    priceOccurrences[productId][price] = (priceOccurrences[productId][price] || 0) + 1;
  }

  for (const productId of Object.keys(priceOccurrences)) {
    const prices = priceOccurrences[productId];

    const p = Object.entries(prices)
      .filter(e => e[1] >= MIN_CONFIRMATIONS)
      .sort((a, b) => b[1] - a[1]);

    if (p.length === 0) {
      continue;
    }

    const thirdMostConfirmation = p?.[2]?.[1] ?? p[0][1];

    const topPrices = p.filter((x, i) => i < 3 || x[1] >= thirdMostConfirmation)
      .map(a => Number(a[0]));

    const average = topPrices.reduce((acc, i) => acc + i, 0) / topPrices.length;

    if (average === 0) {
      continue;
    }

    productPrices[productId] = Math.round(average);
  }

  return productPrices;
}

function calculatePriceIndex(productBasket, latestPrices, productPrices) {
  let totalPrice = 0;
  let weightageSum = 0;

  for (const basketItem of productBasket) {
    const { productId, weightage } = basketItem;

    let price = productPrices[productId];
    if (!price) {
      price = latestPrices.find(l => l.product.id === productId)?.value ?? 0;
    }

    if (!price) {
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

beginAggregation()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
