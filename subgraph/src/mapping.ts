import { PriceUpdated } from '../generated/Stable/Stable'
import { Product, PriceHistory } from '../generated/schema'

export function handlePriceUpdated(event: PriceUpdated): void {
  const dateString = event.params.date.toString();
  const price = event.params.price;
  const productId = event.params.itemId.toString();

  let product = Product.load(productId);
  if (product == null) {
    product = new Product(productId);
  }
  product.price = price;
  product.lastUpdated = dateString;;

  const historyId = dateString + '_' + productId + '_' + productId;
  const history = new PriceHistory(historyId);
  history.product = productId;
  history.price = price;
  history.date = dateString;
  history.confirmations = event.params.confirmations;

  // product.priceHistory.push(historyId);

  history.save();
  product.save();
}
