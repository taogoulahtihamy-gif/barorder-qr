let soundEnabled = false;
let audioContext = null;
let lastPlayed = 0;
const DEBOUNCE_MS = 2000;

try {
  const stored = localStorage.getItem('soundEnabled');
  if (stored === 'true') soundEnabled = true;
} catch {}

function getContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function requestSoundPermission() {
  soundEnabled = true;
  localStorage.setItem('soundEnabled', 'true');
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function enableSound() {
  soundEnabled = true;
  localStorage.setItem('soundEnabled', 'true');
}

export function playNotificationSound() {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 880;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.27);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.27);
    }, 120);
  } catch {}
}

export function playServerCallSound() {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 523;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 659;
      osc2.type = 'triangle';
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.5);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
      osc2.start(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.9);
    }, 400);
  } catch {}
}

export function sendBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch {}
  }
}

export function playNewOrderSound() {
  const now = Date.now();
  if (now - lastPlayed < DEBOUNCE_MS) return;
  lastPlayed = now;
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 880;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc2.start(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.35);
    }, 150);
  } catch {}
}

export function vibrateIfSupported() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  } catch {}
}

export function playAlertSound() {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

export async function requestNotificationPermission(label) {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    showToast(`🔕 ${label || ''} — Notifications bloquées. Modifiez les paramètres du navigateur.`, 'error');
    return false;
  }
  const result = await Notification.requestPermission();
  if (result === 'granted') return true;
  showToast(`🔕 ${label || ''} — Permission refusée.`, 'error');
  return false;
}

export function notifyCustomerOrderStatus(order, t) {
  const { orderNumber, status } = order;
  const messages = {
    accepted: t('order.accepted', 'Votre commande a été acceptée'),
    preparing: t('order.preparing', 'Votre commande est en préparation'),
    ready: t('order.ready', 'Votre commande est prête'),
    served: t('order.served', 'Votre commande a été servie'),
    paid: t('order.paid', 'Paiement confirmé'),
    cancelled: t('order.cancelled', 'Votre commande a été annulée'),
  };
  const message = messages[status];
  if (!message) return;
  sendBrowserNotification(`#${orderNumber}`, message);
  playNotificationSound();
  vibrateDevice();
  showToast(`#${orderNumber} — ${message}`, status === 'cancelled' ? 'error' : 'success');
}

export function showToast(message, type = 'success') {
  import('react-hot-toast').then(({ default: toast }) => {
    const opts = { duration: type === 'error' ? 4000 : 3000 };
    if (type === 'error') toast.error(message, opts);
    else if (type === 'info') toast(message, { icon: 'ℹ️' });
    else toast.success(message, opts);
  }).catch(() => {});
}

export function vibrateDevice(pattern) {
  try {
    if (!navigator.vibrate) return;
    if (pattern === undefined) {
      vibrateIfSupported();
      return;
    }
    navigator.vibrate(pattern);
  } catch {}
}

export function notifyAdminNewOrder(order) {
  const { order_number, tableNumber, customerName, totalAmount } = order;
  const title = `Nouvelle commande #${order_number}`;
  const body = `Table ${tableNumber}${customerName ? ` — ${customerName}` : ''}${totalAmount ? ` — ${totalAmount}` : ''}`;
  playNewOrderSound();
  sendBrowserNotification(title, body);
}

export function notifyKitchenOrder(order) {
  const { order_number, tableNumber, items } = order;
  const itemList = items && items.length ? items.slice(0, 3).map(i => i.name || i).join(', ') : '';
  const title = `Cuisson — #${order_number}`;
  const body = `Table ${tableNumber}${itemList ? ` — ${itemList}${items.length > 3 ? '...' : ''}` : ''}`;
  playNewOrderSound();
  sendBrowserNotification(title, body);
}
