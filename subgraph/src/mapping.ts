import { PriceUpdated, PriceIndexUpdated, ProductDetailsUpdated } from '../generated/Stable/Stable';
import { Product, PriceHistory, PriceIndex } from '../generated/schema';
import { ipfs, JSONValue, JSONValueKind, Value } from '@graphprotocol/graph-ts';

export function handlePriceUpdated(event: PriceUpdated): void {
  const dateString = event.params.date.toString();
  const price = event.params.price;
  const productId = event.params.productId;

  let product = Product.load(productId);
  if (product == null) {
    product = new Product(productId);
  }
  product.price = price;
  product.lastUpdated = dateString;;

  const historyId = dateString + '_' + productId + '_' + price.toString();
  const history = new PriceHistory(historyId);
  history.product = productId;
  history.price = price;
  history.date = dateString;
  history.confirmations = event.params.confirmations;

  history.save();
  product.save();
}

export function handlePriceIndexUpdated(event: PriceIndexUpdated): void {
  const priceIndex = new PriceIndex(event.params.date.toString());
  priceIndex.index = event.params.priceIndex;
  priceIndex.date = event.params.date.toString();

  priceIndex.save();
}

// Parse product details JSON from IPFS
// export function processIPFSData(value: JSONValue): void {
//   const productDetails = value.toArray();

//   productDetails.forEach(detail => {
//     const productData = detail.toObject();
//     const productId = productData.get('id');

//     if (!productId) {
//       return;
//     }

//     const name = productData.get('name');
//     const description = productData.get('description');
//     const category = productData.get('category');

//     let product = Product.load(productId.toString());
//     if (product == null) {
//       product = new Product(productId.toString());
//     }

//     if (name) {
//       product.name = name.toString();
//     }
//     if (description) {
//       product.description = description.toString();
//     }
//     if (category) {
//       product.category = category.toString();
//     }

//     product.save();
//   });

// }


// export function handleProductDetailsUpdated(event: ProductDetailsUpdated): void {
//   // ipfs.mapJSON(event.params.productDetailsCid, 'processIPFSData', Value.fromString(''));
// }

