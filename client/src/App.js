import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import Register from "./pages/Register";
import Login from "./pages/Login";
import CodeEditor from "./pages/CodeEditor";

import AdminProblemEdit from "./pages/admin/AdminProblemEdit";
import AdminUserEdit from "./pages/admin/AdminUserEdit";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProblems from "./pages/admin/AdminProblems";
import AdminDashboard from "./pages/admin/AdminDashboard";

import ProtectedRoute from "./hooks/ProtectedRoute";
import PublicOnlyRoute from "./hooks/PublicOnlyRoute";
import AdminRoute from "./hooks/AdminRoute";

import './App.css';
import Problems from "./pages/Problems";

function App() {
  return (

    <BrowserRouter>
        <Routes>

            <Route path="*" element={<NotFound />} />
            <Route path="/" element={<ProtectedRoute> {<Index />} </ProtectedRoute>} />

            <Route path="/profile" element={<ProtectedRoute> {<Profile />} </ProtectedRoute>} />
            <Route path="/problems" element={<ProtectedRoute> {<Problems />} </ProtectedRoute>} />
            <Route path="/editor/:id" element={<ProtectedRoute> {<CodeEditor />} </ProtectedRoute>} />

            <Route path="/register" element={<PublicOnlyRoute> {<Register />} </PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute> {<Login />} </PublicOnlyRoute>} />

            <Route path="/admin/users" element={<AdminRoute> {<AdminUsers />} </AdminRoute>} />
            <Route path="/admin/user/add" element={<AdminRoute> {<AdminUserEdit />} </AdminRoute>} />
            <Route path="/admin/user/:id" element={<AdminRoute> {<AdminUserEdit />} </AdminRoute>} />

            <Route path="/admin/problems" element={<AdminRoute> {<AdminProblems />} </AdminRoute>} />
            <Route path="/admin/problem/add" element={<AdminRoute> {<AdminProblemEdit />} </AdminRoute>} />
            <Route path="/admin/problem/:id" element={<AdminRoute> {<AdminProblemEdit />} </AdminRoute>} />

            <Route path="/admin" element={<AdminRoute> {<AdminDashboard />} </AdminRoute>} />


            
        </Routes>
    </BrowserRouter>
  );
  
}

export default App;
