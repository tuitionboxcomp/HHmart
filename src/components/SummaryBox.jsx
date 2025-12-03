export default function SummaryBox({ totals }) {
  return (
    <div className="bg-blue-50 border rounded-lg p-4">
      <h3 className="font-bold text-lg">Bill Summary</h3>

      <p>Subtotal: ₹{totals.subtotal.toFixed(2)}</p>
      <p>GST: ₹{totals.gstTotal.toFixed(2)}</p>

      {totals.discount > 0 && (
        <p className="text-red-600">
          Discount: -₹{totals.discount.toFixed(2)}
        </p>
      )}

      <p className="text-xl font-bold text-blue-700 mt-2">
        Total: ₹{totals.total.toFixed(2)}
      </p>

      <p className="text-sm text-gray-600">
        Items: {totals.itemCount}
      </p>
    </div>
  );
}
