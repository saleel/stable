import format from 'date-fns/format';

export function contractDateToJsDate(integerDate) {
  const stringDate = integerDate.toString();
  return new Date(`${stringDate.slice(0, 4)}-${stringDate.slice(4, 6)}-${stringDate.slice(6, 8)}`);
}

export function formatContractDate(integerDate) {
  if (Number.isNaN(integerDate)) {
    return '';
  }

  const jsDate = contractDateToJsDate(integerDate);

  return format(jsDate, "MMM dd");
}
