import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  // If already logged in, don't allow access to login page
  if (token) return <Navigate to="/dashboard" replace />;

  return children;
}
