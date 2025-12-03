import { X, Search } from "lucide-react";
import { useState, useEffect } from "react";

export default function ItemSearchModal({ open, onClose, onSelectItem }) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;

    // Fetch initial items (empty search)
    const fetchItems = async () => {
      const res = await window.electronAPI.searchItems("");
      setItems(res || []);
    };

    fetchItems();
  }, [open]);

  // ----------------------------------------
  // LIVE SEARCH — call backend search
  // ----------------------------------------
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      const res = await window.electronAPI.searchItems(search);
      setItems(res || []);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Search Items</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative mb-3">
          <input
            className="w-full border px-3 py-2 rounded-lg"
            placeholder="Search by name, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute right-3 top-2 text-gray-500" />
        </div>

        {/* ITEMS TABLE */}
        <div className="max-h-80 overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">Stock</th>
                <th className="p-2 text-center">Add</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.item_id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2 text-right">
                      ₹{Number(item.price).toFixed(2)}
                    </td>
                    <td className="p-2 text-right">{item.stock}</td>
                    <td className="p-2 text-center">
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded"
                        onClick={() => {
                          onSelectItem(item);
                          onClose();
                        }}
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-3 text-gray-500"
                  >
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
