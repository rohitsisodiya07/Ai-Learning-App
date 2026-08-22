import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Thoda sa buffer time ya turant localStorage check
        const token = localStorage.getItem("token");
        if (token && token !== "undefined" && token !== "null") {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
        setIsChecking(false);
    }, []);

    // Jab tak background check chal raha hai, blank login page par bhejne ki jagah loader dikhayein
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
                <div className="flex flex-col items-center gap-3 text-[#19b673]">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium text-slate-500">Loading your session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;