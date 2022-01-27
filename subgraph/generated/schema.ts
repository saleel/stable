// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class Product extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("createdAt", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Product entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Product entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Product", id.toString(), this);
    }
  }

  static load(id: string): Product | null {
    return changetype<Product | null>(store.get("Product", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get name(): string | null {
    let value = this.get("name");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set name(value: string | null) {
    if (!value) {
      this.unset("name");
    } else {
      this.set("name", Value.fromString(<string>value));
    }
  }

  get description(): string | null {
    let value = this.get("description");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set description(value: string | null) {
    if (!value) {
      this.unset("description");
    } else {
      this.set("description", Value.fromString(<string>value));
    }
  }

  get category(): string | null {
    let value = this.get("category");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set category(value: string | null) {
    if (!value) {
      this.unset("category");
    } else {
      this.set("category", Value.fromString(<string>value));
    }
  }

  get latestPrice(): Array<string> {
    let value = this.get("latestPrice");
    return value!.toStringArray();
  }

  set latestPrice(value: Array<string>) {
    this.set("latestPrice", Value.fromStringArray(value));
  }

  get priceHistory(): Array<string> {
    let value = this.get("priceHistory");
    return value!.toStringArray();
  }

  set priceHistory(value: Array<string>) {
    this.set("priceHistory", Value.fromStringArray(value));
  }

  get createdAt(): BigInt {
    let value = this.get("createdAt");
    return value!.toBigInt();
  }

  set createdAt(value: BigInt) {
    this.set("createdAt", Value.fromBigInt(value));
  }
}

export class PriceSubmission extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("stable", Value.fromString(""));
    this.set("country", Value.fromString(""));
    this.set("currency", Value.fromString(""));
    this.set("price", Value.fromI32(0));
    this.set("product", Value.fromString(""));
    this.set("source", Value.fromString(""));
    this.set("createdBy", Value.fromString(""));
    this.set("createdAt", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save PriceSubmission entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save PriceSubmission entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("PriceSubmission", id.toString(), this);
    }
  }

  static load(id: string): PriceSubmission | null {
    return changetype<PriceSubmission | null>(store.get("PriceSubmission", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get stable(): string {
    let value = this.get("stable");
    return value!.toString();
  }

  set stable(value: string) {
    this.set("stable", Value.fromString(value));
  }

  get country(): string {
    let value = this.get("country");
    return value!.toString();
  }

  set country(value: string) {
    this.set("country", Value.fromString(value));
  }

  get currency(): string {
    let value = this.get("currency");
    return value!.toString();
  }

  set currency(value: string) {
    this.set("currency", Value.fromString(value));
  }

  get price(): i32 {
    let value = this.get("price");
    return value!.toI32();
  }

  set price(value: i32) {
    this.set("price", Value.fromI32(value));
  }

  get product(): string {
    let value = this.get("product");
    return value!.toString();
  }

  set product(value: string) {
    this.set("product", Value.fromString(value));
  }

  get source(): string {
    let value = this.get("source");
    return value!.toString();
  }

  set source(value: string) {
    this.set("source", Value.fromString(value));
  }

  get createdBy(): string {
    let value = this.get("createdBy");
    return value!.toString();
  }

  set createdBy(value: string) {
    this.set("createdBy", Value.fromString(value));
  }

  get createdAt(): BigInt {
    let value = this.get("createdAt");
    return value!.toBigInt();
  }

  set createdAt(value: BigInt) {
    this.set("createdAt", Value.fromBigInt(value));
  }
}

export class Price extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("stable", Value.fromString(""));
    this.set("country", Value.fromString(""));
    this.set("currency", Value.fromString(""));
    this.set("product", Value.fromString(""));
    this.set("value", Value.fromI32(0));
    this.set("confirmations", Value.fromI32(0));
    this.set("date", Value.fromString(""));
    this.set("createdBy", Value.fromBigInt(BigInt.zero()));
    this.set("createdAt", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Price entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Price entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Price", id.toString(), this);
    }
  }

  static load(id: string): Price | null {
    return changetype<Price | null>(store.get("Price", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get stable(): string {
    let value = this.get("stable");
    return value!.toString();
  }

  set stable(value: string) {
    this.set("stable", Value.fromString(value));
  }

  get country(): string {
    let value = this.get("country");
    return value!.toString();
  }

  set country(value: string) {
    this.set("country", Value.fromString(value));
  }

  get currency(): string {
    let value = this.get("currency");
    return value!.toString();
  }

  set currency(value: string) {
    this.set("currency", Value.fromString(value));
  }

  get product(): string {
    let value = this.get("product");
    return value!.toString();
  }

  set product(value: string) {
    this.set("product", Value.fromString(value));
  }

  get value(): i32 {
    let value = this.get("value");
    return value!.toI32();
  }

  set value(value: i32) {
    this.set("value", Value.fromI32(value));
  }

  get confirmations(): i32 {
    let value = this.get("confirmations");
    return value!.toI32();
  }

  set confirmations(value: i32) {
    this.set("confirmations", Value.fromI32(value));
  }

  get date(): string {
    let value = this.get("date");
    return value!.toString();
  }

  set date(value: string) {
    this.set("date", Value.fromString(value));
  }

  get createdBy(): BigInt {
    let value = this.get("createdBy");
    return value!.toBigInt();
  }

  set createdBy(value: BigInt) {
    this.set("createdBy", Value.fromBigInt(value));
  }

  get createdAt(): BigInt {
    let value = this.get("createdAt");
    return value!.toBigInt();
  }

  set createdAt(value: BigInt) {
    this.set("createdAt", Value.fromBigInt(value));
  }
}

export class LatestPrice extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("country", Value.fromString(""));
    this.set("currency", Value.fromString(""));
    this.set("product", Value.fromString(""));
    this.set("price", Value.fromString(""));
    this.set("updatedAt", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save LatestPrice entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save LatestPrice entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("LatestPrice", id.toString(), this);
    }
  }

  static load(id: string): LatestPrice | null {
    return changetype<LatestPrice | null>(store.get("LatestPrice", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get country(): string {
    let value = this.get("country");
    return value!.toString();
  }

  set country(value: string) {
    this.set("country", Value.fromString(value));
  }

  get currency(): string {
    let value = this.get("currency");
    return value!.toString();
  }

  set currency(value: string) {
    this.set("currency", Value.fromString(value));
  }

  get product(): string {
    let value = this.get("product");
    return value!.toString();
  }

  set product(value: string) {
    this.set("product", Value.fromString(value));
  }

  get price(): string {
    let value = this.get("price");
    return value!.toString();
  }

  set price(value: string) {
    this.set("price", Value.fromString(value));
  }

  get updatedAt(): BigInt {
    let value = this.get("updatedAt");
    return value!.toBigInt();
  }

  set updatedAt(value: BigInt) {
    this.set("updatedAt", Value.fromBigInt(value));
  }
}

export class PriceIndex extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("stable", Value.fromString(""));
    this.set("country", Value.fromString(""));
    this.set("currency", Value.fromString(""));
    this.set("value", Value.fromI32(0));
    this.set("date", Value.fromString(""));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save PriceIndex entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save PriceIndex entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("PriceIndex", id.toString(), this);
    }
  }

  static load(id: string): PriceIndex | null {
    return changetype<PriceIndex | null>(store.get("PriceIndex", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get stable(): string {
    let value = this.get("stable");
    return value!.toString();
  }

  set stable(value: string) {
    this.set("stable", Value.fromString(value));
  }

  get country(): string {
    let value = this.get("country");
    return value!.toString();
  }

  set country(value: string) {
    this.set("country", Value.fromString(value));
  }

  get currency(): string {
    let value = this.get("currency");
    return value!.toString();
  }

  set currency(value: string) {
    this.set("currency", Value.fromString(value));
  }

  get value(): i32 {
    let value = this.get("value");
    return value!.toI32();
  }

  set value(value: i32) {
    this.set("value", Value.fromI32(value));
  }

  get date(): string {
    let value = this.get("date");
    return value!.toString();
  }

  set date(value: string) {
    this.set("date", Value.fromString(value));
  }
}

export class ProductBasketItem extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("stable", Value.fromString(""));
    this.set("productId", Value.fromString(""));
    this.set("weightage", Value.fromI32(0));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save ProductBasketItem entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save ProductBasketItem entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("ProductBasketItem", id.toString(), this);
    }
  }

  static load(id: string): ProductBasketItem | null {
    return changetype<ProductBasketItem | null>(
      store.get("ProductBasketItem", id)
    );
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get stable(): string {
    let value = this.get("stable");
    return value!.toString();
  }

  set stable(value: string) {
    this.set("stable", Value.fromString(value));
  }

  get productId(): string {
    let value = this.get("productId");
    return value!.toString();
  }

  set productId(value: string) {
    this.set("productId", Value.fromString(value));
  }

  get weightage(): i32 {
    let value = this.get("weightage");
    return value!.toI32();
  }

  set weightage(value: i32) {
    this.set("weightage", Value.fromI32(value));
  }
}

export class Stable extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("country", Value.fromString(""));
    this.set("currency", Value.fromString(""));
    this.set("address", Value.fromString(""));
    this.set("createdAt", Value.fromBigInt(BigInt.zero()));
    this.set("updatedAt", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Stable entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Stable entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Stable", id.toString(), this);
    }
  }

  static load(id: string): Stable | null {
    return changetype<Stable | null>(store.get("Stable", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get country(): string {
    let value = this.get("country");
    return value!.toString();
  }

  set country(value: string) {
    this.set("country", Value.fromString(value));
  }

  get currency(): string {
    let value = this.get("currency");
    return value!.toString();
  }

  set currency(value: string) {
    this.set("currency", Value.fromString(value));
  }

  get address(): string {
    let value = this.get("address");
    return value!.toString();
  }

  set address(value: string) {
    this.set("address", Value.fromString(value));
  }

  get latestPriceIndex(): string {
    let value = this.get("latestPriceIndex");
    return value!.toString();
  }

  set latestPriceIndex(value: string) {
    this.set("latestPriceIndex", Value.fromString(value));
  }

  get productBasket(): Array<string> {
    let value = this.get("productBasket");
    return value!.toStringArray();
  }

  set productBasket(value: Array<string>) {
    this.set("productBasket", Value.fromStringArray(value));
  }

  get createdAt(): BigInt {
    let value = this.get("createdAt");
    return value!.toBigInt();
  }

  set createdAt(value: BigInt) {
    this.set("createdAt", Value.fromBigInt(value));
  }

  get updatedAt(): BigInt {
    let value = this.get("updatedAt");
    return value!.toBigInt();
  }

  set updatedAt(value: BigInt) {
    this.set("updatedAt", Value.fromBigInt(value));
  }
}
