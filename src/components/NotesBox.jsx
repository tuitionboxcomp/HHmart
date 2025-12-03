export default function NotesBox({ notes, setNotes }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <label className="font-semibold">Notes</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows="3"
        className="w-full border rounded px-3 py-2 mt-1"
        placeholder="Notes..."
      />
    </div>
  );
}
