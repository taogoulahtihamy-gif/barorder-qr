export function formatPrice(price) {
  const rounded = Math.round(price);
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
}

export const formatCurrency = formatPrice;

export function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}
