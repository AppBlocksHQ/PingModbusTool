import React, { useState, useMemo, useCallback } from 'react';
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
  maxDataPoints?: number; // Maximum number of data points to display
}

// Memoized custom tooltip for better performance
const CustomTooltip = React.memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: 0, fontSize: '12px', color: entry.color }}>
            {entry.name}: {entry.value !== undefined ? entry.value.toFixed(2) : 'N/A'}
          </p>
        ))}
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

const LiveChart: React.FC<LiveChartProps> = React.memo(({
  data,
  dataKey,
  yAxisLabel,
  lineColor = '#667eea',
  maxDataPoints = 1000 // Default to last 1000 points
}) => {
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [left, setLeft] = useState<string>('dataMin');
  const [right, setRight] = useState<string>('dataMax');
  const [isZoomed, setIsZoomed] = useState(false);

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }, []);

  // Intelligent downsampling function that preserves visual characteristics
  const downsampleData = useCallback((points: DataPoint[], maxPoints: number) => {
    if (points.length <= maxPoints) {
      return points; // No need to downsample
    }

    const bucketSize = Math.ceil(points.length / maxPoints);
    const downsampled: DataPoint[] = [];

    for (let i = 0; i < points.length; i += bucketSize) {
      const bucket = points.slice(i, i + bucketSize);
      
      // For each bucket, keep the point that best represents the data
      // We'll use a simple approach: keep min, max, and last point to preserve spikes
      const validPoints = bucket.filter(p => p.value !== null);
      
      if (validPoints.length === 0) {
        downsampled.push(bucket[bucket.length - 1]); // Keep last point even if null
      } else if (validPoints.length === 1) {
        downsampled.push(validPoints[0]);
      } else {
        // Find min and max in bucket
        const minPoint = validPoints.reduce((min, p) => 
          (p.value !== null && (min.value === null || p.value < min.value)) ? p : min
        );
        const maxPoint = validPoints.reduce((max, p) => 
          (p.value !== null && (max.value === null || p.value > max.value)) ? p : max
        );
        const lastPoint = bucket[bucket.length - 1];

        // Add unique points (min, max, last) in chronological order
        const bucketPoints = new Set<DataPoint>();
        bucketPoints.add(minPoint);
        bucketPoints.add(maxPoint);
        bucketPoints.add(lastPoint);
        
        // Sort by original index to maintain chronological order
        const sortedBucketPoints = Array.from(bucketPoints).sort((a, b) => 
          bucket.indexOf(a) - bucket.indexOf(b)
        );
        downsampled.push(...sortedBucketPoints);
      }
    }

    return downsampled;
  }, []);

  // Memoize chart data transformation with intelligent downsampling
  const chartData = useMemo(() => {
    // Apply downsampling to entire dataset while preserving time range
    const sampledData = downsampleData(data, maxDataPoints);
    
    return sampledData.map((point) => ({
      time: formatTime(point.timestamp),
      [dataKey]: point.value !== null ? point.value : undefined
    }));
  }, [data, dataKey, formatTime, maxDataPoints, downsampleData]);

  // Memoize filtered data based on zoom range
  const filteredData = useMemo(() => {
    if (left === 'dataMin' && right === 'dataMax') {
      return chartData;
    }

    const leftIndex = chartData.findIndex((d) => d.time === left);
    const rightIndex = chartData.findIndex((d) => d.time === right);

    if (leftIndex === -1 || rightIndex === -1) {
      return chartData;
    }

    return chartData.slice(leftIndex, rightIndex + 1);
  }, [chartData, left, right]);

  const handleMouseDown = useCallback((e: any) => {
    if (e && e.activeLabel) {
      // Prevent text selection and other default behaviors
      if (e.nativeEvent) {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopPropagation();
      }
      setRefAreaLeft(e.activeLabel);
      setRefAreaRight(e.activeLabel);
    }
  }, []);

  const handleMouseMove = useCallback((e: any) => {
    if (refAreaLeft && e && e.activeLabel) {
      // Prevent text selection and other default behaviors
      if (e.nativeEvent) {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopPropagation();
      }
      setRefAreaRight(e.activeLabel);
    }
  }, [refAreaLeft]);

  const handleMouseUp = useCallback(() => {
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
  }, [refAreaLeft, refAreaRight, chartData]);

  const handleMouseLeave = useCallback(() => {
    // If user drags outside chart, clear the reference area
    if (refAreaLeft) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
    }
  }, [refAreaLeft]);

  const handleResetZoom = useCallback(() => {
    setLeft('dataMin');
    setRight('dataMax');
    setIsZoomed(false);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  }, []);

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
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
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
            minTickGap={50}
          />
          <YAxis
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
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
});

LiveChart.displayName = 'LiveChart';

export default LiveChart;

