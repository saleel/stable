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
const variant = () => Math.random() * (1.03 - 0.97) + 0.97;

function generateRandomPrice({ product, country }) {
  let price = (Math.random() * 2 + 1) * 100; // Price with no decimals (between 1 and 3)

  if (product.id === "BTC") {
    price = 29400 * CryptoVariance[country] * variant() * variant(); // Track crypto without penny/cents/paisa
  }

  if (product.id === "ETH") {
    price = 2280 * CryptoVariance[country] * variant() * variant(); // Track crypto without penny/cents/paisa
  }

  return Math.round(
    price *
      CountryMultiplier[country] *
      (CategoryMultiplier[product.category] || 1)
  );
}

const lastPrices = {
  UK: [
    463, 424, 450, 339, 420, 352, 335, 480, 389, 209, 280, 417, 201, 244, 308,
    276, 445, 184, 386, 372, 217, 222, 381, 354, 244, 207, 428, 196, 377, 379,
    363, 423, 365, 391, 438, 254, 288, 447, 400, 444, 327, 239, 350, 258, 403,
    295, 341, 361, 286, 279, 167, 706, 326, 1056, 771, 1529, 818, 29672, 2274,
  ],
  US: [
    517, 1151, 851, 962, 933, 858, 520, 1232, 658, 793, 565, 678, 426, 421,
    1295, 1062, 432, 561, 266, 446, 372, 520, 263, 425, 229, 444, 231, 409, 399,
    334, 372, 204, 448, 397, 284, 460, 493, 565, 609, 473, 353, 453, 269, 648,
    321, 235, 513, 605, 524, 483, 601, 215, 304, 477, 221, 260, 623, 30148,
    2368, 281, 360, 327, 253, 218, 198, 197, 340, 277, 445, 490, 769, 448, 410,
    38520, 2946,
  ],
  IN: [
    14367, 12921, 17689, 8877, 6406, 9083, 9352, 16554, 7498, 11283, 12593,
    18625, 7495, 7047, 13176, 17872, 17652, 16540, 8171, 14211, 10481, 9885,
    9789, 16233, 16408, 11667, 17247, 15778, 18759, 8873, 6312, 17506, 15365,
    13539, 17201, 6943, 15972, 12391, 13690, 14921, 7639, 7456, 11029, 7409,
    19073, 13820, 13590, 11853, 16867, 15238, 9613, 15664, 11358, 36920, 19280,
    57077, 50425, 2232183, 172191,
  ],
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
}) {
  const prices = [];

  let productsToGeneratePriceFor = products;
  if (country !== "US") {
    productsToGeneratePriceFor = products.filter(
      (p) => p.category !== "Futures"
    );
  }

  const productIdsWithPrice = productsToGeneratePriceFor.map((p) => p.id);

  for (let i = 0; i < productsToGeneratePriceFor.length; i += 1) {
    const product = productsToGeneratePriceFor[i];
    const lastPrice = lastPrices[country][i];
    const isCrypto = product.category === "Cryptocurrency";

    let newPrice;

    if (lastPrice && !isCrypto) {
      newPrice = lastPrice * dailyIncrement * variant();
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
  const avgInflation = 3;
  const endAggregationId = new Date(endDateStr).getTime() / 1000;

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
