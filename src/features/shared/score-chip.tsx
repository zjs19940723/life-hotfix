type ScoreChipProps = {
  label: string;
  value: string | number;
};

export function ScoreChip({ label, value }: ScoreChipProps) {
  return (
    <div className="score-chip" role="status" aria-label={label}>
      <span className="score-chip__label">{label}</span>
      <strong className="score-chip__value">{value}</strong>
    </div>
  );
}
