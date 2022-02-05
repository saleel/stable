import axios from 'axios';
import { ethers } from 'ethers';
import stableFactoryContractAbi from './abis/StableFactory.json';
import stableContractAbi from './abis/Stable.json';

const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_ETH_PROVIDER || window.ethereum);
const stableFactorContract = new ethers.Contract(process.env.REACT_APP_STABLE_CONTRACT_ADDRESS, stableFactoryContractAbi, provider);
const signer = provider.getSigner();
const stableFactorContractWithSigner = stableFactorContract.connect(signer);
console.log(stableFactorContract);

const axiosGraphql = axios.create({
  baseURL: process.env.REACT_APP_GRAPHQL_ENDPOINT,
  method: 'POST',
});

axiosGraphql.interceptors.response.use((response) => response.data.data, (error) => Promise.reject(error));

async function getClientForChildContract(country) {
  const address = await stableFactorContractWithSigner.childContracts(country);
  const stableContract = new ethers.Contract(address, stableContractAbi, provider);
  return stableContract.connect(signer);
}

export async function getProducts(country = 'US') {
  // await stableContractWithSigner.calculate();
  // const stableContract = await getClientForChildContract(country);

  // console.log(stableContract)

  // Get product details from IPFS (Graph don't allow IPFS queries now)
  // const ipfsCid = await stableContract.productDetailsCid();
  // const ipfsUrl = `https://ipfs.io/ipfs/${ipfsCid}`;
  // const { data: productsDetails } = await axios.get(ipfsUrl);

  // Get latest price from graph
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

  // const products = productsDetails.map(pd => {
  //   const productWithPrice = productsWithPrices.find(p => p.id === pd.id);

  //   if (productWithPrice) {
  //     return { ...pd, ...productWithPrice };
  //   }

  //   return pd;
  // })

  return products;
}

export async function getProduct(id, country = 'US') {
  // const stableContract = await getClientForChildContract(country)

  // Get product details from IPFS (Graph don't allow IPFS queries now)
  // const ipfsCid = await stableContract.productDetailsCid();
  // const ipfsUrl = `https://ipfs.io/ipfs/${ipfsCid}/products.json`;
  // const { data: productsDetails } = await axios.get(ipfsUrl);

  // Get latest price from graph
  const { product } = await axiosGraphql({
    data: {
      query: `
    {
      product(id: "${id}") {
        id
        latestPrice {
          id
          price
        }
        priceHistory {
          id
          price
          date
          confirmations
        }
      }
    }
  `,
    },
  });

  return product;
}

export async function getContractCurrentDate(country = 'US') {
  const stableContract = await getClientForChildContract(country);
  return stableContract.currentDate();
}

export async function addPrices(date, priceMapping, country = 'US') {
  const stableContract = await getClientForChildContract(country);

  const productsIds = Object.keys(priceMapping);
  const prices = Object.keys(priceMapping).map((k) => priceMapping[k].price);

  await stableContract.submitPrices(date, productsIds, prices);
}

export async function getPriceIndex(country = 'US') {
  const stableContract = await getClientForChildContract(country);
  return stableContract.priceIndex();
}
