import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  secondaryData?: TimeSeriesPoint[];
  type?: "line" | "area" | "bar";
  color?: string;
  secondaryColor?: string;
  name?: string;
  secondaryName?: string;
  formatValue?: (value: number) => string;
  formatSecondaryValue?: (value: number) => string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  height?: number;
  dualAxis?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function TimeSeriesChart({
  data,
  secondaryData,
  type = "area",
  color = "hsl(var(--primary))",
  secondaryColor = "hsl(var(--chart-2))",
  name = "Value",
  secondaryName = "Secondary Value",
  formatValue = (value) => value.toLocaleString(),
  formatSecondaryValue = (value) => value.toLocaleString(),
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  height = 300,
  dualAxis = false,
  className,
  "data-testid": testId
}: TimeSeriesChartProps) {
  
  // Transform data for chart consumption
  const chartData = (data || []).map((point, index) => {
    const result: any = {
      date: point.date,
      [name]: point.value,
      label: point.label,
    };

    // Add secondary data if available
    if (secondaryData && secondaryData[index]) {
      result[secondaryName] = secondaryData[index].value;
    }

    return result;
  });

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-medium text-sm mb-2">
          {new Date(label).toLocaleDateString('en-US', { 
            weekday: 'short',
            year: 'numeric',
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
        {(payload || []).map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">{entry.name}:</span>
            </div>
            <span className="font-medium text-sm">
              {entry.name === name ? formatValue(entry.value) : formatSecondaryValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Chart configuration
  const chartConfig = {
    [name]: {
      label: name,
      color: color,
    },
    ...(secondaryData && {
      [secondaryName]: {
        label: secondaryName,
        color: secondaryColor,
      }
    })
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-xs"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(value) => formatValue(value)}
              className="text-xs"
              axisLine={false}
              tickLine={false}
            />
            {dualAxis && secondaryData && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => formatSecondaryValue(value)}
                className="text-xs"
                axisLine={false}
                tickLine={false}
              />
            )}
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={name}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: "white" }}
            />
            {secondaryData && (
              <Line
                yAxisId={dualAxis ? "right" : "left"}
                type="monotone"
                dataKey={secondaryName}
                stroke={secondaryColor}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: secondaryColor, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: secondaryColor, strokeWidth: 2, fill: "white" }}
              />
            )}
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-xs"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(value) => formatValue(value)}
              className="text-xs"
              axisLine={false}
              tickLine={false}
            />
            {dualAxis && secondaryData && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => formatSecondaryValue(value)}
                className="text-xs"
                axisLine={false}
                tickLine={false}
              />
            )}
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey={name}
              stroke={color}
              fill={color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {secondaryData && (
              <Area
                yAxisId={dualAxis ? "right" : "left"}
                type="monotone"
                dataKey={secondaryName}
                stroke={secondaryColor}
                fill={secondaryColor}
                fillOpacity={0.2}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-xs"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(value) => formatValue(value)}
              className="text-xs"
              axisLine={false}
              tickLine={false}
            />
            {dualAxis && secondaryData && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => formatSecondaryValue(value)}
                className="text-xs"
                axisLine={false}
                tickLine={false}
              />
            )}
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            <Bar
              yAxisId="left"
              dataKey={name}
              fill={color}
              radius={[2, 2, 0, 0]}
            />
            {secondaryData && (
              <Bar
                yAxisId={dualAxis ? "right" : "left"}
                dataKey={secondaryName}
                fill={secondaryColor}
                radius={[2, 2, 0, 0]}
              />
            )}
          </BarChart>
        );

      default:
        return null;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-1">No data available</div>
          <div className="text-sm">No data found for the selected time period</div>
        </div>
      </div>
    );
  }

  const chartElement = renderChart();
  
  if (!chartElement) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-1">Chart not available</div>
          <div className="text-sm">Unable to render chart with current configuration</div>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className={className} data-testid={testId}>
      <ResponsiveContainer width="100%" height={height}>
        {chartElement}
      </ResponsiveContainer>
    </ChartContainer>
  );
}