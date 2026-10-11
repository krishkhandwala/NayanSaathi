import { DenominationValue } from '../types/currency';

export interface DenominationMetadata {
  value: DenominationValue;
  symbol: string;
  name: string;
  colorName: string;
  approxDimensionsMm: [number, number]; // width, height
  releaseYear: number;
}

export const DENOMINATION_DETAILS: Record<DenominationValue, DenominationMetadata> = {
  10: {
    value: 10,
    symbol: '₹10',
    name: 'Ten Rupees',
    colorName: 'Chocolate Brown',
    approxDimensionsMm: [123, 63],
    releaseYear: 2018,
  },
  20: {
    value: 20,
    symbol: '₹20',
    name: 'Twenty Rupees',
    colorName: 'Greenish Yellow',
    approxDimensionsMm: [129, 63],
    releaseYear: 2019,
  },
  50: {
    value: 50,
    symbol: '₹50',
    name: 'Fifty Rupees',
    colorName: 'Fluorescent Blue',
    approxDimensionsMm: [135, 66],
    releaseYear: 2017,
  },
  100: {
    value: 100,
    symbol: '₹100',
    name: 'One Hundred Rupees',
    colorName: 'Lavender',
    approxDimensionsMm: [142, 66],
    releaseYear: 2018,
  },
  200: {
    value: 200,
    symbol: '₹200',
    name: 'Two Hundred Rupees',
    colorName: 'Bright Yellow',
    approxDimensionsMm: [146, 66],
    releaseYear: 2017,
  },
  500: {
    value: 500,
    symbol: '₹500',
    name: 'Five Hundred Rupees',
    colorName: 'Stone Grey',
    approxDimensionsMm: [150, 66],
    releaseYear: 2016,
  },
  2000: {
    value: 2000,
    symbol: '₹2000',
    name: 'Two Thousand Rupees',
    colorName: 'Magenta',
    approxDimensionsMm: [166, 66],
    releaseYear: 2016,
  },
};
