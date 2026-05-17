export default function Badge({ children, variant = 'default', className = '' }) {
  const colors = {
    default: 'bg-white/10 text-white/70',
    pending: 'bg-yellow-500/20 text-yellow-400',
    preparing: 'bg-blue-500/20 text-blue-400',
    ready: 'bg-wave-500/20 text-wave-500',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };
  return (
    <span
      className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 max-w-full ${colors[variant] || colors.default} ${className}`}
      style={{ fontSize: 'clamp(12px, 3.2vw, 14px)' }}
    >
      {children}
    </span>
  );
}
