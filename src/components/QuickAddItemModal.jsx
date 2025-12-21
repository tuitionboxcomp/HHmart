import { X } from "lucide-react";
import { useState } from "react";
import Toast from "../components/Toast";

export default function QuickAddItemModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [gst, setGst] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
  };

  const saveItem = async () => {
    if (!name.trim() || !price) return;

    setLoading(true);
    showToast("Adding item...", "info");

    const item = await window.electronAPI.quickAddItem({
      name,
      price: Number(price),
      gst: Number(gst) || 0,
      stock: Number(stock) || 0,
      barcode: barcode || null,
      category: "General",
    });

    setLoading(false);

    if (item) {
      showToast("Product added successfully!", "success");

      onCreated(item);

      setTimeout(() => {
        onClose();
      }, 2000);

      // Reset all fields
      setName("");
      setPrice("");
      setGst("");
      setStock("");
      setBarcode("");
    } else {
      showToast("Failed to add product!", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      {/* Modal Box */}
      <div className="bg-white w-full max-w-md rounded-lg p-4">

        <div className="flex justify-between mb-3">
          <h2 className="text-xl font-bold">Quick Add Item</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="space-y-2">
          <input
            className="w-full border p-2 rounded"
            placeholder="Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full border p-2 rounded"
            placeholder="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <input
            className="w-full border p-2 rounded"
            placeholder="GST %"
            type="number"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
          />

          <input
            className="w-full border p-2 rounded"
            placeholder="Stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />

          <input
            className="w-full border p-2 rounded"
            placeholder="Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />

          <button
            disabled={loading}
            className={`w-full text-white py-2 rounded ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600"
            }`}
            onClick={saveItem}
          >
            {loading ? "Saving..." : "Save Item"}
          </button>
        </div>

      </div>

      {/* Toast (floating outside modal) */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast({ show: false, message: "", type: "info" })
          }
        />
      )}

    </div>
  );
}
