import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, Edit, ChevronDown, ChevronUp, RotateCcw, AlertCircle } from "lucide-react";
import EditItemPanel from "../components/EditItemPanel";

// Loading Skeleton Component
function ItemSkeleton() {
  return (
    <tr className="border-b bg-gray-50 animate-pulse">
      <td className="p-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </td>
      <td className="p-3 text-center">
        <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
      </td>
      <td className="p-3 text-center">
        <div className="h-4 bg-gray-300 rounded w-1/3 mx-auto"></div>
      </td>
      <td className="p-3 text-center">
        <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div>
      </td>
      <td className="p-3 text-center">
        <div className="h-6 bg-gray-300 rounded-full w-1/3 mx-auto"></div>
      </td>
      <td className="p-3 text-center">
        <div className="h-10 bg-gray-300 rounded w-20 mx-auto"></div>
      </td>
    </tr>
  );
}

// Stock Badge Component (Memoized)
const StockBadge = ({ stock }) => {
  let badgeClass, badgeText;

  if (stock <= 0) {
    badgeClass = "bg-gray-300 text-gray-700";
    badgeText = "Out of Stock";
  } else if (stock <= 5) {
    badgeClass = "bg-red-500 text-white animate-pulse";
    badgeText = `Low: ${stock}`;
  } else {
    badgeClass = "bg-green-500 text-white";
    badgeText = stock;
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
      {badgeText}
    </span>
  );
};

// Item Row Component (Memoized)
const ItemRow = ({ item, index, onEdit }) => {
  return (
    <tr
      className={`border-b transition-all hover:bg-blue-50/40 ${
        index % 2 === 0 ? "bg-white" : "bg-gray-50"
      }`}
    >
      <td className="p-3 font-medium text-gray-900">{item.name}</td>
      <td className="p-3 text-center text-gray-700 font-mono text-sm">
        {item.barcode}
      </td>
      <td className="p-3 text-center font-semibold text-blue-700">
        ₹{Number(item.price).toFixed(2)}
      </td>
      <td className="p-3 text-center text-gray-700">{item.gst}%</td>
      <td className="p-3 text-center">
        <StockBadge stock={item.stock} />
      </td>
      <td className="p-3 text-center">
        <button
          onClick={() => onEdit(item)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-1 mx-auto transition-all hover:shadow-lg active:scale-95"
        >
          <Edit size={16} /> Edit
        </button>
      </td>
    </tr>
  );
};

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [displayItems, setDisplayItems] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [stockFilter, setStockFilter] = useState("all");
  const tableRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load items once on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getAllItems();
      setItems(res || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Optimized filtering with debounce
  const handleSearch = useCallback((value) => {
    setSearch(value);
    setCurrentPage(1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      // Filtering happens in useMemo below
    }, 100);
  }, []);

  // Memoized filtered items
  const filtered = useMemo(() => {
    let result = items;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(searchLower) ||
          i.barcode.toLowerCase().includes(searchLower)
      );
    }

    // Apply stock filter
    if (stockFilter !== "all") {
      result = result.filter((i) => {
        if (stockFilter === "low") return i.stock > 0 && i.stock <= 5;
        if (stockFilter === "out") return i.stock <= 0;
        if (stockFilter === "instock") return i.stock > 5;
        return true;
      });
    }

    return result;
  }, [items, search, stockFilter]);

  // Memoized sorted items
  const sorted = useMemo(() => {
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle numeric values
      if (typeof aVal === "string" && /^\d+$/.test(aVal)) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }

      // Handle string comparison
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filtered, sortConfig]);

  // Memoized paginated items
  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIdx, startIdx + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  // Handle sort click
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  }, []);

  // Handle edit
  const handleEdit = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  // Handle reload
  const handleReload = useCallback(async () => {
    await loadItems();
  }, []);

  // Stock stats (memoized)
  const stockStats = useMemo(() => {
    return {
      total: items.length,
      inStock: items.filter((i) => i.stock > 5).length,
      low: items.filter((i) => i.stock > 0 && i.stock <= 5).length,
      outOfStock: items.filter((i) => i.stock <= 0).length,
    };
  }, [items]);

  const SortableHeader = ({ label, sortKey, className = "" }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th
        className={`p-3 text-left cursor-pointer select-none hover:bg-gray-200 transition ${className}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-2 justify-center">
          {label}
          {isActive ? (
            sortConfig.direction === "asc" ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )
          ) : (
            <div className="w-4 h-4"></div>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="p-6 animate-fadeSlide">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
              📦 Inventory
            </h1>
            <p className="text-gray-500 mt-1">
              Manage all your products in one place.
            </p>
          </div>
          <button
            onClick={handleReload}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg"
          >
            <RotateCcw size={18} className={loading ? "animate-spin" : ""} />
            Reload
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-popIn">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">Total Items</p>
          <p className="text-2xl font-bold text-blue-700">{stockStats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">In Stock</p>
          <p className="text-2xl font-bold text-green-700">{stockStats.inStock}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-700">{stockStats.low}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">Out of Stock</p>
          <p className="text-2xl font-bold text-red-700">{stockStats.outOfStock}</p>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="space-y-3 mb-6">
        {/* Search Bar */}
        <div className="bg-white/70 backdrop-blur-md shadow-lg rounded-2xl p-4 flex items-center gap-3 border border-gray-200 animate-popIn">
          <Search className="text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by name or barcode..."
            className="flex-1 outline-none text-lg bg-transparent"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full shadow font-semibold">
            {filtered.length}
          </div>
        </div>

        {/* Filter & Pagination Controls */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Stock Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: "all", label: "All", count: stockStats.total },
              { id: "instock", label: "In Stock", count: stockStats.inStock },
              { id: "low", label: "Low Stock", count: stockStats.low },
              { id: "out", label: "Out of Stock", count: stockStats.outOfStock },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setStockFilter(filter.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  stockFilter === filter.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {/* Items Per Page */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden animate-fadeInUp">
        <div className="overflow-x-auto" ref={tableRef}>
          <table className="w-full text-sm">
            {/* TABLE HEADER */}
            <thead className="bg-gray-100 sticky top-0 shadow-sm">
              <tr className="text-gray-700 uppercase text-xs tracking-wider">
                <SortableHeader label="Product" sortKey="name" />
                <SortableHeader label="Barcode" sortKey="barcode" className="text-center" />
                <SortableHeader label="Price" sortKey="price" className="text-center" />
                <SortableHeader label="GST" sortKey="gst" className="text-center" />
                <SortableHeader label="Stock" sortKey="stock" className="text-center" />
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => <ItemSkeleton key={i} />)
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => (
                  <ItemRow
                    key={item.item_id}
                    item={item}
                    index={index}
                    onEdit={handleEdit}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg font-medium">
                      No items found
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
        {!loading && paginatedItems.length > 0 && totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200 flex-wrap gap-3">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, sorted.length)} of{" "}
              <span className="font-bold">{sorted.length}</span> items
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SLIDE EDIT PANEL */}
      {selectedItem && (
        <EditItemPanel
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null);
            loadItems();
          }}
        />
      )}

      {/* ANIMATIONS */}
      <style>{`
        .animate-fadeSlide {
          animation: fadeSlide 0.4s ease-out;
        }
        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-popIn {
          animation: popIn 0.3s ease-out;
        }
        @keyframes popIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.4s ease-out;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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