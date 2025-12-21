import { useEffect } from "react";

export default function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 2000);
    return () => clearTimeout(timer);
  }, []);

  const colors = {
    info: "bg-blue-600",
    success: "bg-green-600",
    error: "bg-red-600",
  };

  return (
    <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg animate-slide-in ${colors[type]}`}>
      {message}
    </div>
  );
}
