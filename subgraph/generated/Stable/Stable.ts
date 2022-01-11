// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class PriceIndexUpdated extends ethereum.Event {
  get params(): PriceIndexUpdated__Params {
    return new PriceIndexUpdated__Params(this);
  }
}

export class PriceIndexUpdated__Params {
  _event: PriceIndexUpdated;

  constructor(event: PriceIndexUpdated) {
    this._event = event;
  }

  get date(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get priceIndex(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class PriceUpdated extends ethereum.Event {
  get params(): PriceUpdated__Params {
    return new PriceUpdated__Params(this);
  }
}

export class PriceUpdated__Params {
  _event: PriceUpdated;

  constructor(event: PriceUpdated) {
    this._event = event;
  }

  get date(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get productId(): string {
    return this._event.parameters[1].value.toString();
  }

  get price(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get confirmations(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }
}

export class ProductAdded extends ethereum.Event {
  get params(): ProductAdded__Params {
    return new ProductAdded__Params(this);
  }
}

export class ProductAdded__Params {
  _event: ProductAdded;

  constructor(event: ProductAdded) {
    this._event = event;
  }

  get productId(): string {
    return this._event.parameters[0].value.toString();
  }

  get weightage(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class ProductDetailsUpdated extends ethereum.Event {
  get params(): ProductDetailsUpdated__Params {
    return new ProductDetailsUpdated__Params(this);
  }
}

export class ProductDetailsUpdated__Params {
  _event: ProductDetailsUpdated;

  constructor(event: ProductDetailsUpdated) {
    this._event = event;
  }

  get productDetailsCid(): string {
    return this._event.parameters[0].value.toString();
  }
}

export class Stable extends ethereum.SmartContract {
  static bind(address: Address): Stable {
    return new Stable("Stable", address);
  }

  currency(): string {
    let result = super.call("currency", "currency():(string)", []);

    return result[0].toString();
  }

  try_currency(): ethereum.CallResult<string> {
    let result = super.tryCall("currency", "currency():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  currentDate(): BigInt {
    let result = super.call("currentDate", "currentDate():(uint32)", []);

    return result[0].toBigInt();
  }

  try_currentDate(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("currentDate", "currentDate():(uint32)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  owner(): Address {
    let result = super.call("owner", "owner():(address)", []);

    return result[0].toAddress();
  }

  try_owner(): ethereum.CallResult<Address> {
    let result = super.tryCall("owner", "owner():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  priceIndex(): BigInt {
    let result = super.call("priceIndex", "priceIndex():(uint32)", []);

    return result[0].toBigInt();
  }

  try_priceIndex(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("priceIndex", "priceIndex():(uint32)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  prices(param0: string): BigInt {
    let result = super.call("prices", "prices(string):(uint32)", [
      ethereum.Value.fromString(param0)
    ]);

    return result[0].toBigInt();
  }

  try_prices(param0: string): ethereum.CallResult<BigInt> {
    let result = super.tryCall("prices", "prices(string):(uint32)", [
      ethereum.Value.fromString(param0)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  productDetailsCid(): string {
    let result = super.call(
      "productDetailsCid",
      "productDetailsCid():(string)",
      []
    );

    return result[0].toString();
  }

  try_productDetailsCid(): ethereum.CallResult<string> {
    let result = super.tryCall(
      "productDetailsCid",
      "productDetailsCid():(string)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  productIds(param0: BigInt): string {
    let result = super.call("productIds", "productIds(uint256):(string)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);

    return result[0].toString();
  }

  try_productIds(param0: BigInt): ethereum.CallResult<string> {
    let result = super.tryCall("productIds", "productIds(uint256):(string)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  productWeightage(param0: string): BigInt {
    let result = super.call(
      "productWeightage",
      "productWeightage(string):(uint32)",
      [ethereum.Value.fromString(param0)]
    );

    return result[0].toBigInt();
  }

  try_productWeightage(param0: string): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "productWeightage",
      "productWeightage(string):(uint32)",
      [ethereum.Value.fromString(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  submittedPrices(param0: string, param1: BigInt): BigInt {
    let result = super.call(
      "submittedPrices",
      "submittedPrices(string,uint256):(uint32)",
      [
        ethereum.Value.fromString(param0),
        ethereum.Value.fromUnsignedBigInt(param1)
      ]
    );

    return result[0].toBigInt();
  }

  try_submittedPrices(
    param0: string,
    param1: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "submittedPrices",
      "submittedPrices(string,uint256):(uint32)",
      [
        ethereum.Value.fromString(param0),
        ethereum.Value.fromUnsignedBigInt(param1)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  submittedUsers(param0: string, param1: BigInt, param2: BigInt): Address {
    let result = super.call(
      "submittedUsers",
      "submittedUsers(string,uint32,uint256):(address)",
      [
        ethereum.Value.fromString(param0),
        ethereum.Value.fromUnsignedBigInt(param1),
        ethereum.Value.fromUnsignedBigInt(param2)
      ]
    );

    return result[0].toAddress();
  }

  try_submittedUsers(
    param0: string,
    param1: BigInt,
    param2: BigInt
  ): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "submittedUsers",
      "submittedUsers(string,uint32,uint256):(address)",
      [
        ethereum.Value.fromString(param0),
        ethereum.Value.fromUnsignedBigInt(param1),
        ethereum.Value.fromUnsignedBigInt(param2)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  validSubmitters(param0: BigInt): Address {
    let result = super.call(
      "validSubmitters",
      "validSubmitters(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(param0)]
    );

    return result[0].toAddress();
  }

  try_validSubmitters(param0: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "validSubmitters",
      "validSubmitters(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get _currency(): string {
    return this._call.inputValues[0].value.toString();
  }

  get _startDate(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _productIds(): Array<string> {
    return this._call.inputValues[2].value.toStringArray();
  }

  get _weightage(): Array<BigInt> {
    return this._call.inputValues[3].value.toBigIntArray();
  }

  get _productDetailsCid(): string {
    return this._call.inputValues[4].value.toString();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class AddProductCall extends ethereum.Call {
  get inputs(): AddProductCall__Inputs {
    return new AddProductCall__Inputs(this);
  }

  get outputs(): AddProductCall__Outputs {
    return new AddProductCall__Outputs(this);
  }
}

export class AddProductCall__Inputs {
  _call: AddProductCall;

  constructor(call: AddProductCall) {
    this._call = call;
  }

  get _productId(): string {
    return this._call.inputValues[0].value.toString();
  }

  get _weightage(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _updatedProductDetailsCid(): string {
    return this._call.inputValues[2].value.toString();
  }
}

export class AddProductCall__Outputs {
  _call: AddProductCall;

  constructor(call: AddProductCall) {
    this._call = call;
  }
}

export class CalculateCall extends ethereum.Call {
  get inputs(): CalculateCall__Inputs {
    return new CalculateCall__Inputs(this);
  }

  get outputs(): CalculateCall__Outputs {
    return new CalculateCall__Outputs(this);
  }
}

export class CalculateCall__Inputs {
  _call: CalculateCall;

  constructor(call: CalculateCall) {
    this._call = call;
  }
}

export class CalculateCall__Outputs {
  _call: CalculateCall;

  constructor(call: CalculateCall) {
    this._call = call;
  }
}

export class SubmitPricesCall extends ethereum.Call {
  get inputs(): SubmitPricesCall__Inputs {
    return new SubmitPricesCall__Inputs(this);
  }

  get outputs(): SubmitPricesCall__Outputs {
    return new SubmitPricesCall__Outputs(this);
  }
}

export class SubmitPricesCall__Inputs {
  _call: SubmitPricesCall;

  constructor(call: SubmitPricesCall) {
    this._call = call;
  }

  get date(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _productIds(): Array<string> {
    return this._call.inputValues[1].value.toStringArray();
  }

  get _prices(): Array<BigInt> {
    return this._call.inputValues[2].value.toBigIntArray();
  }
}

export class SubmitPricesCall__Outputs {
  _call: SubmitPricesCall;

  constructor(call: SubmitPricesCall) {
    this._call = call;
  }
}

export class UpdateWeightageCall extends ethereum.Call {
  get inputs(): UpdateWeightageCall__Inputs {
    return new UpdateWeightageCall__Inputs(this);
  }

  get outputs(): UpdateWeightageCall__Outputs {
    return new UpdateWeightageCall__Outputs(this);
  }
}

export class UpdateWeightageCall__Inputs {
  _call: UpdateWeightageCall;

  constructor(call: UpdateWeightageCall) {
    this._call = call;
  }

  get _productIds(): Array<string> {
    return this._call.inputValues[0].value.toStringArray();
  }

  get _weightage(): Array<BigInt> {
    return this._call.inputValues[1].value.toBigIntArray();
  }
}

export class UpdateWeightageCall__Outputs {
  _call: UpdateWeightageCall;

  constructor(call: UpdateWeightageCall) {
    this._call = call;
  }
}
