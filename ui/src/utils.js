import format from 'date-fns/format';
import { utils } from 'ethers';

export function contractDateToJsDate(integerDate) {
  const stringDate = integerDate.toString();
  return new Date(`${stringDate.slice(0, 4)}-${stringDate.slice(4, 6)}-${stringDate.slice(6, 8)}`);
}

export function formatContractDate(integerDate) {
  return format(new Date(integerDate * 1000), 'MMM dd');
}

export function sortByContractDate(array) {
  return array.sort((a, b) => b.createdAt - a.createdAt);
}

export function formatContractDateWithYear(integerDate) {
  return format(new Date(integerDate * 1000), 'MMM dd, yyyy');
}

export function calculatePriceChange(oldPrice, newPrice) {
  if (newPrice?.value && oldPrice?.value) {
    return (((newPrice.value / oldPrice.value) - 1) * 100).toFixed(1);
  }

  return 0;
}

export function formatPrice(priceValue) {
  return +Number(priceValue / 100).toFixed(2);
}

export function formatToken(bigNumber) {
  return Number(utils.formatEther(bigNumber.toString()));
}

export function trimAddress(address) {
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}
