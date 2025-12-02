import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Sidebar from "./components/Sidebar";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar (Now a separate component) */}
      <Sidebar page={page} setPage={setPage} />

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        {page === "dashboard" && <Dashboard />}
        {page === "billing" && <Billing />}
      </div>

    </div>
  );
}

export default App;
