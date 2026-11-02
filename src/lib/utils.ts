export const currency = (value: number) =>
  `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const categories = [
  'Smartphones',
  'Laptops',
  'Audio',
  'Smartwatches',
  'Cameras',
  'Gaming',
  'Accessories',
  'Tablets',
];
