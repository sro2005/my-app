export const formatCop = amount => {
  const parsedAmount = Number(amount);
  const value = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const fractionDigits = Number.isInteger(value) ? 0 : 2;

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2
  }).format(value);
};
