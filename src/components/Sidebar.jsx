import { useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Plus,
  List,
  LogOut,
  Menu,
  Save,
  History,
} from "lucide-react";

function Sidebar({ page, setPage, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  const NavItem = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setPage(id)}
      className={`flex items-center gap-3 py-3 rounded-lg transition-all w-full
        ${collapsed ? "justify-center px-0" : "px-4"}
        ${
          page === id
            ? "bg-blue-600 text-white"
            : "text-gray-300 hover:bg-gray-700"
        }
      `}
    >
      <Icon className="w-5 h-5" />
      {!collapsed && <span>{label}</span>}
    </button>
  );

  return (
    <div
      className={`h-full bg-gray-900 text-white transition-all duration-300 flex flex-col overflow-hidden
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <h2 className="text-xl font-bold">HH Mart</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-700"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-2 mt-4 px-2">
        <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
        <NavItem id="billing" label="Billing" icon={Receipt} />
        <NavItem id="previous-bills" label="Previous Bills" icon={History} />
        <NavItem id="add-item" label="Add Item" icon={Plus} />
        <NavItem id="item-list" label="Item List" icon={List} />
        <NavItem id="barcode" label="Generate Barcode" icon={Save} />
      </div>

      {/* Logout */}
      <div className="mt-auto p-4">
        <button
          onClick={onLogout}
          className="w-full bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
