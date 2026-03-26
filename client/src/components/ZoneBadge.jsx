const zoneStyles = {
  green: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-500',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-500',
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

const dotSizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

export default function ZoneBadge({ zone = 'green', size = 'md' }) {
  const style = zoneStyles[zone] || zoneStyles.green;
  const sizeClass = sizeStyles[size] || sizeStyles.md;
  const dotSize = dotSizes[size] || dotSizes.md;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClass}`}
    >
      <span className={`${dotSize} rounded-full ${style.dot}`} />
      {zone.charAt(0).toUpperCase() + zone.slice(1)}
    </span>
  );
}
