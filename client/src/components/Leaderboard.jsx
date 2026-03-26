import { Trophy } from 'lucide-react';
import ZoneBadge from './ZoneBadge';
import DepartmentBadge from './DepartmentBadge';

const trophyColors = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-700',
};

const scoreZoneBg = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
};

export default function Leaderboard({ data = [] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Performers
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Rank</th>
              <th className="px-6 py-3">Employee</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Score</th>
              <th className="px-6 py-3">Zone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((entry, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {entry.rank <= 3 ? (
                      <Trophy
                        className={`h-5 w-5 ${trophyColors[entry.rank]}`}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-500 w-5 text-center">
                        {entry.rank}
                      </span>
                    )}
                    {entry.rank <= 3 && (
                      <span className="text-sm font-bold text-gray-700">
                        {entry.rank}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <DepartmentBadge department={entry.department} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${
                      scoreZoneBg[entry.zone] || scoreZoneBg.green
                    }`}
                  >
                    {entry.score}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ZoneBadge zone={entry.zone} size="sm" />
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                  No leaderboard data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
