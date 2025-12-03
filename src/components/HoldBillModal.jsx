import { X } from "lucide-react";
import { useState, useEffect } from "react";

export default function HoldBillModal({ open, onClose, onResume }) {
  const [holds, setHolds] = useState([]);

  useEffect(() => {
    if (!open) return;
    loadHolds();
  }, [open]);

  const loadHolds = async () => {
    const saved = await window.electronAPI.getHoldBills();
    setHolds(saved || []);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg p-4 rounded-lg shadow-lg">

        <div className="flex justify-between mb-3">
          <h2 className="text-xl font-bold">Holded Bills</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="max-h-64 overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2">Items</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-center">Resume</th>
              </tr>
            </thead>

            <tbody>
              {holds.map((bill) => {
                const data = bill.data; // full JSON stored

                return (
                  <tr key={bill.id} className="border-b">

                    <td className="p-2">
                      {data.customer?.name || "No Name"}
                    </td>

                    <td className="p-2 text-center">
                      {data.cart?.length || 0}
                    </td>

                    <td className="p-2 text-right">
                      ₹{data.totals?.total?.toFixed(2) || "0.00"}
                    </td>

                    <td className="p-2 text-center">
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded"
                        onClick={async () => {
                          // fetch & delete bill from DB
                          const restored = await window.electronAPI.resumeHoldBill(bill.id);

                          if (restored) {
                            onResume(restored); // send loaded bill to Billing.jsx
                            onClose();
                          }
                        }}
                      >
                        Resume
                      </button>
                    </td>

                  </tr>
                );
              })}

              {!holds.length && (
                <tr>
                  <td colSpan="4" className="text-center p-3 text-gray-500">
                    No hold bills
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
