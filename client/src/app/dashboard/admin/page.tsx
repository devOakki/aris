'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  UserCheck,
  UserX,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  X,
  LogOut,
  Menu,
  GraduationCap,
  Users,
  Search,
  Building,
  Briefcase,
  Layers,
  Calendar,
  Sparkles,
  Pencil,
  Trash2,
} from 'lucide-react';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '');
const API = `${API_BASE}/api`;

// ─── DATA INTERFACES ──────────────────────────────────────────────────
export interface UserCredentialData {
  id: string;
  university_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'DEAN' | 'HOD' | 'ADMIN' | 'STUDENT' | 'SUPERVISOR';
  is_active: boolean;
  created_at: string;
}

export interface DepartmentData {
  id: number;
  school: number;
  school_name: string;
  school_code: string;
  name: string;
  code: string;
  hods: UserCredentialData[];
  created_at: string;
}

export interface SchoolData {
  id: number;
  name: string;
  code: string;
  dean: UserCredentialData | null;
  departments: DepartmentData[];
  departments_count: number;
  created_at: string;
}

export interface FacultyApprovalData {
  id: number;
  user_id: string;
  university_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  designation: string;
  department: string;
  max_groups: number;
  expertise_domains: string[];
  expertise_tech: string[];
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  approved_by_name?: string;
  approved_at?: string;
  current_role: string;
  is_active: boolean;
  created_at: string;
}

export interface EligibleFacultyData {
  id: number;
  user_id: string;
  university_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  department: string;
  designation: string;
  role: string;
  is_active: boolean;
  dean_school?: { id: number; name: string; code: string } | null;
  hod_departments: { id: number; name: string; code: string; school_id: number; school_name: string; school_code: string }[];
}

interface CurrentUser {
  id: string;
  university_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
}

// ─── MODAL CONTAINER ──────────────────────────────────────────────────
function Modal({
  title,
  subtitle,
  children,
  onClose,
  maxWidth = 'max-w-md',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto w-full ${maxWidth}`}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'management' | 'approvals'>('management');

  // Layout State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Search States
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [approvalsSearchQuery, setApprovalsSearchQuery] = useState('');
  const [facultyPickerSearch, setFacultyPickerSearch] = useState('');

  // Data States
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [expandedSchoolIds, setExpandedSchoolIds] = useState<number[]>([]);

  const [approvals, setApprovals] = useState<FacultyApprovalData[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'all'>('PENDING');

  const [eligibleFaculty, setEligibleFaculty] = useState<EligibleFacultyData[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  // Action / Feedback State
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modals State
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [addSchoolError, setAddSchoolError] = useState<string | null>(null);
  const [schoolForm, setSchoolForm] = useState({ name: '', code: '' });

  const [selectedSchoolForDept, setSelectedSchoolForDept] = useState<SchoolData | null>(null);
  const [addDeptError, setAddDeptError] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });

  // Edit School & Department Modal States
  const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);
  const [editSchoolForm, setEditSchoolForm] = useState({ name: '', code: '' });
  const [editSchoolError, setEditSchoolError] = useState<string | null>(null);

  const [editingDept, setEditingDept] = useState<{ dept: DepartmentData; school: SchoolData } | null>(null);
  const [editDeptForm, setEditDeptForm] = useState({ name: '', code: '' });
  const [editDeptError, setEditDeptError] = useState<string | null>(null);

  // Faculty Picker Modals
  const [assignDeanModal, setAssignDeanModal] = useState<SchoolData | null>(null);
  const [assignHodModal, setAssignHodModal] = useState<DepartmentData | null>(null);

  // Rejection modal
  const [rejectingFaculty, setRejectingFaculty] = useState<FacultyApprovalData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const tok = useCallback(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('access_token') || '';
  }, []);

  // ─── AUTHENTICATION CHECK ───────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    const storedUserStr = localStorage.getItem('aris_user') || localStorage.getItem('user');

    if (!token || !storedUserStr) {
      router.replace('/');
      return;
    }

    try {
      const parsed = JSON.parse(storedUserStr);
      if (parsed.role !== 'ADMIN') {
        router.replace('/');
        return;
      }
      setCurrentUser(parsed);
      setAuthChecked(true);
    } catch {
      router.replace('/');
    }
  }, [router]);

  // ─── LOAD DATA FUNCTIONS ────────────────────────────────────────────
  const loadSchools = useCallback(async () => {
    setLoadingSchools(true);
    try {
      const res = await fetch(`${API}/accounts/admin/schools/`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (res.ok) {
        const data: SchoolData[] = await res.json();
        setSchools(data);
        if (data.length === 1) {
          setExpandedSchoolIds([data[0].id]);
        }
      } else if (res.status === 401 || res.status === 403) {
        router.replace('/');
      }
    } catch (e) {
      console.error('Failed to load schools hierarchy:', e);
      setActionMessage({ type: 'error', text: 'Failed to connect to backend server.' });
    } finally {
      setLoadingSchools(false);
    }
  }, [tok, router]);

  const loadApprovals = useCallback(async () => {
    setLoadingApprovals(true);
    try {
      const res = await fetch(`${API}/accounts/admin/faculty-approvals/?status=all`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (res.ok) {
        const data: FacultyApprovalData[] = await res.json();
        setApprovals(data);
      } else if (res.status === 401 || res.status === 403) {
        router.replace('/');
      }
    } catch (e) {
      console.error('Failed to load faculty approvals:', e);
    } finally {
      setLoadingApprovals(false);
    }
  }, [tok, router]);

  const loadEligibleFaculty = useCallback(async () => {
    setLoadingEligible(true);
    try {
      const res = await fetch(`${API}/accounts/admin/eligible-faculty/`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (res.ok) {
        const data: EligibleFacultyData[] = await res.json();
        setEligibleFaculty(data);
      } else if (res.status === 401 || res.status === 403) {
        router.replace('/');
      }
    } catch (e) {
      console.error('Failed to load eligible faculty:', e);
    } finally {
      setLoadingEligible(false);
    }
  }, [tok, router]);

  // Initial load
  useEffect(() => {
    if (authChecked) {
      loadSchools();
      loadApprovals();
      loadEligibleFaculty();
    }
  }, [authChecked, loadSchools, loadApprovals, loadEligibleFaculty]);

  // Pending count for sidebar badge
  const pendingCount = useMemo(() => {
    return approvals.filter((a) => a.approval_status === 'PENDING').length;
  }, [approvals]);

  // ─── TOGGLE SCHOOL ACCORDION ────────────────────────────────────────
  const toggleSchoolAccordion = (schoolId: number) => {
    setExpandedSchoolIds((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]
    );
  };

  // ─── CREATE SCHOOL ──────────────────────────────────────────────────
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSchoolError(null);
    if (!schoolForm.name.trim() || !schoolForm.code.trim()) {
      setAddSchoolError('School name and short code are both required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/schools/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({
          name: schoolForm.name.trim(),
          code: schoolForm.code.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorText = Object.values(data).flat().join(' ') || 'Failed to create school.';
        setAddSchoolError(errorText);
        return;
      }

      // On successful creation:
      setActionMessage({ type: 'success', text: `School "${data.name}" (${data.code}) created successfully.` });
      setSchoolForm({ name: '', code: '' });
      setShowAddSchoolModal(false); // Modal closes immediately
      await loadSchools();
      if (data.id) {
        setExpandedSchoolIds((prev) => [...prev, data.id]);
      }
    } catch {
      setAddSchoolError('Network connection failed while creating school.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── CREATE DEPARTMENT UNDER SCHOOL ─────────────────────────────────
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDeptError(null);
    if (!selectedSchoolForDept) return;
    if (!deptForm.name.trim()) {
      setAddDeptError('Department name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/schools/${selectedSchoolForDept.id}/departments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({
          name: deptForm.name.trim(),
          code: deptForm.code.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorText = Object.values(data).flat().join(' ') || 'Failed to create department.';
        setAddDeptError(errorText);
        return;
      }

      setActionMessage({
        type: 'success',
        text: `Department "${data.name}" added to ${selectedSchoolForDept.code}.`,
      });
      setDeptForm({ name: '', code: '' });
      setSelectedSchoolForDept(null);
      await loadSchools();
      await loadEligibleFaculty();
    } catch {
      setAddDeptError('Network connection failed while creating department.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── EDIT SCHOOL ─────────────────────────────────────────────────────
  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    setEditSchoolError(null);
    if (!editSchoolForm.name.trim()) {
      setEditSchoolError('School name cannot be blank.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/schools/${editingSchool.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({
          name: editSchoolForm.name.trim(),
          code: editSchoolForm.code.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = Object.values(data).flat().join(' ') || 'Failed to update school.';
        setEditSchoolError(err);
        return;
      }
      setActionMessage({ type: 'success', text: `School updated to "${data.name}".` });
      setEditingSchool(null);
      await loadSchools();
    } catch {
      setEditSchoolError('Network error while updating school.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── DELETE SCHOOL ───────────────────────────────────────────────────
  const handleDeleteSchool = async (school: SchoolData) => {
    if (
      !confirm(
        `Are you sure you want to delete "${school.name}" (${school.code})?\n\nThis will remove the school and its departments. Any assigned Dean or HODs will be de-elevated back to faculty supervisor.`
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/schools/${school.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: `School "${school.name}" deleted.` });
        await loadSchools();
        await loadEligibleFaculty();
      } else {
        setActionMessage({ type: 'error', text: 'Failed to delete school.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network connection failed while deleting school.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── EDIT DEPARTMENT ─────────────────────────────────────────────────
  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setEditDeptError(null);
    if (!editDeptForm.name.trim()) {
      setEditDeptError('Department name cannot be blank.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/departments/${editingDept.dept.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({
          name: editDeptForm.name.trim(),
          code: editDeptForm.code.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = Object.values(data).flat().join(' ') || 'Failed to update department.';
        setEditDeptError(err);
        return;
      }
      setActionMessage({ type: 'success', text: `Department updated to "${data.name}".` });
      setEditingDept(null);
      await loadSchools();
    } catch {
      setEditDeptError('Network error while updating department.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── DELETE DEPARTMENT ───────────────────────────────────────────────
  const handleDeleteDept = async (school: SchoolData, dept: DepartmentData) => {
    if (
      !confirm(
        `Are you sure you want to delete department "${dept.name}"?\n\nAny assigned HODs will be de-elevated back to faculty supervisor.`
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/departments/${dept.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: `Department "${dept.name}" deleted.` });
        await loadSchools();
        await loadEligibleFaculty();
      } else {
        setActionMessage({ type: 'error', text: 'Failed to delete department.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network connection failed while deleting department.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RBAC: ASSIGN DEAN (ELEVATE ROLE TO DEAN) ───────────────────────
  const handleAssignDean = async (schoolId: number, userId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/schools/${schoolId}/assign-dean/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorText = Object.values(data).flat().join(' ') || 'Failed to assign Dean.';
        setActionMessage({ type: 'error', text: errorText });
        return;
      }

      setActionMessage({
        type: 'success',
        text: `${data.dean?.full_name || 'Faculty'} elevated and assigned as Dean of ${data.name}.`,
      });
      setAssignDeanModal(null);
      await loadSchools();
      await loadEligibleFaculty();
    } catch {
      setActionMessage({ type: 'error', text: 'Network connection failed while assigning Dean.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RBAC: REMOVE DEAN (DE-ELEVATE ROLE BACK TO SUPERVISOR) ──────────
  const handleRemoveDean = async (school: SchoolData) => {
    if (!confirm(`Are you sure you want to remove ${school.dean?.full_name} as Dean of ${school.name}? If they are also an HOD, they will retain their HOD role; otherwise they de-elevate to Supervisor.`)) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/schools/${school.id}/assign-dean/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({ action: 'REMOVE' }),
      });
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Dean removed from ${school.name}. Role updated accordingly.`,
        });
        await loadSchools();
        await loadEligibleFaculty();
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network failed while removing Dean.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RBAC: ASSIGN HOD (ELEVATE ROLE TO HOD) ─────────────────────────
  const handleAddHod = async (deptId: number, userId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/departments/${deptId}/add-hod/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorText = Object.values(data).flat().join(' ') || 'Failed to assign HOD.';
        setActionMessage({ type: 'error', text: errorText });
        return;
      }

      setActionMessage({
        type: 'success',
        text: `Faculty elevated and assigned as HOD of ${data.name}.`,
      });
      setAssignHodModal(null);
      await loadSchools();
      await loadEligibleFaculty();
    } catch {
      setActionMessage({ type: 'error', text: 'Network connection failed while assigning HOD.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RBAC: REMOVE HOD (DE-ELEVATE ROLE BACK TO SUPERVISOR) ──────────
  const handleRemoveHod = async (department: DepartmentData, hod: UserCredentialData) => {
    if (!confirm(`Are you sure you want to remove ${hod.full_name} as HOD of ${department.name}? If they also hold a Dean position, they will retain their Dean role.`)) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/departments/${department.id}/remove-hod/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({ user_id: hod.id }),
      });
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `${hod.full_name} removed from HOD role of ${department.name}.`,
        });
        await loadSchools();
        await loadEligibleFaculty();
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network failed while removing HOD.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── FACULTY APPROVAL: APPROVE / REJECT ──────────────────────────────
  const handleApprovalAction = async (supervisorId: number, action: 'APPROVE' | 'REJECT', reason = '') => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts/admin/faculty-approvals/${supervisorId}/action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorText = Object.values(data).flat().join(' ') || `Failed to ${action.toLowerCase()} application.`;
        setActionMessage({ type: 'error', text: errorText });
        return;
      }

      setActionMessage({
        type: 'success',
        text: `Faculty application for ${data.full_name} was ${action === 'APPROVE' ? 'Approved & Activated' : 'Rejected'}.`,
      });
      setRejectingFaculty(null);
      setRejectionReason('');
      await loadApprovals();
      await loadEligibleFaculty();
    } catch {
      setActionMessage({ type: 'error', text: 'Network error while processing approval action.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── TOGGLE CREDENTIAL LOGIN STATUS (ENABLE / DISABLE) ──────────────
  const handleToggleStatus = async (userId: string, currentStatus: boolean, fullName: string) => {
    // Optimistic UI update
    setApprovals((prev) =>
      prev.map((f) => (f.user_id === userId ? { ...f, is_active: !currentStatus } : f))
    );
    try {
      const res = await fetch(`${API}/accounts/admin/users/${userId}/toggle-status/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Credentials for ${fullName} are now ${data.is_active ? 'Active' : 'Disabled'}.`,
        });
        await loadSchools();
        await loadApprovals();
        await loadEligibleFaculty();
      } else {
        // Revert on failure
        setApprovals((prev) =>
          prev.map((f) => (f.user_id === userId ? { ...f, is_active: currentStatus } : f))
        );
        setActionMessage({ type: 'error', text: 'Failed to update credential status.' });
      }
    } catch {
      // Revert on failure
      setApprovals((prev) =>
        prev.map((f) => (f.user_id === userId ? { ...f, is_active: currentStatus } : f))
      );
      setActionMessage({ type: 'error', text: 'Network failed while updating credential status.' });
    }
  };

  // ─── LOGOUT ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('aris_user');
    localStorage.removeItem('user');
    router.replace('/');
  };

  // ─── FILTERED SCHOOLS ───────────────────────────────────────────────
  const filteredSchools = useMemo(() => {
    if (!schoolSearchQuery.trim()) return schools;
    const q = schoolSearchQuery.trim().toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.dean && s.dean.full_name.toLowerCase().includes(q)) ||
        s.departments.some(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.code.toLowerCase().includes(q) ||
            d.hods.some((h) => h.full_name.toLowerCase().includes(q))
        )
    );
  }, [schools, schoolSearchQuery]);

  // ─── FILTERED APPROVALS ─────────────────────────────────────────────
  const filteredApprovals = useMemo(() => {
    let list = approvals;
    if (approvalStatusFilter !== 'all') {
      list = list.filter((a) => a.approval_status === approvalStatusFilter);
    }
    if (approvalsSearchQuery.trim()) {
      const q = approvalsSearchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          a.university_id.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.designation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [approvals, approvalStatusFilter, approvalsSearchQuery]);

  // ─── FILTERED ELIGIBLE FACULTY (FOR PICKER) ─────────────────────────
  const filteredEligibleFaculty = useMemo(() => {
    if (!facultyPickerSearch.trim()) return eligibleFaculty;
    const q = facultyPickerSearch.trim().toLowerCase();
    return eligibleFaculty.filter(
      (f) =>
        f.full_name.toLowerCase().includes(q) ||
        f.university_id.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        f.designation.toLowerCase().includes(q)
    );
  }, [eligibleFaculty, facultyPickerSearch]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800 antialiased">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 h-screen flex flex-col justify-between bg-white border-r border-slate-200 shadow-xl lg:shadow-sm transition-all duration-300 ease-in-out shrink-0 z-50 lg:z-30 ${
          sidebarOpen
            ? 'translate-x-0 w-64 lg:w-56'
            : '-translate-x-full lg:translate-x-0 w-64 lg:w-[64px]'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Sidebar Logo */}
          <div className="flex items-center justify-between border-b border-slate-100 py-3.5 px-3 overflow-hidden h-[74px] shrink-0">
            {sidebarOpen ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center justify-center transition-all duration-200 flex-1">
                  <Image
                    src="/images/logo.jpeg"
                    alt="Dev Bhoomi Uttarakhand University"
                    width={180}
                    height={52}
                    priority
                    className="object-contain w-full max-h-11"
                  />
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg ml-2 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-200 mx-auto">
                <Image
                  src="/images/dbgi.avif"
                  alt="DBUU Logo"
                  width={44}
                  height={44}
                  priority
                  className="object-contain w-10 h-10 rounded-md"
                />
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
            {/* Option 1: Academic Management */}
            <button
              onClick={() => {
                setActiveTab('management');
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              title={!sidebarOpen ? 'Management' : undefined}
              className={`w-full flex items-center transition-all duration-150 cursor-pointer group ${
                sidebarOpen ? 'px-4 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'
              } ${
                activeTab === 'management'
                  ? 'bg-red-50 text-[#B81D24] border-r-3 border-[#B81D24] font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <KeyRound
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === 'management' ? 'text-[#B81D24]' : 'text-slate-400 group-hover:text-slate-700'
                }`}
              />
              {sidebarOpen && (
                <span className="text-[12px] whitespace-nowrap overflow-hidden text-ellipsis">
                  Management
                </span>
              )}
            </button>

            {/* Option 2: Approvals */}
            <button
              onClick={() => {
                setActiveTab('approvals');
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              title={!sidebarOpen ? 'Approvals' : undefined}
              className={`w-full flex items-center transition-all duration-150 cursor-pointer group ${
                sidebarOpen ? 'px-4 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'
              } ${
                activeTab === 'approvals'
                  ? 'bg-red-50 text-[#B81D24] border-r-3 border-[#B81D24] font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === 'approvals' ? 'text-[#B81D24]' : 'text-slate-400 group-hover:text-slate-700'
                }`}
              />
              {sidebarOpen && (
                <span className="text-[12px] whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left">
                  Approvals
                </span>
              )}
              {sidebarOpen && pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-[#B81D24] text-white text-[10px] font-black rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Profile Details (Avatar, Name, ID, Sign Out button below) */}
        <div
          className={`border-t border-slate-100 py-3.5 bg-slate-50/60 shrink-0 ${
            sidebarOpen ? 'px-4 space-y-2.5' : 'px-0 py-3 flex flex-col items-center gap-2'
          }`}
        >
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-[#B81D24] text-white flex items-center justify-center text-xs font-black shrink-0">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {currentUser?.full_name || 'System Administrator'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {currentUser?.university_id || 'ADMIN001'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-600 hover:text-[#B81D24] hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-[#B81D24] text-white flex items-center justify-center text-xs font-black">
                A
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-[#B81D24] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Collapse Toggle Button (Desktop Only) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-16 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center shadow-md cursor-pointer hover:bg-slate-50 z-10 transition-transform"
          title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>
      </aside>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-auto min-w-0">
        {/* Top Navbar */}
        <header className="bg-[#B81D24] px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              className="lg:hidden p-1.5 text-red-100 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight truncate">
                {activeTab === 'management' ? 'Management' : 'Approvals'}
              </h1>
            </div>
          </div>

          {/* Top Right Actions & Notification Toast */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {actionMessage && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white border border-white/30 rounded-lg text-xs font-semibold animate-in fade-in">
                {actionMessage.type === 'success' ? (
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="max-w-[280px] truncate">{actionMessage.text}</span>
                <button
                  onClick={() => setActionMessage(null)}
                  className="cursor-pointer opacity-70 hover:opacity-100 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {activeTab === 'management' && (
              <button
                onClick={() => {
                  setAddSchoolError(null);
                  setSchoolForm({ name: '', code: '' });
                  setShowAddSchoolModal(true);
                }}
                className="py-1.5 px-3 sm:px-3.5 bg-white hover:bg-red-50 text-[#B81D24] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add School</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-5">
          {/* ═══════════════════════════════════════════════════════════════
              TAB 1: MANAGEMENT (SCHOOLS & DEPARTMENTS RBAC)
          ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'management' && (
            <div className="space-y-4">
              {/* Search Bar (only if schools exist) */}
              {schools.length > 0 && (
                <div className="relative max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search schools, departments, Deans, or HODs..."
                    value={schoolSearchQuery}
                    onChange={(e) => setSchoolSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B81D24] shadow-xs"
                  />
                  {schoolSearchQuery && (
                    <button
                      onClick={() => setSchoolSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Loading State */}
              {loadingSchools ? (
                <div className="p-12 text-center space-y-2">
                  <div className="w-5 h-5 border-2 border-[#B81D24] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">Loading university hierarchy...</p>
                </div>
              ) : filteredSchools.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400">
                  {schoolSearchQuery
                    ? `No schools found matching "${schoolSearchQuery}".`
                    : 'No schools configured yet.'}
                </div>
              ) : (
                /* Schools Accordion List */
                <div className="space-y-4">
                  {filteredSchools.map((school) => {
                    const isExpanded = expandedSchoolIds.includes(school.id);
                    return (
                      <div
                        key={school.id}
                        className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden transition-all"
                      >
                        {/* School Accordion Header */}
                        <div
                          onClick={() => toggleSchoolAccordion(school.id)}
                          className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 select-none transition-colors border-b border-slate-100"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-700 transition-transform shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-slate-900 truncate">{school.name}</h3>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">
                                  {school.code}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {school.departments_count} {school.departments_count === 1 ? 'Department' : 'Departments'}
                                {' • '}
                                {school.dean ? (
                                  <span className="text-emerald-700 font-semibold">
                                    Dean: {school.dean.full_name}
                                  </span>
                                ) : (
                                  <span className="text-amber-700 font-medium">No Dean Assigned</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setAddDeptError(null);
                                setDeptForm({ name: '', code: '' });
                                setSelectedSchoolForDept(school);
                              }}
                              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Add Dept</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditSchoolError(null);
                                setEditSchoolForm({ name: school.name, code: school.code });
                                setEditingSchool(school);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit School"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchool(school)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete School"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* School Expanded Body */}
                        {isExpanded && (
                          <div className="p-4 sm:p-6 bg-slate-50/50 space-y-6">
                            {/* ── DEAN SECTION ── */}
                            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="w-4 h-4 text-[#B81D24]" />
                                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    School Executive (Dean)
                                  </h4>
                                </div>
                                {!school.dean ? (
                                  <button
                                    onClick={() => {
                                      setFacultyPickerSearch('');
                                      setAssignDeanModal(school);
                                    }}
                                    className="px-2.5 py-1 bg-[#B81D24] hover:bg-[#9E181E] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Assign Dean</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setFacultyPickerSearch('');
                                        setAssignDeanModal(school);
                                      }}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                    >
                                      Change Dean
                                    </button>
                                    <button
                                      onClick={() => handleRemoveDean(school)}
                                      className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>

                              {school.dean ? (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 text-[#B81D24] border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs">
                                      {school.dean.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={school.dean.avatar_url}
                                          alt={school.dean.full_name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span>{school.dean.full_name?.charAt(0) || 'D'}</span>
                                      )}
                                    </div>
                                    <div className="min-w-0 space-y-0.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-slate-900">
                                          {school.dean.full_name}
                                        </span>
                                      {school.departments?.some((d) => d.hods.some((h) => h.id === school.dean?.id)) ? (
                                        <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[9px] font-black border border-purple-200">
                                          DEAN &amp; HOD
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[9px] font-bold">
                                          DEAN
                                        </span>
                                      )}
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                          school.dean.is_active
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {school.dean.is_active ? 'Active' : 'Disabled'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono flex-wrap">
                                      <span>ID: {school.dean.university_id}</span>
                                      <span>•</span>
                                      <span>{school.dean.email}</span>
                                      {school.dean.phone && (
                                        <>
                                          <span>•</span>
                                          <span>{school.dean.phone}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                    onClick={() =>
                                      handleToggleStatus(school.dean!.id, school.dean!.is_active, school.dean!.full_name)
                                    }
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-colors cursor-pointer shrink-0 ${
                                      school.dean.is_active
                                        ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {school.dean.is_active ? 'Disable Access' : 'Enable Access'}
                                  </button>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 py-2">
                                  No Dean assigned to {school.name}. Click &ldquo;Assign Dean&rdquo; to elevate an approved faculty member.
                                </p>
                              )}
                            </div>

                            {/* ── DEPARTMENTS & HODs ── */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-[#B81D24]" />
                                  Departments ({school.departments.length})
                                </h4>
                              </div>

                              {school.departments.length === 0 ? (
                                <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                                  No departments added to this school yet. Click &ldquo;Add Dept&rdquo; above.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-3">
                                  {school.departments.map((dept) => (
                                    <div
                                      key={dept.id}
                                      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h5 className="text-xs font-bold text-slate-900 truncate">
                                              {dept.name}
                                            </h5>
                                            {dept.code && (
                                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">
                                                {dept.code}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-slate-400 mt-0.5">
                                            {dept.hods.length} {dept.hods.length === 1 ? 'Head of Department' : 'Heads of Department'}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            onClick={() => {
                                              setEditDeptError(null);
                                              setEditDeptForm({ name: dept.name, code: dept.code || '' });
                                              setEditingDept({ dept, school });
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                            title="Edit Department"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteDept(school, dept)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            title="Delete Department"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setFacultyPickerSearch('');
                                              setAssignHodModal(dept);
                                            }}
                                            className="px-2.5 py-1 bg-[#B81D24] hover:bg-[#9E181E] text-white text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors shrink-0 shadow-xs"
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>Assign HOD</span>
                                          </button>
                                        </div>
                                      </div>

                                      {/* HODs List */}
                                      {dept.hods.length === 0 ? (
                                        <p className="text-[11px] text-slate-400 italic py-1">
                                          No HOD assigned yet. Click &ldquo;Assign HOD&rdquo; to elevate an approved faculty member.
                                        </p>
                                      ) : (
                                        <div className="space-y-1.5 pt-1">
                                          {dept.hods.map((hod) => (
                                            <div
                                              key={hod.id}
                                              className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-2"
                                            >
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-blue-700 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs">
                                                  {hod.avatar_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                      src={hod.avatar_url}
                                                      alt={hod.full_name}
                                                      className="w-full h-full object-cover"
                                                    />
                                                  ) : (
                                                    <span>{hod.full_name?.charAt(0) || 'H'}</span>
                                                  )}
                                                </div>
                                                <div className="min-w-0 space-y-0.5">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-xs font-bold text-slate-900">
                                                      {hod.full_name}
                                                    </span>
                                                    {school.dean?.id === hod.id ? (
                                                      <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[8px] font-black border border-purple-200">
                                                        DEAN &amp; HOD
                                                      </span>
                                                    ) : (
                                                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[8px] font-bold">
                                                        HOD
                                                      </span>
                                                    )}
                                                    <span
                                                      className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                                                        hod.is_active
                                                          ? 'bg-emerald-100 text-emerald-800'
                                                          : 'bg-rose-100 text-rose-800'
                                                      }`}
                                                    >
                                                      {hod.is_active ? 'Active' : 'Disabled'}
                                                    </span>
                                                  </div>
                                                  <div className="text-[10px] font-mono text-slate-500 truncate">
                                                    {hod.university_id} • {hod.email}
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                  onClick={() =>
                                                    handleToggleStatus(hod.id, hod.is_active, hod.full_name)
                                                  }
                                                  className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                                    hod.is_active
                                                      ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                                                      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                                  }`}
                                                >
                                                  {hod.is_active ? 'Disable' : 'Enable'}
                                                </button>
                                                <button
                                                  onClick={() => handleRemoveHod(dept, hod)}
                                                  className="text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                                  title="Remove HOD role"
                                                >
                                                  Remove
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
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
              TAB 2: FACULTY REGISTRATION APPROVALS
          ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Status Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs overflow-x-auto">
                  {(
                    [
                      { key: 'PENDING', label: 'Pending', count: approvals.filter((a) => a.approval_status === 'PENDING').length },
                      { key: 'APPROVED', label: 'Approved', count: approvals.filter((a) => a.approval_status === 'APPROVED').length },
                      { key: 'REJECTED', label: 'Rejected', count: approvals.filter((a) => a.approval_status === 'REJECTED').length },
                      { key: 'all', label: 'All', count: approvals.length },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setApprovalStatusFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        approvalStatusFilter === tab.key
                          ? 'bg-[#B81D24] text-white'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          approvalStatusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, dept..."
                    value={approvalsSearchQuery}
                    onChange={(e) => setApprovalsSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B81D24] shadow-xs"
                  />
                  {approvalsSearchQuery && (
                    <button
                      onClick={() => setApprovalsSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Approvals List */}
              {loadingApprovals ? (
                <div className="p-12 text-center space-y-2">
                  <div className="w-5 h-5 border-2 border-[#B81D24] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">Loading faculty applications...</p>
                </div>
              ) : filteredApprovals.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
                  No faculty registrations found for this filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredApprovals.map((faculty) => (
                    <div
                      key={faculty.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Left: Profile Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-slate-100 text-[#B81D24] border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-base shrink-0 select-none shadow-2xs">
                          {faculty.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={faculty.avatar_url}
                              alt={faculty.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{faculty.full_name?.charAt(0) || 'F'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                            {faculty.full_name}
                          </h4>
                          <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">
                            {faculty.university_id}
                          </p>
                          <p className="text-xs text-slate-700 font-medium mt-0.5 truncate">
                            {faculty.department}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Date: {faculty.created_at ? new Date(faculty.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {faculty.approval_status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleApprovalAction(faculty.id, 'APPROVE')}
                              disabled={submitting}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectingFaculty(faculty);
                                setRejectionReason('');
                              }}
                              disabled={submitting}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {faculty.approval_status === 'APPROVED' && (
                              <button
                                onClick={() =>
                                  handleToggleStatus(faculty.user_id, faculty.is_active, faculty.full_name)
                                }
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                                  faculty.is_active
                                    ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                                    : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                }`}
                              >
                                {faculty.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                <span>{faculty.is_active ? 'Disable Access' : 'Enable Access'}</span>
                              </button>
                            )}
                            {faculty.approval_status === 'REJECTED' && (
                              <button
                                onClick={() => handleApprovalAction(faculty.id, 'APPROVE')}
                                disabled={submitting}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Re-approve</span>
                              </button>
                            )}
                          </>
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

      {/* ─── MODAL 1: ADD SCHOOL ──────────────────────────────────────── */}
      {showAddSchoolModal && (
        <Modal
          title="Add University Academic School"
          subtitle="Define a major school within Dev Bhoomi Uttarakhand University."
          onClose={() => setShowAddSchoolModal(false)}
        >
          <form onSubmit={handleCreateSchool} className="space-y-4">
            {addSchoolError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addSchoolError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                School Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. School of Engineering & Computing"
                value={schoolForm.name}
                onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Short Form / Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SOEC"
                value={schoolForm.code}
                onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 uppercase focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSchoolModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {submitting ? 'Creating...' : 'Create School'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL 2: ADD DEPARTMENT ─────────────────────────────────── */}
      {selectedSchoolForDept && (
        <Modal
          title={`Add Department to ${selectedSchoolForDept.code}`}
          subtitle={`School: ${selectedSchoolForDept.name}`}
          onClose={() => setSelectedSchoolForDept(null)}
        >
          <form onSubmit={handleCreateDepartment} className="space-y-4">
            {addDeptError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addDeptError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Department of Computer Applications"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department Code / Acronym (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. DCA"
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 uppercase focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSchoolForDept(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {submitting ? 'Adding...' : 'Add Department'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL 2B: EDIT SCHOOL ───────────────────────────────────── */}
      {editingSchool && (
        <Modal
          title={`Edit School: ${editingSchool.code}`}
          subtitle="Update school institutional name and short code"
          onClose={() => setEditingSchool(null)}
        >
          <form onSubmit={handleUpdateSchool} className="space-y-4">
            {editSchoolError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editSchoolError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                School Full Name *
              </label>
              <input
                type="text"
                required
                value={editSchoolForm.name}
                onChange={(e) => setEditSchoolForm({ ...editSchoolForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                School Short Code *
              </label>
              <input
                type="text"
                required
                value={editSchoolForm.code}
                onChange={(e) => setEditSchoolForm({ ...editSchoolForm, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 uppercase focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSchool(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL 2C: EDIT DEPARTMENT ───────────────────────────────── */}
      {editingDept && (
        <Modal
          title="Edit Department"
          subtitle={`School: ${editingDept.school.name}`}
          onClose={() => setEditingDept(null)}
        >
          <form onSubmit={handleUpdateDept} className="space-y-4">
            {editDeptError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editDeptError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department Full Name *
              </label>
              <input
                type="text"
                required
                value={editDeptForm.name}
                onChange={(e) => setEditDeptForm({ ...editDeptForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department Code / Acronym (Optional)
              </label>
              <input
                type="text"
                value={editDeptForm.code}
                onChange={(e) => setEditDeptForm({ ...editDeptForm, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 uppercase focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL 3: ASSIGN DEAN (RBAC FACULTY PICKER) ────────────────── */}
      {assignDeanModal && (
        <Modal
          title={`Assign Dean of ${assignDeanModal.name}`}
          subtitle="Select an approved faculty member to elevate their role to Dean."
          maxWidth="max-w-lg"
          onClose={() => setAssignDeanModal(null)}
        >
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search approved faculty by name, ID, department..."
                value={facultyPickerSearch}
                onChange={(e) => setFacultyPickerSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            {/* Faculty List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredEligibleFaculty.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No approved faculty available. First approve faculty registrations in the Approvals section.
                </div>
              ) : (
                filteredEligibleFaculty.map((faculty) => {
                  const isCurrentDean = assignDeanModal.dean?.id === faculty.user_id;
                  return (
                    <div
                      key={faculty.user_id}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                        isCurrentDean
                          ? 'bg-red-50/50 border-[#B81D24]'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-[#B81D24] border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs">
                          {faculty.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={faculty.avatar_url}
                              alt={faculty.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{faculty.full_name?.charAt(0) || 'F'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{faculty.full_name}</span>
                            <span className="text-[10px] font-mono text-slate-500">({faculty.university_id})</span>
                            {faculty.dean_school && faculty.hod_departments.length > 0 ? (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                DEAN &amp; HOD
                              </span>
                            ) : faculty.dean_school || faculty.role === 'DEAN' ? (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-100 text-amber-800">
                                DEAN
                              </span>
                            ) : faculty.hod_departments.length > 0 || faculty.role === 'HOD' ? (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-blue-100 text-blue-800">
                                HOD
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-100 text-slate-700">
                                SUPERVISOR
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {faculty.designation} • {faculty.department}
                          </p>
                          {faculty.dean_school && faculty.dean_school.id !== assignDeanModal.id && (
                            <p className="text-[10px] text-amber-600 font-semibold">
                              Currently Dean of {faculty.dean_school.code} (will transfer Dean role to {assignDeanModal.code})
                            </p>
                          )}
                          {faculty.hod_departments && faculty.hod_departments.length > 0 && (
                            <p className="text-[10px] text-blue-600 font-semibold">
                              Holds HOD of {faculty.hod_departments.map((d) => d.code || d.name).join(', ')} (will retain HOD position)
                            </p>
                          )}
                        </div>
                      </div>

                      {isCurrentDean ? (
                        <span className="text-xs font-bold text-emerald-700 px-2 py-1 bg-emerald-50 rounded">
                          Current Dean
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAssignDean(assignDeanModal.id, faculty.user_id)}
                          disabled={submitting}
                          className="px-3 py-1.5 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs shrink-0"
                        >
                          Assign as Dean
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setAssignDeanModal(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 4: ASSIGN HOD (RBAC FACULTY PICKER) ─────────────────── */}
      {assignHodModal && (
        <Modal
          title={`Assign HOD for ${assignHodModal.name}`}
          subtitle="Select an approved faculty member to elevate their role to Head of Department."
          maxWidth="max-w-lg"
          onClose={() => setAssignHodModal(null)}
        >
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search approved faculty by name, ID, department..."
                value={facultyPickerSearch}
                onChange={(e) => setFacultyPickerSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            {/* Faculty List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredEligibleFaculty.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No approved faculty available. First approve faculty registrations in the Approvals section.
                </div>
              ) : (
                filteredEligibleFaculty.map((faculty) => {
                  const isAlreadyHodHere = assignHodModal.hods.some((h) => h.id === faculty.user_id);
                  return (
                    <div
                      key={faculty.user_id}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                        isAlreadyHodHere
                          ? 'bg-blue-50/50 border-blue-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-[#B81D24] border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs">
                          {faculty.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={faculty.avatar_url}
                              alt={faculty.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{faculty.full_name?.charAt(0) || 'F'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{faculty.full_name}</span>
                            <span className="text-[10px] font-mono text-slate-500">({faculty.university_id})</span>
                            {faculty.dean_school && faculty.hod_departments.length > 0 ? (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                DEAN &amp; HOD
                              </span>
                            ) : faculty.dean_school || faculty.role === 'DEAN' ? (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-100 text-amber-800">
                                DEAN
                              </span>
                            ) : faculty.hod_departments.length > 0 || faculty.role === 'HOD' ? (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-blue-100 text-blue-800">
                                HOD
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-100 text-slate-700">
                                SUPERVISOR
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {faculty.designation} • {faculty.department}
                          </p>
                          {faculty.dean_school && (
                            <p className="text-[10px] text-purple-600 font-semibold">
                              Dean of {faculty.dean_school.code} (will retain Dean executive rank and gain HOD role)
                            </p>
                          )}
                          {faculty.hod_departments && faculty.hod_departments.filter((d) => d.id !== assignHodModal.id).length > 0 && (
                            <p className="text-[10px] text-blue-600 font-semibold">
                              Also HOD of {faculty.hod_departments.filter((d) => d.id !== assignHodModal.id).map((d) => d.code || d.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {isAlreadyHodHere ? (
                        <span className="text-xs font-bold text-blue-700 px-2 py-1 bg-blue-50 rounded">
                          Already HOD
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddHod(assignHodModal.id, faculty.user_id)}
                          disabled={submitting}
                          className="px-3 py-1.5 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs shrink-0"
                        >
                          Assign as HOD
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setAssignHodModal(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 5: REJECT FACULTY MODAL ────────────────────────────── */}
      {rejectingFaculty && (
        <Modal
          title={`Reject Faculty Application`}
          subtitle={`Applicant: ${rejectingFaculty.full_name} (${rejectingFaculty.university_id})`}
          onClose={() => setRejectingFaculty(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Employee ID not found in HR records or incorrect department selected."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingFaculty(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApprovalAction(rejectingFaculty.id, 'REJECT', rejectionReason)}
                disabled={submitting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
