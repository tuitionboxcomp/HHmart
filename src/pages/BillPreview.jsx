import { useState } from "react";
import {
  Printer,
  Download,
  X,
  Check,
  Copy,
  MessageCircle,
  Eye,
} from "lucide-react";

function BillPreview({
  billId,
  cart,
  totals,
  paymentType,
  customerName,
  customerPhone,
  customerEmail, // still accepted for PDF, but no email feature
  notes,
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState("invoice"); // "invoice" | "thermal"

  const billDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const billTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const copyBillId = () => {
    if (!billId) return;
    navigator.clipboard.writeText(String(billId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePDF = async () => {
    // Match your main.js generatePDF signature:
    // (billId, cart, totals, customer, paymentType)
    await window.electronAPI.generatePDF({
      billId,
      cart,
      totals,
      customer: {
        name: customerName || "Walk-in",
        phone: customerPhone || "",
        email: customerEmail || "",
      },
      paymentType,
    });
  };

  const handleWhatsApp = () => {
    if (!customerPhone) {
      alert("No phone number provided for customer");
      return;
    }

    const message = `Hi ${customerName || "Customer"},\n\nBill ID: ${
      billId || ""
    }\nTotal: ₹${totals.total.toFixed(
      2
    )}\n\nThank you for your purchase!`;
    const encodedMessage = encodeURIComponent(message);

    // Use the customer number exactly as typed
    window.open(
      `https://wa.me/${encodeURIComponent(customerPhone)}?text=${encodedMessage}`,
      "_blank"
    );
  };

  // INVOICE MODE (Professional)
  const InvoiceMode = () => (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 md:px-8 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-0 mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">INVOICE</h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1">
              Professional Receipt
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xl md:text-2xl font-bold break-all">
              #{billId}
            </p>
            <p className="text-blue-100 text-[11px] md:text-xs mt-1">
              {billDate} • {billTime}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-8">
        {/* Customer Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-gray-200">
          <div>
            <p className="text-gray-500 text-[11px] font-semibold uppercase mb-1">
              Bill To
            </p>
            <p className="text-lg font-bold text-gray-900 break-words">
              {customerName || "Walk-in Customer"}
            </p>
            {customerPhone && (
              <p className="text-sm text-gray-600 mt-1 break-all">
                📱 {customerPhone}
              </p>
            )}
          </div>

          <div className="text-left md:text-right">
            <p className="text-gray-500 text-[11px] font-semibold uppercase mb-1">
              Payment Method
            </p>
            <p className="text-lg font-bold text-gray-900">
              {paymentType}
            </p>
            <div className="mt-2 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
              ✓ Completed
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6 md:mb-8 overflow-x-auto">
          <table className="w-full text-xs md:text-sm mb-4">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-3 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-900">
                  Description
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold text-gray-900">
                  Qty
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-right font-semibold text-gray-900">
                  Unit Price
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-right font-semibold text-gray-900">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cart.map((item, idx) => {
                const itemTotal = item.qty * item.price;
                const itemGst = (itemTotal * item.gst) / 100;
                const itemGrandTotal = itemTotal + itemGst;

                return (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <div>
                        <p className="font-medium text-gray-900 break-words">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          GST: {item.gst}%
                        </p>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-center text-gray-900 font-medium">
                      {item.qty}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-right text-gray-900 font-medium">
                      ₹{Number(item.price).toFixed(2)}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-right font-bold text-gray-900">
                      ₹{itemGrandTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 md:p-6 mb-4 md:mb-6 border border-blue-200">
          <div className="space-y-2 md:space-y-3 text-sm md:text-base">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Subtotal:</span>
              <span className="text-lg font-semibold text-gray-900">
                ₹{totals.subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">
                GST (Inclusive):
              </span>
              <span className="text-lg font-semibold text-blue-600">
                +₹{totals.gstTotal.toFixed(2)}
              </span>
            </div>

            {totals.discount > 0 && (
              <div className="flex justify-between items-center bg-white bg-opacity-50 px-3 py-2 rounded">
                <span className="text-gray-700 font-medium">Discount:</span>
                <span className="text-lg font-semibold text-red-600">
                  -₹{totals.discount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="border-t border-blue-300 pt-3 flex justify-between items-center">
              <span className="text-gray-900 font-bold text-lg">
                Grand Total:
              </span>
              <span className="text-2xl md:text-3xl font-bold text-blue-600">
                ₹{totals.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <p className="text-[11px] font-semibold text-amber-900 mb-1">
              NOTES:
            </p>
            <p className="text-xs md:text-sm text-amber-800 whitespace-pre-line">
              {notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 md:pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Thank you for your business! 🙏
          </p>
          <p className="text-[11px] text-gray-400 mt-1 md:mt-2">
            Invoice generated on {billDate} at {billTime}
          </p>
        </div>
      </div>
    </div>
  );

  // THERMAL RECEIPT MODE (80mm optimized)
  const ThermalMode = () => (
    <div className="bg-white rounded-lg shadow-lg w-[80mm] max-w-full mx-auto p-4 font-mono text-xs border border-gray-300">
      {/* Header */}
      <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
        <p className="font-bold text-base">RECEIPT</p>
        <p className="text-[11px] text-gray-600 break-all">
          Bill ID: {billId}
        </p>
        <p className="text-[11px] text-gray-600">
          {billDate} {billTime}
        </p>
      </div>

      {/* Customer Info */}
      <div className="mb-2 pb-2 border-b border-dashed border-gray-400">
        <p className="font-bold">
          {customerName || "Walk-in Customer"}
        </p>
        {customerPhone && (
          <p className="text-[11px] break-all">{customerPhone}</p>
        )}
      </div>

      {/* Items */}
      <div className="mb-2 pb-2 border-b border-dashed border-gray-400 space-y-1.5">
        {cart.map((item, idx) => {
          const itemTotal = item.qty * item.price;
          const itemGst = (itemTotal * item.gst) / 100;
          const itemGrandTotal = itemTotal + itemGst;

          return (
            <div key={idx}>
              <div className="flex justify-between gap-2">
                <span className="font-semibold break-words w-32">
                  {item.name}
                </span>
                <span>
                  {item.qty} x ₹{Number(item.price).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-600">
                <span>GST {item.gst}%</span>
                <span>₹{itemGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[11px]">
                <span>Total</span>
                <span>₹{itemGrandTotal.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="mb-2 pb-2 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST:</span>
          <span>₹{totals.gstTotal.toFixed(2)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-₹{totals.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base mt-1">
          <span>TOTAL:</span>
          <span>₹{totals.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="text-center text-[11px] pb-2 border-b border-dashed border-gray-400 mb-2">
        <p className="font-semibold">Payment: {paymentType}</p>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-gray-600 space-y-1">
        <p>Thank you!</p>
        <p>Visit Again</p>
      </div>
    </div>
  );

  return (
    <div className="bp-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bp-container bp-animated-panel bg-gray-50 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="bp-topbar sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                Bill Summary
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Bill ID: {billId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Preview Mode Selector */}
        <div className="bp-mode-switch bg-white border-b border-gray-200 px-4 sm:px-6 py-2 sm:py-3 flex flex-wrap gap-2">
          <button
            onClick={() => setPreviewMode("invoice")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-[15px] font-medium transition ${
              previewMode === "invoice"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Eye className="w-4 h-4" />
            Invoice
          </button>
          <button
            onClick={() => setPreviewMode("thermal")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-[15px] font-medium transition ${
              previewMode === "thermal"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Printer className="w-4 h-4" />
            Thermal 80mm
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50">
          <div className="bp-print-area flex justify-center">
            {previewMode === "invoice" ? <InvoiceMode /> : <ThermalMode />}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bp-actions sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm"
          >
            <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Print</span>
          </button>

          <button
            onClick={handlePDF}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">PDF</span>
          </button>

          {customerPhone && (
            <button
              onClick={handleWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">WhatsApp</span>
            </button>
          )}

          <button
            onClick={copyBillId}
            className={`${
              copied
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-500 hover:bg-gray-600"
            } text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm col-span-2 sm:col-span-1`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* Extra styles for print + animations */}
        <style>{`
          @keyframes bp-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes bp-slide-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .bp-overlay {
            animation: bp-fade-in 0.18s ease-out;
          }
          .bp-animated-panel {
            animation: bp-slide-up 0.22s ease-out;
          }
          @media print {
            /* Use the preview as the only printed content */
            .bp-overlay {
              position: static !important;
              inset: 0 !important;
              background: transparent !important;
              padding: 0 !important;
            }
            .bp-container {
              box-shadow: none !important;
              border-radius: 0 !important;
              max-width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
            }
            .bp-topbar,
            .bp-actions,
            .bp-mode-switch {
              display: none !important;
            }
            .bp-print-area {
              margin: 0 auto !important;
              padding: 0 !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default BillPreview;
