import { PricesSubmitted, PriceIndexUpdated, PricesUpdated, ProductBasketUpdated } from '../../generated/templates/Stable/Stable';
import { Product, PriceIndex, Stable, Price, PriceSubmission, LatestPrice, ProductBasketItem, AggregationRound, AggregationRound, AggregationRound, AggregationRound } from '../../generated/schema';
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
      basketItem.stable = stable.id;
    }

    basketItem.weightage = event.params.weightages[i];
    basketItem.save();
  }
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
    const aggregationRoundId = stableId + "-" + event.params.aggregationRoundId.toString();

    const submissionId = aggregationRoundId + "-" + productId + "-" + event.transaction.from.toHex();

    let priceSubmission = PriceSubmission.load(submissionId);
    if (priceSubmission == null) {
      priceSubmission = new PriceSubmission(submissionId);
      priceSubmission.createdAt = event.block.timestamp;
    }

    priceSubmission.stable = stable.id;
    priceSubmission.aggregationRound = aggregationRoundId;
    priceSubmission.currency = stable.currency;
    priceSubmission.country = stable.country;
    priceSubmission.product = productId;
    priceSubmission.price = event.params.prices[i];
    priceSubmission.source = event.params.source;
    priceSubmission.updatedAt = event.block.timestamp;
    priceSubmission.createdBy = event.transaction.from.toHex();
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

    // Create Price
    const aggregationRoundId = event.params.aggregationRoundId.toString();
    const priceId = stable.id + "-" + aggregationRoundId + "-" + productId;
    const price = new Price(priceId);
    price.stable = stable.id;
    price.currency = stable.currency;
    price.country = stable.country;
    price.product = productId;
    price.value = event.params.prices[i];
    price.createdAt = event.params.aggregationRoundId;
    price.createdBy = event.transaction.from.toHex();
    price.save();

    // Update LatestPrice
    const latestPriceId = stable.id + '-' + productId;
    let latestPrice = LatestPrice.load(latestPriceId);
    if (latestPrice == null) {
      latestPrice = new LatestPrice(latestPriceId);
      latestPrice.country = stable.country;
      latestPrice.currency = stable.currency;
      latestPrice.stable = stable.id;
    }
    latestPrice.updatedAt = event.block.timestamp;
    latestPrice.value = price.value;
    latestPrice.product = productId;
    latestPrice.save();
  }
}

export function handlePriceIndexUpdated(event: PriceIndexUpdated): void {
  let context = dataSource.context();
  const stableId = context.getString('stableId');
  const stable = Stable.load(stableId);

  if (stable == null) {
    return;
  }

  const aggregationRoundId = event.params.aggregationRoundId;
  const priceIndexId = stable.id + '-' + aggregationRoundId.toString();
  const priceIndex = new PriceIndex(priceIndexId);

  priceIndex.stable = stable.id;
  priceIndex.value = event.params.priceIndex;
  priceIndex.updatedAt = aggregationRoundId;
  priceIndex.currency = stable.currency;
  priceIndex.country = stable.country;

  priceIndex.save();

  stable.latestPriceIndex = priceIndex.id;
  stable.save();
}

export function handleAggregationRoundStarted(event: PriceIndexUpdated): void {
  let context = dataSource.context();
  const stableId = context.getString('stableId');

  const aggregationRoundId = stableId + "-" + event.params.aggregationRoundId.toString();
  const aggregationRound = new AggregationRound(aggregationRoundId.toString());

  aggregationRound.stable = stableId;
  aggregationRound.startTime = event.params.aggregationRoundId;
  aggregationRound.status = 'ACTIVE';
  aggregationRound.save();
}

export function handleAggregationRoundCompleted(event: PriceIndexUpdated): void {
  let context = dataSource.context();
  const stableId = context.getString('stableId');

  const aggregationRoundId = stableId + "-" + event.params.aggregationRoundId.toString();
  const aggregationRound = AggregationRound.load(aggregationRoundId);

  if (!aggregationRound) {
    return;
  }

  aggregationRound.endTime = event.block.timestamp;
  aggregationRound.status = 'COMPLETED';
  aggregationRound.save();
}
