'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Search,
  Users,
  LogOut,
  ExternalLink,
  FileText,
  Layers,
  ShieldCheck,
  Award,
  ChevronRight,
  RefreshCw,
  FolderGit2,
  UserCheck,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';

// ─── TYPES ──────────────────────────────────────────────────────────
export interface DepartmentItem {
  id: number;
  name: string;
  code: string;
  school_id: number;
  school_name: string;
  school_code: string;
}

export interface GroupMemberData {
  id: number;
  university_id: string;
  full_name: string;
  email: string;
  program: string;
  semester: number;
  member_role: 'LEADER' | 'MEMBER';
  avatar_url?: string;
}

export interface ApprovalRecordData {
  id: number;
  stage: 'HOD' | 'DEAN';
  action: 'APPROVED' | 'REJECTED';
  comment: string;
  actioned_by_name: string;
  created_at: string;
}

export interface ProjectDossierData {
  id: string;
  name: string;
  track: string;
  track_title: string;
  category: string;
  department: string;
  status: string;
  supervisor: string | null;
  supervisor_name: string | null;
  supervisor_designation?: string | null;
  created_by_name?: string;
  members: GroupMemberData[];
  approved_proposal?: {
    id: string;
    title: string;
    abstract: string;
    tech_stack: string[];
    domain: string;
  } | null;
  submissions?: {
    synopsis_url?: string;
    report_url?: string;
    presentation_url?: string;
    github_url?: string;
    live_demo_url?: string;
    research_paper_url?: string;
    is_complete: boolean;
  } | null;
  approval_records: ApprovalRecordData[];
  created_at: string;
  updated_at: string;
}

export interface CurrentUser {
  id: string;
  university_id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  avatar_url?: string;
  is_dean?: boolean;
  is_hod?: boolean;
  dean_school?: { id: number; name: string; code: string } | null;
  hod_departments?: DepartmentItem[];
  available_roles?: string[];
}

export default function DeanDashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'school' | 'archive'>('reviews');

  // Dossiers awaiting Dean Review or All dossiers
  const [dossiersList, setDossiersList] = useState<ProjectDossierData[]>([]);
  const [archiveList, setArchiveList] = useState<ProjectDossierData[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'HOD_APPROVED' | 'DEAN_APPROVED' | 'DEAN_REJECTED' | 'ALL'>('HOD_APPROVED');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Inspect Modal
  const [inspectDossier, setInspectDossier] = useState<ProjectDossierData | null>(null);

  // Action Verdict Modal
  const [actionDossier, setActionDossier] = useState<ProjectDossierData | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [actionComment, setActionComment] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tok = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '');

  // ─── AUTH & DATA LOADING ──────────────────────────────────────────
  const loadData = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const [reviewRes, archiveRes, deptRes] = await Promise.all([
        fetch(`${API}/approvals/dean-review/?status=all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/approvals/archive/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/accounts/departments/`),
      ]);

      if (reviewRes.status === 401 || reviewRes.status === 403) {
        // Not authorized as Dean
        setToastMessage({ type: 'error', text: 'Dean credentials required for executive access.' });
      }

      if (reviewRes.ok) {
        const data = await reviewRes.json();
        setDossiersList(Array.isArray(data) ? data : data.results || []);
      }

      if (archiveRes.ok) {
        const data = await archiveRes.json();
        setArchiveList(Array.isArray(data) ? data : data.results || []);
      }

      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartmentsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load Dean workspace:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = tok();
    const raw = localStorage.getItem('aris_user');

    if (!token) {
      router.replace('/');
      return;
    }

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed);
      } catch {
        setCurrentUser(null);
      }
    }

    setIsAuthorized(true);
    loadData(token);
  }, [router, loadData]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('aris_user');
    localStorage.removeItem('user');
    router.replace('/');
  };

  // ─── DEAN VERDICT ACTION (GRANT FINAL APPROVAL / DECLINE) ──────────
  const handleSubmitVerdict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionDossier) return;
    if (!actionComment.trim() || actionComment.trim().length < 5) {
      setActionError('Please provide institutional review remarks (min 5 characters).');
      return;
    }

    setSubmittingAction(true);
    setActionError(null);

    try {
      const res = await fetch(`${API}/approvals/dean-review/${actionDossier.id}/action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({
          action: actionType,
          comment: actionComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errText = Object.values(data).flat().join(' ') || 'Failed to submit Dean verdict.';
        setActionError(errText);
        return;
      }

      setToastMessage({
        type: 'success',
        text:
          actionType === 'APPROVED'
            ? `Final institutional approval granted for "${actionDossier.name}". Project is officially archived!`
            : `Project "${actionDossier.name}" declined with executive review feedback.`,
      });

      setActionDossier(null);
      setActionComment('');
      if (inspectDossier?.id === actionDossier.id) {
        setInspectDossier(null);
      }
      await loadData(tok());
    } catch {
      setActionError('Network error while recording Dean decision.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // ─── FILTERED DOSSIERS ────────────────────────────────────────────
  const pendingDeanCount = useMemo(() => {
    return dossiersList.filter((d) => d.status === 'HOD_APPROVED').length;
  }, [dossiersList]);

  const filteredDossiers = useMemo(() => {
    return dossiersList.filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) {
        return false;
      }
      if (departmentFilter !== 'ALL' && d.department !== departmentFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = d.name?.toLowerCase().includes(q);
        const mTrack = d.track_title?.toLowerCase().includes(q);
        const mSuper = d.supervisor_name?.toLowerCase().includes(q);
        const mProp = d.approved_proposal?.title?.toLowerCase().includes(q);
        const mDept = d.department?.toLowerCase().includes(q);
        const mMember = d.members?.some(
          (m) => m.full_name?.toLowerCase().includes(q) || m.university_id?.toLowerCase().includes(q)
        );
        return mName || mTrack || mSuper || mProp || mDept || mMember;
      }
      return true;
    });
  }, [dossiersList, statusFilter, departmentFilter, searchQuery]);

  const filteredArchive = useMemo(() => {
    return archiveList.filter((d) => {
      if (departmentFilter !== 'ALL' && d.department !== departmentFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = d.name?.toLowerCase().includes(q);
        const mTrack = d.track_title?.toLowerCase().includes(q);
        const mSuper = d.supervisor_name?.toLowerCase().includes(q);
        const mProp = d.approved_proposal?.title?.toLowerCase().includes(q);
        return mName || mTrack || mSuper || mProp;
      }
      return true;
    });
  }, [archiveList, departmentFilter, searchQuery]);

  // Check if current user is dual Dean + HOD
  const isDualRole = useMemo(() => {
    if (!currentUser) return false;
    const hasDean = currentUser.is_dean || currentUser.role === 'DEAN' || !!currentUser.dean_school;
    const hasHod = currentUser.is_hod || currentUser.role === 'HOD' || (currentUser.hod_departments && currentUser.hod_departments.length > 0);
    return hasDean && hasHod;
  }, [currentUser]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-9 h-9 border-3 border-slate-700 border-t-[#B81D24] rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
          Verifying Dean Executive Credentials...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* ─── TOAST NOTIFICATION ────────────────────────────────────────── */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2.5 text-xs font-bold transition-all border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─── TOP EXECUTIVE NAVBAR ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          {/* LEFT: University Logo */}
          <div className="flex items-center gap-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.jpeg"
              alt="Dev Bhoomi Uttarakhand University"
              className="h-10 sm:h-11 w-auto object-contain"
            />
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 tracking-wide uppercase">
                  Dean Executive Office
                </span>
                {isDualRole && (
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                    DEAN &amp; HOD
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                {currentUser?.dean_school?.name || 'School Academic Leadership'}
              </p>
            </div>
          </div>

          {/* MIDDLE: MAIN TABS */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-[#B81D24]" />
              <span>Final Approvals</span>
              {pendingDeanCount > 0 && (
                <span className="px-1.5 py-0.2 bg-[#B81D24] text-white text-[9px] font-black rounded-full animate-pulse">
                  {pendingDeanCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('school')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'school'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#B81D24]" />
              <span>School Oversight</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#B81D24]" />
              <span>University Archive</span>
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[9px] font-bold rounded-full">
                {archiveList.length}
              </span>
            </button>
          </div>

          {/* RIGHT: DUAL-ROLE QUICK SWITCHER & USER PROFILE */}
          <div className="flex items-center gap-2.5">
            {/* Dual Role HOD Switcher */}
            {isDualRole && (
              <button
                onClick={() => router.push('/dashboard/hod')}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                title="Switch to Head of Department workspace"
              >
                <FolderGit2 className="w-3 h-3 text-blue-600" />
                <span>HOD Portal</span>
              </button>
            )}

            {/* Supervisor Portal Switcher */}
            <button
              onClick={() => router.push('/dashboard/supervisor')}
              className="hidden lg:flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              title="Switch to Faculty Supervisor Portal"
            >
              <UserCheck className="w-3 h-3 text-slate-500" />
              <span>Faculty Portal</span>
            </button>

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#B81D24] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {currentUser?.full_name?.charAt(0) || 'D'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.full_name || 'Dean'}
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  {currentUser?.university_id}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── DUAL ROLE NOTICE BANNER (IF APPLICABLE) ────────────────────── */}
      {isDualRole && (
        <div className="bg-purple-900 text-white px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span className="font-semibold">Dual Leadership Assignment Active:</span>
            <span className="text-purple-200">
              You are currently Dean of{' '}
              <strong className="text-white">
                {currentUser?.dean_school?.name || 'School of Engineering'}
              </strong>{' '}
              and Head of Department for{' '}
              <strong className="text-white">
                {currentUser?.hod_departments?.map((d) => d.name).join(', ') || 'Department'}
              </strong>
              .
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard/hod')}
            className="px-2.5 py-0.5 bg-white text-purple-950 font-bold rounded text-[11px] hover:bg-purple-50 cursor-pointer transition-colors shrink-0"
          >
            Open HOD Workspace &rarr;
          </button>
        </div>
      )}

      {/* ─── MAIN CONTENT CONTAINER ────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: FINAL DEAN APPROVALS (DEAN REVIEW)
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Header & Metric Cards */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#B81D24]" />
                  <span>Institutional Project Sign-Off</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conduct final executive evaluation of HOD-approved student projects for permanent university archival.
                </p>
              </div>

              <button
                onClick={() => loadData(tok())}
                disabled={loading}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors self-start shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Dossiers</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Awaiting Dean Approval
                </span>
                <span className="text-2xl font-black text-[#B81D24] mt-1 block">
                  {pendingDeanCount}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">HOD sign-off completed</span>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dean Approved
                </span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {dossiersList.filter((d) => d.status === 'DEAN_APPROVED').length}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Archived to repository</span>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Returned for Revision
                </span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">
                  {dossiersList.filter((d) => d.status === 'DEAN_REJECTED').length}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Executive feedback sent</span>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Evaluated
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {dossiersList.length}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Across all school departments</span>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Tabs */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => setStatusFilter('HOD_APPROVED')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'HOD_APPROVED'
                        ? 'bg-white text-[#B81D24] shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending Dean Review ({pendingDeanCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('DEAN_APPROVED')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'DEAN_APPROVED'
                        ? 'bg-white text-emerald-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setStatusFilter('DEAN_REJECTED')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'DEAN_REJECTED'
                        ? 'bg-white text-rose-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Declined
                  </button>
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Dossiers
                  </button>
                </div>

                {/* Department Dropdown */}
                {departmentsList.length > 0 && (
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#B81D24]"
                  >
                    <option value="ALL">All Departments</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search project, student, track..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B81D24]"
                />
              </div>
            </div>

            {/* Project Dossiers List */}
            {loading ? (
              <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-xs">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-[#B81D24] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500">Loading dossiers for executive review...</p>
              </div>
            ) : filteredDossiers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-xs space-y-2">
                <Award className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No project dossiers found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {statusFilter === 'HOD_APPROVED'
                    ? 'All project dossiers have been reviewed or are currently pending HOD department review.'
                    : 'No projects match your current status or search filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDossiers.map((dossier) => {
                  const isPending = dossier.status === 'HOD_APPROVED';
                  const isApproved = dossier.status === 'DEAN_APPROVED';
                  const isRejected = dossier.status === 'DEAN_REJECTED';

                  return (
                    <div
                      key={dossier.id}
                      className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-900">
                              {dossier.approved_proposal?.title || dossier.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {dossier.name}
                            </span>

                            {isPending && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>AWAITING DEAN APPROVAL</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>DEAN APPROVED &amp; ARCHIVED</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                <span>REVISION REQUESTED</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2">
                            {dossier.approved_proposal?.abstract || 'No abstract submitted.'}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                            <span>
                              <strong>Department:</strong> {dossier.department}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Track:</strong> {dossier.track_title}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Supervisor:</strong> {dossier.supervisor_name || 'Unassigned'}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Team:</strong> {dossier.members.length} students
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <button
                            onClick={() => setInspectDossier(dossier)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Dossier</span>
                          </button>

                          {isPending && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setActionDossier(dossier);
                                  setActionType('APPROVED');
                                  setActionComment('Institutional standards met. Approved for university archive.');
                                  setActionError(null);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActionDossier(dossier);
                                  setActionType('REJECTED');
                                  setActionComment('');
                                  setActionError(null);
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors shadow-xs"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Deliverables / Submission Links Chips */}
                      {dossier.submissions && (
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Deliverables:
                          </span>
                          {dossier.submissions.synopsis_url && (
                            <a
                              href={dossier.submissions.synopsis_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 font-medium flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-[#B81D24]" />
                              <span>Synopsis</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                            </a>
                          )}
                          {dossier.submissions.report_url && (
                            <a
                              href={dossier.submissions.report_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 font-medium flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>Report</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                            </a>
                          )}
                          {dossier.submissions.github_url && (
                            <a
                              href={dossier.submissions.github_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 font-medium flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3 text-slate-700" />
                              <span>GitHub</span>
                            </a>
                          )}
                          {dossier.submissions.live_demo_url && (
                            <a
                              href={dossier.submissions.live_demo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] text-emerald-800 font-medium flex items-center gap-1"
                            >
                              <span>Live Demo</span>
                              <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: SCHOOL OVERSIGHT (DEPARTMENTS & HODS)
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'school' && (
          <div className="space-y-4">
            <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#B81D24]" />
                <h2 className="text-base font-black text-slate-900">
                  {currentUser?.dean_school?.name || 'School of Engineering & Computing'}
                </h2>
                {currentUser?.dean_school?.code && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono font-bold">
                    {currentUser.dean_school.code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                You are registered as the presiding Dean for this academic school. All department curricula, tracks, and student project cohorts fall under your institutional review.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Departments Under This School ({departmentsList.length})
              </h3>

              {departmentsList.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-xs text-slate-400">
                  No departments created under this school yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departmentsList.map((dept) => {
                    const deptProjects = dossiersList.filter((d) => d.department === dept.name);
                    const isUserHodHere = currentUser?.hod_departments?.some((h) => h.id === dept.id);

                    return (
                      <div
                        key={dept.id}
                        className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900">{dept.name}</h4>
                              {dept.code && (
                                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[9px] font-mono font-bold">
                                  {dept.code}
                                </span>
                              )}
                              {isUserHodHere && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[9px] font-black border border-purple-200">
                                  You are HOD
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Affiliated to {dept.school_name || 'Academic School'}
                            </p>
                          </div>

                          {isUserHodHere && (
                            <button
                              onClick={() => router.push('/dashboard/hod')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                            >
                              <span>Manage as HOD</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Dept Mini Stats */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                          <div className="p-2 bg-slate-50 rounded">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Projects</span>
                            <span className="text-sm font-black text-slate-800">{deptProjects.length}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Pending</span>
                            <span className="text-sm font-black text-[#B81D24]">
                              {deptProjects.filter((p) => p.status === 'HOD_APPROVED').length}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Archived</span>
                            <span className="text-sm font-black text-emerald-700">
                              {deptProjects.filter((p) => p.status === 'DEAN_APPROVED').length}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: UNIVERSITY ARCHIVE
        ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'archive' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#B81D24]" />
                  <span>Permanent Institutional Repository</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete repository of Dean-approved, archived student research and capstone projects.
                </p>
              </div>

              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold self-start">
                {filteredArchive.length} Archived Projects
              </span>
            </div>

            {filteredArchive.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-lg border border-slate-200 text-xs text-slate-400 shadow-xs">
                No archived projects available yet. Once Dean approves submissions, they appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArchive.map((arch) => (
                  <div
                    key={arch.id}
                    className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black text-slate-900">
                        {arch.approved_proposal?.title || arch.name}
                      </h3>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black shrink-0">
                        ARCHIVED
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {arch.approved_proposal?.abstract || 'No abstract available.'}
                    </p>

                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                      <div>
                        <strong>Department:</strong> {arch.department} • <strong>Track:</strong> {arch.track_title}
                      </div>
                      <div>
                        <strong>Supervisor:</strong> {arch.supervisor_name || 'N/A'} • <strong>Team:</strong>{' '}
                        {arch.members.length} students
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => setInspectDossier(arch)}
                        className="text-xs font-bold text-[#B81D24] hover:underline cursor-pointer"
                      >
                        Inspect Dossier &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── MODAL 1: INSPECT FULL DOSSIER ─────────────────────────────── */}
      {inspectDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#B81D24] font-bold uppercase tracking-wider block">
                  Project Dossier Verification
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {inspectDossier.approved_proposal?.title || inspectDossier.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {inspectDossier.name} • {inspectDossier.department}
                </p>
              </div>
              <button
                onClick={() => setInspectDossier(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abstract */}
            {inspectDossier.approved_proposal?.abstract && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700">Project Abstract</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {inspectDossier.approved_proposal.abstract}
                </p>
              </div>
            )}

            {/* Team Members */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">
                Team Members ({inspectDossier.members.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inspectDossier.members.map((m) => (
                  <div key={m.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className="font-bold text-slate-900">{m.full_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {m.university_id} • {m.program} Sem {m.semester}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            {inspectDossier.submissions && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Submitted Deliverables</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {inspectDossier.submissions.synopsis_url && (
                    <a
                      href={inspectDossier.submissions.synopsis_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 font-medium flex items-center justify-between"
                    >
                      <span>Synopsis PDF</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </a>
                  )}
                  {inspectDossier.submissions.report_url && (
                    <a
                      href={inspectDossier.submissions.report_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 font-medium flex items-center justify-between"
                    >
                      <span>Project Report PDF</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </a>
                  )}
                  {inspectDossier.submissions.github_url && (
                    <a
                      href={inspectDossier.submissions.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 font-medium flex items-center justify-between"
                    >
                      <span>GitHub Repository</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </a>
                  )}
                  {inspectDossier.submissions.live_demo_url && (
                    <a
                      href={inspectDossier.submissions.live_demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 font-medium flex items-center justify-between text-emerald-800"
                    >
                      <span>Live Working Demo</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Approval History Audit Trail */}
            {inspectDossier.approval_records && inspectDossier.approval_records.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Governance Audit Trail</span>
                <div className="space-y-1.5">
                  {inspectDossier.approval_records.map((rec) => (
                    <div key={rec.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {rec.stage} Review — {rec.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(rec.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">&ldquo;{rec.comment}&rdquo;</p>
                      <span className="text-[10px] text-slate-400 block mt-1">By: {rec.actioned_by_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setInspectDossier(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>

              {inspectDossier.status === 'HOD_APPROVED' && (
                <button
                  onClick={() => {
                    setActionDossier(inspectDossier);
                    setActionType('APPROVED');
                    setActionComment('Institutional standards met. Approved for university archive.');
                    setActionError(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Grant Final Approval</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: DEAN VERDICT MODAL (APPROVE / REJECT) ───────────── */}
      {actionDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-mono font-bold text-[#B81D24] uppercase tracking-wider block">
                Executive Action Required
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                {actionType === 'APPROVED' ? 'Grant Final Institutional Approval' : 'Decline Project Dossier'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {actionDossier.name} • {actionDossier.department}
              </p>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSubmitVerdict} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Executive Remarks &amp; Feedback <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder={
                    actionType === 'APPROVED'
                      ? 'e.g. Work verified according to university capstone standards. Project accepted for institutional archival.'
                      : 'e.g. Deliverables incomplete or live demo unreachable. Please revise and resubmit with supervisor.'
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#B81D24]"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  These remarks are recorded permanently in the university audit log and notified to students and supervisor.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionDossier(null)}
                  disabled={submittingAction}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingAction}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    actionType === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{actionType === 'APPROVED' ? 'Confirm Approval & Archive' : 'Confirm Decline'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
