import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg ${
      isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="p-5 border-b">
          <h1 className="text-xl font-bold">PC Parts Admin</h1>
          <p className="text-sm text-gray-500">Manage store</p>
        </div>

        <nav className="p-3 space-y-1">
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/categories" className={linkClass}>Categories</NavLink>
          <NavLink to="/products" className={linkClass}>Products</NavLink>
          <NavLink to="/orders" className={linkClass}>Orders</NavLink>
          <NavLink to="/support" className={linkClass}>Support</NavLink>
        </nav>

        <div className="p-3 mt-auto">
          <button
            onClick={logout}
            className="w-full px-3 py-2 rounded-lg bg-black text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="text-gray-600">Admin Panel</div>
          <div className="text-sm text-gray-500">Logged in</div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
