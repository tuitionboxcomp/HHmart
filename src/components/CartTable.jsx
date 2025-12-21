import { ShoppingCart, Trash2 } from "lucide-react";

export default function CartTable({ cart = [], updateQty, removeItem }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h2 className="text-lg font-bold mb-2">Cart Items ({cart.length})</h2>

      {!cart.length ? (
        <div className="py-6 text-center text-gray-500">
          <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          Cart empty.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-2 py-2 text-left">Item</th>
              <th className="px-2 py-2 text-center">Qty</th>
              <th className="px-2 py-2 text-right">Price</th>
              <th className="px-2 py-2 text-right">GST</th>
              <th className="px-2 py-2 text-right">Total</th>
              <th className="px-2 py-2 text-center">Remove</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {cart.map((item, i) => {
              const price = Number(item.price);
              const gst = Number(item.gst);
              const qty = Number(item.qty);

              const line = price * qty;
              const gstAmt = (line * gst) / 100;
              const final = line + gstAmt;

              return (
                <tr key={i}>
                  <td className="px-2">{item.name}</td>

                  {/* QTY CONTROL WITH + / - BUTTONS */}
                  <td className="px-2 text-center">
                    <div className="flex items-center justify-center gap-2">

                      {/* - BUTTON */}
                      <button
                        onClick={() => updateQty(i, Math.max(0, qty - 1))}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 font-bold"
                      >
                        –
                      </button>

                      {/* INPUT - NO ARROWS */}
                      <input
                        type="text"
                        value={qty}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, ""); // digits only
                          const safeQty = val === "" ? 0 : Number(val);
                          updateQty(i, safeQty);
                        }}
                        className="w-12 border rounded text-center appearance-none"
                        style={{ MozAppearance: "textfield" }}
                      />

                      {/* + BUTTON */}
                      <button
                        onClick={() => updateQty(i, qty + 1)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 font-bold"
                      >
                        +
                      </button>

                    </div>
                  </td>

                  <td className="px-2 text-right">₹{price.toFixed(2)}</td>
                  <td className="px-2 text-right">{gst}%</td>
                  <td className="px-2 text-right">₹{final.toFixed(2)}</td>

                  <td className="px-2 text-center">
                    <button
                      onClick={() => removeItem(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
