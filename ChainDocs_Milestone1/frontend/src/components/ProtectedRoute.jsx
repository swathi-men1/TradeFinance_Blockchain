
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({children}){
  return localStorage.getItem("token") ? children : <Navigate to="/" />
}
