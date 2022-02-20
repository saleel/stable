/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
const { ethers } = require("hardhat");
const products = require("./products.json");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");
const countryTrackerAbi = require("../artifacts/contracts/CountryTracker.sol/CountryTracker.json");
const { stable: stableContractAddress } = require("./deployed.json");

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

// A random number between to apply a small variation
const variant = () => Math.random() * (1.02 - 0.99) + 0.99;

function generateRandomPrice({ product, country }) {
  let price = (Math.random() * 2 + 1) * 100; // Price with no decimals (between 1 and 3)

  if (product.id === "BTC") {
    price = 29400 * CryptoVariance[country] * variant() * variant() * variant(); // Track crypto without penny/cents/paisa
  }

  if (product.id === "ETH") {
    price = 2280 * CryptoVariance[country] * variant() * variant() * variant(); // Track crypto without penny/cents/paisa
  }

  return Math.round(
    price *
      CountryMultiplier[country] *
      (CategoryMultiplier[product.category] || 1)
  );
}

const lastPrices = {
  US: [
    ["Corn", 853],
    ["Wheat", 639],
    ["Rough Rice", 900],
    ["Soybean", 513],
    ["Hard Red Wheat", 591],
    ["Soybean Meal", 788],
    ["Oats", 729],
    ["Gasoline RBOB", 420],
    ["Live Cattle", 719],
    ["Pork Cutout", 468],
    ["Butter Cash-Settled", 540],
    ["Feeder Cattle", 469],
    ["Milk", 796],
    ["Cheese Cash-Settled", 564],
    ["Lean Hogs", 590],
    ["Flour", 275],
    ["Rice", 155],
    ["Spaghetti", 345],
    ["Bread White", 315],
    ["Bread Wheat", 313],
    ["Cupcakes", 411],
    ["Cookies", 320],
    ["Ground Beef", 287],
    ["Ham", 282],
    ["Lamb and Mutton", 272],
    ["Chicken", 349],
    ["Turkey", 367],
    ["Eggs", 334],
    ["Milk Whole", 390],
    ["Milk Skim", 398],
    ["Milk Low Fat", 343],
    ["Butter", 361],
    ["Yogurt", 422],
    ["Cheese", 433],
    ["Cheddar Cheese", 204],
    ["Ice Cream", 259],
    ["Apples", 174],
    ["Bananas", 375],
    ["Oranges Navel", 187],
    ["Oranges Valencia", 301],
    ["Grapefruit", 183],
    ["Lemons", 338],
    ["Pears", 393],
    ["Peaches", 299],
    ["Strawberries", 422],
    ["Grapes", 240],
    ["Cherries", 366],
    ["Potatoes", 282],
    ["Lettuce", 250],
    ["Tomatoes", 461],
    ["Cabbage", 295],
    ["Celery", 231],
    ["Carrots", 222],
    ["Onions", 288],
    ["Peppers", 395],
    ["Radishes", 181],
    ["Cucumbers", 336],
    ["Beans", 263],
    ["Mushrooms", 396],
    ["Broccoli", 348],
    ["Sugar", 188],
    ["Peanut Butter", 269],
    ["Coffee", 324],
    ["Vodka", 473],
    ["Wine", 329],
    ["Electricity", 1380],
    ["Piped Gas", 1287],
    ["Petrol", 868],
    ["Diesel Fuel", 1017],
    ["Bitcoin", 38026],
    ["Etherum", 2982],
  ].map((x) => x[1]),
  UK: [
    ["Flour", 148],
    ["Rice", 192],
    ["Spaghetti", 170],
    ["Bread White", 326],
    ["Bread Wheat", 219],
    ["Cupcakes", 331],
    ["Cookies", 207],
    ["Ground Beef", 274],
    ["Ham", 254],
    ["Lamb and Mutton", 122],
    ["Chicken", 190],
    ["Turkey", 293],
    ["Eggs", 194],
    ["Milk Whole", 238],
    ["Milk Skim", 142],
    ["Milk Low Fat", 206],
    ["Butter", 118],
    ["Yogurt", 260],
    ["Cheese", 333],
    ["Cheddar Cheese", 191],
    ["Ice Cream", 156],
    ["Apples", 280],
    ["Bananas", 265],
    ["Oranges Navel", 174],
    ["Oranges Valencia", 283],
    ["Grapefruit", 140],
    ["Lemons", 229],
    ["Pears", 257],
    ["Peaches", 228],
    ["Strawberries", 270],
    ["Grapes", 207],
    ["Cherries", 272],
    ["Potatoes", 338],
    ["Lettuce", 257],
    ["Tomatoes", 171],
    ["Cabbage", 332],
    ["Celery", 282],
    ["Carrots", 211],
    ["Onions", 331],
    ["Peppers", 272],
    ["Radishes", 140],
    ["Cucumbers", 296],
    ["Beans", 310],
    ["Mushrooms", 283],
    ["Broccoli", 154],
    ["Sugar", 330],
    ["Peanut Butter", 152],
    ["Coffee", 165],
    ["Vodka", 209],
    ["Wine", 193],
    ["Electricity", 470],
    ["Piped Gas", 1000],
    ["Petrol", 940],
    ["Diesel Fuel", 710],
    ["Bitcoin", 29042],
    ["Etherum", 2269],
  ].map((x) => x[1]),
  IN: [
    ["Flour", 12242],
    ["Rice", 11129],
    ["Spaghetti", 4836],
    ["Bread White", 13606],
    ["Bread Wheat", 4895],
    ["Cupcakes", 8647],
    ["Cookies", 8226],
    ["Ground Beef", 7891],
    ["Ham", 13449],
    ["Lamb and Mutton", 12906],
    ["Chicken", 11581],
    ["Turkey", 5192],
    ["Eggs", 6699],
    ["Milk Whole", 10586],
    ["Milk Skim", 10781],
    ["Milk Low Fat", 7997],
    ["Butter", 11709],
    ["Yogurt", 7439],
    ["Cheese", 10422],
    ["Cheddar Cheese", 5133],
    ["Ice Cream", 6658],
    ["Apples", 9172],
    ["Bananas", 6251],
    ["Oranges Navel", 8146],
    ["Oranges Valencia", 9577],
    ["Grapefruit", 6062],
    ["Lemons", 6215],
    ["Pears", 11058],
    ["Peaches", 10758],
    ["Strawberries", 10328],
    ["Grapes", 4771],
    ["Cherries", 13066],
    ["Potatoes", 5344],
    ["Lettuce", 5277],
    ["Tomatoes", 8539],
    ["Cabbage", 9144],
    ["Celery", 5415],
    ["Carrots", 12062],
    ["Onions", 13750],
    ["Peppers", 11577],
    ["Radishes", 9682],
    ["Cucumbers", 9091],
    ["Beans", 11386],
    ["Mushrooms", 13319],
    ["Broccoli", 5385],
    ["Sugar", 7927],
    ["Peanut Butter", 6838],
    ["Coffee", 12864],
    ["Vodka", 10501],
    ["Wine", 18077],
    ["Electricity", 19584],
    ["Piped Gas", 34284],
    ["Petrol", 15747],
    ["Diesel Fuel", 36022],
    ["Bitcoin", 2255643],
    ["Etherum", 172651],
  ].map((x) => x[1]),
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
    prices.push(Math.ceil(newPrice));

    lastPrices[country][i] = Math.ceil(newPrice);
  }

  const timestamp = Number(aggregationRoundId) + 43200; // Some timestamp during the day

  console.log(
    "\nSubmitting : ",
    country,
    dailyIncrement,
    aggregationRoundId.toString(),
    timestamp,
    productsToGeneratePriceFor.map((p, i) => [p.name, prices[i]])
  );

  await contract
    .connect(signer1)
    .submitPrices(productIdsWithPrice, prices, timestamp, "manual");

  await sleep(3);

  await contract
    .connect(signer2)
    .submitPrices(productIdsWithPrice, prices, timestamp, "manual");

  await sleep(3);

  await contract.connect(signer3).submitPrices(
    productIdsWithPrice,
    prices.map((p) => Math.round(p * variant())),
    timestamp,
    "manual"
  );

  await sleep(3);

  console.log("Done");
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
  const avgInflation = 2;
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
