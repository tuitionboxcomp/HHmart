export default function CustomerDetails({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h3 className="font-bold text-lg mb-2">Customer Details</h3>

      <input
        type="text"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder="Name *"
        className="w-full mb-2 border rounded px-3 py-2"
      />

      <input
        type="tel"
        value={customerPhone}
        onChange={(e) => setCustomerPhone(e.target.value)}
        placeholder="Phone"
        className="w-full mb-2 border rounded px-3 py-2"
      />

      <input
        type="email"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
        placeholder="Email"
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );
}
