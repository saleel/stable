import { DataSourceContext } from '@graphprotocol/graph-ts';
import { StableCreated } from '../../generated/StableFactory/StableFactory';
import { Stable } from '../../generated/templates';
import { Stable as StableEntity } from '../../generated/schema';

export function handleStableCreated(event: StableCreated): void {
  let context = new DataSourceContext()
  context.setString('country', event.params.country);
  context.setString('currency', event.params.currency);
  context.setString('address', event.params.stableAddress.toHex());

  Stable.createWithContext(event.params.stableAddress, context);

  const stable = new StableEntity(event.params.country);
  stable.country = event.params.country;
  stable.currency = event.params.currency;
  stable.address = event.params.stableAddress.toHex();

  stable.save();
}