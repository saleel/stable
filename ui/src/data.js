/* eslint-disable no-underscore-dangle */
import axios from 'axios';
import { ethers } from 'ethers';
import countryTrackerInterface from './abis/CountryTracker.json';
import stableContractInterface from './abis/Stable.json';
import szrContractInterface from './abis/StabilizerToken.json';
import stableTokenContractInterface from './abis/StableToken.json';
import { formatPrice, formatToken } from './utils';
import { Currencies } from './constants';

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
            id
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
 * @param {boolean} readOnly
 * @returns {Promise<ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider>}
 */
async function getProvider(readOnly = true) {
  let provider;

  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum, 'any');

    const chainId = await provider.getSigner(0).getChainId();
    if (chainId !== Number(process.env.REACT_APP_CHAIN_ID)) {
      provider = null;
    }
  }

  if (!provider) {
    if (readOnly) {
      provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_JSON_RPC_URL);
    } else {
      // eslint-disable-next-line no-alert
      window.alert('Metamask not found or selected chain is not Aurora mainnet');
      return null;
    }
  }

  return provider;
}

/**
 * @param {ethers.providers.Provider | ethers.Signer} provider
 *
 * @returns {import("../../core/typechain-types/Stable").Stable}
 */
function getStableContract(provider) {
  const stableContractAddress = process.env.REACT_APP_STABLE_CONTRACT_ADDRESS;
  const stableContract = new ethers.Contract(stableContractAddress, stableContractInterface, provider);

  return stableContract;
}

/**
 * @param {ethers.providers.Provider | ethers.Signer} provider
 * @param {string} country
 *
 * @returns {Promise<import("../../core/typechain-types/CountryTracker").CountryTracker>}
 */
async function getCountryTrackerContract(provider, country) {
  const stableContract = getStableContract(provider);
  const address = await stableContract.countryTrackers(country);
  const countryTrackerContract = new ethers.Contract(address, countryTrackerInterface, stableContract.provider);

  return countryTrackerContract;
}

/**
 *
 * @returns {Promise<import("../../core/typechain-types/StabilizerToken").StabilizerToken>}
 */
async function getSZRContract(provider) {
  const stableContract = getStableContract(provider);
  const address = await stableContract.szrToken();

  return new ethers.Contract(address, szrContractInterface, stableContract.provider);
}

/**
 *
 * @returns {Promise<import("../../core/typechain-types/StableToken").StableToken>}
 */
async function getStableTokenContract(provider) {
  const stableContract = getStableContract(provider);
  const address = await stableContract.stableToken();

  return new ethers.Contract(address, stableTokenContractInterface, stableContract.provider);
}

export async function getTokenBalance(address) {
  const provider = await getProvider(true);

  const result = await Promise.all([
    getSZRContract(provider).then((c) => c.balanceOf(address)).then(formatToken),
    getStableTokenContract(provider).then((c) => c.balanceOf(address)).then(formatToken),
  ]);

  return {
    SZR: result[0],
    STABLE: result[1],
  };
}

export async function getTokenAllowance(address) {
  const provider = await getProvider(true);
  const stableContract = getStableContract(provider);

  const result = await Promise.all([
    getSZRContract().then((c) => c.allowance(address, stableContract.address)).then(formatToken),
    getStableTokenContract().then((c) => c.allowance(address, stableContract.address)).then(formatToken),
  ]);

  return {
    SZR: result[0],
    STABLE: result[1],
  };
}

export async function getTokenPrice() {
  const provider = await getProvider(true);
  const stableContract = getStableContract(provider);

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
  const provider = await getProvider(true);
  const stableContract = getStableContract(provider);

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
  const provider = await getProvider(true);
  const stableContract = getStableContract(provider);

  const rewardAmount = await stableContract.rewards(address);

  return formatToken(rewardAmount);
}

export async function getContractState() {
  const provider = await getProvider(true);
  const stableContract = getStableContract(provider);

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
  const provider = await getProvider(true);
  const countryTrackerContract = await getCountryTrackerContract(provider, country);
  return countryTrackerContract.aggregationRoundId();
}

export async function submitPrices({
  address, priceMapping, country, source,
}) {
  const provider = await getProvider(false);

  const countryTrackerContract = await getCountryTrackerContract(provider, country);
  const signer = provider.getSigner(address);

  const productsIds = Object.keys(priceMapping);
  const prices = Object.keys(priceMapping).map((k) => priceMapping[k].price);
  const timestamp = Math.round(new Date().getTime() / 1000);

  await countryTrackerContract.connect(signer).submitPrices(productsIds, prices, timestamp, source);
}

export async function mintStables(address, amount) {
  const provider = await getProvider(false);
  const stableContract = getStableContract(provider);

  const allowance = await getTokenAllowance(address);
  const amountInWei = ethers.utils.parseEther(amount.toString());
  const signer = provider.getSigner(address);

  if (amount > allowance.SZR) {
    const tokenContract = await getSZRContract();
    await tokenContract.connect(signer).approve(stableContract.address, amountInWei.mul(10)); // Get higher allowance for future
  }

  const result = await stableContract.connect(signer).mintStable(amountInWei);

  return result.hash;
}

export async function burnStables(address, amount) {
  const provider = await getProvider(false);
  const stableContract = getStableContract(provider);

  const allowance = await getTokenAllowance(address);
  const amountInWei = ethers.utils.parseEther(amount.toString());
  const signer = provider.getSigner(address);

  if (amount > allowance.STABLE) {
    const tokenContract = await getStableTokenContract();
    await tokenContract.connect(signer).approve(stableContract.address, amountInWei.mul(10)); // Get higher allowance for future
  }

  const result = await stableContract.connect(signer).burnStable(amountInWei);

  return result.hash;
}

export async function supplierWithdrawSZR(address, amount) {
  const provider = await getProvider(false);
  const stableContract = getStableContract(provider);

  const amountInWei = ethers.utils.parseEther(amount.toString());
  const signer = provider.getSigner(address);
  const result = await stableContract.connect(signer).supplierWithdrawSZR(amountInWei);

  return result.hash;
}

export async function withdrawRewards(address, amount) {
  const provider = await getProvider(false);
  const stableContract = getStableContract(provider);

  const amountInWei = ethers.utils.parseEther(amount.toString());
  const signer = provider.getSigner(address);
  const result = await stableContract.connect(signer).withdrawRewards(amountInWei);

  return result.hash;
}
