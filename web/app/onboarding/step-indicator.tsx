export function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      <span className={`h-2 rounded-full transition-all ${step === 1 ? "w-6 bg-gradient-to-r from-accent to-gold" : "w-2 bg-border"}`} />
      <span className={`h-2 rounded-full transition-all ${step === 2 ? "w-6 bg-gradient-to-r from-accent to-gold" : "w-2 bg-border"}`} />
      <span className="ml-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        Step {step} of 2
      </span>
    </div>
  );
}
