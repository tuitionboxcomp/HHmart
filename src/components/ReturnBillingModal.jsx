import { X } from "lucide-react";
import { useState } from "react";

export default function ReturnBillingModal({ open, onClose, onReturn }) {
  const [billId, setBillId] = useState("");

  if (!open) return null;

  const loadBill = async () => {
    if (!billId.trim()) {
      alert("Please enter a bill ID");
      return;
    }

    const bill = await window.electronAPI.getBillForReturn(billId);

    if (!bill) {
      alert("Bill not found");
      return;
    }

    onReturn(bill);   // Billing.jsx handles negative qty conversion
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-4 max-w-md w-full rounded-lg">

        <div className="flex justify-between mb-3">
          <h2 className="text-xl font-bold">Return / Exchange</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <input
          className="w-full border p-2 rounded"
          placeholder="Enter Bill ID"
          value={billId}
          onChange={(e) => setBillId(e.target.value)}
        />

        <button
          className="w-full bg-red-600 text-white py-2 rounded mt-3"
          onClick={loadBill}
        >
          Load Bill
        </button>

      </div>
    </div>
  );
}
