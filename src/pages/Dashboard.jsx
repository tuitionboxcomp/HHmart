import { useEffect, useState, Fragment } from "react";
import SalesChart from "../components/SalesChart";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  Calendar,
  Download,
  Filter,
  Eye,
  EyeOff,
  Menu,
  LogOut,
  Settings,
  FileText,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Columns,
  Printer,
} from "lucide-react";

// Single-file Dashboard + Sidebar. Keeps existing DB connections via window.electronAPI.getDashboardStats
// Additions: responsive sidebar, quick date buttons, CSV export client-side, pagination for bills, bill detail modal, low-stock notification badge, column toggles, print view.

function Sidebar({ active, onChange, collapsed, onToggle }) {
  const items = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "inventory", label: "Inventory", icon: ShoppingCart },
    { id: "transactions", label: "Transactions", icon: FileText },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

 
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [range, setRange] = useState("daily");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [prevStats, setPrevStats] = useState(null);
  const [showDetails, setShowDetails] = useState({
    topItems: true,
    lowStock: true,
    recentBills: true,
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [searchBill, setSearchBill] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [billsPage, setBillsPage] = useState(1);
  const billsPerPage = 8;
  const [visibleColumns, setVisibleColumns] = useState({
    billId: true,
    items: true,
    total: true,
    date: true,
    status: true,
  });
  const [selectedBill, setSelectedBill] = useState(null);
  const [quickRangeLoading, setQuickRangeLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, customRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data =
        range === "custom"
          ? await window.electronAPI.getDashboardStats(range, customRange)
          : await window.electronAPI.getDashboardStats(range);

      setPrevStats(stats);
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setQuickRangeLoading(false);
    }
  };

  const formatNumber = (num) => Number(num || 0).toFixed(2);

  const getChange = (current, previous) => {
    if (!previous || previous === 0) return { percent: 0, isPositive: true };
    const percent = (((current - previous) / previous) * 100).toFixed(1);
    return { percent: Math.abs(percent), isPositive: current >= previous };
  };

  const getTrendIcon = (isPositive) =>
    isPositive ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );

  const StatCard = ({ title, value, icon: Icon, bg, trend, unit = "" }) => {
    const trendData = trend
      ? getChange(value, trend)
      : { percent: 0, isPositive: true };
    return (
      <div className={`${bg} rounded-lg p-5 shadow-md hover:shadow-lg transition`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold mt-2">
              {unit}
              {formatNumber(value)}
            </p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(trendData.isPositive)}
                <span
                  className={`text-xs font-semibold ${
                    trendData.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trendData.isPositive ? "+" : "-"}
                  {trendData.percent}%
                </span>
              </div>
            )}
          </div>
          <div className="bg-white bg-opacity-50 p-3 rounded-lg">
            <Icon className="w-5 h-5 text-gray-700" />
          </div>
        </div>
      </div>
    );
  };

  // CSV Export (client-side) for recent bills
  const exportBillsCSV = () => {
    const rows = stats?.recentBills || [];
    if (!rows.length) return alert("No bills to export");

    const headers = ["Bill ID", "Items", "Total", "Date & Time", "Status"];
    const csv = [headers.join(",")];
    for (const r of rows) {
      const line = [
        `"${r.bill_id}"`,
        r.itemCount || "-",
        r.total || 0,
        `"${new Date(r.date_time).toLocaleString()}"`,
        r.status || "Completed",
      ];
      csv.push(line.join(","));
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recent-bills-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print handler for bills table
  const printBills = () => {
    window.print();
  };

  // Quick date range helper (last N days)
  const setQuickRange = (days) => {
    setQuickRangeLoading(true);
    if (days === 0) {
      setRange("daily");
      setQuickRangeLoading(false);
      return;
    }
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days + 1);
    setRange("custom");
    setCustomRange({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
  };

  // Paginated bills list
  const filteredBills = (stats?.recentBills || []).filter(
    (bill) =>
      !searchBill || bill.bill_id.toLowerCase().includes(searchBill.toLowerCase())
  );
  const billsTotal = filteredBills.length;
  const billsPages = Math.max(1, Math.ceil(billsTotal / billsPerPage));
  const paginatedBills = filteredBills.slice(
    (billsPage - 1) * billsPerPage,
    billsPage * billsPerPage
  );

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar
        active={activeTab}
        onChange={(t) => setActiveTab(t)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((s) => !s)}
      />

      <main className="flex-1 p-6 lg:p-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                className="px-3 py-2 bg-white rounded-lg border border-gray-100 flex items-center gap-2"
                title="Low stock alerts"
              >
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-700">
                  {stats?.lowStock?.length || 0} Low
                </span>
              </button>
            </div>

            <button
              onClick={fetchStats}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters + Quick Ranges */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {range === "custom" && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                value={customRange.from}
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                value={customRange.to}
              />
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setQuickRange(0)} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Today</button>
            <button onClick={() => setQuickRange(6)} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">7d</button>
            <button onClick={() => setQuickRange(29)} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">30d</button>
            <button onClick={() => setQuickRange(89)} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">90d</button>

            <button onClick={exportBillsCSV} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Bills
            </button>

            <button onClick={printBills} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Total Sales"
            value={stats?.totalSales || 0}
            icon={ShoppingCart}
            bg="bg-gradient-to-br from-blue-50 to-blue-100"
            unit="₹"
            trend={prevStats?.totalSales}
          />
          <StatCard
            title="Bills Count"
            value={stats?.billsCount || 0}
            icon={ShoppingCart}
            bg="bg-gradient-to-br from-green-50 to-green-100"
            trend={prevStats?.billsCount}
          />
          <StatCard
            title="Items Sold"
            value={stats?.itemsSold || 0}
            icon={ShoppingCart}
            bg="bg-gradient-to-br from-yellow-50 to-yellow-100"
            trend={prevStats?.itemsSold}
          />
          <StatCard
            title="Avg Bill Value"
            value={stats?.avgBill || 0}
            icon={ShoppingCart}
            bg="bg-gradient-to-br from-purple-50 to-purple-100"
            unit="₹"
          />
        </div>

        {/* Profit + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <div className="lg:col-span-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white text-opacity-90 text-sm font-medium">Estimated Profit</p>
                <p className="text-4xl font-bold mt-2">₹{formatNumber(stats?.profit || 0)}</p>
                <p className="text-white text-opacity-75 text-xs mt-2">Based on current period</p>
              </div>
              <TrendingUp className="w-12 h-12 text-white text-opacity-30" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Quick Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Profit Margin</span>
                <span className="font-bold">{stats?.profit && stats?.totalSales ? ((stats.profit / stats.totalSales) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Avg Items/Bill</span>
                <span className="font-bold">{stats?.billsCount ? (stats.itemsSold / stats.billsCount).toFixed(1) : 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 w-fit shadow-sm">
          {["overview", "inventory", "transactions", "reports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                activeTab === tab ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Sales Trend</h2>
              <SalesChart data={stats?.graphData || []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Items */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">🔥 Top Selling Items</h2>
                  <button
                    onClick={() => setShowDetails({ ...showDetails, topItems: !showDetails.topItems })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showDetails.topItems ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                {showDetails.topItems && (
                  <>
                    {(stats?.topItems?.length || 0) === 0 ? (
                      <p className="text-gray-500 text-sm">No data available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700">Item</th>
                              <th className="px-4 py-2 text-right font-semibold text-gray-700">Qty</th>
                              <th className="px-4 py-2 text-right font-semibold text-gray-700">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {stats?.topItems?.map((item, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{item.name}</td>
                                <td className="px-4 py-3 text-right">{item.qty}</td>
                                <td className="px-4 py-3 text-right font-semibold">₹{formatNumber(item.revenue || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Low Stock Alerts
                  </h2>
                  <button
                    onClick={() => setShowDetails({ ...showDetails, lowStock: !showDetails.lowStock })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showDetails.lowStock ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                {showDetails.lowStock && (
                  <>
                    {(stats?.lowStock?.length || 0) === 0 ? (
                      <p className="text-green-600 font-medium">✓ No stock issues</p>
                    ) : (
                      <div className="space-y-2">
                        {stats?.lowStock?.map((item) => (
                          <div key={item.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-red-600">Stock: {item.stock} {item.unit || "units"}</p>
                            {item.minStock && <p className="text-xs text-gray-500 mt-1">Min: {item.minStock}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Recent Bills</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Bill ID..."
                    className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={searchBill}
                    onChange={(e) => {
                      setSearchBill(e.target.value);
                      setBillsPage(1);
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVisibleColumns((v) => ({ ...v, status: !v.status }))}
                    className="px-3 py-2 bg-gray-100 rounded-lg"
                    title="Toggle status column"
                  >
                    <Columns className="w-4 h-4" />
                  </button>
                  <button onClick={exportBillsCSV} className="px-3 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
              </div>
            </div>

            {showDetails.recentBills && (
              <>
                {(stats?.recentBills?.length || 0) === 0 ? (
                  <p className="text-gray-500">No recent bills</p>
                ) : (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {visibleColumns.billId && <th className="px-4 py-3 text-left font-semibold text-gray-700">Bill ID</th>}
                            {visibleColumns.items && <th className="px-4 py-3 text-left font-semibold text-gray-700">Items</th>}
                            {visibleColumns.total && <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>}
                            {visibleColumns.date && <th className="px-4 py-3 text-left font-semibold text-gray-700">Date & Time</th>}
                            {visibleColumns.status && <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedBills.map((bill, i) => (
                            <tr key={i} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBill(bill)}>
                              {visibleColumns.billId && <td className="px-4 py-3 font-medium">{bill.bill_id}</td>}
                              {visibleColumns.items && <td className="px-4 py-3">{bill.itemCount || "-"}</td>}
                              {visibleColumns.total && <td className="px-4 py-3 text-right font-semibold">₹{formatNumber(bill.total)}</td>}
                              {visibleColumns.date && <td className="px-4 py-3 text-xs text-gray-600">{new Date(bill.date_time).toLocaleString("en-IN")}</td>}
                              {visibleColumns.status && <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Completed</span></td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-600">Showing {(billsPage - 1) * billsPerPage + 1} - {Math.min(billsPage * billsPerPage, billsTotal)} of {billsTotal}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBillsPage((p) => Math.max(1, p - 1))} className="p-2 rounded border"><ChevronLeft className="w-4 h-4" /></button>
                        <div className="text-sm">Page {billsPage} / {billsPages}</div>
                        <button onClick={() => setBillsPage((p) => Math.min(billsPages, p + 1))} className="p-2 rounded border"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Inventory Overview</h2>
            <p className="text-gray-600 text-center py-8">Inventory management features coming soon... (you already have low-stock alerts showcased in Overview)</p>
          </div>
        )}

        {/* Reports Tab (simple) */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reports</h2>
            <p className="text-gray-600 mb-4">Quick exports and useful snapshots.</p>
            <div className="flex gap-3">
              <button onClick={exportBillsCSV} className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"><Download className="w-4 h-4" /> Export Recent Bills</button>
              <button onClick={() => alert('Custom report generation endpoint not implemented on client. Use existing server APIs.') } className="px-4 py-2 bg-gray-100 rounded-lg">Generate Custom Report</button>
            </div>
          </div>
        )}

        {/* Bill Detail Modal (basic) */}
        {selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 md:w-3/4 lg:w-1/2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">Bill: {selectedBill.bill_id}</h3>
                  <p className="text-sm text-gray-500">{new Date(selectedBill.date_time).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedBill(null)} className="p-2 rounded hover:bg-gray-100">✕</button>
              </div>

              <div className="mt-4">
                <p className="font-medium mb-2">Items</p>
                <div className="space-y-2">
                  {(selectedBill.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-gray-500">{it.qty} × ₹{formatNumber(it.price)}</div>
                      </div>
                      <div className="font-semibold">₹{formatNumber((it.qty || 0) * (it.price || 0))}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-between border-t pt-4">
                  <div />
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-xl font-bold">₹{formatNumber(selectedBill.total)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
