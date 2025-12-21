import { useState, useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import AddItem from "./pages/AddItem";
import ItemList from "./pages/ItemList";
import BarcodeGenerator from "./pages/BarcodeGenerator";
import PreviousBills from "./pages/PreviousBills";

import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";

function App() {
  const [page, setPage] = useState("dashboard");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("loggedIn");
    if (saved === "true") setLoggedIn(true);
  }, []);

  const handleLogin = () => {
    localStorage.setItem("loggedIn", "true");
    setLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar page={page} setPage={setPage} onLogout={handleLogout} />

      <div className="flex-1 p-6 overflow-auto">
        {page === "dashboard" && <Dashboard />}
        {page === "billing" && <Billing />}
        {page === "add-item" && <AddItem />}
        {page === "item-list" && <ItemList />}
        {page === "barcode" && <BarcodeGenerator />}
        {page === "previous-bills" && <PreviousBills />}
      </div>
    </div>
  );
}

export default App;
