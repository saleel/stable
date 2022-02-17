/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
const ethers = require("ethers");
const products = require("./products.json");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");
const countryTrackerAbi = require("../artifacts/contracts/CountryTracker.sol/CountryTracker.json");

const stableContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const provider = new ethers.providers.JsonRpcProvider();
const signer1 = provider.getSigner(1);
const signer2 = provider.getSigner(2);
const signer3 = provider.getSigner(3);
const signer4 = provider.getSigner(4);

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

/**
 *
 * @param {{ contract: ethers.Contract }} param0
 * @returns
 */
async function submitPrices({
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
    const lastPrice = await contract.prices(product.id);
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
  }

  const timestamp = Number(aggregationRoundId) + 43200; // Some timestamp during the day

  console.log(
    "\nSubmitting : ",
    country,
    dailyIncrement,
    contract.address,
    aggregationRoundId.toString(),
    timestamp,
    prices
  );

  await contract
    .connect(signer1)
    .submitPrices(productIdsWithPrice, prices, timestamp, "manual");

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
  await contract.connect(signer4).submitPrices(
    productIdsWithPrice,
    prices.map((p) => Math.round(p * 0.97)),
    timestamp,
    "manual"
  );

  if (aggregationRoundId >= endAggregationId) {
    return;
  }

  await new Promise((resolve) => {
    const interval = setInterval(async () => {
      console.log("Waiting for aggregation round to complete", country);
      const nextAggregationRoundId = await contract
        .connect(signer1)
        .aggregationRoundId();
      if (nextAggregationRoundId > aggregationRoundId) {
        clearInterval(interval);
        resolve();
      }
    }, 5000);
  });

  const nextAggregationRoundId = await contract
    .connect(signer1)
    .aggregationRoundId();

  submitPrices({
    dailyIncrement,
    contract,
    aggregationRoundId: nextAggregationRoundId,
    country,
    endAggregationId,
  });
}

async function generate() {
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

  const countries = ["US", "UK", "IN"];

  for (const country of countries) {
    const countryContractAddress = await stableContract.countryTrackers(
      country
    );

    const countryTracker = new ethers.Contract(
      countryContractAddress,
      countryTrackerAbi.abi,
      provider
    );

    const aggregationRoundId = await countryTracker.aggregationRoundId();

    const dateDiff = Math.round(
      (endAggregationId - aggregationRoundId) / 60 / 60 / 24
    );
    // Required daily increment needed for expected inflation over period
    const dailyIncrement =
      (100 ** (dateDiff - 1) * (100 + avgInflation)) ** (1 / dateDiff) / 100;

    submitPrices({
      contract: countryTracker,
      aggregationRoundId,
      country,
      dailyIncrement,
      endAggregationId,
    });
  }
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
