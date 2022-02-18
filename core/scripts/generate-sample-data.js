/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
const { ethers } = require("hardhat");
const products = require("./products.json");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");
const countryTrackerAbi = require("../artifacts/contracts/CountryTracker.sol/CountryTracker.json");

const stableContractAddress = "0xe630868e440d2a595632959297a4cb9d170036f2";

const sleep = (sec = 5) =>
  new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });

let signer1;
let signer2;
let signer3;

const { provider } = ethers;

const CountryMultiplier = {
  UK: 1,
  US: 1.3, // with respect to uk
  IN: 40, // should be * 100, but prices are cheaper in general in India
};

const CategoryMultiplier = {
  Food: 1,
  Futures: 2,
  Energy: 3,
  Alcohol: 1.5,
};

const CryptoVariance = {
  UK: 1,
  US: 1,
  IN: 1.9, // to compensate for CountryMultiplier[in] + little extra
};

// A random number between 0.97 and 1.05 to be apply a small invariance
const variant = Math.random() * (1.05 - 0.97) + 0.97;

function generateRandomPrice({ product, country }) {
  let price = (Math.random() * 2 + 1) * 100; // Price with no decimals (between 1 and 3)

  if (product.id === "BTC") {
    price = 29400 * CryptoVariance[country] * variant * variant * variant; // Track crypto without penny/cents/paisa
  }

  if (product.id === "ETH") {
    price = 2280 * CryptoVariance[country] * variant * variant * variant; // Track crypto without penny/cents/paisa
  }

  return Math.round(
    price *
      CountryMultiplier[country] *
      (CategoryMultiplier[product.category] || 1)
  );
}

const lastPrices = {
  UK: {},
  US: {},
  IN: {},
};

/**
 *
 * @param {{ contract: ethers.Contract }} param0
 * @returns
 */
async function submitPricesForCountry({
  dailyIncrement,
  contract,
  aggregationRoundId,
  country,
  endAggregationId,
}) {
  const prices = [];

  let productsToGeneratePriceFor = products;
  if (country !== "US") {
    productsToGeneratePriceFor = products.filter(
      (p) => p.category !== "Futures"
    );
  }

  const productIdsWithPrice = productsToGeneratePriceFor.map((p) => p.id);

  for (const product of productsToGeneratePriceFor) {
    const lastPrice = lastPrices[country][product.id];
    const isCrypto = product.category === "Cryptocurrency";

    let newPrice;

    if (lastPrice && !isCrypto) {
      newPrice = lastPrice * dailyIncrement * variant;
    } else {
      newPrice = generateRandomPrice({
        product,
        country,
      });
    }

    // console.log(country, aggregationRoundId, product.name, lastPrice, newPrice);
    prices.push(Math.round(newPrice));

    lastPrices[country][product.id] = Math.round(newPrice);
  }

  const timestamp = Number(aggregationRoundId) + 43200; // Some timestamp during the day

  console.log(
    "\nSubmitting : ",
    country,
    contract.address,
    aggregationRoundId.toString(),
    timestamp,
    prices
  );

  await contract
    .connect(signer1)
    .submitPrices(productIdsWithPrice, prices, timestamp, "manual");

  await sleep();

  await contract.connect(signer2).submitPrices(
    productIdsWithPrice,
    prices.map((p) => Math.round(p * 1.03)),
    timestamp,
    "manual"
  );

  await contract.connect(signer3).submitPrices(
    productIdsWithPrice,
    prices.map((p) => Math.round(p * 1.03)),
    timestamp,
    "manual"
  );
}

async function beginSubmission({
  stableContract,
  endAggregationId,
  avgInflation,
}) {
  const countries = ["US", "UK", "IN"];

  let aggregationRoundId;
  let anyCountryTracker;
  for (const country of countries) {
    const countryContractAddress = await stableContract.countryTrackers(
      country
    );

    const countryTracker = new ethers.Contract(
      countryContractAddress,
      countryTrackerAbi.abi,
      provider
    );

    anyCountryTracker = countryTracker;

    aggregationRoundId = await countryTracker.aggregationRoundId();

    const dateDiff = Math.round(
      (endAggregationId - aggregationRoundId) / 60 / 60 / 24
    );
    // Required daily increment needed for expected inflation over period
    const dailyIncrement =
      (100 ** (dateDiff - 1) * (100 + avgInflation)) ** (1 / dateDiff) / 100;

    // console.log(signer1.address, signer2.address, signer3.address);

    await submitPricesForCountry({
      contract: countryTracker,
      aggregationRoundId,
      country,
      dailyIncrement,
      endAggregationId,
    });
  }

  if (aggregationRoundId >= endAggregationId) {
    return;
  }

  await new Promise((resolve) => {
    const interval = setInterval(async () => {
      console.log("Waiting for aggregation round to complete");
      const nextAggregationRoundId = await anyCountryTracker
        .connect(signer1)
        .aggregationRoundId();

      if (nextAggregationRoundId > aggregationRoundId) {
        clearInterval(interval);
        resolve();
      }
    }, 5000);
  });

  await beginSubmission({
    stableContract,
    endAggregationId,
    avgInflation,
  });
}

async function generate() {
  [, signer1, signer2, signer3] = await ethers.getSigners();

  const endDateStr = new Date().toISOString().slice(0, 10);
  const avgInflation = 10;
  const endAggregationId = new Date(endDateStr).getTime() / 1000 - 24 * 60 * 60;

  console.log("Generating sample data", {
    endAggregationId,
    avgInflation,
  });

  const stableContract = new ethers.Contract(
    stableContractAddress,
    stableAbi.abi,
    provider
  );

  await beginSubmission({
    stableContract,
    endAggregationId,
    avgInflation,
  });
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
