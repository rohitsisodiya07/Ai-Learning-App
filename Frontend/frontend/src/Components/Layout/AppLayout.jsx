import React, { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Responsive sidebar handling on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8f9fc] font-sans text-gray-800 selection:bg-[#19b673] selection:text-white">

      {/* SIDEBAR */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* MAIN AREA */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">

        {/* HEADER */}
        <Header toggleSidebar={toggleSidebar} />

        {/* PAGE CONTENT */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#f8f9fc] px-4 py-5 sm:px-5 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl min-h-full">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default AppLayout;