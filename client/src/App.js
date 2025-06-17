import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Profile from "./pages/Profile";

import Register from "./pages/Register";
import Login from "./pages/Login";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import AdminDashboard from "./pages/admin/AdminDashboard";

import ProtectedRoute from "./hooks/ProtectedRoute";
import PublicOnlyRoute from "./hooks/PublicOnlyRoute";

import './App.css';
import Problems from "./pages/Problems";

function App() {
  return (

    <BrowserRouter>
        <Routes>

            <Route path="*" element={<Index />} />
            <Route path="/" element={<ProtectedRoute> {<Index />} </ProtectedRoute>} />

            <Route path="/profile" element={<ProtectedRoute> {<Profile />} </ProtectedRoute>} />
            <Route path="/problems" element={<ProtectedRoute> {<Problems />} </ProtectedRoute>} />

            <Route path="/register" element={<PublicOnlyRoute> {<Register />} </PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute> {<Login />} </PublicOnlyRoute>} />

            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-register" element={<AdminRegister />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />


            
        </Routes>
    </BrowserRouter>
  );
  
}

export default App;
