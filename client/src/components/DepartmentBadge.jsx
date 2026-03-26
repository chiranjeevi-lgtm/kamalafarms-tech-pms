const departmentStyles = {
  operations: {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    label: 'Operations',
  },
  farm_execution: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Farm Execution',
  },
  farm_agronomy: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    label: 'Farm Agronomy',
  },
  hr_admin: {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    label: 'HR & Admin',
  },
  field_sales: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: 'Field Sales',
  },
  inhouse_sales: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    label: 'Inhouse Sales',
  },
  marketing: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    label: 'Marketing',
  },
  computer_engineering: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    label: 'Computer Eng.',
  },
  research_development: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    label: 'R&D',
  },
};

export default function DepartmentBadge({ department }) {
  const style = departmentStyles[department] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: department || 'Unknown',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
