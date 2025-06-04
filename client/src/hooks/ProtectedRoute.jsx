import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Loading from "../components/Loading";

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useUser();

    if (loading) return <Loading />;

    if (!user) {
        return <Navigate to="/login" replace />;
    }


    return children;
};

export default ProtectedRoute;