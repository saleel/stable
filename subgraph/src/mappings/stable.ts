import { PricesSubmitted, PriceIndexUpdated, PricesUpdated, ProductBasketUpdated } from '../../generated/templates/Stable/Stable';
import { Product, PriceIndex, Stable, Price, PriceSubmission, LatestPrice, ProductBasketItem } from '../../generated/schema';
import { dataSource } from '@graphprotocol/graph-ts';

export function handleProductBasketUpdated(event: ProductBasketUpdated): void {
  let context = dataSource.context();
  const stableId = context.getString('stableId');
  const stable = Stable.load(stableId);

  if (stable == null) {
    return;
  }

  for (let i = 0; i < event.params.productIds.length; i++) {
    const productId = event.params.productIds[i]
    const basketItemId = stable.id + "-" + productId;

    let basketItem = ProductBasketItem.load(basketItemId);

    if (basketItem == null) {
      basketItem = new ProductBasketItem(basketItemId);
      basketItem.productId = productId;

      stable.productBasket.push(basketItem.id);
    }

    basketItem.weightage = event.params.weightages[i];
    basketItem.save();
  }

  stable.save();
}

export function handlePricesSubmitted(event: PricesSubmitted): void {
  let context = dataSource.context();
  const stableId = context.getString('stableId');
  const stable = Stable.load(stableId);

  if (stable == null) {
    return;
  }

  for (let i = 0; i < event.params.productIds.length; i++) {
    const productId = event.params.productIds[i]
    const product = Product.load(productId);

    if (product == null) {
      return;
    }

    const id = event.transaction.hash.toString() + "-" + productId;
    const priceSubmission = new PriceSubmission(id);

    priceSubmission.stable = stable.id;
    priceSubmission.currency = stable.currency;
    priceSubmission.country = stable.country;
    priceSubmission.product = product.id;
    priceSubmission.price = event.params.prices[i];
    priceSubmission.source = event.params.source;
    priceSubmission.createdBy = event.transaction.from.toString();
    priceSubmission.createdAt = event.block.timestamp;
    priceSubmission.save();
  }
}

export function handlePricesUpdated(event: PricesUpdated): void {
  let context = dataSource.context();
  const stableId = context.getString('stableId');
  const stable = Stable.load(stableId);

  if (stable == null) {
    return;
  }

  for (let i = 0; i < event.params.productIds.length; i++) {
    const productId = event.params.productIds[i]
    const product = Product.load(productId);

    if (product == null) {
      return;
    }

    // Create Price
    const id = event.transaction.hash.toString() + "-" + productId;
    const price = new Price(id);
    price.stable = stable.id;
    price.currency = stable.currency;
    price.country = stable.country;
    price.product = product.id;
    price.value = event.params.prices[i];
    price.date = event.params.date.toString();
    price.confirmations = event.params.confirmations[i];
    price.createdAt = event.block.timestamp;
    price.save();

    // Update LatestPrice
    const latestPriceId = stable.id + '-' + productId;
    let latestPrice = LatestPrice.load(latestPriceId);
    if (latestPrice == null) {
      latestPrice = new LatestPrice(latestPriceId);
      latestPrice.country = stable.country;
      latestPrice.currency = stable.currency;
    }
    latestPrice.updatedAt = event.block.timestamp;
    latestPrice.price = price.id;
    latestPrice.product = productId;
    latestPrice.save();

    product.priceHistory.push(price.id);
    product.save();
  }
}

export function handlePriceIndexUpdated(event: PriceIndexUpdated): void {
  let context = dataSource.context();
  const stableId = context.getString('stableId');
  const stable = Stable.load(stableId);

  if (stable == null) {
    return;
  }
  
  const priceIndex = new PriceIndex(event.params.date.toString());
  
  priceIndex.stable = stable.id;
  priceIndex.value = event.params.priceIndex;
  priceIndex.date = event.params.date.toString();
  priceIndex.currency = stable.currency;
  priceIndex.country = stable.country;

  priceIndex.save();

  stable.latestPriceIndex = priceIndex.id;
  stable.save();
}
