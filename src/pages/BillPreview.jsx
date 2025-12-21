import { useState, useRef } from "react";
import {
  Printer,
  Download,
  X,
  Check,
  Copy,
  MessageCircle,
} from "lucide-react";

export default function BillPreview({
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
  const [previewMode, setPreviewMode] = useState("thermal");

  const thermalRef = useRef(null);
  const invoiceRef = useRef(null);

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
    navigator.clipboard.writeText(String(billId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==============================================================  
  // 🌟 UNIVERSAL THERMAL PRINT (42mm WIDTH + LEFT SHIFT -2mm)  
  // ==============================================================  
  const handleThermalPrint = () => {
    const printContents = thermalRef.current.innerHTML;
    const win = window.open("", "_blank", "width=260,height=800");

    win.document.write(`
      <html>
      <head>
        <title>Bill #${billId}</title>
        <style>
          @page { size: 58mm auto; margin: 0; }
          body {
            margin: 0;
            padding: 0;
            width: 58mm;
            background: white;
            font-family: monospace;
          }
          .thermal-safe {
            width: 42mm !important;
            margin: 0 auto !important;
            margin-left: 1mm !important;   /* ⭐ SHIFT LEFT SAFELY */
            padding: 0;
            font-size: 11px;
            line-height: 1.25;
            box-sizing: border-box;
            word-wrap: break-word;
            overflow-wrap: break-word;
            text-align: left;
          }
        </style>
      </head>

      <body>
        <div class="thermal-safe">${printContents}</div>
      </body>
      </html>
    `);

    win.document.close();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };

  const handleInvoicePrint = () => {
    const content = invoiceRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=1000");

    win.document.write(`
      <html>
      <head>
        <title>Invoice #${billId}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: system-ui, sans-serif; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);

    win.document.close();
    win.print();
    win.close();
  };

  const handlePDF = async () => {
    await window.electronAPI.generatePDF({
      billId,
      cart,
      totals,
      customer: {
        name: customerName || "Walk-in",
        phone: customerPhone || "",
        email: customerEmail || "",
        notes,
      },
      paymentType,
    });
  };

  const handleWhatsApp = () => {
    if (!customerPhone) return alert("No phone number");
    const msg = `Hi ${customerName || "Customer"},
Bill ID: ${billId}
Total: ₹${totals.total.toFixed(2)}

Thank you!
HH Mart, Shivamogga`;
    window.open(`https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`);
  };

  // ===============================
  // 🧾 Thermal Receipt UI — with left shift  
  // ===============================
  const ThermalMode = () => (
    <div
      style={{
        width: "42mm",
        margin: "0 auto",
        marginLeft: "-2mm",     /* ⭐ SAME LEFT SHIFT IN PREVIEW */
        padding: 0,
        fontFamily: "monospace",
        fontSize: "11px",
        lineHeight: "1.25",
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: "1px dashed #444", paddingBottom: "2mm" }}>
        <div style={{ fontWeight: "bold" }}>HH MART • SHIVAMOGGA</div>
        <div style={{ fontSize: "10px" }}>Customer Receipt</div>
        <div style={{ fontSize: "10px" }}>Bill ID: {billId}</div>
        <div style={{ fontSize: "10px" }}>{billDate} • {billTime}</div>
      </div>

      {/* Customer Block */}
      <div style={{ borderBottom: "1px dashed #444", marginBottom: "2mm", paddingTop: "1mm" }}>
        <div style={{ fontWeight: "bold" }}>{customerName || "Walk-in Customer"}</div>
        {customerPhone && <div style={{ fontSize: "10px" }}>📱 {customerPhone}</div>}
      </div>

      {/* Items */}
      <div style={{ borderBottom: "1px dashed #444", paddingBottom: "2mm" }}>
        {cart.map((item, i) => {
          const total = item.qty * item.price;
          const gstAmt = (total * item.gst) / 100;

          return (
            <div key={i} style={{ marginBottom: "2mm" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b style={{ maxWidth: "20mm", overflow: "hidden" }}>{item.name}</b>
                <span>{item.qty} × ₹{item.price}</span>
              </div>

              <div style={{ fontSize: "10px", display: "flex", justifyContent: "space-between" }}>
                <span>GST {item.gst}%</span>
                <span>₹{gstAmt.toFixed(2)}</span>
              </div>

              <div style={{ fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
                <span>Total</span>
                <span>₹{(total + gstAmt).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div style={{ borderBottom: "1px dashed #444", paddingBottom: "2mm", marginBottom: "2mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span>₹{totals.subtotal.toFixed(2)}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>GST</span>
          <span>₹{totals.gstTotal.toFixed(2)}</span>
        </div>

        {totals.discount > 0 && (
          <div style={{ color: "red", display: "flex", justifyContent: "space-between" }}>
            <span>Discount</span>
            <span>-₹{totals.discount}</span>
          </div>
        )}

        <div style={{ fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
          <span>Grand Total</span>
          <span>₹{totals.total.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: "10px" }}>
        <div>Payment: {paymentType}</div>
        <div>Thank you for shopping!</div>
        <div>Visit Again 🙏</div>
      </div>
    </div>
  );

  // ===============================
  // A4 Invoice  
  // ===============================
  const InvoiceMode = () => (
    <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-auto" style={{ fontFamily: "system-ui" }}>
      <h2 className="text-3xl font-bold mb-4">Tax Invoice</h2>
      <p><b>Bill ID:</b> {billId}</p>
      <p><b>Date:</b> {billDate} {billTime}</p>
      <p><b>Name:</b> {customerName || "Walk-in Customer"}</p>
      <p><b>Phone:</b> {customerPhone || "—"}</p>
      <hr className="my-4" />
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Item</th>
            <th className="p-2 border">Qty</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">GST</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((i, idx) => {
            const total = i.qty * i.price;
            const gst = (total * i.gst) / 100;
            return (
              <tr key={idx}>
                <td className="p-2 border">{i.name}</td>
                <td className="p-2 border text-center">{i.qty}</td>
                <td className="p-2 border text-right">₹{i.price}</td>
                <td className="p-2 border text-right">{i.gst}%</td>
                <td className="p-2 border text-right">₹{(total + gst).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="text-right mt-4 text-lg font-bold">
        Total: ₹{totals.total.toFixed(2)}
      </div>
    </div>
  );

  // ===============================
  // MAIN WRAPPER UI  
  // ===============================
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">

        <div className="flex justify-between items-center bg-white border-b p-4">
          <h2 className="text-xl font-bold">Bill Preview</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <div className="p-3 border-b flex gap-2 bg-white">
          <button
            onClick={() => setPreviewMode("thermal")}
            className={`px-4 py-2 rounded-full ${previewMode === "thermal" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Thermal 58mm
          </button>

          <button
            onClick={() => setPreviewMode("invoice")}
            className={`px-4 py-2 rounded-full ${previewMode === "invoice" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Invoice A4
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <div ref={thermalRef} style={{ display: previewMode === "thermal" ? "block" : "none" }}>
            <ThermalMode />
          </div>

          <div ref={invoiceRef} style={{ display: previewMode === "invoice" ? "block" : "none" }}>
            <InvoiceMode />
          </div>
        </div>

        <div className="p-4 border-t grid grid-cols-2 md:grid-cols-5 gap-3 bg-white">

          <button onClick={handleThermalPrint} className="bg-blue-600 text-white p-3 rounded-lg flex gap-2 justify-center">
            <Printer /> Thermal
          </button>

          <button onClick={handleInvoicePrint} className="bg-gray-700 text-white p-3 rounded-lg flex gap-2 justify-center">
            <Printer /> Invoice
          </button>

          <button onClick={handlePDF} className="bg-pink-600 text-white p-3 rounded-lg flex gap-2 justify-center">
            <Download /> PDF
          </button>

          {customerPhone && (
            <button onClick={handleWhatsApp} className="bg-green-600 text-white p-3 rounded-lg flex gap-2 justify-center">
              <MessageCircle /> WhatsApp
            </button>
          )}

          <button
            onClick={copyBillId}
            className={`p-3 rounded-lg flex justify-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-black text-white"}`}
          >
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy ID"}
          </button>

        </div>
      </div>
    </div>
  );
}
