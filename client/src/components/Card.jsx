export default function Card({ children, className = '', style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`card bg-zinc-900/80 rounded-2xl border border-white/5 p-4 ${onClick ? 'cursor-pointer hover:bg-zinc-800/80 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
