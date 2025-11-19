import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DataPoint {
  timestamp: string;
  value: number | null;
}

interface LiveChartProps {
  data: DataPoint[];
  dataKey: string;
  yAxisLabel: string;
  lineColor?: string;
}

const LiveChart: React.FC<LiveChartProps> = ({
  data,
  dataKey,
  yAxisLabel,
  lineColor = '#667eea'
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const chartData = data.map((point) => ({
    time: formatTime(point.timestamp),
    [dataKey]: point.value !== null ? point.value : undefined
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LiveChart;

