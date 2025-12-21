import { useState, useRef, useEffect } from "react";
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
import SplitPaymentModal from "../components/SplitPaymentModal";

import {
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Save,
  X,
  Loader,
  Printer,
  FileText,
  Zap,
} from "lucide-react";

// Toast Component
function BillGenerationToast({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4 pointer-events-auto">
        {/* Main Toast Content */}
        <div className="flex flex-col items-center justify-center space-y-6">
          
          {/* Animated Icon Container */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
            
            {/* Middle rotating ring (opposite direction) */}
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-green-500 border-l-pink-500 animate-spin" style={{ animationDirection: 'reverse' }}></div>
            
            {/* Inner pulsing container */}
            <div className="relative z-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-6 animate-pulse">
              <FileText className="w-12 h-12 text-white animate-bounce" />
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Generating Bill
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              Please wait while we process your bill...
            </p>
          </div>

          {/* Loading Steps */}
          <div className="w-full space-y-3">
            <div className="flex items-center space-x-3 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white animate-pulse">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-gray-700 font-medium">Calculating totals</p>
            </div>

            <div className="flex items-center space-x-3 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500 text-white animate-pulse">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <p className="text-gray-700 font-medium">Processing payment</p>
            </div>

            <div className="flex items-center space-x-3 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-pink-500 text-white animate-pulse">
                  <Printer className="w-4 h-4" />
                </div>
              </div>
              <p className="text-gray-700 font-medium">Preparing print</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full animate-[slideIn_2s_ease-in-out_infinite]"
              style={{
                width: '100%',
                animation: 'slideIn 2s ease-in-out infinite'
              }}
            ></div>
          </div>

          {/* Status text */}
          <p className="text-xs md:text-sm text-gray-500 font-semibold tracking-wider">
            <span className="animate-pulse">●</span> PROCESSING
          </p>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideIn {
            0%, 100% {
              transform: translateX(-100%);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateX(100%);
              opacity: 0;
            }
          }

          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      </div>
    </div>
  );
}

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

  // Bill generation toast state
  const [showGeneratingToast, setShowGeneratingToast] = useState(false);

  // Modals
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);

  // Refs for focus management
  const barcodeRef = useRef(null);
  const customerNameRef = useRef(null);
  const customerPhoneRef = useRef(null);
  const saveBtnRef = useRef(null);

  // Auto-focus barcode input on mount and after clearing cart
  useEffect(() => {
    if (!showPreview && barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, [showPreview, cart.length]);

  // -----------------------------------------
  // Barcode Scan with Enter Navigation
  // -----------------------------------------
  const handleScan = async (e) => {
    if (e.key !== "Enter") return;

    // If barcode is empty, move to customer name
    if (!barcode.trim()) {
      if (customerNameRef.current) {
        customerNameRef.current.focus();
      }
      return;
    }

    try {
      const clean = barcode.trim();
      const item = await window.electronAPI.fetchItem(clean);

      if (!item) {
        setError("Item not found.");
        setTimeout(() => setError(""), 2000);
        setBarcode("");
        return;
      }

      const safePrice = Number(item.price) || 0;
      const safeGst = Number(item.gst) || 0;
      const safeStock = Number(item.stock ?? 999);

      const existing = cart.find((c) => c.item_id === item.item_id);

      if (existing) {
        const existingIndex = cart.indexOf(existing);
        updateQty(existingIndex, existing.qty + 1);
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
        setTimeout(() => setSuccess(""), 1500);
      }

      setBarcode("");
      // Keep focus on barcode for continuous scanning
      if (barcodeRef.current) {
        barcodeRef.current.focus();
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError("Scan error");
      setTimeout(() => setError(""), 2000);
      setBarcode("");
    }
  };

  // -----------------------------------------
  // Customer Name Enter Handler
  // -----------------------------------------
  const handleCustomerNameEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (customerPhoneRef.current) {
        customerPhoneRef.current.focus();
      }
    }
  };

  // -----------------------------------------
  // Customer Phone Enter Handler
  // -----------------------------------------
  const handleCustomerPhoneEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (saveBtnRef.current) {
        saveBtnRef.current.focus();
      }
    }
  };

  // -----------------------------------------
  // Quantity Update
  // -----------------------------------------
  const updateQty = (index, qtyValue) => {
    const qty = Number(qtyValue);

    // block negative numbers
    if (qty < 0) {
      setError("Quantity cannot be negative");
      setTimeout(() => setError(""), 2000);
      return;
    }

    const updated = [...cart];

    if (qty > updated[index].stock) {
      setError(`Only ${updated[index].stock} available`);
      setTimeout(() => setError(""), 2000);
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
      const p = Number(item.price) || 0;
      const g = Number(item.gst) || 0;
      const q = Number(item.qty) || 0;

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
    finalDiscount = Math.max(0, finalDiscount);

    return {
      subtotal: Math.max(0, subtotal),
      gstTotal: Math.max(0, gstTotal),
      discount: finalDiscount,
      total: Math.max(0, subtotal + gstTotal - finalDiscount),
      itemCount,
    };
  })();

  // -----------------------------------------
  // Save Bill with Toast
  // -----------------------------------------
  const saveBillToDB = async () => {
    if (!customerName.trim()) {
      setError("Customer name required");
      setTimeout(() => setError(""), 2000);
      if (customerNameRef.current) {
        customerNameRef.current.focus();
      }
      return;
    }

    if (cart.length === 0) {
      setError("Cart is empty");
      setTimeout(() => setError(""), 2000);
      return;
    }

    // Show generating toast
    setShowGeneratingToast(true);

    try {
      // Simulate processing time or wait for actual API
      await new Promise(resolve => setTimeout(resolve, 2500));

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

      setShowGeneratingToast(false);

      if (result.success) {
        setLastBillId(result.billId);
        setShowPreview(true);
      } else {
        setError(result.message || "Failed to save bill");
        setTimeout(() => setError(""), 2000);
      }
    } catch (err) {
      setShowGeneratingToast(false);
      console.error("Save bill error:", err);
      setError("Failed to save bill");
      setTimeout(() => setError(""), 2000);
    }
  };

  // -----------------------------------------
  // Hold Bill
  // -----------------------------------------
  const saveHoldBillToDB = async () => {
    if (cart.length === 0) {
      setError("No items to hold");
      setTimeout(() => setError(""), 2000);
      return;
    }

    try {
      const result = await window.electronAPI.saveHoldBill({
        items: cart,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        payment_type: paymentType,
        notes,
        discountType,
        discount,
        totals,
      });

      if (result.success) {
        setSuccess("✓ Bill moved to Hold");
        setTimeout(() => setSuccess(""), 1500);
        clearCart();
      } else {
        setError(result.message || "Failed to save hold bill");
        setTimeout(() => setError(""), 2000);
      }
    } catch (err) {
      console.error("Hold bill error:", err);
      setError("Failed to save hold bill");
      setTimeout(() => setError(""), 2000);
    }
  };

  // -----------------------------------------
  // Clear Cart - Fixed to reset all states
  // -----------------------------------------
  const clearCart = () => {
    if (!cart.length) return;
    if (!confirm("Clear cart?")) return;

    // Reset all states
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setNotes("");
    setDiscount(0);
    setDiscountType("fixed");
    setPaymentType("Cash");
    setError("");
    setSuccess("");
    setBarcode("");

    // Refocus barcode input
    setTimeout(() => {
      if (barcodeRef.current) {
        barcodeRef.current.focus();
      }
    }, 100);
  };

  // -----------------------------------------
  // Bill Preview Close Handler - Fixed freezing issue
  // -----------------------------------------
  const handleClosePreview = () => {
    setShowPreview(false);
    setLastBillId(null);
    
    // Clear all states after preview
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setNotes("");
    setDiscount(0);
    setDiscountType("fixed");
    setPaymentType("Cash");
    setBarcode("");
    setError("");
    setSuccess("");

    // Refocus barcode input after a short delay
    setTimeout(() => {
      if (barcodeRef.current) {
        barcodeRef.current.focus();
      }
    }, 100);
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
        onClose={handleClosePreview}
      />
    );
  }

  // -----------------------------------------
  // MAIN UI
  // -----------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 p-4 flex flex-col">
      {/* Bill Generation Toast */}
      <BillGenerationToast isVisible={showGeneratingToast} />

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">

        {/* HEADER */}
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-4">
          <ShoppingCart className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
          Billing System
        </h1>

        {/* FEATURE BUTTONS */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button 
            onClick={() => setShowSearchModal(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Search Items
          </button>
          <button 
            onClick={() => setShowHoldModal(true)} 
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Resume Hold Bills
          </button>
          <button 
            onClick={() => setShowQuickAddModal(true)} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Quick Add Item
          </button>
          <button 
            onClick={() => setShowReturnModal(true)} 
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Return / Exchange
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg mb-2 flex items-center gap-2 animate-pulse">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg mb-2 flex items-center gap-2 animate-pulse">
            <CheckCircle className="w-5 h-5" /> {success}
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
              inputRef={barcodeRef}
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
              nameRef={customerNameRef}
              phoneRef={customerPhoneRef}
              onNameEnter={handleCustomerNameEnter}
              onPhoneEnter={handleCustomerPhoneEnter}
            />

            <PaymentSection
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              discount={discount}
              setDiscount={setDiscount}
              discountType={discountType}
              setDiscountType={setDiscountType}
              onOpenSplit={() => setShowSplitModal(true)}
            />

            <SummaryBox totals={totals} />

            {/* STICKY BUTTONS */}
            <div className="sticky bottom-0 bg-slate-100 pt-2 pb-4">

              {/* HOLD BILL */}
              <button
                onClick={saveHoldBillToDB}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-bold mb-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={cart.length === 0 || showGeneratingToast}
              >
                Hold Bill
              </button>

              {/* SAVE BILL */}
              <button
                ref={saveBtnRef}
                onClick={saveBillToDB}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold mb-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={cart.length === 0 || showGeneratingToast}
              >
                <Save className="w-5 h-5" />
                Save & Print
              </button>

              {/* CLEAR */}
              <button
                onClick={clearCart}
                className="w-full bg-gray-300 hover:bg-gray-400 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={cart.length === 0 || showGeneratingToast}
              >
                <X className="w-5 h-5" />
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
                price: Number(item.price) || 0,
                gst: Number(item.gst ?? 0),
                qty: 1,
                stock: Number(item.stock ?? 0),
                category: item.category || "General",
              },
            ]);
            setSuccess(`✓ ${item.name} added`);
            setTimeout(() => setSuccess(""), 1500);
          }
          setShowSearchModal(false);
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
          if (bill.discount !== undefined) setDiscount(bill.discount);
          if (bill.discountType) setDiscountType(bill.discountType);
          setShowHoldModal(false);
          setSuccess("✓ Bill resumed from hold");
          setTimeout(() => setSuccess(""), 1500);
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
              price: Number(item.price) || 0,
              gst: Number(item.gst ?? 0),
              qty: 1,
              stock: Number(item.stock ?? 0),
              category: item.category || "General",
            },
          ]);
          setShowQuickAddModal(false);
          setSuccess(`✓ ${item.name} added`);
          setTimeout(() => setSuccess(""), 1500);
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
            setSuccess("✓ Return bill loaded");
            setTimeout(() => setSuccess(""), 1500);
          }
          setShowReturnModal(false);
        }}
      />

      {/* SPLIT PAYMENT MODAL */}
      <SplitPaymentModal
        open={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        total={totals.total}
        onConfirm={(formatted) => {
          setPaymentType(formatted);
          setShowSplitModal(false);
          setSuccess("✓ Split payment configured");
          setTimeout(() => setSuccess(""), 1500);
        }}
      />

    </div>
  );
}

export default Billing;