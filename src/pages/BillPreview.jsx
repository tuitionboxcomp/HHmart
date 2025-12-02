import { useState } from "react";
import {
  Printer,
  Download,
  Share2,
  Mail,
  X,
  Check,
  Copy,
  MessageCircle,
  MoreVertical,
  Eye,
  Smartphone,
} from "lucide-react";

function BillPreview({
  billId,
  cart,
  totals,
  paymentType,
  customerName,
  customerPhone,
  customerEmail,
  notes,
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [previewMode, setPreviewMode] = useState("invoice"); // invoice or thermal

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
    navigator.clipboard.writeText(billId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePDF = () => {
    window.electronAPI.generatePDF({
      billId,
      cart,
      totals,
      customerName: customerName || "Walk-in",
      customerPhone,
      customerEmail,
      paymentType,
      notes,
      billDate,
      billTime,
    });
  };

  const handleEmail = () => {
    if (!customerEmail) {
      alert("No email provided for customer");
      return;
    }
    window.electronAPI.sendBillEmail({
      billId,
      cart,
      totals,
      customerName,
      customerEmail,
      paymentType,
    });
  };

  const handleWhatsApp = () => {
    if (!customerPhone) {
      alert("No phone number provided for customer");
      return;
    }
    const message = `Hi ${customerName || "Customer"},\n\nBill ID: ${billId}\nTotal: ₹${totals.total.toFixed(2)}\n\nThank you for your purchase!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/91${customerPhone}?text=${encodedMessage}`,
      "_blank"
    );
  };

  // INVOICE MODE (Professional)
  const InvoiceMode = () => (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">INVOICE</h1>
            <p className="text-blue-100 text-sm mt-1">Professional Receipt</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">#{billId}</p>
            <p className="text-blue-100 text-xs mt-1">
              {billDate} • {billTime}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Customer Section */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-gray-200">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase mb-2">
              Bill To
            </p>
            <p className="text-lg font-bold text-gray-900">
              {customerName || "Walk-in Customer"}
            </p>
            {customerPhone && (
              <p className="text-sm text-gray-600 mt-1">📱 {customerPhone}</p>
            )}
            {customerEmail && (
              <p className="text-sm text-gray-600">📧 {customerEmail}</p>
            )}
          </div>

          <div className="text-right">
            <p className="text-gray-500 text-xs font-semibold uppercase mb-2">
              Payment Method
            </p>
            <p className="text-lg font-bold text-gray-900">{paymentType}</p>
            <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
              ✓ Completed
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Description
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">
                  Qty
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">
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
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          GST: {item.gst}%
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 font-medium">
                      {item.qty}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ₹{itemGrandTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6 border border-blue-200">
          <div className="space-y-3">
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
              <span className="text-3xl font-bold text-blue-600">
                ₹{totals.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-xs font-semibold text-amber-900 mb-2">NOTES:</p>
            <p className="text-sm text-amber-800">{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Thank you for your business! 🙏
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Invoice generated on {billDate} at {billTime}
          </p>
        </div>
      </div>
    </div>
  );

  // THERMAL RECEIPT MODE
  const ThermalMode = () => (
    <div className="bg-white rounded-lg shadow-lg w-80 mx-auto p-4 font-mono text-sm border border-gray-300">
      {/* Thermal Header */}
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <p className="font-bold text-lg">RECEIPT</p>
        <p className="text-xs text-gray-600">Bill ID: {billId}</p>
        <p className="text-xs text-gray-600">
          {billDate} {billTime}
        </p>
      </div>

      {/* Customer Info */}
      <div className="text-sm mb-3 pb-2 border-b border-dashed border-gray-400">
        <p className="font-bold">{customerName || "Walk-in"}</p>
        {customerPhone && <p className="text-xs">{customerPhone}</p>}
      </div>

      {/* Items */}
      <div className="mb-3 pb-2 border-b border-dashed border-gray-400 space-y-2">
        {cart.map((item, idx) => {
          const itemTotal = item.qty * item.price;
          const itemGst = (itemTotal * item.gst) / 100;
          const itemGrandTotal = itemTotal + itemGst;

          return (
            <div key={idx}>
              <div className="flex justify-between">
                <span className="font-semibold break-words w-32">{item.name}</span>
                <span>{item.qty}x ₹{item.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-end text-xs text-gray-600">
                GST {item.gst}%: ₹{itemGst.toFixed(2)}
              </div>
              <div className="flex justify-between font-bold text-xs">
                <span></span>
                <span>₹{itemGrandTotal.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="mb-3 pb-2 border-b border-dashed border-gray-400 space-y-1 text-xs">
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
        <div className="flex justify-between font-bold text-base mt-2">
          <span>TOTAL:</span>
          <span>₹{totals.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="text-center text-xs pb-2 border-b border-dashed border-gray-400 mb-2">
        <p className="font-semibold">Payment: {paymentType}</p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 space-y-1">
        <p>Thank you!</p>
        <p>Visit Again</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-h-screen overflow-y-auto">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Check className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bill Summary</h2>
              <p className="text-sm text-gray-500">Bill ID: {billId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview Mode Selector */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-2">
          <button
            onClick={() => setPreviewMode("invoice")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              previewMode === "thermal"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Printer className="w-4 h-4" />
            Thermal
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 bg-gray-50">
          {previewMode === "invoice" ? <InvoiceMode /> : <ThermalMode />}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Printer className="w-5 h-5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={handlePDF}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {customerEmail && (
            <button
              onClick={handleEmail}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Mail className="w-5 h-5" />
              <span className="hidden sm:inline">Email</span>
            </button>
          )}

          {customerPhone && (
            <button
              onClick={handleWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          )}

          <button
            onClick={copyBillId}
            className={`${
              copied
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-400 hover:bg-gray-500"
            } text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span className="hidden sm:inline">Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* Close overlay when clicking outside */}
        <style>{`
          @media print {
            body * { display: none; }
            .no-print { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default BillPreview;