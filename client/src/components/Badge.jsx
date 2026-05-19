export default function Badge({ children, variant = 'default', className = '' }) {
  const colors = {
    default: 'bg-white/10 text-white/70',
    pending: 'bg-yellow-500/20 text-yellow-400',
    accepted: 'bg-amber-500/20 text-amber-400',
    preparing: 'bg-blue-500/20 text-blue-400',
    ready: 'bg-wave-500/20 text-wave-500',
    served: 'bg-purple-500/20 text-purple-400',
    paid: 'bg-emerald-500/20 text-emerald-400',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-1 md:px-3 md:py-1.5 font-medium flex-shrink-0 max-w-full min-h-[24px] md:min-h-[28px] ${colors[variant] || colors.default} ${className}`}
      style={{ fontSize: 'clamp(11px, 2.8vw, 14px)' }}
    >
      {children}
    </span>
  );
}
