import { TrendingUp, TrendingDown } from 'lucide-react';

const colorStyles = {
  green: {
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    border: 'border-green-500',
  },
  blue: {
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    border: 'border-blue-500',
  },
  red: {
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    border: 'border-red-500',
  },
  yellow: {
    iconBg: 'bg-yellow-100',
    iconText: 'text-yellow-600',
    border: 'border-yellow-500',
  },
  purple: {
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
    border: 'border-purple-500',
  },
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue' }) {
  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${style.border}`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex-shrink-0 p-3 rounded-full ${style.iconBg}`}>
          {Icon && <Icon className={`h-6 w-6 ${style.iconText}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {trend != null && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
