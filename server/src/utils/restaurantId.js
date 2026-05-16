export const DEFAULT_RESTAURANT_ID = 1;

export function getRestaurantId(req) {
  return (req.user && req.user.restaurant_id) || DEFAULT_RESTAURANT_ID;
}

export function safeRestaurantClause(alias = '') {
  const col = alias ? `${alias}.restaurant_id` : 'restaurant_id';
  return `${col} = $1`;
}
