import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, Building2, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const [loginScope, setLoginScope] = useState('global'); // 'global' or 'city'
  const [selectedCity, setSelectedCity] = useState('mumbai');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('sangam_admin2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  // Quick preset accounts handler for demonstrator convenience
  const handleSelectPreset = (scope, city, user, pass) => {
    setLoginScope(scope);
    if (city) setSelectedCity(city);
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiService.login({ username, password });
      loginUser(res.data.user, res.data.access_token);

      // If city operator, redirect directly to their city node; otherwise to overview
      if (res.data.user.city && res.data.user.city !== 'all') {
        navigate(`/cities/${res.data.user.city}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Check your security credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4C5744] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#D5DDD0] overflow-hidden">
        
        {/* Tactical Banner Header */}
        <div className="bg-[#1F251A] p-6 md:p-8 text-white border-b border-[#3E4A35]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#333E2B] text-white flex items-center justify-center rounded border border-[#526346] shadow-inner">
              <Shield className="w-7 h-7 text-[#D7E3CC]" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-wider block leading-none">SANGAM</span>
              <span className="text-[11px] font-semibold tracking-wider text-[#BAC8AB] uppercase block mt-1">Keep country secured</span>
            </div>
          </div>
        </div>

        {/* Preset Role Switcher Bar */}
        <div className="bg-[#F4F6F2] px-6 py-3 border-b border-[#E1E7DC]">
          <span className="text-[10px] uppercase font-bold text-[#5B6D4C] block mb-2 tracking-wider">
            Demo Credentials & Jurisdiction Nodes:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectPreset('global', null, 'admin', 'sangam_admin2026')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded uppercase transition ${
                username === 'admin' ? 'bg-[#222A1E] text-white' : 'bg-white border border-[#CCD4C5] text-[#333E2B] hover:bg-[#EAEFE5]'
              }`}
            >
              Central Admin
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('global', null, 'analyst', 'analyst_intel')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded uppercase transition ${
                username === 'analyst' ? 'bg-[#222A1E] text-white' : 'bg-white border border-[#CCD4C5] text-[#333E2B] hover:bg-[#EAEFE5]'
              }`}
            >
              Global Analyst
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('city', 'mumbai', 'mumbai_op', 'mumbai@123')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded uppercase transition ${
                username === 'mumbai_op' ? 'bg-[#222A1E] text-white' : 'bg-white border border-[#CCD4C5] text-[#333E2B] hover:bg-[#EAEFE5]'
              }`}
            >
              Mumbai Node
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('city', 'bengaluru', 'bengaluru_op', 'bengaluru@123')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded uppercase transition ${
                username === 'bengaluru_op' ? 'bg-[#222A1E] text-white' : 'bg-white border border-[#CCD4C5] text-[#333E2B] hover:bg-[#EAEFE5]'
              }`}
            >
              Bengaluru Node
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('city', 'kolkata', 'kolkata_op', 'kolkata@123')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded uppercase transition ${
                username === 'kolkata_op' ? 'bg-[#222A1E] text-white' : 'bg-white border border-[#CCD4C5] text-[#333E2B] hover:bg-[#EAEFE5]'
              }`}
            >
              Kolkata Node
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('city', 'chennai', 'chennai_op', 'chennai@123')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded uppercase transition ${
                username === 'chennai_op' ? 'bg-[#222A1E] text-white' : 'bg-white border border-[#CCD4C5] text-[#333E2B] hover:bg-[#EAEFE5]'
              }`}
            >
              Chennai Node
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-300 text-red-700 text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#333E2B] mb-1.5 tracking-wider">
                Operator Security Identifier
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, mumbai_op, bengaluru_op"
                  className="w-full bg-[#FAFBF9] border border-[#CCD6C4] px-3.5 py-2.5 pl-10 rounded text-xs font-semibold text-[#1E251A] focus:outline-none focus:border-[#414E36]"
                />
                <User className="w-4 h-4 absolute left-3 top-3 text-[#6E805E]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#333E2B] mb-1.5 tracking-wider">
                Passphrase / Credential Token
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full bg-[#FAFBF9] border border-[#CCD6C4] px-3.5 py-2.5 pl-10 rounded text-xs font-semibold text-[#1E251A] focus:outline-none focus:border-[#414E36]"
                />
                <Lock className="w-4 h-4 absolute left-3 top-3 text-[#6E805E]" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#222A1E] hover:bg-[#34402D] text-white py-3 rounded text-xs font-bold uppercase tracking-widest transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Authorize Terminal Session'}</span>
              </button>
            </div>
          </form>

          {/* Tactical Note */}
          <div className="mt-6 pt-4 border-t border-[#EAEFE5] text-[11px] text-[#697B59] leading-relaxed">
            <span className="font-bold text-[#232B1E]">Access Note:</span> Each city operator authenticates with an isolated security profile to ingest intelligence reports for their sector while retaining cross-city visibility across all other nodes and the central global model.
          </div>
        </div>

      </div>
    </div>
  );
};
