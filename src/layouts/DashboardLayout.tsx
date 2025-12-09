import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../Global/Header";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">

      <Sidebar />

      <div className="flex flex-col flex-1 overflow-auto">
        <Header />

        <main className="p-6 bg-slate-100 h-full overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
