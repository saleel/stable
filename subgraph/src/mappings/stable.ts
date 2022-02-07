import { StableFactory as StableFactoryContract } from '../../generated/StableFactory/StableFactory';
import { PricesSubmitted, PriceIndexUpdated, PricesUpdated, ProductBasketUpdated, Stable as StableContract } from '../../generated/templates/Stable/Stable';
import { PriceIndex, Stable, Price, PriceSubmission, ProductBasketItem, AggregationRound, GlobalPriceIndex } from '../../generated/schema';
import { Address, BigInt, dataSource, DataSourceContext } from '@graphprotocol/graph-ts';

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
      priceSubmission.createdAt = event.block.timestamp.toI32();
    }

    priceSubmission.stable = stable.id;
    priceSubmission.aggregationRound = aggregationRoundId;
    priceSubmission.transactionId = event.transaction.hash.toHex();
    priceSubmission.currency = stable.currency;
    priceSubmission.country = stable.country;
    priceSubmission.product = productId;
    priceSubmission.price = event.params.prices[i];
    priceSubmission.source = event.params.source;
    priceSubmission.updatedAt = event.block.timestamp.toI32();
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
    price.createdAt = event.params.aggregationRoundId.toI32();
    price.createdBy = event.transaction.from.toHex();
    price.save();
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
  priceIndex.updatedAt = aggregationRoundId.toI32();
  priceIndex.currency = stable.currency;
  priceIndex.country = stable.country;

  priceIndex.save();

  stable.latestPriceIndex = priceIndex.value;
  stable.save();

  // Update the global price index
  const stableFactoryAddress = context.getString('stableFactoryAddress');
  const stableFactoryContract = StableFactoryContract.bind(Address.fromString(stableFactoryAddress));
  const blockTime = event.block.timestamp.toI32();
  // Round to nearest 00:00 GMT time
  const globalPriceIndexId = blockTime - (blockTime % (24 * 60 * 60));
  let globalPriceIndex = GlobalPriceIndex.load(globalPriceIndexId.toString());
  if (!globalPriceIndex) {
    globalPriceIndex = new GlobalPriceIndex(globalPriceIndexId.toString());
    globalPriceIndex.createdAt = event.block.timestamp.toI32();
  }
  globalPriceIndex.value = stableFactoryContract.globalPriceIndex().toI32();
  globalPriceIndex.updatedAt = event.block.timestamp.toI32();
  globalPriceIndex.save();
}

export function handleAggregationRoundStarted(event: PriceIndexUpdated): void {
  let context = dataSource.context();
  const stableId = context.getString('stableId');

  const aggregationRoundId = stableId + "-" + event.params.aggregationRoundId.toString();
  const aggregationRound = new AggregationRound(aggregationRoundId.toString());

  aggregationRound.stable = stableId;
  aggregationRound.startTime = event.params.aggregationRoundId.toI32();
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

  aggregationRound.endTime = event.block.timestamp.toI32();
  aggregationRound.status = 'COMPLETED';
  aggregationRound.save();
}
