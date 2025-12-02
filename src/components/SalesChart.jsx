import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

function SalesChart({ data }) {
  return (
    <div className="mt-6 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-2">📈 Sales Trend</h2>
      {data.length === 0 ? (
        <p>No data available for chart</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default SalesChart;
