import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
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
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [left, setLeft] = useState<string>('dataMin');
  const [right, setRight] = useState<string>('dataMax');
  const [isZoomed, setIsZoomed] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const chartData = data.map((point) => ({
    time: formatTime(point.timestamp),
    [dataKey]: point.value !== null ? point.value : undefined
  }));

  // Filter data based on zoom range
  const getFilteredData = () => {
    if (left === 'dataMin' && right === 'dataMax') {
      return chartData;
    }

    const leftIndex = chartData.findIndex((d) => d.time === left);
    const rightIndex = chartData.findIndex((d) => d.time === right);

    if (leftIndex === -1 || rightIndex === -1) {
      return chartData;
    }

    return chartData.slice(leftIndex, rightIndex + 1);
  };

  const filteredData = getFilteredData();

  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel) {
      // Prevent text selection and other default behaviors
      if (e.nativeEvent) {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopPropagation();
      }
      setRefAreaLeft(e.activeLabel);
      setRefAreaRight(e.activeLabel);
    }
  };

  const handleMouseMove = (e: any) => {
    if (refAreaLeft && e && e.activeLabel) {
      // Prevent text selection and other default behaviors
      if (e.nativeEvent) {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopPropagation();
      }
      setRefAreaRight(e.activeLabel);
    }
  };

  const handleMouseUp = () => {
    if (refAreaLeft && refAreaRight) {
      // Determine the zoom range
      let leftIndex = chartData.findIndex((d) => d.time === refAreaLeft);
      let rightIndex = chartData.findIndex((d) => d.time === refAreaRight);

      // Ensure left is always less than right
      if (leftIndex > rightIndex) {
        [leftIndex, rightIndex] = [rightIndex, leftIndex];
      }

      // Only zoom if there's a meaningful selection (more than 2 data points apart)
      if (rightIndex - leftIndex > 1) {
        setLeft(chartData[leftIndex].time);
        setRight(chartData[rightIndex].time);
        setIsZoomed(true);
      }

      // Clear the selection area
      setRefAreaLeft(null);
      setRefAreaRight(null);
    } else {
      // Clear selection if no valid area
      setRefAreaLeft(null);
      setRefAreaRight(null);
    }
  };

  const handleMouseLeave = () => {
    // If user drags outside chart, clear the reference area
    if (refAreaLeft) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
    }
  };

  const handleResetZoom = () => {
    setLeft('dataMin');
    setRight('dataMax');
    setIsZoomed(false);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none'
      } as React.CSSProperties}
    >
      {isZoomed && (
        <button
          onClick={handleResetZoom}
          style={{
            position: 'absolute',
            top: '10px',
            right: '40px',
            zIndex: 1000,
            padding: '6px 12px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5568d3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#667eea';
          }}
        >
          Reset Zoom
        </button>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={filteredData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: refAreaLeft ? 'crosshair' : 'default' }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
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
          {refAreaLeft && refAreaRight && (
            <ReferenceArea
              x1={refAreaLeft}
              x2={refAreaRight}
              strokeOpacity={0.3}
              fill={lineColor}
              fillOpacity={0.3}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LiveChart;

