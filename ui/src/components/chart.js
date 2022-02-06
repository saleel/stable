import {
  Line, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function Chart(props) {
  const {
    data, xAxisKey, yAxisKey, xAxisFormatter, yAxisFormatter
  } = props;

  return (
    <ResponsiveContainer>
      <ComposedChart
        data={data}
        margin={{
          top: 5, right: 5, left: -15, bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--blue-500)" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <XAxis dataKey={xAxisKey} tickFormatter={xAxisFormatter} />
        <YAxis tickFormatter={yAxisFormatter} />
        <Tooltip />

        <Line
          type="monotone"
          unit="$"
          strokeLinecap="round"
          strokeWidth={2}
          dataKey={yAxisKey}
          stroke="var(--blue-500)"
          dot={false}
          legendType="none"
        />
        <Area type="monotone" dataKey={yAxisKey} tooltipType="none" fillOpacity={1} fill="url(#colorUv)" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default Chart;
