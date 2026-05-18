import { X, Printer, Download, ChefHat, Receipt, FileText } from 'lucide-react';
import Badge from './Badge';
import OrderTimeline from './OrderTimeline';
import { printKitchenTicket, printCustomerReceipt, printCashierInvoice, downloadPDF } from '../utils/printService';
import { formatPrice } from '../utils/formatters';

const badgeVariant = {
  new: 'pending', pending: 'pending', accepted: 'accepted',
  preparing: 'preparing', ready: 'ready', served: 'served',
  paid: 'paid', cancelled: 'cancelled',
};

export default function OrderDetailsModal({ order, restaurant, userRole, cashierName, onClose }) {
  if (!order) return null;
  const isPaid = order.paymentStatus === 'paid' || order.status === 'paid';

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-zinc-900 border-b border-white/10 px-5 py-4 flex items-center justify-between">
            <h2 className="font-bold text-white text-lg">
              {order.orderNumber || `#${order.id}`}
            </h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={badgeVariant[order.status] || 'pending'}>{order.status}</Badge>
              <Badge variant={isPaid ? 'delivered' : 'pending'}>{order.payment}</Badge>
              <span className="text-xs text-white/40">Table {order.table}</span>
            </div>

            <OrderTimeline status={order.status} />

            {(order.customerName || order.customerPhone) && (
              <div className="bg-white/5 rounded-xl p-3 space-y-1">
                {order.customerName && <p className="text-sm text-white/70">👤 {order.customerName}</p>}
                {order.customerPhone && <p className="text-sm text-white/70">📞 {order.customerPhone}</p>}
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-white mb-2">Articles</h3>
              <div className="space-y-1.5">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-white/80">
                      <span className="text-white/40 mr-1">x{item.qty || 1}</span>
                      {item.name}
                    </span>
                    <span className="text-white font-medium">{formatPrice((item.price || 0) * (item.qty || 1))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 flex items-center justify-between">
              <span className="text-white font-medium">Total</span>
              <span className="text-lg font-bold text-gold-500">{order.total}</span>
            </div>

            {order.kitchenNote && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <p className="text-xs text-yellow-400/80">🍳 Note cuisine: {order.kitchenNote}</p>
              </div>
            )}

            {order.note && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-white/60">📝 Note client: {order.note}</p>
              </div>
            )}

            <div className="border-t border-white/10 pt-3">
              <p className="text-xs text-white/40 mb-1">Paiement: {order.payment}</p>
              <p className="text-xs text-white/40">Statut: {order.paymentStatus === 'paid' ? 'Payé' : order.paymentStatus === 'pending' ? 'En attente' : order.paymentStatus}</p>
            </div>
          </div>

          <div className="sticky bottom-0 bg-zinc-900 border-t border-white/10 px-5 py-3 flex flex-wrap gap-2">
            <button
              onClick={() => printKitchenTicket(order, restaurant?.name)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-white/80 hover:bg-zinc-700 text-xs font-medium transition-colors"
            >
              <ChefHat size={14} /> Ticket cuisine
            </button>
            <button
              onClick={() => printCustomerReceipt(order, restaurant)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-white/80 hover:bg-zinc-700 text-xs font-medium transition-colors"
            >
              <Receipt size={14} /> Facture client
            </button>
            {isPaid && (
              <button
                onClick={() => printCashierInvoice(order, restaurant, cashierName)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-white/80 hover:bg-zinc-700 text-xs font-medium transition-colors"
              >
                <FileText size={14} /> Facture acquittée
              </button>
            )}
            <button
              onClick={() => downloadPDF(order, 'receipt', restaurant)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-white/80 hover:bg-zinc-700 text-xs font-medium transition-colors"
            >
              <Download size={14} /> PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

OrderDetailsModal.defaultProps = {
  restaurant: {},
  userRole: '',
  cashierName: '',
};
