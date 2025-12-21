import { useState } from "react";
import JsBarcode from "jsbarcode";
import {
  PlusCircle,
  Trash2,
  Printer,
  X,
  FilePlus,
  Hash,
  Ruler,
  BadgeIndianRupee,
} from "lucide-react";

export default function BarcodeGenerator() {
  const [form, setForm] = useState({
    name: "",
    weight: "",
    mrp: "",
  });

  const [labels, setLabels] = useState([]);
  const [printModal, setPrintModal] = useState(false);
  const [printMode, setPrintMode] = useState("same");
  const [sameQty, setSameQty] = useState(1);
  const [multiQty, setMultiQty] = useState({});
  const [previewLabels, setPreviewLabels] = useState([]);

  // Generate valid 12-digit EAN (auto checksum)
  const generateBarcodeCode = () => {
    const nine = Math.floor(100000000 + Math.random() * 900000000);
    return `890${nine}`;
  };

  const createBarcodeImage = (code) => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, code, {
      format: "EAN13",
      width: 2,
      height: 80,       // Increased height
      displayValue: true,
      fontSize: 12,
      margin: 0,
    });
    return canvas.toDataURL("image/png");
  };

  const addLabel = () => {
    if (!form.name || !form.weight || !form.mrp)
      return alert("Fill all fields");

    const code = generateBarcodeCode();
    const img = createBarcodeImage(code);

    const newLabel = {
      shop: "HH MART SHIMOGA",
      name: form.name,
      weight: form.weight,
      mrp: form.mrp,
      barcode: code,
      img,
    };

    setLabels([...labels, newLabel]);
    setForm({ name: "", weight: "", mrp: "" });
  };

  const openPrintModal = () => {
    if (labels.length === 0) return alert("Add at least one label first");
    setPrintModal(true);
  };

  const preparePrint = () => {
    let finalList = [];

    if (printMode === "same") {
      const base = labels[labels.length - 1];
      const qty = Math.min(Number(sameQty), 40);
      for (let i = 0; i < qty; i++) finalList.push(base);
    } else {
      labels.forEach((lbl, idx) => {
        const qty = Math.min(Number(multiQty[idx] || 0), 40);
        for (let i = 0; i < qty; i++) finalList.push(lbl);
      });
    }

    while (finalList.length < 40) finalList.push(null);

    setPreviewLabels(finalList.slice(0, 40));
    setPrintModal(false);

    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <FilePlus className="text-blue-600" /> Barcode Label Generator
      </h1>

      {/* FORM */}
      <div className="bg-white p-5 rounded-xl shadow grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center border p-2 rounded">
          <Hash className="text-gray-500 mr-2" />
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Item Name"
            className="flex-1 outline-none"
          />
        </div>

        <div className="flex items-center border p-2 rounded">
          <Ruler className="text-gray-500 mr-2" />
          <input
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            placeholder="Weight (1KG / 500G)"
            className="flex-1 outline-none"
          />
        </div>

        <div className="flex items-center border p-2 rounded">
          <BadgeIndianRupee className="text-gray-500 mr-2" />
          <input
            value={form.mrp}
            type="number"
            onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            placeholder="MRP ₹"
            className="flex-1 outline-none"
          />
        </div>

        <button
          onClick={addLabel}
          className="col-span-full bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold"
        >
          <PlusCircle /> Add Label
        </button>
      </div>

      {/* LABEL PREVIEW */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Labels ({labels.length})</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {labels.map((lbl, index) => (
            <div key={index} className="bg-white p-3 rounded-lg shadow flex justify-between">
              <div>
                <p className="font-bold">{lbl.name}</p>
                <p>{lbl.weight}</p>
                <p>MRP: ₹{lbl.mrp}</p>
                <p className="text-xs">{lbl.barcode}</p>
              </div>
              <button
                onClick={() => setLabels(labels.filter((_, i) => i !== index))}
                className="text-red-600"
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
      </div>

      {labels.length > 0 && (
        <button
          onClick={openPrintModal}
          className="mt-6 bg-green-600 text-white py-3 px-6 rounded-xl font-bold flex items-center gap-2"
        >
          <Printer /> Print Labels
        </button>
      )}

      {/* PRINT MODAL */}
      {printModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between mb-3">
              <h2 className="text-xl font-bold">Print Options</h2>
              <button onClick={() => setPrintModal(false)}>
                <X />
              </button>
            </div>

            <label className="font-semibold">Choose Print Mode:</label>

            <label className="flex items-center gap-2 mt-2">
              <input
                type="radio"
                checked={printMode === "same"}
                onChange={() => setPrintMode("same")}
              />
              Same Label (multiple copies)
            </label>

            <label className="flex items-center gap-2 mt-2">
              <input
                type="radio"
                checked={printMode === "multi"}
                onChange={() => setPrintMode("multi")}
              />
              Separate Labels
            </label>

            {printMode === "same" && (
              <div className="mt-4">
                <label className="font-semibold">Copies (max 40):</label>
                <input
                  type="number"
                  className="border w-full p-2 rounded mt-1"
                  min={1}
                  max={40}
                  value={sameQty}
                  onChange={(e) =>
                    setSameQty(Math.min(40, Number(e.target.value)))
                  }
                />
              </div>
            )}

            {printMode === "multi" && (
              <div className="mt-4 space-y-3">
                {labels.map((lbl, idx) => (
                  <div key={idx}>
                    <p className="font-semibold">
                      {lbl.name} ({lbl.weight})
                    </p>
                    <input
                      type="number"
                      className="border w-full p-2 rounded"
                      min={0}
                      max={40}
                      placeholder="Copies"
                      onChange={(e) =>
                        setMultiQty({
                          ...multiQty,
                          [idx]: Math.min(40, Number(e.target.value)),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={preparePrint}
              className="w-full bg-blue-600 text-white mt-5 py-3 rounded-lg font-bold"
            >
              Print Now
            </button>
          </div>
        </div>
      )}

      {/* PRINT GRID */}
      <div id="print-area">
        {previewLabels.map((lbl, i) =>
          lbl ? (
            <div className="label-box" key={i}>
              <p className="label-shop">HH MART SHIMOGA</p>
              <p className="label-line">{lbl.name} • {lbl.weight}</p>
              <p className="label-mrp">MRP ₹{lbl.mrp}</p>
              <img src={lbl.img} className="label-barcode" />
            </div>
          ) : (
            <div className="blank-box" key={i}></div>
          )
        )}
      </div>

      <style>{`
        @page {
          margin: 0 !important;
        }

        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #print-area, #print-area * {
            visibility: visible;
          }

          /* 🚀 PERFECT NO-GAP LABEL GRID */
          #print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;

            display: grid;
            grid-template-columns: repeat(4, 52.5mm);
            grid-template-rows: repeat(10, 29.7mm);
            gap: 0;
          }

          .label-box {
            width: 52.5mm;
            height: 29.7mm;
            padding: 1mm 1mm;
            border: 1px solid #000 !important;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }

          .blank-box {
            width: 52.5mm;
            height: 29.7mm;
          }
        }

        .label-shop {
          font-size: 8px;
          font-weight: bold;
          margin: 0;
        }

        .label-line {
          font-size: 8px;
          margin: 0;
        }

        .label-mrp {
          font-size: 8px;
          font-weight: bold;
          margin: 0;
        }

        .label-barcode {
          width: 100%;
          height: 18mm;
          object-fit: contain;
          margin-top: 1mm;
        }
      `}</style>
    </div>
  );
}
