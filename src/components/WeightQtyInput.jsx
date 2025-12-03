export default function WeightQtyInput({ qty, onChange }) {
  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={qty}
      onChange={(e) => onChange(e.target.value)}
      className="w-20 border rounded text-center"
    />
  );
}
