import { DataSourceContext, ipfs, JSONValue, Value } from '@graphprotocol/graph-ts';
import { ProductDetailsUpdated, CountryTrackerCreated, AggregationRoundStarted, AggregationRoundCompleted } from '../../generated/Stable/Stable';
import { Product, ProductBasketItem, CountryTracker as CountryTrackerEntity, AggregationRound } from '../../generated/schema';
import { CountryTracker } from '../../generated/templates';


export function handleCountryTrackerCreated(event: CountryTrackerCreated): void {
  const id = event.params.country + "-" + event.params.currency;

  const countryTracker = new CountryTrackerEntity(id);
  countryTracker.country = event.params.country;
  countryTracker.currency = event.params.currency;
  countryTracker.address = event.params.contractAddress.toHex();
  countryTracker.createdAt = event.block.timestamp.toI32();
  countryTracker.updatedAt = event.block.timestamp.toI32();

  for (let i = 0; i < event.params.productIds.length; i++) {
    const productId = event.params.productIds[i]
    const basketItemId = countryTracker.id + "-" + productId;

    let basketItem = ProductBasketItem.load(basketItemId);

    if (basketItem == null) {
      basketItem = new ProductBasketItem(basketItemId);
      basketItem.productId = productId;
      basketItem.countryTracker = countryTracker.id;
    }

    if (event.params.weightages.length > 0) {
      basketItem.weightage = event.params.weightages[i];
    } else {
      basketItem.weightage = 1; // Default is 1 while create if empty
    }

    basketItem.save();
  }

  countryTracker.save();

  let context = new DataSourceContext()
  context.setString('countryTrackerId', id);
  context.setString('stableAddress', event.address.toHex());
  CountryTracker.createWithContext(event.params.contractAddress, context);
}

// Parse product details JSON from IPFS
export function processIPFSData(value: JSONValue, userData: Value): void {
  const productDetails = value.toArray();

  productDetails.forEach(detail => {
    const productData = detail.toObject();
    const productId = productData.get('id');

    if (!productId) {
      return;
    }

    const name = productData.get('name');
    const description = productData.get('description');
    const category = productData.get('category');

    let product = Product.load(productId.toString());
    if (product == null) {
      product = new Product(productId.toString());
      // product.createdAt = userData.toBigInt(); // TODO: This is throwing error
    }

    if (name) {
      product.name = name.toString();
    }
    if (description) {
      product.description = description.toString();
    }
    if (category) {
      product.category = category.toString();
    }

    product.save();
  });

}

export function handleProductDetailsUpdated(event: ProductDetailsUpdated): void {
  ipfs.mapJSON(event.params.productDetailsCID, 'processIPFSData', Value.fromBigInt(event.block.timestamp));
}

export function handleAggregationRoundStarted(event: AggregationRoundStarted): void {
  const aggregationRoundId = event.params.aggregationRoundId.toString();
  const aggregationRound = new AggregationRound(aggregationRoundId);

  aggregationRound.startTime = event.params.aggregationRoundId.toI32();
  aggregationRound.status = 'ACTIVE';
  aggregationRound.save();
}

export function handleAggregationRoundCompleted(event: AggregationRoundCompleted): void {
  const aggregationRoundId = event.params.aggregationRoundId.toString();
  const aggregationRound = new AggregationRound(aggregationRoundId);

  if (!aggregationRound) {
    return;
  }

  aggregationRound.endTime = event.block.timestamp.toI32();
  aggregationRound.status = 'COMPLETED';
  aggregationRound.save();
}
