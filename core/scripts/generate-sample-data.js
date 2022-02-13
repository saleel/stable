/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
const ethers = require("ethers");
const products = require("./products.json");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");
const countryTrackerAbi = require("../artifacts/contracts/CountryTracker.sol/CountryTracker.json");

const productIds = products.map((p) => p.id);
const stableContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const provider = new ethers.providers.JsonRpcProvider();
const signer1 = provider.getSigner(1);
const signer2 = provider.getSigner(2);
const signer3 = provider.getSigner(3);
const signer4 = provider.getSigner(4);
const signer5 = provider.getSigner(5);

function generateRandomPrice() {
  return Math.round(Math.random() * 10 * 100); // Price with no decimals
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

  for (const product of products) {
    const lastPrice = await contract.prices(product.id);

    let newPrice;

    if (lastPrice) {
      // A random number between 0.95 and 1.05 to be apply a +-5% diff
      const variant = Math.random() * (1.05 - 0.95) + 0.9;
      newPrice = lastPrice * dailyIncrement * variant;
    } else {
      newPrice = generateRandomPrice(product);
    }

    // console.log(country, aggregationRoundId, product.name, lastPrice, newPrice);
    prices.push(Math.round(newPrice));
  }

  console.log("\nSubmitting: ", aggregationRoundId.toString(), country, prices);

  await contract.connect(signer1).submitPrices(productIds, prices, "manual");
  await contract.connect(signer2).submitPrices(
    productIds,
    prices.map((p) => p + 500),
    "manual"
  );
  await contract.connect(signer3).submitPrices(
    productIds,
    prices.map((p) => p + 500),
    "manual"
  );
  await contract.connect(signer4).submitPrices(
    productIds,
    prices.map((p) => p + generateRandomPrice()),
    "manual"
  );
  await contract.connect(signer5).submitPrices(
    productIds,
    prices.map((p) => p + generateRandomPrice()),
    "manual"
  );

  if (aggregationRoundId >= endAggregationId) {
    return;
  }

  const interval = setInterval(async () => {
    console.log("Waiting for aggregation round to complete", country);
    const nextAggregationRoundId = await contract
      .connect(signer1)
      .aggregationRoundId();
    if (nextAggregationRoundId > aggregationRoundId) {
      clearInterval(interval);
      submitPrices({
        dailyIncrement,
        contract,
        aggregationRoundId: nextAggregationRoundId,
        country,
        endAggregationId,
      });
    }
  }, 5000);
}

async function generate() {
  const endDateStr = new Date().toISOString().slice(0, 10);
  const avgInflation = 10;
  const endAggregationId = new Date(endDateStr).getTime() / 1000;

  console.log("Generating sample data", {
    endDate: endDateStr,
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

    await submitPrices({
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
