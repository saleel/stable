/* eslint-disable no-underscore-dangle */
import axios from 'axios';
import { ethers } from 'ethers';
import countryTrackerInterface from './abis/CountryTracker.json';
import stableContractInterface from './abis/Stable.json';
import szrContractInterface from './abis/StabilizerToken.json';
import stableTokenContractInterface from './abis/StableToken.json';
import { formatPrice, formatToken } from './utils';
import { Currencies } from './constants';

const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');

const stableContractAddress = process.env.REACT_APP_STABLE_CONTRACT_ADDRESS;
/** @type{import("../../core/typechain-types/Stable").Stable} */
const stableContract = new ethers.Contract(stableContractAddress, stableContractInterface, provider);

const axiosGraphql = axios.create({
  baseURL: process.env.REACT_APP_GRAPHQL_ENDPOINT,
  method: 'POST',
});

axiosGraphql.interceptors.response.use((response) => response.data.data, (error) => Promise.reject(error));

// TODO: Fetch from some API
const USDConversionRates = {
  USD: 1,
  GBP: 0.74,
  INR: 0.013,
};

export function getUSDRate(currency, amount) {
  return USDConversionRates[currency] * amount;
}

export async function getProductsWithWeightage({ country }) {
  const { products, countryTracker } = await axiosGraphql({
    data: {
      query: `
      {
        products {
          id
          name
          category
          description
          prices(where: { country: "${country}" }, first: 7, orderBy: createdAt, orderDirection: desc) {
            value
            createdAt
            currency
          }
        }
        countryTracker(id: "${country}-${Currencies[country]}") {
          productBasket {
            productId
            weightage
          }
        }
      }
      `,
    },
  });

  const { productBasket } = countryTracker;
  const weightage = productBasket.reduce((acc, b) => { acc[b.productId] = b.weightage; return acc; }, {});

  return products.map((p) => ({ ...p, weightage: weightage[p.id] || 0 }));
}

export async function getProduct(id) {
  const { product } = await axiosGraphql({
    data: {
      query: `
      {
        product(id: "${id}") {
          id
          name
          category
          description
          prices(orderBy: createdAt, orderDirection: desc) {
            id
            value
            createdAt
            currency
            country
          }
        }
      }
  `,
    },
  });

  return product;
}

export async function getLatestPriceIndex({ country }) {
  const { priceIndexes, globalPriceIndexes } = await axiosGraphql({
    data: {
      query: `
        {
          priceIndexes(where: { country: "${country}" }, first: 1, orderBy:createdAt, orderDirection:desc) {
            value
          }
          globalPriceIndexes(first: 1, orderBy:createdAt, orderDirection:desc) {
            value
          }
        }
      `,
    },
  });

  return {
    [country]: formatPrice(priceIndexes[0]?.value),
    GLOBAL: formatPrice(globalPriceIndexes[0]?.value),
  };
}

// TODO: TheGraph only allows max 1000 items.
// Implement multiple calls until all items are queried
export async function getPriceSubmissions({ country, productId }) {
  const { priceSubmissions } = await axiosGraphql({
    data: {
      query: `
        {
          priceSubmissions(first: 1000, where: { country: "${country}", product: "${productId}" }) {
            transactionId
            price
            currency
            createdBy
            createdAt
          }
        }
      `,
    },
  });

  return priceSubmissions;
}

export async function getPriceIndexHistory() {
  const { priceIndexes } = await axiosGraphql({
    data: {
      query: `
        {
          priceIndexes(first: 1000, orderBy:createdAt, orderDirection:desc) {
            country
            createdAt
            value
          }
        }
      `,
    },
  });

  return priceIndexes;
}

export async function getGlobalPriceIndexHistory() {
  const { globalPriceIndexes } = await axiosGraphql({
    data: {
      query: `
        {
          globalPriceIndexes(first: 1000, orderBy:createdAt, orderDirection:desc) {
            createdAt
            value
          }
        }
      `,
    },
  });

  return globalPriceIndexes;
}

/**
 *
 * @returns {import("../../core/typechain-types/CountryTracker").CountryTracker}
 */
async function getCountryTrackerContract(country) {
  const address = await stableContract.countryTrackers(country);
  const countryTrackerContract = new ethers.Contract(address, countryTrackerInterface, provider);
  return countryTrackerContract;
}

/** @type{import("../../core/typechain-types/StabilizerToken").StabilizerToken} */
let _szrContract;
async function getSZRContract() {
  if (_szrContract) {
    return _szrContract;
  }
  const address = await stableContract.szrToken();
  _szrContract = new ethers.Contract(address, szrContractInterface, provider);
  return _szrContract;
}

/** @type{import("../../core/typechain-types/StableToken").StableToken} */
let _stableTokenContract;
async function getStableTokenContract() {
  if (_stableTokenContract) {
    return _stableTokenContract;
  }
  const address = await stableContract.stableToken();
  _stableTokenContract = new ethers.Contract(address, stableTokenContractInterface, provider);
  return _stableTokenContract;
}

export async function getTokenBalance(address) {
  const result = await Promise.all([
    getSZRContract().then((c) => c.balanceOf(address)).then(formatToken),
    getStableTokenContract().then((c) => c.balanceOf(address)).then(formatToken),
  ]);

  return {
    SZR: result[0],
    STABLE: result[1],
  };
}

export async function getTokenAllowance(address) {
  const result = await Promise.all([
    getSZRContract().then((c) => c.allowance(address, stableContractAddress)).then(formatToken),
    getStableTokenContract().then((c) => c.allowance(address, stableContractAddress)).then(formatToken),
  ]);

  return {
    SZR: result[0],
    STABLE: result[1],
  };
}

export async function getTokenPrice() {
  const result = await Promise.all([
    stableContract.getSZRPriceInUSD(),
    stableContract.getStableTokenPrice(),
  ]);

  return {
    SZR: formatPrice(result[0].toNumber()),
    STABLE: formatPrice(result[1].toNumber()),
  };
}

export async function getSupplier(address) {
  const [result, szrWithdrawable] = await Promise.all([
    stableContract.suppliers(address),
    stableContract.getSZRWithdrawableBySupplier(address),
  ]);

  return {
    claimPercent: result.claimPercent,
    name: result.name,
    stablesRedeemable: formatToken(result.stablesRedeemable),
    stablesRedeemed: formatToken(result.stablesRedeemed),
    szrRewardsPerRedemption: formatToken(result.szrRewardsPerRedemption),
    szrWithdrawable: formatToken(szrWithdrawable),
    szrWithdrawn: formatToken(result.szrWithdrawn),
  };
}

export async function getRewardAmount(address) {
  const rewardAmount = await stableContract.rewards(address);

  return formatToken(rewardAmount);
}

export async function getContractState() {
  const [totalStablesRedeemable, overCollateralizationRatio, mintableStableTokenCount] = await Promise.all([
    stableContract.totalStablesRedeemable(),
    stableContract.overCollateralizationRatio(),
    stableContract.getMintableStableTokenCount(),
  ]);

  return {
    totalStablesRedeemable: formatToken(totalStablesRedeemable),
    overCollateralizationRatio,
    mintableStableTokenCount: formatToken(mintableStableTokenCount),
  };
}

export async function getAggregationRoundId(country) {
  const countryTrackerContract = await getCountryTrackerContract(country);
  return countryTrackerContract.aggregationRoundId();
}

export async function submitPrices({
  address, priceMapping, country, source,
}) {
  const countryTrackerContract = await getCountryTrackerContract(country);
  const signer = provider.getSigner(address);

  const productsIds = Object.keys(priceMapping);
  const prices = Object.keys(priceMapping).map((k) => priceMapping[k].price);
  const timestamp = Math.round(new Date().getTime() / 1000);

  await countryTrackerContract.connect(signer).submitPrices(productsIds, prices, timestamp, source);
}

export async function mintStables(address, amount) {
  const allowance = await getTokenAllowance(address);
  const amountInWei = ethers.utils.parseEther(amount.toString());
  const signer = provider.getSigner(address);

  if (amount > allowance.SZR) {
    const tokenContract = await getSZRContract();
    await tokenContract.connect(signer).approve(stableContractAddress, amountInWei.mul(10)); // Get higher allowance for future
  }

  const result = await stableContract.connect(signer).mintStable(amountInWei);

  return result.hash;
}

export async function burnStables(address, amount) {
  const allowance = await getTokenAllowance(address);
  const amountInWei = ethers.utils.parseEther(amount.toString());
  const signer = provider.getSigner(address);

  if (amount > allowance.STABLE) {
    const tokenContract = await getStableTokenContract();
    await tokenContract.connect(signer).approve(stableContractAddress, amountInWei.mul(10)); // Get higher allowance for future
  }

  const result = await stableContract.connect(signer).burnStable(amountInWei);

  return result.hash;
}

export async function supplierWithdrawSZR(address, amount) {
  const amountInWei = ethers.utils.parseEther(amount.toString());
  const signer = provider.getSigner(address);
  const result = await stableContract.connect(signer).supplierWithdrawSZR(amountInWei);

  return result.hash;
}

export async function withdrawRewards(address, amount) {
  const amountInWei = ethers.utils.parseEther(amount.toString());
  const signer = provider.getSigner(address);
  const result = await stableContract.connect(signer).withdrawRewards(amountInWei);

  return result.hash;
}
