import { X } from "lucide-react";
import { useState } from "react";

export default function QuickAddItemModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [gst, setGst] = useState("");
  const [stock, setStock] = useState("");

  if (!open) return null;

  const saveItem = async () => {
    if (!name.trim() || !price) return;

    const item = await window.electronAPI.quickAddItem({
      name,
      price: Number(price),
      gst: Number(gst) || 0,
      stock: Number(stock) || 0,
      barcode: null,
      category: "General"
    });

    if (item) {
      onCreated(item);   // add to cart in billing
      onClose();

      // Reset form
      setName("");
      setPrice("");
      setGst("");
      setStock("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg p-4">

        <div className="flex justify-between mb-3">
          <h2 className="text-xl font-bold">Quick Add Item</h2>
          <button onClick={onClose}><X /></button>
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

          <button
            className="w-full bg-blue-600 text-white py-2 rounded"
            onClick={saveItem}
          >
            Save Item
          </button>
        </div>

      </div>
    </div>
  );
}
