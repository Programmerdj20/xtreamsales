import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Toaster } from 'sonner';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="flex-1 p-8 overflow-auto"><Outlet /></main>
      </div>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

