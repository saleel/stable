import axios from 'axios';
import { ethers } from 'ethers';
import countryTrackerInterface from './abis/CountryTracker.json';
import stableContractInterface from './abis/Stable.json';
import szrContractInterface from './abis/StabilizerToken.json';
import stableTokenContractInterface from './abis/StableToken.json';
import { formatPrice, formatToken } from './utils';

const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
const signer = provider.getSigner();

/** @type{import("../../core/typechain-types/Stable").Stable} */
const stableContract = new ethers.Contract(process.env.REACT_APP_STABLE_CONTRACT_ADDRESS, stableContractInterface, provider);
const stableContractWithSigner = stableContract.connect(signer);

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

export async function getProducts(country) {
  const { products } = await axiosGraphql({
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
      }
      `,
    },
  });

  return products;
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

export async function getPriceIndex(country) {
  const { priceIndexes } = await axiosGraphql({
    data: {
      query: `
    {
      priceIndexes(where: { country: "${country}" }, first: 1, orderBy:updatedAt, orderDirection:desc) {
        value
      }
    }
  `,
    },
  });

  return priceIndexes[0]?.value;
}

export async function getGlobalPriceIndex() {
  const { globalPriceIndexes } = await axiosGraphql({
    data: {
      query: `
    {
      globalPriceIndexes(first: 1, orderBy:createdAt, orderDirection:desc) {
        value
      }
    }
  `,
    },
  });

  return globalPriceIndexes[0]?.value;
}

export async function getPriceSubmissions({ country, productId }) {
  const { priceSubmissions } = await axiosGraphql({
    data: {
      query: `
    {
      priceSubmissions(where: { country: "${country}", product: "${productId}" }) {
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

async function getCountryTrackerContract(country) {
  const address = await stableContractWithSigner.countryTrackers(country);
  const countryTrackerContract = new ethers.Contract(address, countryTrackerInterface, provider);
  return countryTrackerContract.connect(signer);
}

let szrContract;
async function getSZRContract() {
  if (szrContract) {
    return szrContract;
  }
  const address = await stableContract.szrToken();
  szrContract = new ethers.Contract(address, szrContractInterface, provider);
  return szrContract;
}

let stableTokenContract;
async function getStableTokenContract() {
  if (stableTokenContract) {
    return stableTokenContract;
  }
  const address = await stableContract.stableToken();
  stableTokenContract = new ethers.Contract(address, stableTokenContractInterface, provider);
  return stableTokenContract;
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
    stablesRedeemable: result.stablesRedeemable.toNumber(),
    stablesRedeemed: result.stablesRedeemed.toNumber(),
    szrRewardsPerRedemption: formatToken(result.szrRewardsPerRedemption),
    szrWithdrawable: formatToken(szrWithdrawable),
  };
}

export async function getContractState() {
  const [totalStablesRedeemable, overCollateralizationRatio, mintableStableTokenCount] = await Promise.all([
    stableContract.totalStablesRedeemable(),
    stableContract.overCollateralizationRatio(),
    stableContract.getMintableStableTokenCount(),
  ]);

  return {
    totalStablesRedeemable: totalStablesRedeemable.toNumber(),
    overCollateralizationRatio,
    mintableStableTokenCount: mintableStableTokenCount.toNumber(),
  };
}

export async function getAggregationRoundId(country) {
  const countryTrackerContract = await getCountryTrackerContract(country);
  return countryTrackerContract.aggregationRoundId();
}

export async function addPrices({ priceMapping, country, source }) {
  const countryTrackerContract = await getCountryTrackerContract(country);

  const productsIds = Object.keys(priceMapping);
  const prices = Object.keys(priceMapping).map((k) => priceMapping[k].price);

  await countryTrackerContract.submitPrices(productsIds, prices, source);
}
