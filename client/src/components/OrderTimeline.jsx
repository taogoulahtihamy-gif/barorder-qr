import { useApp } from '../context/AppContext';

const STEPS = [
  { key: 'new', label: 'Nouvelle' },
  { key: 'accepted', label: 'Acceptée' },
  { key: 'preparing', label: 'En prépa.' },
  { key: 'ready', label: 'Prête' },
  { key: 'served', label: 'Servie' },
  { key: 'paid', label: 'Payée' },
];

const STEP_COLORS = {
  new: 'bg-yellow-400',
  accepted: 'bg-amber-400',
  preparing: 'bg-blue-400',
  ready: 'bg-emerald-400',
  served: 'bg-green-400',
  paid: 'bg-wave-500',
};

function normalizeStatus(s) {
  if (s === 'pending') return 'new';
  return s;
}

export default function OrderTimeline({ status }) {
  const { t } = useApp();
  const current = normalizeStatus(status);
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  if (currentIdx < 0) return null;

  return (
    <div className="flex items-center gap-0.5 w-full py-1">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isPast = i < currentIdx;
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center min-w-0">
            <div className="flex items-center w-full">
              <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                done ? STEP_COLORS[step.key] : 'bg-white/10'
              } ${i === 0 ? 'rounded-l-full' : ''} ${i === STEPS.length - 1 ? 'rounded-r-full' : ''}`} />
            </div>
            <div className={`w-2 h-2 rounded-full mt-1 transition-colors duration-300 ${
              done ? STEP_COLORS[step.key] : 'bg-white/10'
            } ${isPast ? 'opacity-60' : ''} ${current === step.key ? 'ring-2 ring-white/30 ring-offset-1 ring-offset-zinc-900' : ''}`} />
            <span className={`text-[10px] mt-0.5 whitespace-nowrap transition-colors duration-300 ${
              done ? 'text-white/70' : 'text-white/20'
            }`}>
              {t(step.label)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
