export function printKitchenTicket(order, restaurantName) {
  const items = order.items || [];
  const date = new Date();
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const lines = [
    `${'='.repeat(32)}`,
    `  ${restaurantName || 'BarOrder'}  `,
    `  TICKET CUISINE  `,
    `${'='.repeat(32)}`,
    ``,
    `Commande: ${order.orderNumber || '#'}`,
    `Table:    ${order.table || ''}`,
    `Heure:    ${time}`,
    `${'-'.repeat(32)}`,
    ...items.map(i => {
      const name = i.name || '';
      const qty = i.qty || 1;
      return `  x${qty}  ${name}`;
    }),
    ...(order.kitchenNote ? [
      `${'-'.repeat(32)}`,
      `  NOTE: ${order.kitchenNote}`,
    ] : []),
    ...(order.customerName ? [
      `  Client: ${order.customerName}`,
    ] : []),
    `${'='.repeat(32)}`,
    `  --- Ticket cuisine ---`,
    ``,
  ];

  const text = lines.join('\n');
  const html = buildPrintHtml(text, '58mm');
  openPrintWindow(html);
}

export function printReceipt(order, restaurantName, cashierName) {
  const items = order.items || [];
  const date = new Date();
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const total = order.totalRaw || items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const paid = order.paymentStatus === 'paid';

  const lines = [
    `${'='.repeat(40)}`,
    `  ${restaurantName || 'BarOrder'}  `,
    `  FACTURE ${paid ? '- PAYÉE' : ''}  `,
    `${'='.repeat(40)}`,
    ``,
    `Commande: ${order.orderNumber || '#'}`,
    `Table:    ${order.table || ''}`,
    `Date:     ${date.toLocaleDateString('fr-FR')} ${time}`,
    `${'-'.repeat(40)}`,
    ...items.map(i => {
      const name = i.name || '';
      const qty = i.qty || 1;
      const price = (i.price || 0).toLocaleString('fr-FR');
      return `  x${qty}  ${name.padEnd(20)} ${price.padStart(8)}`;
    }),
    `${'-'.repeat(40)}`,
    `  TOTAL:        ${total.toLocaleString('fr-FR')} FCFA`,
    `  Paiement:     ${order.payment || ''}`,
    ...(paid ? [`  Statut:       PAYÉ`, `  Caissier:     ${cashierName || '—'}`] : []),
    `${'='.repeat(40)}`,
    `  Merci de votre visite !`,
    ``,
  ];

  const text = lines.join('\n');
  const html = buildPrintHtml(text, '80mm');
  openPrintWindow(html);
}

function buildPrintHtml(text, width) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Impression</title>
<style>
  @page { margin: 0; size: ${width} auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: 12px;
    white-space: pre;
    width: ${width};
    padding: 4mm 3mm;
    background: #fff;
    color: #000;
  }
  @media print {
    body { background: #fff; }
  }
</style></head><body>${escapeHtml(text)}</body></html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function openPrintWindow(html) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    setTimeout(() => win.close(), 500);
  }, 300);
}
