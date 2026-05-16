export default function Badge({ children, variant = 'default' }) {
  const colors = {
    default: 'bg-white/10 text-white/70',
    pending: 'bg-yellow-500/20 text-yellow-400',
    preparing: 'bg-blue-500/20 text-blue-400',
    ready: 'bg-wave-500/20 text-wave-500',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant] || colors.default}`}>
      {children}
    </span>
  );
}
