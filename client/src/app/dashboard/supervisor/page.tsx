'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, Briefcase, LogOut, CheckCircle, Users } from 'lucide-react';

export default function SupervisorDashboardPage() {
  const router = useRouter();
 
  const [user, setUser] = useState<any>(null);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const raw = localStorage.getItem('aris_user');

    if (!token) {
      setIsAuthorized(false);
      window.location.replace('/');
      return;
    }

    setIsAuthorized(true);

    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }

    fetch('http://127.0.0.1:8000/api/auth/me/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('aris_user');
          sessionStorage.clear();
          setIsAuthorized(false);
          window.location.replace('/');
          return null;
        }
        return res.json();
      })
      .then((freshUser) => {
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem('aris_user', JSON.stringify(freshUser));
        }
      })
      .catch((err) => console.warn('User profile sync skipped:', err));

    const handlePageShow = (event: PageTransitionEvent) => {
      const currentToken = localStorage.getItem('access_token');
      if (event.persisted || !currentToken) {
        setIsAuthorized(false);
        window.location.replace('/');
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('aris_user');
    sessionStorage.clear();
    setIsAuthorized(false);
    window.location.replace('/');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-9 h-9 border-3 border-slate-700 border-t-[#B81D24] rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
          Verifying Faculty Credentials...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans">
      <header className="w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.jpeg" alt="DBUU" className="h-10 sm:h-12 w-auto object-contain" />
            <div className="hidden sm:block pl-3 border-l-2 border-slate-300">
              <div className="text-xs font-black uppercase tracking-wider text-slate-800">
                ARIS Faculty Workspace
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Dev Bhoomi Uttarakhand University • Dehradun
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#B81D24] text-xs font-bold rounded-sm border border-red-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        <div className="w-full bg-[#B81D24] text-white py-2 px-4 sm:px-6 lg:px-8 text-xs font-bold uppercase tracking-wider">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span>Faculty Supervisor Matrix &amp; Evaluation Panel</span>
            <span className="font-mono text-[11px] text-red-100">Session 2026-27</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-white border-2 border-slate-200 border-t-4 border-t-[#B81D24] rounded-sm p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-sm border-2 border-slate-300 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
              {user?.avatar_url && !avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'Profile'}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-[#B81D24] text-[10px] font-bold uppercase tracking-wider rounded-sm mb-1">
                <Briefcase className="w-3 h-3" />
                Faculty Supervisor
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Welcome, {user?.full_name || 'Professor'}!
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Employee ID: <span className="font-bold text-slate-800">{user?.university_id}</span> • Email: {user?.email}
              </p>
            </div>
          </div>

          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-sm text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile Active &amp; Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs">
            <div className="flex items-center gap-2 text-[#B81D24] font-bold text-sm uppercase tracking-wider mb-2">
              <Users className="w-4 h-4" />
              Assigned Project Groups
            </div>
            <p className="text-xs text-slate-500">
              Student groups requesting your mentorship will appear here for review and acceptance.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-[#B81D24]" />
              Department &amp; Capacity
            </div>
            <p className="text-xs text-slate-500 mb-1">
              Department: <span className="font-bold text-slate-800">{user?.department || 'Department of Computer Applications'}</span>
            </p>
            <p className="text-xs text-slate-500">
              School: <span className="font-bold text-slate-800">School of Engineering and Computing (SoEC)</span>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-5 bg-[#0F2137] text-slate-300 border-t-2 border-[#B81D24] text-center text-xs">
        © 2026 Dev Bhoomi Uttarakhand University • Academic Repository &amp; Institutional System (ARIS)
      </footer>
    </div>
  );
}
