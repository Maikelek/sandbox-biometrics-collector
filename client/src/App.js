import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import AdminDashboard from "./pages/admin/AdminDashboard";

import './App.css';

function App() {
  return (
    <BrowserRouter>
        <Routes>

            <Route path="*" element={<Index />} />
            <Route path="/" element={<Index />} />

            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-register" element={<AdminRegister />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />


            
        </Routes>
    </BrowserRouter>
);
}

export default App;
