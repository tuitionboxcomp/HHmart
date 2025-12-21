import { X } from "lucide-react";
import { useState, useEffect } from "react";

export default function SplitPaymentModal({ open, onClose, total, onConfirm }) {
  const [cash, setCash] = useState("");
  const [upi, setUpi] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setCash("");
      setUpi("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const totalNum = Number(total);

  const validateAndConfirm = () => {
    const c = Number(cash);
    const u = Number(upi);

    if (c < 0 || u < 0) {
      setError("Amounts cannot be negative");
      return;
    }

    if (c + u !== totalNum) {
      setError(`Cash + UPI must equal Total (${totalNum})`);
      return;
    }

    const formatted = `Split | Cash: ${c} | UPI: ${u}`;
    onConfirm(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg animate-fadeIn relative">

        <button className="absolute top-3 right-3" onClick={onClose}>
          <X />
        </button>

        <h2 className="text-2xl font-bold mb-4">Split Payment</h2>

        <p className="text-gray-600 mb-4">Total Amount: <b>₹{total}</b></p>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Cash Amount</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">UPI Amount</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-3">{error}</div>
        )}

        <button
          onClick={validateAndConfirm}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold"
        >
          Confirm Split Payment
        </button>
      </div>

      <style>{`
        .animate-fadeIn {
          animation: fadeIn .25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
