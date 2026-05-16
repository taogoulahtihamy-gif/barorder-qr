## Goal
- Build the full real QR restaurant experience layer with QR workflow, customer cart, premium checkout, kitchen workflow, realtime order tracking, multi-restaurant SaaS architecture, dashboard/stats synchronization, and backend SQL type safety.

## Constraints & Preferences
- Do not rewrite the project
- Do not break existing CRUD/admin functionality or QR ordering workflow
- Keep current dark premium design
- Preserve existing architecture; add multi-restaurant support without removing single-restaurant workflow
- Fix backend SQL typing conflicts without touching frontend layout
- Every SQL query must fall back safely when `restaurant_id` is missing

## Progress
### Done
- DB schema: added `customer_name`, `customer_phone`, `kitchen_note` to `orders`; `slug` to `restaurants`; `restaurant_id` FK to `users` — all with `ALTER TABLE ADD COLUMN IF NOT EXISTS`
- Server `publicController.createOrder` accepts `customerName`, `customerPhone`, `kitchenNote`; supports Orange Money (creates payment record like Wave)
- Table QR URLs changed from `/table/:id` to `/r/:slug/menu/:id` (slug-based); `tableController` generates correct QR pointing to `/r/:slug/menu/:tableId`
- Slide cart drawer (`CartDrawer.jsx`): right-side overlay with quantity controls, total, and checkout button; integrated into `MenuPage` bottom bar
- CheckoutPage: required customer name/phone fields, kitchen note textarea, Orange Money payment option alongside Wave/Cash
- OrderPage: elapsed time live counter, customer name/phone display, French status steps (`new`→`paid`)
- OrdersPage: elapsed time per card, customer info, kitchen notes, print ticket button (opens formatted receipt window)
- Translations added for all new French labels (customer info, checkout, order tracking, print)
- `orderService.mapOrder` and `adminService.mapOrder` include `customerName`, `customerPhone`, `kitchenNote`, `restaurantSlug`
- Multi-restaurant SaaS migration:
  - `restaurants` table gets `slug` column; `users` gets `restaurant_id` FK
  - JWT includes `restaurant_id`; `/me` returns restaurant branding (slug, logo, color, currency)
  - All admin controllers filter by `req.user.restaurant_id` using `getRestaurantId(req)` helper with `DEFAULT_RESTAURANT_ID = 1` fallback
  - All admin SQL queries use `(restaurant_id = $1 OR restaurant_id IS NULL)` backward-compatible pattern
  - Public routes: `GET /api/public/restaurants`, `GET /api/public/r/:slug/menu`, `GET /api/public/r/:slug/menu/:tableId`
  - Client router: `/r/:slug/menu/:tableId`, `/r/:slug/order/:orderNumber` routes added alongside old routes
  - ClientLayout applies dynamic restaurant branding (logo, name, primary_color)
  - All customer pages (Menu, Checkout, Order, TablePage) navigate using slug when available
  - SettingsPage fetches/saves from API (not localStorage); includes `slug` field
  - Seed script creates default restaurant with `slug = 'barorder'` and links admin user via `restaurant_id`
- Dashboard real data sync:
  - `dashboardController` counts revenue from `payment_status = 'paid'` only (not just non-cancelled)
  - Returns `revenueFormatted`, `avgOrderFormatted` in FCFA format
  - Recent orders include actual product names from `order_items`
  - Top products include `revenueFormatted`
- Stats real data sync:
  - Orange Money in payment method split (alongside Wave, Cash)
  - All amounts formatted with `toLocaleString('fr-FR')` FCFA
- Payments real data sync:
  - `paymentController` joins payments with orders and tables filtered by restaurant_id
  - Frontend `getPayments` maps backend fields (`order_number`→`order`, `table_number`→`table`, `transaction_reference`→`ref`, `created_at`→`date`)
- Real-time refresh: Dashboard, Payments, Stats pages use socket listeners (`onNewOrder`, `onOrderStatusUpdated`) + 10s polling
- When order marked `paid`, `orderController` auto-updates `payment_status` and `payments.status`
- Frontend error handling: added `.catch()` on all fetches, `console.error` logs, null/array safety, loading state prevents blank black screens
- All admin controllers add `console.error` on failing queries
- **PostgreSQL type inference fix (completed round)**:
  - `updateOrderStatus`: separated `$1` (used twice for different types) into `$1::text` + `$2::text` + `$3` (int)
  - All `req.params.id` now cast with `Number()` before passing to SQL
  - All `getRestaurantId(req)` results cast with `Number()` before passing
  - All COALESCE/SET params use explicit `::text`, `::int`, `::boolean` type casts
  - Detailed error JSON returned with `{ error, query, params }` on failure
  - Console logs added before each SQL execution showing params
  - All 11 controllers audited and fixed where needed

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Use `getRestaurantId(req)` helper instead of raw `req.user.restaurant_id` to safely fallback to `DEFAULT_RESTAURANT_ID = 1` for old JWT tokens
- Use `(col = $1 OR col IS NULL)` SQL pattern to match both restaurant-tagged and legacy (NULL) data
- QR URLs point to `/r/:slug/menu/:tableId` instead of old `/menu/1/:tableId` to support multi-tenant branding
- Always cast route params (`Number(req.params.id)`) and separate SQL parameter indices per unique usage to avoid PostgreSQL `inconsistent types` errors
- Always use explicit `::text`, `::int`, `::boolean` casts on COALESCE/SET params so PostgreSQL can infer types
- Always wrap `console.log` before SQL execution and detailed `console.error` + JSON `{ error, query, params }` on failure
- Keep both `/r/:slug/*` and old `/menu/:restaurantId/*` routes working simultaneously for backward compatibility
- Use 10s polling + socket events for dashboard/stats/payments auto-refresh

## Next Steps
1. Run schema migration on production DB (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for `slug`, `restaurant_id`, `customer_name`, `customer_phone`, `kitchen_note`)
2. Re-run seed script or manually update existing users to link to restaurant_id
3. Generate/set slugs for existing restaurants
4. Verify all admin order actions work end-to-end (Accepter, Préparation, Prête, Servie, Payée, Annulée)
5. Test QR scan flow from `/r/:slug/menu/:tableId` through menu, cart, checkout, order tracking
6. Monitor socket events for real-time dashboard/stats updates after order changes

## Critical Context
- PostgreSQL error `inconsistent types deduced for parameter $1` — caused by reusing `$1` for both `order_status = $1` (VARCHAR) and `$1 = 'paid'` (TEXT literal) in the same UPDATE query. Fix: separate param indices + explicit `::text` casts.
- All 11 controllers: each of `getRestaurantId(req)` and `req.params.id` must be wrapped in `Number()`. Every SQL parameter in COALESCE/SET must have `::type` cast.
- JWT tokens issued before multi-tenant migration lack `restaurant_id` — `getRestaurantId(req)` returns `DEFAULT_RESTAURANT_ID = 1` fallback
- Legacy rows with `restaurant_id IS NULL` matched by `OR restaurant_id IS NULL`
- Valid order statuses: `new`, `accepted`, `preparing`, `ready`, `served`, `paid`, `cancelled`
- Cart is managed via AppContext (`addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`); persisted in localStorage
- Socket.io events: `new_order`, `order_status_updated`, `server_called`, `server_call_updated`
- Express JSON/urlencoded limit set to 10mb

## Relevant Files
- `server/src/controllers/orderController.js`: `updateOrderStatus` — separated `$1` into `$1::$2::$3`, `Number()` casts, `::text`, detailed error JSON
- `server/src/controllers/productController.js`: all CRUD ops — `Number()` on params, `::text`/`::int`/`::boolean` casts, detailed errors
- `server/src/controllers/categoryController.js`: all CRUD ops — `Number()` on params, `::text`/`::int`/`::boolean` casts, detailed errors
- `server/src/controllers/tableController.js`: `createTable`/`deleteTable` — `Number()` on params, `::int`/`::text` casts
- `server/src/controllers/serverCallController.js`: `updateServerCallStatus` — `Number()` on id, `::text` cast
- `server/src/controllers/settingsController.js`: `updateSettings` — `Number()` on rid, `::text` casts on all COALESCE
- `server/src/controllers/dashboardController.js`, `paymentController.js`, `statsController.js`: `Number()` on rid, console logs
- `server/src/controllers/publicController.js`: `getMenuBySlug`, `createOrder` — `Number()` on params
- `server/src/utils/restaurantId.js`: `getRestaurantId(req)` + `DEFAULT_RESTAURANT_ID = 1`
- `server/database/schema.sql`: `slug` on restaurants, `restaurant_id` on users, `customer_name`/`customer_phone`/`kitchen_note` on orders
- `server/database/seed.js`: slug='barorder', user linked via restaurant_id
- `client/src/pages/admin/OrdersPage.jsx`: elapsed time, customer info, kitchen notes, print button, socket refresh
- `client/src/pages/admin/DashboardPage.jsx`: socket listeners + 10s polling, null/array safety, console.error
- `client/src/pages/admin/PaymentsPage.jsx`: Orange Money filter, mapped fields, socket refresh
- `client/src/pages/admin/StatsPage.jsx`: Orange Money bar, dynamic days, socket refresh
- `client/src/pages/admin/ProductsPage.jsx`: `.catch()` to prevent blank loading screen
- `client/src/pages/client/MenuPage.jsx`: slug param, `getMenuBySlug`, CartDrawer integration
- `client/src/pages/client/CheckoutPage.jsx`: customer name/phone, kitchen note, Orange Money, slug-based URL
- `client/src/pages/client/OrderPage.jsx`: slug param, elapsed time, customer info
- `client/src/pages/client/TablePage.jsx`: fetches restaurant info via API, navigates with slug
- `client/src/pages/admin/TablesPage.jsx`: QR URL uses `/r/:slug/menu/:id`
- `client/src/pages/admin/SettingsPage.jsx`: API fetch/save, slug field, logo upload
- `client/src/context/AppContext.jsx`: `restaurant`, `restaurantSlug` state + localStorage
- `client/src/layouts/ClientLayout.jsx`: dynamic logo, brand color, restaurant name
- `client/src/services/adminService.js`: getDashboard/getPayments/getStats mapped, getSettings/updateSettings
- `client/src/services/orderService.js`: `mapOrder` includes customerName/customerPhone/kitchenNote/restaurantSlug
- `client/src/services/menuService.js`: `getMenuBySlug(slug)`
- `client/src/router/index.jsx`: `/r/:slug/menu/:tableId` and `/r/:slug/order/:orderNumber` routes
- `client/src/utils/translations.js`: all new French labels