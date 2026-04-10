interface Props {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  color?: 'teal' | 'navy' | 'lime';
}

const colorMap = {
  teal: 'var(--teal)',
  navy: 'var(--navy)',
  lime: 'var(--lime)',
};

export default function IndicatorCard({ value, label, color = 'teal' }: Props) {
  return (
    <div className="card-indicator">
      <div className="card-indicator-value" style={{ color: `hsl(${colorMap[color]})` }}>
        {value}
      </div>
      <div className="card-indicator-label">{label}</div>
    </div>
  );
}
