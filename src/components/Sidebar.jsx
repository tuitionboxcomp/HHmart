import { useState } from "react";
import { LayoutDashboard, Receipt, Menu } from "lucide-react";

function Sidebar({ page, setPage }) {
  const [collapsed, setCollapsed] = useState(false);

  const NavItem = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setPage(id)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full
        ${page === id ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"}
        ${collapsed ? "justify-center" : ""}
      `}
    >
      <Icon className="w-5 h-5" />
      {!collapsed && <span>{label}</span>}
    </button>
  );

  return (
    <div
      className={`h-full bg-gray-900 text-white transition-all duration-300 flex flex-col
        ${collapsed ? "w-20" : "w-64"}
      `}
    >

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <h2 className="text-xl font-bold">Mart Billing</h2>}
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
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 text-center text-gray-400 text-sm">
        {!collapsed && "© 2025 Mart Billing System"}
      </div>

    </div>
  );
}

export default Sidebar;
