import { X, Save, Trash2 } from "lucide-react";
import { useState } from "react";

export default function EditItemPanel({ item, onClose }) {
  const [form, setForm] = useState(item);

  const update = async () => {
    await window.electronAPI.updateItem(form);
    onClose();
  };

  const deleteItem = async () => {
    if (!confirm("Delete this item?")) return;
    await window.electronAPI.deleteItem(form.item_id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // close when clicking outside
      }}
    >
      <div
        className="bg-white w-full md:max-w-md h-full shadow-2xl p-6 rounded-l-2xl animate-slideLeft flex flex-col overflow-y-auto"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Edit Item</h2>
          <button
            className="p-2 rounded hover:bg-gray-200 transition"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* FORM FIELDS */}
        <div className="flex-1">
          {[
            { name: "name", label: "Item Name" },
            { name: "barcode", label: "Barcode" },
            { name: "price", label: "Selling Price (₹)", type: "number" },
            { name: "buy_price", label: "Purchase Price (₹)", type: "number" },
            { name: "gst", label: "GST %", type: "number" },
            { name: "category", label: "Category" },
            { name: "stock", label: "Stock Qty", type: "number" },
          ].map((field) => (
            <div key={field.name} className="mb-5">
              <label className="block mb-1 text-sm font-semibold text-gray-700">
                {field.label}
              </label>

              <input
                type={field.type || "text"}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition shadow-sm"
                value={form[field.name]}
                onChange={(e) =>
                  setForm({ ...form, [field.name]: e.target.value })
                }
              />
            </div>
          ))}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="mt-4 flex gap-4 sticky bottom-0 bg-white py-4">
          <button
            onClick={update}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow 
                       flex items-center justify-center gap-2 transition"
          >
            <Save size={20} /> Save Changes
          </button>

          <button
            onClick={deleteItem}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl shadow 
                       flex items-center justify-center gap-2 transition"
          >
            <Trash2 size={20} /> Delete
          </button>
        </div>
      </div>

      <style>{`
        .animate-slideLeft {
          animation: slideLeft 0.35s ease-out;
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Mobile - full screen panel */
        @media (max-width: 768px) {
          .edit-panel {
            width: 100%;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
