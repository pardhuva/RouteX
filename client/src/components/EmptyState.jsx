export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 shadow-xs">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        {description && <p className="mt-0.5 max-w-sm text-xs text-slate-500">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
