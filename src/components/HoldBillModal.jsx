import { X, Trash2, Eye } from "lucide-react";
import { useState, useEffect } from "react";

export default function HoldBillModal({ open, onClose, onResume }) {
  const [holds, setHolds] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState(null); // View items modal

  // Load holds
  useEffect(() => {
    if (!open) return;
    loadHolds();
  }, [open]);

  const loadHolds = async () => {
    const saved = await window.electronAPI.getHoldBills();
    setHolds(saved || []);
  };

  // Delete Hold Bill
  const deleteHold = async (id) => {
    if (!confirm("Delete this hold bill?")) return;

    await window.electronAPI.resumeHoldBill(id); // resume API deletes the hold bill
    loadHolds();
  };

  // Search logic
  const filtered = holds.filter((bill) => {
    const name = bill.customer_name?.toLowerCase() || "";
    const phone = bill.customer_phone?.toLowerCase() || "";
    const q = search.toLowerCase();

    return name.includes(q) || phone.includes(q) || String(bill.id).includes(q);
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 transition-opacity animate-fadeIn"
    >
      <div className="bg-white w-full max-w-2xl p-5 rounded-xl shadow-lg animate-slideUp relative">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Hold Bills</h2>
          <button onClick={onClose}><X size={22} /></button>
        </div>

        {/* SEARCH BAR */}
        <input
          type="text"
          placeholder="Search by name, phone, or bill ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
        />

        {/* TABLE */}
        <div className="max-h-96 overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-center">Items</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((bill) => {
                const items = bill.items || [];

                return (
                  <tr key={bill.id} className="border-b hover:bg-gray-50">
                    {/* Customer */}
                    <td className="p-2">
                      <div className="font-semibold">
                        {bill.customer_name || "Walk-in Customer"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {bill.customer_phone || ""}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(bill.created_at).toLocaleString()}
                      </div>
                    </td>

                    {/* Items Count */}
                    <td className="p-2 text-center">
                      {items.length}
                    </td>

                    {/* Total */}
                    <td className="p-2 text-right">
                      ₹{Number(bill.total).toFixed(2)}
                    </td>

                    {/* ACTION BUTTONS */}
                    <td className="p-2 text-center space-x-2">

                      {/* View Items */}
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded inline-flex items-center gap-1"
                        onClick={() => setSelectedItems(items)}
                      >
                        <Eye size={16} /> View
                      </button>

                      {/* Resume */}
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded"
                        onClick={async () => {
                          const restored = await window.electronAPI.resumeHoldBill(bill.id);
                          if (restored) {
                            onResume(restored);
                            onClose();
                          }
                        }}
                      >
                        Resume
                      </button>

                      {/* Delete */}
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded inline-flex items-center gap-1"
                        onClick={() => deleteHold(bill.id)}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500">
                    No hold bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ITEM VIEW MODAL */}
      {selectedItems && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn"
        >
          <div className="bg-white p-5 rounded-xl w-full max-w-md animate-slideUp relative">
            <div className="flex justify-between mb-3">
              <h3 className="text-xl font-bold">Items</h3>
              <button onClick={() => setSelectedItems(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="max-h-80 overflow-auto">
              {selectedItems.map((item, i) => (
                <div key={i} className="border-b py-2">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    Qty: {item.qty} | Price: ₹{item.price} | GST: {item.gst}%
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedItems(null)}
              className="mt-4 w-full bg-gray-200 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ANIMATIONS */
<style>
{`
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .animate-slideUp {
    animation: slideUp 0.25s ease-out;
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0px); opacity: 1; }
  }
`}
</style>
