import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

const zoneColors = {
  green: '#16a34a',
  yellow: '#ca8a04',
  red: '#dc2626',
};

function CustomDot({ cx, cy, payload }) {
  const color = zoneColors[payload.zone] || zoneColors.green;
  return (
    <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const color = zoneColors[data.zone] || zoneColors.green;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-700">{data.month}</p>
      <p className="text-lg font-bold" style={{ color }}>
        {data.score}
      </p>
      <p className="text-xs text-gray-500 capitalize">Zone: {data.zone}</p>
    </div>
  );
}

export default function KPIChart({ data = [], title = 'KPI Score Trend' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={80}
            stroke="#16a34a"
            strokeDasharray="6 4"
            label={{ value: 'Green (80)', position: 'right', fontSize: 11, fill: '#16a34a' }}
          />
          <ReferenceLine
            y={50}
            stroke="#ca8a04"
            strokeDasharray="6 4"
            label={{ value: 'Yellow (50)', position: 'right', fontSize: 11, fill: '#ca8a04' }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 7, stroke: '#4f46e5', strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
