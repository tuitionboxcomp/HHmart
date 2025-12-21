import { useState } from "react";
import {
  Package,
  Barcode,
  IndianRupee,
  Percent,
  Box,
  Layers,
  BadgePlus,
  CheckCircle,
  Loader2,
} from "lucide-react";

// 🔊 import sound
const successSound = new Audio("/success.mp3"); // <- Place sound file inside public folder

export default function AddItem() {
  const [form, setForm] = useState({
    barcode: "",
    name: "",
    price: "",
    gst: "",
    category: "",
    stock: "",
    buy_price: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const categories = [
    "Grocery",
    "Dairy",
    "Bakery",
    "Snacks",
    "Beverages",
    "Personal Care",
    "Household",
    "Fruits",
    "Vegetables",
    "Stationery",
  ];

  const [suggestions, setSuggestions] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "category") {
      const filtered = categories.filter((c) =>
        c.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    }
  };

  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Item name is required";
    if (!form.barcode.trim()) newErrors.barcode = "Barcode is required";
    if (!form.price) newErrors.price = "Selling price is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const submitItem = async () => {
    if (!validate()) return;

    setLoading(true);

    const res = await window.electronAPI.addNewItem(form);

    setLoading(false);

    if (res?.success) {
      setSuccess(true);
      successSound.play(); // 🔊 Play sound

      setForm({
        barcode: "",
        name: "",
        price: "",
        gst: "",
        category: "",
        stock: "",
        buy_price: "",
      });

      setTimeout(() => setSuccess(false), 2500);
    } else {
      alert("Failed to add item");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fadeIn">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-2xl shadow text-white mb-6 flex items-center gap-3">
        <BadgePlus size={42} className="opacity-90" />
        <div>
          <h1 className="text-3xl font-semibold">Add New Item</h1>
          <p className="text-sm text-blue-200">Create a new product for your inventory</p>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="mb-4 bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl shadow flex items-center gap-2 animate-slideDown">
          <CheckCircle /> Item added successfully! Add more?
        </div>
      )}

      {/* FORM CARD */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* NAME */}
        <InputField
          icon={Package}
          name="name"
          placeholder="Item Name"
          value={form.name}
          error={errors.name}
          onChange={handleChange}
        />

        {/* BARCODE */}
        <InputField
          icon={Barcode}
          name="barcode"
          placeholder="Barcode"
          value={form.barcode}
          error={errors.barcode}
          onChange={handleChange}
        />

        {/* PRICE */}
        <InputField
          icon={IndianRupee}
          name="price"
          type="number"
          placeholder="Selling Price"
          value={form.price}
          error={errors.price}
          onChange={handleChange}
        />

        {/* BUY PRICE */}
        <InputField
          icon={IndianRupee}
          name="buy_price"
          type="number"
          placeholder="Purchase Price"
          value={form.buy_price}
          onChange={handleChange}
        />

        {/* GST */}
        <InputField
          icon={Percent}
          name="gst"
          type="number"
          placeholder="GST % (optional)"
          value={form.gst}
          onChange={handleChange}
        />

        {/* STOCK */}
        <InputField
          icon={Box}
          name="stock"
          type="number"
          placeholder="Stock Quantity"
          value={form.stock}
          onChange={handleChange}
        />

        {/* CATEGORY WITH SUGGESTIONS */}
        <div className="relative md:col-span-2">
          <InputField
            icon={Layers}
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
          />

          {suggestions.length > 0 && (
            <div className="absolute z-50 bg-white shadow-lg rounded-xl mt-1 w-full max-h-40 overflow-auto border">
              {suggestions.map((category, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setForm({ ...form, category });
                    setSuggestions([]);
                  }}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {category}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SAVE BUTTON */}
        <div className="md:col-span-2">
          <button
            onClick={submitItem}
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 transition-all text-white py-4 rounded-xl text-lg font-bold shadow-lg flex items-center justify-center gap-2 ${
              loading ? "opacity-70" : ""
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Add Item"}
          </button>
        </div>
      </div>

      {/* CSS ANIMATIONS */}
      <style>{`
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px);} to { opacity: 1; transform: translateY(0);} }
      `}</style>
    </div>
  );
}

/* Reusable Input Component */
function InputField({ icon: Icon, error, ...props }) {
  return (
    <div className={`relative border rounded-xl p-4 flex items-center gap-3 
        bg-white hover:shadow-lg transition-all duration-200 ${
          error ? "border-red-500" : "border-gray-300"
        }`}>
      <Icon className="text-gray-500 w-6 h-6" />
      <input
        {...props}
        className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
      />
      {error && <span className="absolute -bottom-5 left-3 text-xs text-red-500">{error}</span>}
    </div>
  );
}
