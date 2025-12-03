import { useState } from "react";
import BillPreview from "./BillPreview";

// Base Components
import BarcodeInput from "../components/BarcodeInput";
import CartTable from "../components/CartTable";
import CustomerDetails from "../components/CustomerDetails";
import PaymentSection from "../components/PaymentSection";
import SummaryBox from "../components/SummaryBox";
import NotesBox from "../components/NotesBox";

// Feature Components
import ItemSearchModal from "../components/ItemSearchModal";
import HoldBillModal from "../components/HoldBillModal";
import QuickAddItemModal from "../components/QuickAddItemModal";
import ReturnBillingModal from "../components/ReturnBillingModal";

import {
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Save,
  X,
} from "lucide-react";

function Billing() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState([]);

  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("fixed");
  const [paymentType, setPaymentType] = useState("Cash");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [notes, setNotes] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const [lastBillId, setLastBillId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // -----------------------------------------
  // Barcode Scan
  // -----------------------------------------
  const handleScan = async (e) => {
    if (e.key !== "Enter") return;
    if (!barcode.trim()) return;

    try {
      const clean = barcode.trim();
      const item = await window.electronAPI.fetchItem(clean);

      if (!item) {
        setError("Item not found.");
        return;
      }

      const safePrice = Number(item.price);
      const safeGst = Number(item.gst);
      const safeStock = Number(item.stock ?? 999);

      const existing = cart.find((c) => c.item_id === item.item_id);

      if (existing) {
        updateQty(cart.indexOf(existing), existing.qty + 1);
      } else {
        setCart((prev) => [
          ...prev,
          {
            item_id: item.item_id,
            name: item.name,
            price: safePrice,
            gst: safeGst,
            qty: 1,
            stock: safeStock,
            category: item.category || "General",
          },
        ]);
        setSuccess(`✓ ${item.name} added`);
      }

      setTimeout(() => setSuccess(""), 1500);
      setBarcode("");
    } catch {
      setError("Scan error");
    }
  };

  // -----------------------------------------
  // Quantity Update
  // -----------------------------------------
  const updateQty = (index, qtyValue) => {
    const qty = Number(qtyValue);
    if (qty <= 0) return removeItem(index);

    const updated = [...cart];

    if (qty > updated[index].stock) {
      setError(`Only ${updated[index].stock} available`);
      return;
    }

    updated[index].qty = qty;
    setCart(updated);
  };

  // -----------------------------------------
  // Remove Item
  // -----------------------------------------
  const removeItem = (index) => {
    const name = cart[index].name;
    setCart(cart.filter((_, i) => i !== index));
    setSuccess(`✓ ${name} removed`);
    setTimeout(() => setSuccess(""), 1500);
  };

  // -----------------------------------------
  // Totals Calculation
  // -----------------------------------------
  const totals = (() => {
    let subtotal = 0,
      gstTotal = 0,
      itemCount = 0;

    cart.forEach((item) => {
      const p = Number(item.price);
      const g = Number(item.gst);
      const q = Number(item.qty);

      const line = p * q;
      const gstAmt = (line * g) / 100;

      subtotal += line;
      gstTotal += gstAmt;
      itemCount += q;
    });

    let finalDiscount =
      discountType === "percent"
        ? (subtotal * Number(discount)) / 100
        : Number(discount);

    finalDiscount = Math.min(finalDiscount, subtotal);

    return {
      subtotal,
      gstTotal,
      discount: finalDiscount,
      total: subtotal + gstTotal - finalDiscount,
      itemCount,
    };
  })();

  // -----------------------------------------
  // Save Bill
  // -----------------------------------------
  const saveBillToDB = async () => {
    if (!customerName.trim()) return setError("Customer name required");
    if (cart.length === 0) return setError("Cart is empty");

    try {
      const result = await window.electronAPI.saveBill({
        cart,
        totals,
        paymentType,
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
        notes,
        discountType,
        discount,
      });

      if (result.success) {
        setLastBillId(result.billId);
        setShowPreview(true);
      }
    } catch {
      setError("Failed to save bill");
    }
  };

  // -----------------------------------------
  // Clear Cart
  // -----------------------------------------
  const clearCart = () => {
    if (!cart.length) return;
    if (!confirm("Clear cart?")) return;

    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setNotes("");
    setDiscount(0);
    setError("");
  };

  // -----------------------------------------
  // Bill Preview
  // -----------------------------------------
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
          clearCart();
        }}
      />
    );
  }

  // -----------------------------------------
  // MAIN RESPONSIVE UI
  // -----------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 p-4 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">

        {/* HEADER */}
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-4">
          <ShoppingCart className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
          Billing System
        </h1>

        {/* FEATURE BUTTONS */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => setShowSearchModal(true)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Search Items</button>
          <button onClick={() => setShowHoldModal(true)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">Resume Hold Bills</button>
          <button onClick={() => setShowQuickAddModal(true)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Quick Add Item</button>
          <button onClick={() => setShowReturnModal(true)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Return / Exchange</button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg mb-2 flex items-center gap-2">
            <AlertCircle /> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg mb-2 flex items-center gap-2">
            <CheckCircle /> {success}
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-visible">

          {/* LEFT SECTION */}
          <div className="lg:col-span-2 space-y-4 overflow-visible">

            <BarcodeInput
              barcode={barcode}
              setBarcode={setBarcode}
              handleScan={handleScan}
            />

            <div className="max-h-[50vh] md:max-h-[60vh] overflow-auto">
              <CartTable
                cart={cart}
                updateQty={updateQty}
                removeItem={removeItem}
              />
            </div>

            <NotesBox notes={notes} setNotes={setNotes} />
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4 overflow-visible">

            <CustomerDetails
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              customerEmail={customerEmail}
              setCustomerEmail={setCustomerEmail}
            />

            <PaymentSection
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              discount={discount}
              setDiscount={setDiscount}
              discountType={discountType}
              setDiscountType={setDiscountType}
            />

            <SummaryBox totals={totals} />

            {/* STICKY BUTTONS */}
            <div className="sticky bottom-0 bg-slate-100 pt-2 pb-4">
              <button
                onClick={saveBillToDB}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-bold mb-2"
                disabled={cart.length === 0}
              >
                <Save className="inline w-5 h-5 mr-1" />
                Save & Print
              </button>

              <button
                onClick={clearCart}
                className="w-full bg-gray-300 py-3 rounded-lg font-bold"
                disabled={cart.length === 0}
              >
                <X className="inline w-5 h-5 mr-1" />
                Clear Cart
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* MODALS */}
      <ItemSearchModal
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectItem={(item) => {
          const exists = cart.find((c) => c.item_id === item.item_id);
          if (exists) {
            updateQty(cart.indexOf(exists), exists.qty + 1);
          } else {
            setCart((prev) => [
              ...prev,
              {
                item_id: item.item_id,
                name: item.name,
                price: Number(item.price),
                gst: Number(item.gst ?? 0),
                qty: 1,
                stock: Number(item.stock ?? 0),
              },
            ]);
          }
        }}
      />

      <HoldBillModal
        open={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        onResume={(bill) => {
          if (bill.items) setCart(bill.items);
          if (bill.customer_name) setCustomerName(bill.customer_name);
          if (bill.customer_phone) setCustomerPhone(bill.customer_phone);
          if (bill.customer_email) setCustomerEmail(bill.customer_email);
          if (bill.payment_type) setPaymentType(bill.payment_type);
          if (bill.notes) setNotes(bill.notes);
          setShowHoldModal(false);
        }}
      />

      <QuickAddItemModal
        open={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onCreated={(item) => {
          setCart((prev) => [
            ...prev,
            {
              item_id: item.item_id,
              name: item.name,
              price: Number(item.price),
              gst: Number(item.gst ?? 0),
              qty: 1,
              stock: Number(item.stock ?? 0),
            },
          ]);
        }}
      />

      <ReturnBillingModal
        open={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onReturn={(bill) => {
          if (bill.items) {
            setCart(
              bill.items.map((item) => ({
                ...item,
                qty: -Math.abs(Number(item.qty || 1)),
              }))
            );
            setCustomerName(bill.customer_name || "");
            setPaymentType(bill.payment_type || "Cash");
          }
        }}
      />

    </div>
  );
}

export default Billing;
