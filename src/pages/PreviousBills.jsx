import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import BillPreview from "./BillPreview";
import {
  Search,
  Download,
  Printer,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Phone,
  DollarSign,
  Loader,
  AlertCircle,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";

// 🔒 Safe numeric guard
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Loading Skeleton
function BillSkeleton() {
  return (
    <tr className="border-b bg-gray-50 animate-pulse">
      <td className="p-4">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </td>
      <td className="p-4">
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </td>
      <td className="p-4">
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </td>
      <td className="p-4">
        <div className="h-6 bg-gray-300 rounded-full w-20"></div>
      </td>
      <td className="p-4">
        <div className="h-4 bg-gray-300 rounded w-1/3 ml-auto"></div>
      </td>
      <td className="p-4">
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </td>
      <td className="p-4">
        <div className="h-8 bg-gray-300 rounded-full w-24 mx-auto"></div>
      </td>
    </tr>
  );
}

// Payment Badge Component
const PaymentBadge = ({ type }) => {
  const paymentTypes = {
    Cash: { bg: "bg-green-100", text: "text-green-800", icon: "💵" },
    Card: { bg: "bg-blue-100", text: "text-blue-800", icon: "💳" },
    UPI: { bg: "bg-purple-100", text: "text-purple-800", icon: "📱" },
    Cheque: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "📄" },
  };

  const config = paymentTypes[type] || paymentTypes.Cash;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} flex items-center gap-1 w-fit`}>
      <span>{config.icon}</span>
      {type || "Cash"}
    </span>
  );
};

// Bill Row Component
const BillRow = ({ bill, index, onView, isLoading }) => {
  const createdDate = new Date(bill.created_at);
  const dateStr = createdDate.toLocaleDateString("en-IN");
  const timeStr = createdDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <tr
      className={`border-b transition-all duration-200 hover:bg-blue-50/50 ${
        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
      }`}
    >
      <td className="p-4">
        <span className="font-bold text-gray-900 text-sm">{bill.id}</span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-gray-800">{bill.customer_name || "Walk-in"}</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-mono text-sm">{bill.customer_phone || "-"}</span>
        </div>
      </td>
      <td className="p-4">
        <PaymentBadge type={bill.payment_type} />
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-bold text-gray-900">
            ₹{num(bill.total).toFixed(2)}
          </span>
        </div>
      </td>
      <td className="p-4 text-gray-600 text-sm">
        <div className="flex flex-col">
          <span className="font-medium">{dateStr}</span>
          <span className="text-xs text-gray-500">{timeStr}</span>
        </div>
      </td>
      <td className="p-4 text-center">
        <button
          onClick={() => onView(bill.id)}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold
                     hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2 mx-auto"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          View
        </button>
      </td>
    </tr>
  );
};

// Stats Card Component
const StatCard = ({ label, value, icon: Icon, gradient }) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 shadow-sm border border-white/20`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="bg-white/20 p-3 rounded-lg">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

export default function PreviousBills() {
  const [bills, setBills] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateRangeFilter, setDateRangeFilter] = useState({ from: "", to: "" });
  const searchTimeoutRef = useRef(null);
  const tableRef = useRef(null);

  // Load bills on mount
  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getAllBills();
      setBills(data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading bills:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleSearch = useCallback((value) => {
    setSearch(value);
    setCurrentPage(1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Memoized filtered bills
  const filtered = useMemo(() => {
    let result = bills;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (bill) =>
          bill.id.toLowerCase().includes(searchLower) ||
          (bill.customer_name && bill.customer_name.toLowerCase().includes(searchLower)) ||
          (bill.customer_phone && bill.customer_phone.includes(search))
      );
    }

    // Payment type filter
    if (filterType !== "all") {
      result = result.filter((bill) => bill.payment_type === filterType);
    }

    // Date range filter
    if (dateRangeFilter.from && dateRangeFilter.to) {
      const fromDate = new Date(dateRangeFilter.from);
      const toDate = new Date(dateRangeFilter.to);
      toDate.setHours(23, 59, 59);

      result = result.filter((bill) => {
        const billDate = new Date(bill.created_at);
        return billDate >= fromDate && billDate <= toDate;
      });
    }

    return result;
  }, [bills, search, filterType, dateRangeFilter]);

  // Memoized sorted bills
  const sorted = useMemo(() => {
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "created_at") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortConfig.key === "total") {
        aVal = num(aVal);
        bVal = num(bVal);
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filtered, sortConfig]);

  // Memoized paginated bills
  const paginatedBills = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIdx, startIdx + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  // Open bill handler
  const openBill = useCallback(async (billId) => {
    try {
      setLoadingBill(true);

      const data = await window.electronAPI.getBillById(billId);

      const totals = {
        subtotal: num(data?.bill?.subtotal),
        gstTotal: num(data?.bill?.gst_total),
        discount: num(data?.bill?.discount),
        total: num(data?.bill?.total),
      };

      const cart = (data?.items || []).map((i) => ({
        name: i.item_name,
        qty: num(i.qty),
        price: num(i.price),
        gst: num(i.gst),
      }));

      setPreviewData({
        billId: data.bill.id,
        cart,
        totals,
        paymentType: data.bill.payment_type || "",
        customerName: data.bill.customer_name || "",
        customerPhone: data.bill.customer_phone || "",
        customerEmail: data.bill.customer_email || "",
        notes: data.bill.notes || "",
      });
    } catch (err) {
      alert("Failed to load bill. Please try again.");
      console.error(err);
    } finally {
      setLoadingBill(false);
    }
  }, []);

  // Export CSV
  const exportCSV = useCallback(() => {
    if (sorted.length === 0) {
      alert("No bills to export");
      return;
    }

    const headers = ["Bill ID", "Customer", "Phone", "Payment", "Total", "Date"];
    const csv = [headers.join(",")];

    for (const bill of sorted) {
      const line = [
        `"${bill.id}"`,
        `"${bill.customer_name || "Walk-in"}"`,
        `"${bill.customer_phone || "-"}"`,
        bill.payment_type,
        num(bill.total).toFixed(2),
        `"${new Date(bill.created_at).toLocaleString("en-IN")}"`,
      ];
      csv.push(line.join(","));
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bills-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalBills: sorted.length,
      totalRevenue: sorted.reduce((sum, bill) => sum + num(bill.total), 0),
      avgBill: sorted.length > 0 ? sorted.reduce((sum, bill) => sum + num(bill.total), 0) / sorted.length : 0,
      paymentMethods: [...new Set(sorted.map((b) => b.payment_type))].length,
    };
  }, [sorted]);

  // Get unique payment types
  const paymentTypes = useMemo(
    () => ["all", ...new Set(bills.map((b) => b.payment_type))],
    [bills]
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-12 bg-gray-300 rounded-lg animate-pulse mb-6"></div>
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          <table className="w-full">
            <tbody>
              {[...Array(8)].map((_, i) => (
                <BillSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Previous Bills
            </h1>
            <p className="text-gray-600 mt-2">
              View, reprint and manage all past transactions
            </p>
          </div>
          <button
            onClick={loadBills}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Bills"
            value={stats.totalBills}
            icon={Printer}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard
            label="Total Revenue"
            value={`₹${stats.totalRevenue.toFixed(0)}`}
            icon={DollarSign}
            gradient="from-green-500 to-emerald-600"
          />
          <StatCard
            label="Avg Bill Value"
            value={`₹${stats.avgBill.toFixed(0)}`}
            icon={DollarSign}
            gradient="from-purple-500 to-pink-600"
          />
          <StatCard
            label="Payment Methods"
            value={stats.paymentMethods}
            icon={Printer}
            gradient="from-orange-500 to-red-600"
          />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Bill ID, Customer name or Phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Payment Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payment Types</option>
              {paymentTypes.filter((t) => t !== "all").map((type) => (
                <option key={type} value={type}>
                  {type || "Cash"}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <input
              type="date"
              value={dateRangeFilter.from}
              onChange={(e) => {
                setDateRangeFilter({ ...dateRangeFilter, from: e.target.value });
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRangeFilter.to}
              onChange={(e) => {
                setDateRangeFilter({ ...dateRangeFilter, to: e.target.value });
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          {(search || filterType !== "all" || dateRangeFilter.from) && (
            <button
              onClick={() => {
                handleSearch("");
                setFilterType("all");
                setDateRangeFilter({ from: "", to: "" });
              }}
              className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              Clear Filters
            </button>
          )}

          {/* Export & Items Per Page */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto" ref={tableRef}>
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0">
              <tr className="text-gray-700 uppercase text-xs tracking-wider">
                <th className="p-4 text-left font-semibold">Bill ID</th>
                <th className="p-4 text-left font-semibold">Customer</th>
                <th className="p-4 text-left font-semibold">Phone</th>
                <th className="p-4 text-left font-semibold">Payment</th>
                <th className="p-4 text-right font-semibold">Total</th>
                <th className="p-4 text-left font-semibold">Date & Time</th>
                <th className="p-4 text-center font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedBills.length > 0 ? (
                paginatedBills.map((bill, index) => (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    index={index}
                    onView={openBill}
                    isLoading={loadingBill}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg font-medium">
                      No bills found
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Try adjusting your search or filters
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginatedBills.length > 0 && totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, sorted.length)} of{" "}
              <span className="font-bold">{sorted.length}</span> bills
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage > totalPages - 3) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-lg"
                          : "border border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔔 Loading Toast */}
      {loadingBill && (
        <div className="fixed bottom-6 right-6 z-40 animate-toast">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-sm border border-white/20">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0s" }}></span>
              <span className="h-2 w-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="h-2 w-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
            <span className="text-sm font-semibold">Loading bill, please wait…</span>
          </div>
        </div>
      )}

      {/* Bill Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 animate-slideUp">
          <BillPreview
            {...previewData}
            onClose={() => setPreviewData(null)}
          />
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.35s ease-out;
        }

        @keyframes toast {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-toast {
          animation: toast 0.25s ease-out;
        }

        /* Smooth scrollbar */
        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}