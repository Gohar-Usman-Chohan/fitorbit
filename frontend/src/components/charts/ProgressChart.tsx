'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProgressChartProps {
  data: Array<{
    date: string;
    label?: string;
    weight?: number;
    calories?: number;
    workouts?: number;
    [key: string]: string | number | undefined;
  }>;
  title: string;
  dataKey: string;
  type?: 'line' | 'bar';
  color?: string;
  /** X-axis field — use `label` when multiple entries share the same date */
  categoryKey?: string;
}

export function ProgressChart({
  data,
  title,
  dataKey,
  type = 'line',
  color = '#3b82f6',
  categoryKey = 'date',
}: ProgressChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    [dataKey]:
      typeof point[dataKey] === 'number' ? point[dataKey] : Number(point[dataKey]) || 0,
  }));

  if (!chartData.length) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No data available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {type === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [Number(value ?? 0), dataKey]}
              labelFormatter={(label) => String(label)}
            />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={{ r: 4 }} />
          </LineChart>
        ) : (
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(value) => [Number(value ?? 0), dataKey]}
              labelFormatter={(label) => String(label)}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Legend />
            <Bar dataKey={dataKey} fill={color} maxBarSize={48} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export { StatCard } from '@/components/ui/StatCard';

interface MultiLineChartProps {
  data: Array<{
    date: string;
    [key: string]: string | number | undefined;
  }>;
  title: string;
  dataKeys: Array<{
    key: string;
    label: string;
    color: string;
  }>;
}

export function MultiLineChart({ data, title, dataKeys }: MultiLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No data available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {dataKeys.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              stroke={item.color}
              dot={{ r: 3 }}
              name={item.label}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
