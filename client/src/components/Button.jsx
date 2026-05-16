export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-wave-500 text-black hover:bg-wave-600',
    gold: 'bg-gold-500 text-black hover:bg-gold-600',
    outline: 'border border-white/20 text-white hover:bg-white/10',
    ghost: 'text-white/70 hover:text-white',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
