import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Loading from "../components/Loading";

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useUser();

    if (loading) return <Loading />;

    if (user?.isAdmin !== 1) {
        return <Navigate to="/" replace />;
    }


    return children;
};

export default ProtectedRoute;