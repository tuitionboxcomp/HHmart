import { useState } from "react";
import BillPreview from "./BillPreview";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Search,
  Package,
  DollarSign,
  Percent,
  User,
  Phone,
  MapPin,
  CreditCard,
  X,
  AlertCircle,
  CheckCircle,
  Save,
} from "lucide-react";

function Billing() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("fixed"); // fixed or percent
  const [paymentType, setPaymentType] = useState("Cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [lastBillId, setLastBillId] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [showItemSearch, setShowItemSearch] = useState(false);

  // FETCH ITEM BY BARCODE
  const handleScan = async (e) => {
    if (e.key === "Enter" && barcode.trim()) {
      try {
        setError("");
        const item = await window.electronAPI.fetchItem(barcode);

        if (!item) {
          setError("Item not found. Please check the barcode.");
          return;
        }

        // Check if item already in cart
        const existingItem = cart.find((cartItem) => cartItem.id === item.item_id);
        if (existingItem) {
          updateQty(cart.indexOf(existingItem), existingItem.qty + 1);
        } else {
          setCart((prevCart) => [
            ...prevCart,
            {
              id: item.item_id,
              name: item.name,
              price: item.price,
              gst: item.gst,
              qty: 1,
              category: item.category || "General",
              stock: item.stock || 999,
            },
          ]);
          setSuccess(`✓ ${item.name} added to cart`);
          setTimeout(() => setSuccess(""), 2000);
        }

        setBarcode("");
      } catch (err) {
        setError("Error scanning item. Please try again.");
      }
    }
  };

  // UPDATE QUANTITY
  const updateQty = (index, newQty) => {
    const updatedCart = [...cart];
    const qty = parseInt(newQty) || 1;

    if (qty <= 0) {
      removeItem(index);
      return;
    }

    if (qty > updatedCart[index].stock) {
      setError(`Only ${updatedCart[index].stock} units available in stock`);
      return;
    }

    updatedCart[index].qty = qty;
    setCart(updatedCart);
    setError("");
  };

  // REMOVE ITEM
  const removeItem = (index) => {
    const itemName = cart[index].name;
    setCart(cart.filter((_, i) => i !== index));
    setSuccess(`✓ ${itemName} removed from cart`);
    setTimeout(() => setSuccess(""), 2000);
  };

  // CALCULATE TOTALS
  const calculateTotals = () => {
    const result = cart.reduce(
      (acc, item) => {
        const itemTotal = item.price * item.qty;
        const itemGst = (itemTotal * item.gst) / 100;
        acc.subtotal += itemTotal;
        acc.gstTotal += itemGst;
        acc.itemCount += item.qty;
        return acc;
      },
      { subtotal: 0, gstTotal: 0, itemCount: 0, discount: 0, total: 0 }
    );

    // Apply discount
    let finalDiscount = 0;
    if (discountType === "percent") {
      finalDiscount = (result.subtotal * parseFloat(discount)) / 100;
    } else {
      finalDiscount = parseFloat(discount) || 0;
    }

    result.discount = Math.min(finalDiscount, result.subtotal);
    result.total = result.subtotal + result.gstTotal - result.discount;

    return result;
  };

  const totals = calculateTotals();

  // SAVE BILL AND SHOW PREVIEW
  const saveBillToDB = async () => {
    if (cart.length === 0) {
      setError("Please add items to the cart");
      return;
    }

    if (!customerName.trim()) {
      setError("Please enter customer name");
      return;
    }

    try {
      setError("");
      const result = await window.electronAPI.saveBill({
        cart,
        totals,
        paymentType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        notes: notes.trim(),
        discountType,
        discount,
      });

      if (result.success) {
        setLastBillId(result.billId);
        setSuccess("✓ Bill saved successfully!");
        setShowPreview(true);
      } else {
        setError(result.error || "Error saving bill");
      }
    } catch (err) {
      setError("Failed to save bill. Please try again.");
    }
  };

  // CLEAR CART
  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Are you sure you want to clear the cart?")) {
      setCart([]);
      setDiscount(0);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
      setError("");
      setSuccess("✓ Cart cleared");
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  // SHOW PREVIEW AFTER SAVE
  if (showPreview) {
    return (
      <BillPreview
        billId={lastBillId}
        cart={cart}
        totals={totals}
        paymentType={paymentType}
        customerName={customerName}
        customerPhone={customerPhone}
        customerEmail={customerEmail}
        notes={notes}
        onClose={() => {
          setShowPreview(false);
          setCart([]);
          setDiscount(0);
          setBarcode("");
          setCustomerName("");
          setCustomerPhone("");
          setCustomerEmail("");
          setNotes("");
          setError("");
          setSuccess("");
        }}
      />
    );
  }

  // MAIN BILLING SCREEN
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">

        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-blue-600" />
            Billing System
          </h1>
          <p className="text-gray-500 mt-1">Create professional invoices with real-time calculations</p>
        </div>

        {/* Alerts */}
        <div className="flex-shrink-0">
          {error && (
            <div className="mb-2 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-2 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow overflow-hidden">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-2">
            {/* Barcode Input */}
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                Scan Item Barcode
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={barcode}
                  placeholder="Scan or type barcode and press Enter..."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={handleScan}
                  autoFocus
                />
                <Search className="absolute right-4 top-2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Cart Items Table */}
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <h2 className="text-lg font-bold mb-2">Cart Items ({cart.length})</h2>
              {cart.length === 0 ? (
                <div className="text-center py-6">
                  <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Cart is empty. Scan items to add.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-2 py-2 text-left">Item</th>
                        <th className="px-2 py-2 text-center">Qty</th>
                        <th className="px-2 py-2 text-right">Price</th>
                        <th className="px-2 py-2 text-right">GST</th>
                        <th className="px-2 py-2 text-right">Total</th>
                        <th className="px-2 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cart.map((item, i) => {
                        const itemTotal = item.price * item.qty;
                        const itemGst = (itemTotal * item.gst) / 100;
                        const itemGrandTotal = itemTotal + itemGst;

                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-2 py-2">{item.name}</td>
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                value={item.qty}
                                min="1"
                                className="w-14 px-1 border rounded text-center"
                                onChange={(e) => updateQty(i, e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-2 text-right">₹{item.price.toFixed(2)}</td>
                            <td className="px-2 py-2 text-right">{item.gst}%</td>
                            <td className="px-2 py-2 text-right">₹{itemGrandTotal.toFixed(2)}</td>
                            <td className="px-2 py-2 text-center">
                              <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <label className="block text-sm font-semibold mb-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border rounded"
                placeholder="Add delivery instructions, etc..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 overflow-y-auto max-h-full pr-2">
            {/* Customer Details */}
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <h3 className="text-lg font-bold mb-2">Customer Details</h3>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Name *"
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone"
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            {/* Payment */}
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <h3 className="text-lg font-bold mb-2">Payment</h3>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full mb-2 px-3 py-2 border rounded"
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Credit</option>
                <option>Cheque</option>
              </select>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => setDiscountType("fixed")}
                  className={`py-2 px-3 rounded ${discountType === "fixed" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                >
                  Fixed
                </button>
                <button
                  onClick={() => setDiscountType("percent")}
                  className={`py-2 px-3 rounded ${discountType === "percent" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                >
                  %
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Discount"
                  className="w-full px-3 py-2 border rounded"
                />
                <span className="absolute right-3 top-2 text-gray-600">
                  {discountType === "percent" ? "%" : "₹"}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border">
              <h3 className="text-lg font-bold mb-2">Bill Summary</h3>
              <p>Subtotal: ₹{totals.subtotal.toFixed(2)}</p>
              <p>GST: ₹{totals.gstTotal.toFixed(2)}</p>
              {totals.discount > 0 && <p className="text-red-600">Discount: -₹{totals.discount.toFixed(2)}</p>}
              <p className="font-bold text-blue-600 text-xl mt-2">Total: ₹{totals.total.toFixed(2)}</p>
              <p className="text-xs text-gray-600">Items: {totals.itemCount}</p>
            </div>

            {/* Actions */}
            <div>
              <button
                onClick={saveBillToDB}
                disabled={cart.length === 0}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded mb-2"
              >
                <Save className="inline w-5 h-5 mr-1" />
                Save & Print
              </button>

              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded"
              >
                <X className="inline w-5 h-5 mr-1" />
                Clear Cart
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Billing;
