import axios from 'axios';
import { ethers } from 'ethers';
import stableFactoryContractAbi from './abis/Stable.json';
import stableContractAbi from './abis/Stable.json';

const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_ETH_PROVIDER || window.ethereum);
const stableFactorContract = new ethers.Contract(process.env.REACT_APP_STABLE_CONTRACT_ADDRESS, stableFactoryContractAbi, provider);
const signer = provider.getSigner();
const stableFactorContractWithSigner = stableFactorContract.connect(signer);

const axiosGraphql = axios.create({
  baseURL: process.env.REACT_APP_GRAPHQL_ENDPOINT,
  method: 'POST',
});

axiosGraphql.interceptors.response.use((response) => response.data.data, (error) => Promise.reject(error));

async function getClientForChildContract(country) {
  const address = await stableFactorContractWithSigner.countryTrackers(country);
  const stableContract = new ethers.Contract(address, stableContractAbi, provider);
  return stableContract.connect(signer);
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
  const stableContract = await getClientForChildContract(country);
  return stableContract.aggregationRoundId();
}

export async function addPrices({ priceMapping, country, source }) {
  const stableContract = await getClientForChildContract(country);

  const productsIds = Object.keys(priceMapping);
  const prices = Object.keys(priceMapping).map((k) => priceMapping[k].price);

  await stableContract.submitPrices(productsIds, prices, source);
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
