'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  User,
  Briefcase,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  Sparkles,
  Users,
  Building2,
  AlertCircle
} from 'lucide-react';

interface FacultyApplication {
  id: number;
  university_id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  designation: string;
  department: string;
  max_groups: number;
  expertise_domains: string[];
  expertise_tech: string[];
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason: string;
  approved_by_name: string;
  approved_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function HODDashboardPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [facultyList, setFacultyList] = useState<FacultyApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'faculty' | 'dossiers'>('faculty');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const raw = localStorage.getItem('aris_user');

    // Strict Auth guard: force immediate redirect if no session exists (prevents back-button bypass)
    if (!token) {
      setIsAuthorized(false);
      window.location.replace('/');
      return;
    }

    setIsAuthorized(true);

    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch {
        setCurrentUser(null);
      }
    }
    loadFaculty(token);

    // bfcache listener: if restored from browser back-forward cache without token, force login
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

  const loadFaculty = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/approvals/faculty/?status=all', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setFacultyList(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Error fetching faculty approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyAction = async (supervisorId: number, action: 'APPROVE' | 'REJECT') => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    let reason = '';
    if (action === 'REJECT') {
      const input = prompt('Please provide a reason for declining this faculty registration:');
      if (input === null) return; // User cancelled
      reason = input.trim();
    }

    setActionLoading(supervisorId);
    setActionMessage('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/approvals/faculty/${supervisorId}/action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, reason }),
      });

      if (res.ok) {
        const updated = await res.json();
        setFacultyList((prev) => prev.map((f) => (f.id === supervisorId ? updated : f)));
        setActionMessage(
          action === 'APPROVE'
            ? `Successfully approved ${updated.full_name}. Their login credentials are now active.`
            : `Declined application for ${updated.full_name}.`
        );
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update faculty status.');
      }
    } catch {
      alert('Network error while processing decision.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('aris_user');
    sessionStorage.clear();
    setIsAuthorized(false);
    window.location.replace('/');
  };

  const pendingCount = facultyList.filter((f) => f.approval_status === 'PENDING').length;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-9 h-9 border-3 border-slate-700 border-t-[#B81D24] rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
          Verifying HOD Governance Credentials...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans">
      {/* ── 1. Top Navbar ── */}
      <header className="w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.jpeg" alt="DBUU" className="h-10 sm:h-12 w-auto object-contain" />
            <div className="hidden sm:block pl-3 border-l-2 border-slate-300">
              <div className="text-xs font-black uppercase tracking-wider text-slate-800">
                ARIS HOD Workspace &amp; Governance
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
            <span>Department Academic Governance &amp; Faculty Intake Panel</span>
            <span className="font-mono text-[11px] text-red-100">Session 2026-27</span>
          </div>
        </div>
      </header>

      {/* ── 2. Main Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Card */}
        <div className="bg-white border-2 border-slate-200 border-t-4 border-t-[#B81D24] rounded-sm p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-sm border-2 border-slate-300 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-[#B81D24] text-[10px] font-bold uppercase tracking-wider rounded-sm mb-1">
                <Building2 className="w-3 h-3" />
                Head of Department (HOD)
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Welcome, {currentUser?.full_name || 'Department Head'}!
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Officer ID: <span className="font-bold text-slate-800">{currentUser?.university_id}</span> • Department:{' '}
                <span className="font-bold text-slate-800">{currentUser?.department || 'Computer Applications'}</span>
              </p>
            </div>
          </div>

          <div className="px-3.5 py-2 bg-slate-100 border border-slate-300 text-slate-800 rounded-sm text-xs font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#B81D24] shrink-0" />
            <span>Institutional Sign-off Authority</span>
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-sm text-xs font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-300 gap-2">
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-sm border-t-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'faculty'
                ? 'bg-white border-t-[#B81D24] border-x border-slate-300 text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 border-t-transparent'
            }`}
          >
            <Users className="w-4 h-4 text-[#B81D24]" />
            Faculty Supervisor Verification
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#B81D24] text-white text-[10px] font-extrabold rounded-sm">
                {pendingCount} Pending
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Faculty Approvals */}
        {activeTab === 'faculty' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Faculty Supervisor Applications
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review applicant profile, photo, domain expertise, and approve valid faculty login credentials.
                </p>
              </div>
              <button
                onClick={() => {
                  const token = localStorage.getItem('access_token');
                  if (token) loadFaculty(token);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm cursor-pointer"
              >
                Refresh List
              </button>
            </div>

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-sm p-8 text-center text-xs text-slate-500 font-mono">
                Loading faculty applications from departmental database...
              </div>
            ) : facultyList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-sm p-8 text-center text-xs text-slate-500">
                No faculty applications found for this department.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {facultyList.map((faculty) => (
                  <div
                    key={faculty.id}
                    className={`bg-white border rounded-sm p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                      faculty.approval_status === 'PENDING'
                        ? 'border-amber-300 bg-amber-50/20'
                        : faculty.approval_status === 'APPROVED'
                        ? 'border-emerald-300'
                        : 'border-rose-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Portrait Image */}
                      <div className="w-16 h-16 rounded-sm border-2 border-slate-300 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                        {faculty.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={faculty.avatar_url}
                            alt={faculty.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-slate-400" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{faculty.full_name}</h4>
                          <span className="px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-300 text-[10px] font-mono text-slate-700">
                            {faculty.university_id}
                          </span>
                          <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-[10px] font-semibold text-slate-700">
                            {faculty.designation}
                          </span>

                          {/* Approval Badge */}
                          {faculty.approval_status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                              <Clock className="w-3 h-3" />
                              Awaiting HOD Sign-off
                            </span>
                          )}
                          {faculty.approval_status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle className="w-3 h-3" />
                              Approved &amp; Active
                            </span>
                          )}
                          {faculty.approval_status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
                              <XCircle className="w-3 h-3" />
                              Declined
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 font-mono">
                          Email: {faculty.email} {faculty.phone ? `• Phone: ${faculty.phone}` : ''} • Max Groups:{' '}
                          <span className="font-bold text-slate-800">{faculty.max_groups}</span>
                        </p>

                        {/* Domains */}
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                            Domains:
                          </span>
                          {faculty.expertise_domains.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">None specified</span>
                          ) : (
                            faculty.expertise_domains.map((dom) => (
                              <span
                                key={dom}
                                className="px-2 py-0.5 rounded-sm bg-blue-50 border border-blue-200 text-[#1A4DBE] text-[10px] font-medium"
                              >
                                {dom}
                              </span>
                            ))
                          )}
                        </div>

                        {/* Technologies */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                            Tech:
                          </span>
                          {faculty.expertise_tech.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">None specified</span>
                          ) : (
                            faculty.expertise_tech.map((tech) => (
                              <span
                                key={tech}
                                className="px-2 py-0.5 rounded-sm bg-red-50 border border-red-200 text-[#B81D24] text-[10px] font-medium"
                              >
                                {tech}
                              </span>
                            ))
                          )}
                        </div>

                        {faculty.rejection_reason && (
                          <p className="text-[11px] text-rose-700 font-medium pt-1">
                            Decline Reason: {faculty.rejection_reason}
                          </p>
                        )}
                        {faculty.approved_by_name && faculty.approval_status === 'APPROVED' && (
                          <p className="text-[11px] text-emerald-700 font-medium pt-1">
                            Verified &amp; Approved by {faculty.approved_by_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 pt-2 md:pt-0">
                      {faculty.approval_status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading === faculty.id}
                            onClick={() => handleFacultyAction(faculty.id, 'APPROVE')}
                            className="w-full md:w-36 py-2 px-3 rounded-sm bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {actionLoading === faculty.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === faculty.id}
                            onClick={() => handleFacultyAction(faculty.id, 'REJECT')}
                            className="w-full md:w-36 py-2 px-3 rounded-sm bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-300 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </>
                      ) : faculty.approval_status === 'REJECTED' ? (
                        <button
                          type="button"
                          disabled={actionLoading === faculty.id}
                          onClick={() => handleFacultyAction(faculty.id, 'APPROVE')}
                          className="w-full md:w-36 py-1.5 px-3 rounded-sm bg-slate-100 hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 text-xs font-semibold cursor-pointer"
                        >
                          Re-Approve
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Credentials Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
