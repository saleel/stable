import { DataSourceContext, ipfs, JSONValue, Value } from '@graphprotocol/graph-ts';
import { ProductDetailsUpdated, StableCreated } from '../../generated/StableFactory/StableFactory';
import { Stable } from '../../generated/templates';
import { Product, Stable as StableEntity } from '../../generated/schema';


export function handleStableCreated(event: StableCreated): void {
  const id = event.params.country + "-" + event.params.currency;

  const stable = new StableEntity(id);
  stable.country = event.params.country;
  stable.currency = event.params.currency;
  stable.address = event.params.stableAddress.toHex();
  stable.createdAt = event.block.timestamp;
  stable.updatedAt = event.block.timestamp;
  stable.save();


  let context = new DataSourceContext()
  context.setString('stableId', id);
  Stable.createWithContext(event.params.stableAddress, context);
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
  ipfs.mapJSON(event.params.productDetailsCid, 'processIPFSData', Value.fromBigInt(event.block.timestamp));
}