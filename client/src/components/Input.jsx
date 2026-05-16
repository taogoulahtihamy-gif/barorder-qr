export default function Input({ label, icon: Icon, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm text-white/60">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />}
        <input
          className={`w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/50 transition-colors ${Icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}
