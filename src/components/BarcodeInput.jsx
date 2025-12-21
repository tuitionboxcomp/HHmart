import { Search } from "lucide-react";

export default function BarcodeInput({ barcode, setBarcode, handleScan }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <label className="font-semibold text-sm mb-1 block">Scan Barcode</label>

      <div className="relative">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleScan}
          placeholder="Scan barcode & press Enter"
          className="w-full border px-3 py-2 rounded-lg"
          autoFocus
        />
        <Search className="absolute right-4 top-2 text-gray-400" />
      </div>
    </div>
  );
}
