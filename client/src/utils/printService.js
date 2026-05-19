function formatDateTime(date) {
  const d = date ? new Date(date) : new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function t(label) {
  const locale = typeof window !== 'undefined' ? (localStorage.getItem('locale') || 'fr') : 'fr';
  const dict = {
    'Client': { fr: 'Client', en: 'Customer' },
    'Statut': { fr: 'Statut', en: 'Status' },
    'Paiement': { fr: 'Paiement', en: 'Payment' },
    'Commande': { fr: 'Commande', en: 'Order' },
    'Table': { fr: 'Table', en: 'Table' },
    'Heure': { fr: 'Heure', en: 'Time' },
    'Total': { fr: 'Total', en: 'Total' },
    'Payé': { fr: 'Payé', en: 'Paid' },
    'En attente': { fr: 'En attente', en: 'Pending' },
    'Caissier': { fr: 'Caissier', en: 'Cashier' },
    'Payé le': { fr: 'Payé le', en: 'Paid on' },
    'Merci de votre visite ! À bientôt 😊': { fr: 'Merci de votre visite ! À bientôt 😊', en: 'Thank you for visiting! See you soon 😊' },
    '--- Ticket cuisine ---': { fr: '--- Ticket cuisine ---', en: '--- Kitchen ticket ---' },
    'Facture': { fr: 'Facture', en: 'Receipt' },
    'CUISINE': { fr: 'CUISINE', en: 'KITCHEN' },
    'Date': { fr: 'Date', en: 'Date' },
    'Facture Caissier': { fr: 'Facture Caissier', en: 'Cashier Invoice' },
    'FACTURE': { fr: 'FACTURE', en: 'INVOICE' },
    'PAYÉ': { fr: 'PAYÉ', en: 'PAID' },
    '--- Facture acquittée ---': { fr: '--- Facture acquittée ---', en: '--- Paid invoice ---' },
  };
  const entry = dict[label];
  if (!entry) return label;
  return entry[locale] || label;
}

function getPrintStyles(thermalWidth) {
  const w = thermalWidth === 58 ? '58mm' : '80mm';
  return `
    @page { margin: 0; size: ${w} auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #000;
      background: #fff;
      width: ${w};
      padding: 4mm 3mm;
    }
    .header { text-align: center; margin-bottom: 4px; }
    .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
    .header .sub { font-size: 11px; color: #555; }
    .divider { border-top: 1px dashed #333; margin: 4px 0; }
    .divider-solid { border-top: 1px solid #333; margin: 4px 0; }
    .row { display: flex; justify-content: space-between; font-size: 11px; margin: 1px 0; }
    .item-row { display: flex; gap: 4px; font-size: 11px; margin: 2px 0; }
    .item-qty { min-width: 24px; text-align: right; }
    .item-name { flex: 1; }
    .item-price { min-width: 50px; text-align: right; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin: 4px 0; }
    .paid-stamp {
      text-align: center; font-size: 18px; font-weight: bold; color: #fff;
      background: #22c55e; padding: 4px 12px; border-radius: 4px;
      display: inline-block; margin: 4px auto;
    }
    .stamp-container { text-align: center; margin: 4px 0; }
    .note { font-size: 10px; color: #c2410c; font-style: italic; margin: 2px 0; }
    .footer { text-align: center; font-size: 10px; color: #888; margin-top: 6px; }
    .qr { text-align: center; margin: 4px 0; font-size: 10px; color: #555; }
    .highlight { background: #fff3cd; padding: 0 2px; }
    @media print {
      body { background: #fff; }
      .no-print { display: none; }
    }
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildKitchenTicket(order, restaurantName) {
  const items = order.items || [];
  const time = formatDateTime(order.createdAt);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ticket Cuisine</title>
<style>${getPrintStyles(58)}</style></head><body>
<div class="header">
  <h1>🍽️ ${t('CUISINE')}</h1>
  <div class="sub">${escapeHtml(restaurantName || 'BarOrder')}</div>
</div>
<div class="divider"></div>
<div class="row"><span>${t('Commande')}</span><strong>${escapeHtml(order.orderNumber || '#')}</strong></div>
<div class="row"><span>${t('Table')}</span><strong>${escapeHtml(order.table || '')}</strong></div>
<div class="row"><span>${t('Heure')}</span>${time}</div>
<div class="divider"></div>
${items.map(i => `<div class="item-row">
  <span class="item-qty">x${i.qty || 1}</span>
  <span class="item-name">${escapeHtml(i.name)}</span>
</div>`).join('')}
${order.kitchenNote ? `<div class="divider"></div><div class="note">📝 ${escapeHtml(order.kitchenNote)}</div>` : ''}
${order.customerName ? `<div class="row" style="margin-top:4px"><span>${t('Client')}</span>${escapeHtml(order.customerName)}</div>` : ''}
<div class="divider-solid"></div>
<div class="footer">${t('--- Ticket cuisine ---')}</div>
</body></html>`;
}

function buildCustomerReceipt(order, restaurant, paymentDetails) {
  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const paidLabel = order.paymentStatus === 'paid' ? `✅ ${t('Payé')}` : `⏳ ${t('En attente')}`;
  const qrText = order.orderNumber || `#${order.id}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t('Facture')}</title>
<style>${getPrintStyles(80)}</style></head><body>
<div class="header">
  <h1>${escapeHtml(restaurant?.name || 'BarOrder')}</h1>
  <div class="sub">${restaurant?.address || ''}</div>
  ${restaurant?.phone ? `<div class="sub">📞 ${escapeHtml(restaurant.phone)}</div>` : ''}
</div>
<div class="divider-solid"></div>
<div class="row"><span>${t('Table')}</span><strong>${escapeHtml(order.table || '')}</strong></div>
<div class="row"><span>${t('Commande')}</span><strong>${escapeHtml(order.orderNumber || '#')}</strong></div>
<div class="row"><span>${t('Date')}</span>${formatDateTime(order.createdAt)}</div>
<div class="divider"></div>
${items.map(i => `<div class="item-row">
  <span class="item-qty">x${i.qty || 1}</span>
  <span class="item-name">${escapeHtml(i.name)}</span>
  <span class="item-price">${(i.price || 0).toLocaleString('fr-FR')}</span>
</div>`).join('')}
<div class="divider"></div>
<div class="total-row"><span>${t('Total')}</span><strong>${formatCurrency(order.totalRaw || subtotal)}</strong></div>
<div class="divider-solid"></div>
<div class="row"><span>${t('Paiement')}</span>${escapeHtml(order.payment || '')}</div>
<div class="row"><span>${t('Statut')}</span>${paidLabel}</div>
${paymentDetails?.cashier ? `<div class="row"><span>${t('Caissier')}</span>${escapeHtml(paymentDetails.cashier)}</div>` : ''}
${paymentDetails?.paidAt ? `<div class="row"><span>${t('Payé le')}</span>${formatDateTime(paymentDetails.paidAt)}</div>` : ''}
<div class="divider-solid"></div>
<div class="qr">🆔 ${qrText}</div>
<div class="footer">${t('Merci de votre visite ! À bientôt 😊')}</div>
</body></html>`;
}

function buildCashierInvoice(order, restaurant, cashierName) {
  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t('Facture Caissier')}</title>
<style>${getPrintStyles(80)}</style></head><body>
<div class="header">
  <h1>${escapeHtml(restaurant?.name || 'BarOrder')}</h1>
  <div class="sub">${t('FACTURE')}</div>
</div>
<div class="stamp-container"><span class="paid-stamp">${t('PAYÉ')}</span></div>
<div class="divider-solid"></div>
<div class="row"><span>${t('Table')}</span><strong>${escapeHtml(order.table || '')}</strong></div>
<div class="row"><span>${t('Commande')}</span><strong>${escapeHtml(order.orderNumber || '#')}</strong></div>
<div class="row"><span>${t('Date')}</span>${formatDateTime(order.createdAt)}</div>
<div class="divider"></div>
${items.map(i => `<div class="item-row">
  <span class="item-qty">x${i.qty || 1}</span>
  <span class="item-name">${escapeHtml(i.name)}</span>
  <span class="item-price">${(i.price || 0).toLocaleString('fr-FR')}</span>
</div>`).join('')}
<div class="divider"></div>
<div class="total-row"><span>${t('Total')}</span><strong>${formatCurrency(order.totalRaw || subtotal)}</strong></div>
<div class="divider-solid"></div>
<div class="row"><span>${t('Paiement')}</span>${escapeHtml(order.payment || '')}</div>
<div class="row"><span>${t('Caissier')}</span>${escapeHtml(cashierName || '—')}</div>
<div class="row"><span>${t('Payé le')}</span>${formatDateTime()}</div>
<div class="divider-solid"></div>
<div class="footer">${t('--- Facture acquittée ---')}</div>
</body></html>`;
}

function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '0 FCFA';
  const n = Math.round(Number(amount));
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

export function printKitchenTicket(order, restaurantName) {
  const html = buildKitchenTicket(order, restaurantName);
  openPrintWindow(html);
}

export function printCustomerReceipt(order, restaurant, paymentDetails) {
  const html = buildCustomerReceipt(order, restaurant, paymentDetails);
  openPrintWindow(html);
}

export function printCashierInvoice(order, restaurant, cashierName) {
  const html = buildCashierInvoice(order, restaurant, cashierName);
  openPrintWindow(html);
}

let printIframeId = 0;

function openPrintWindow(html) {
  const id = `print-frame-${++printIframeId}`;
  let iframe = document.getElementById(id);
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);
  }
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      const win = window.open('', '_blank', 'width=400,height=600,menubar=no,toolbar=no,location=no');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); setTimeout(() => win.close(), 1000); }, 300);
      }
    }
    setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 1000);
  }, 300);
}

export function downloadPDF(order, type, restaurant, cashierName) {
  const html = type === 'kitchen'
    ? buildKitchenTicket(order, restaurant?.name)
    : type === 'invoice'
    ? buildCashierInvoice(order, restaurant, cashierName)
    : buildCustomerReceipt(order, restaurant);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}_${order.orderNumber || order.id || 'order'}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
