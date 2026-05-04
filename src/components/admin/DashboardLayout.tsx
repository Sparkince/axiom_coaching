import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { LayoutDashboard, Calendar, Clock, Lock, Settings, LogOut, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
    { to: "/admin/appointments", icon: Calendar, label: "Appointments" },
    { to: "/admin/services", icon: Briefcase, label: "Services" },
    { to: "/admin/hours", icon: Clock, label: "Business Hours" },
    { to: "/admin/blocks", icon: Lock, label: "Blocked Dates" },
    { to: "/admin/settings", icon: Settings, label: "Settings" }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-10">
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <span className="font-serif text-xl text-slate-900">Admin Portal</span>
        </div>
        <nav className="flex-1 py-8 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                "flex items-center px-4 py-3 rounded-xl transition-all text-sm font-medium",
                isActive 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 pl-8 pr-12 py-10 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
