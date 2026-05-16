export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={48} className="text-white/20 mb-4" />}
      <h3 className="text-lg font-medium text-white/60">{title}</h3>
      {description && <p className="text-sm text-white/30 mt-1">{description}</p>}
    </div>
  );
}
