import axios from "axios";
import { ethers } from "ethers";
import stableContractAbi from "./abis/Stable.json";


const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_ETH_PROVIDER || window.ethereum);
const stableContract = new ethers.Contract(process.env.REACT_APP_STABLE_CONTRACT_ADDRESS, stableContractAbi, provider);
const signer = provider.getSigner();
const stableContractWithSigner = stableContract.connect(signer);

const axiosGraphql = axios.create({
  baseURL: process.env.REACT_APP_GRAPHQL_ENDPOINT,
  method: 'POST',
});

axiosGraphql.interceptors.response.use(function (response) {
  return response.data.data;
}, function (error) {
  return Promise.reject(error);
});


export async function getProducts() {
  // Get product details from IPFS (Graph don't allow IPFS queries now)
  const ipfsCid = await stableContract.productDetailsCid();
  const ipfsUrl = `https://ipfs.io/ipfs/${ipfsCid}/products.json`;
  const { data: productsDetails } = await axios.get(ipfsUrl);

  // Get latest price from graph
  const { products: productsWithPrices } = await axiosGraphql({
    data: {
      query: `
    {
      products {
        id
        price
        lastUpdated
      }
    }
  `
    }
  });

  const products = productsDetails.map(pd => {
    const productWithPrice = productsWithPrices.find(p => p.id === pd.id);

    if (productWithPrice) {
      return { ...pd, ...productWithPrice };
    }

    return pd;
  })

  return products;
}


export async function getProduct(id) {
  // Get product details from IPFS (Graph don't allow IPFS queries now)
  const ipfsCid = await stableContract.productDetailsCid();
  const ipfsUrl = `https://ipfs.io/ipfs/${ipfsCid}/products.json`;
  const { data: productsDetails } = await axios.get(ipfsUrl);

  // Get latest price from graph
  const { products: productsWithPrices } = await axiosGraphql({
    data: {
      query: `
    {
      products {
        id
        price
        lastUpdated
        priceHistory {
          id
          price
          date
          confirmations
        }
      }
    }
  `
    }
  });

  const product = productsDetails.find(p => p.id === id);
  const productWithPrice = productsWithPrices.find(p => p.id === id);

  return { ...product, ...productWithPrice };
}

export function getContractCurrentDate() {
  return stableContract.currentDate();
}

export async function addPrices(date, priceMapping) {
  const productsIds = Object.keys(priceMapping);
  const prices = Object.keys(priceMapping).map(k => priceMapping[k].price);

  await stableContractWithSigner.submitPrices(date, productsIds, prices);
}
