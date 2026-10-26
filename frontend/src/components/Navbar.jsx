import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Radio, Activity, GitFork, Building2, BarChart3, RefreshCw, Key, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onTriggerSync, syncing }) => {
  const { user, logoutUser } = useAuth();
  return (
    <header className="w-full bg-[#FFFFFF] border-b border-[#D8DDD3] shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo / Tactical Insignia */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#2D3627] text-white flex items-center justify-center font-bold text-xl rounded-sm shadow-sm border border-[#4C5B42]">
            <Shield className="w-7 h-7 text-[#D7E3CC]" />
          </div>
          <div className="border-l border-[#CCD4C5] pl-4">
            <span className="font-extrabold text-2xl tracking-wider text-[#1F241C] block leading-none">SANGAM</span>
            <span className="text-[11px] font-semibold tracking-wider text-[#526046] uppercase block mt-1">Keep country secured</span>
          </div>
        </div>

        {/* Navigation links matching UI reference */}
        <nav className="hidden md:flex items-center space-x-1 font-semibold text-xs tracking-widest text-[#526046] uppercase">
          <NavLink 
            to="/" 
            className={({ isActive }) => `px-4 py-2 rounded-sm transition-all duration-150 ${isActive ? 'text-[#1F241C] border-b-2 border-[#2D3627] font-bold bg-[#F4F6F2]' : 'hover:text-[#1F241C] hover:bg-[#F8FAF7]'}`}
          >
            Overview
          </NavLink>
          <NavLink 
            to="/events" 
            className={({ isActive }) => `px-4 py-2 rounded-sm transition-all duration-150 ${isActive ? 'text-[#1F241C] border-b-2 border-[#2D3627] font-bold bg-[#F4F6F2]' : 'hover:text-[#1F241C] hover:bg-[#F8FAF7]'}`}
          >
            Intelligence Log
          </NavLink>
          <NavLink 
            to="/correlations" 
            className={({ isActive }) => `px-4 py-2 rounded-sm transition-all duration-150 ${isActive ? 'text-[#1F241C] border-b-2 border-[#2D3627] font-bold bg-[#F4F6F2]' : 'hover:text-[#1F241C] hover:bg-[#F8FAF7]'}`}
          >
            Cross-City Links
          </NavLink>
          <NavLink 
            to="/cities" 
            className={({ isActive }) => `px-4 py-2 rounded-sm transition-all duration-150 ${isActive ? 'text-[#1F241C] border-b-2 border-[#2D3627] font-bold bg-[#F4F6F2]' : 'hover:text-[#1F241C] hover:bg-[#F8FAF7]'}`}
          >
            City Edge Nodes
          </NavLink>
          <NavLink 
            to="/analytics" 
            className={({ isActive }) => `px-4 py-2 rounded-sm transition-all duration-150 ${isActive ? 'text-[#1F241C] border-b-2 border-[#2D3627] font-bold bg-[#F4F6F2]' : 'hover:text-[#1F241C] hover:bg-[#F8FAF7]'}`}
          >
            Analytics
          </NavLink>
        </nav>

        {/* Global Sync Action Button and User Profile */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onTriggerSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-[#2D3627] hover:bg-[#3D4935] text-[#FFFFFF] px-3.5 py-2 rounded-sm font-semibold text-xs tracking-wider uppercase transition shadow-sm disabled:opacity-50"
            title="Poll and synchronize all 4 city nodes idempotently"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Nodes'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 border-l border-[#D5DDD0] pl-3">
              <div className="text-right">
                <span className="text-xs font-bold text-[#1E251A] block uppercase font-mono">{user.username}</span>
                <span className="text-[10px] text-[#556648] font-bold block">{user.role}</span>
              </div>
              <button
                onClick={logoutUser}
                title="Logout current terminal session"
                className="p-2 text-[#5B6D4C] hover:text-[#8E2828] hover:bg-[#F2F5ED] rounded transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="bg-[#526046] hover:bg-[#3E4A35] text-white text-xs font-bold px-3 py-2 rounded-sm uppercase tracking-wider"
            >
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};
