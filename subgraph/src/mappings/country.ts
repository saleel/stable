import { Stable as StableContract } from '../../generated/Stable/Stable';
import { PricesSubmitted, PriceIndexUpdated, PricesUpdated, ProductBasketUpdated } from '../../generated/templates/CountryTracker/CountryTracker';
import { PriceIndex, CountryTracker, Price, PriceSubmission, ProductBasketItem, GlobalPriceIndex } from '../../generated/schema';
import { Address, dataSource } from '@graphprotocol/graph-ts';

export function handleProductBasketUpdated(event: ProductBasketUpdated): void {
  let context = dataSource.context();
  const countryTrackerId = context.getString('countryTrackerId');
  const countryTracker = CountryTracker.load(countryTrackerId);

  if (countryTracker == null) {
    return;
  }

  for (let i = 0; i < event.params.productIds.length; i++) {
    const productId = event.params.productIds[i]
    const basketItemId = countryTracker.id + "-" + productId;

    let basketItem = ProductBasketItem.load(basketItemId);

    if (basketItem == null) {
      basketItem = new ProductBasketItem(basketItemId);
      basketItem.productId = productId;
      basketItem.countryTracker = countryTracker.id;
    }

    basketItem.weightage = event.params.weightages[i];
    basketItem.save();
  }
}

export function handlePricesSubmitted(event: PricesSubmitted): void {
  let context = dataSource.context();
  const countryTrackerId = context.getString('countryTrackerId');
  const countryTracker = CountryTracker.load(countryTrackerId);

  if (countryTracker == null) {
    return;
  }

  for (let i = 0; i < event.params.productIds.length; i++) {
    const productId = event.params.productIds[i];
    const timestamp = event.params.timestamp || event.block.timestamp;

    const submissionId = countryTracker.country + "-" + productId + "-" + timestamp.toString() + "-" + event.transaction.from.toHex();

    let priceSubmission = PriceSubmission.load(submissionId);
    if (priceSubmission == null) {
      priceSubmission = new PriceSubmission(submissionId);
      priceSubmission.createdAt = timestamp.toI32();
    }

    priceSubmission.countryTracker = countryTracker.id;
    priceSubmission.transactionId = event.transaction.hash.toHex();
    priceSubmission.currency = countryTracker.currency;
    priceSubmission.country = countryTracker.country;
    priceSubmission.product = productId;
    priceSubmission.price = event.params.prices[i].toI32(); // TODO: Check if max possible price value can exceed i32
    priceSubmission.source = event.params.source;
    priceSubmission.updatedAt = timestamp.toI32();
    priceSubmission.createdBy = event.transaction.from.toHex();
    priceSubmission.save();
  }
}

export function handlePricesUpdated(event: PricesUpdated): void {
  let context = dataSource.context();
  const countryTrackerId = context.getString('countryTrackerId');
  const countryTracker = CountryTracker.load(countryTrackerId);

  if (countryTracker == null) {
    return;
  }

  for (let i = 0; i < event.params.productIds.length; i++) {
    const productId = event.params.productIds[i]

    // Create Price
    const aggregationRoundId = event.params.aggregationRoundId.toString();
    const priceId = countryTracker.id + "-" + aggregationRoundId + "-" + productId;
    const price = new Price(priceId);
    price.countryTracker = countryTracker.id;
    price.currency = countryTracker.currency;
    price.country = countryTracker.country;
    price.product = productId;
    price.value = event.params.prices[i].toI32();  // TODO: Check if max possible price value can exceed i32
    price.createdAt = event.params.aggregationRoundId.toI32();
    price.createdBy = event.transaction.from.toHex();
    price.save();
  }
}

export function handlePriceIndexUpdated(event: PriceIndexUpdated): void {
  let context = dataSource.context();
  const countryTrackerId = context.getString('countryTrackerId');
  const countryTracker = CountryTracker.load(countryTrackerId);

  if (countryTracker == null) {
    return;
  }

  const aggregationRoundId = event.params.aggregationRoundId;
  const priceIndexId = countryTracker.id + '-' + aggregationRoundId.toString();
  const priceIndex = new PriceIndex(priceIndexId);

  priceIndex.countryTracker = countryTracker.id;
  priceIndex.value = event.params.priceIndex.toI32();  // TODO: Check if max possible price value can exceed i32
  priceIndex.updatedAt = aggregationRoundId.toI32();
  priceIndex.currency = countryTracker.currency;
  priceIndex.country = countryTracker.country;

  priceIndex.save();

  countryTracker.latestPriceIndex = priceIndex.value;
  countryTracker.save();

  // Update the global price index
  const stableAddress = context.getString('stableAddress');
  const stableContract = StableContract.bind(Address.fromString(stableAddress));
  const blockTime = event.block.timestamp.toI32();
  // Round to nearest 00:00 GMT time
  const globalPriceIndexId = blockTime - (blockTime % (24 * 60 * 60));
  let globalPriceIndex = GlobalPriceIndex.load(globalPriceIndexId.toString());
  if (!globalPriceIndex) {
    globalPriceIndex = new GlobalPriceIndex(globalPriceIndexId.toString());
    globalPriceIndex.createdAt = event.block.timestamp.toI32();
  }
  globalPriceIndex.value = stableContract.getGlobalPriceIndex().toI32();
  globalPriceIndex.updatedAt = event.block.timestamp.toI32();
  globalPriceIndex.save();
}

