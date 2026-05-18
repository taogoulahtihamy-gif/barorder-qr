export function formatPrice(price) {
  if (price == null || Number.isNaN(Number(price))) return '— FCFA';
  const rounded = Math.round(Number(price));
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
}

export const formatCurrency = formatPrice;

export function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}
