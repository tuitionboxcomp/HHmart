import { useState } from "react";

export default function PaymentSection({
  paymentType,
  setPaymentType,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  onOpenSplit
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h3 className="font-bold text-lg mb-2">Payment</h3>

      <select
        value={paymentType}
        onChange={(e) => setPaymentType(e.target.value)}
        className="w-full mb-3 border rounded px-3 py-2"
      >
        <option>Cash</option>
        <option>UPI</option>
        <option>Card</option>
        <option>Credit</option>
        <option>Cheque</option>

        {/* NEW */}
        <option>Split</option>
      </select>

      {/* SHOW SPLIT BUTTON ONLY WHEN "Split" SELECTED */}
      {paymentType === "Split" && (
        <button
          onClick={onOpenSplit}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium mb-3"
        >
          Enter Split Payment
        </button>
      )}

      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          onClick={() => setDiscountType("fixed")}
          className={`py-2 rounded ${
            discountType === "fixed"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
        >
          Fixed
        </button>

        <button
          onClick={() => setDiscountType("percent")}
          className={`py-2 rounded ${
            discountType === "percent"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
        >
          %
        </button>
      </div>

      <div className="relative">
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Discount"
        />
        <span className="absolute right-3 top-2">
          {discountType === "percent" ? "%" : "₹"}
        </span>
      </div>
    </div>
  );
}
