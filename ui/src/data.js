import axios from 'axios';
import { ethers } from 'ethers';
import countryTrackerABI from './abis/CountryTracker.json';
import stableABI from './abis/Stable.json';

const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_CHAIN_RPC || window.ethereum);
const stableContract = new ethers.Contract(process.env.REACT_APP_STABLE_CONTRACT_ADDRESS, countryTrackerABI, provider);
const signer = provider.getSigner();
const stableContractWithSigner = stableContract.connect(signer);

const axiosGraphql = axios.create({
  baseURL: process.env.REACT_APP_GRAPHQL_ENDPOINT,
  method: 'POST',
});

axiosGraphql.interceptors.response.use((response) => response.data.data, (error) => Promise.reject(error));

async function getClientForChildContract(country) {
  const address = await stableContractWithSigner.countryTrackers(country);
  const countryTrackerContract = new ethers.Contract(address, stableABI, provider);
  return countryTrackerContract.connect(signer);
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

export async function getAggregationRoundId(country) {
  const countryTrackerContract = await getClientForChildContract(country);
  return countryTrackerContract.aggregationRoundId();
}

export async function addPrices({ priceMapping, country, source }) {
  const countryTrackerContract = await getClientForChildContract(country);

  const productsIds = Object.keys(priceMapping);
  const prices = Object.keys(priceMapping).map((k) => priceMapping[k].price);

  await countryTrackerContract.submitPrices(productsIds, prices, source);
}

// TODO: Fetch from some API
const USDConversionRates = {
  USD: 1,
  GBP: 0.74,
  INR: 0.013,
};

export function getUSDRate(currency, amount) {
  return USDConversionRates[currency] * amount;
}
