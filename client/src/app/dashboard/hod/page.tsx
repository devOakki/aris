'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  User,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  Users,
  Search,
  Plus,
  FolderGit2,
  Layers,
  ExternalLink,
  FileText,
  FileCode,
  Globe,
  History,
  AlertCircle,
  Edit3,
  Briefcase,
  Sparkles,
  Presentation,
  CheckCircle2,
  Eye,
  Calendar,
  ChevronRight,
  Building2,
  Printer,
  ArrowLeft,
  Upload,
  Download,
  Mail,
  Send,
} from 'lucide-react';

// ─── TYPES ──────────────────────────────────────────────────────────
export interface AcademicSessionData {
  id: number;
  year: string;
  term: 'ODD' | 'EVEN';
  is_active: boolean;
}

export interface FacultyApplication {
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

export interface ProjectTrackData {
  id: string;
  title: string;
  category: string;
  session?: number;
  session_year: string;
  session_term: string;
  department: string;
  target_program: string;
  target_semester: number;
  coordinator: number | null;
  coordinator_name: string;
  is_mandatory: boolean;
  max_group_size: number;
  required_deliverables: string[];
  is_active: boolean;
  created_at: string;
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
  stage: string;
  action: string;
  comment: string;
  actioned_by_name: string;
  actioned_by_role: string;
  actioned_at: string;
}

export interface ProjectDossierData {
  id: string;
  name: string;
  status: string;
  track: string;
  track_title: string;
  category?: string;
  session_year?: string;
  session_term?: string;
  department: string;
  target_program: string;
  target_semester: number;
  supervisor: number | null;
  supervisor_name: string;
  supervisor_email?: string;
  supervisor_designation?: string;
  supervisor_department?: string;
  members: GroupMemberData[];
  approved_proposal?: {
    id: string;
    title: string;
    abstract: string;
    problem_statement: string;
    domain: string;
    tech_stack: string[];
    novelty?: string;
    supervisor_feedback?: string;
  } | null;
  submission?: {
    id: string;
    github_repo_url: string;
    live_demo_url: string;
    synopsis_url: string;
    ppt_url: string;
    report_url: string;
    research_paper_url: string;
    media_urls: string[];
    github_submitted_at?: string | null;
    synopsis_submitted_at?: string | null;
    ppt_submitted_at?: string | null;
    report_submitted_at?: string | null;
    media_submitted_at?: string | null;
    all_completed_at?: string | null;
    is_complete: boolean;
  } | null;
  approval_records: ApprovalRecordData[];
  created_at: string;
  updated_at: string;
}

const CATEGORY_CHOICES = [
  { value: 'MINOR_1', label: 'Minor Project I' },
  { value: 'MINOR_2', label: 'Minor Project II' },
  { value: 'MAJOR', label: 'Major Project' },
  { value: 'RESEARCH', label: 'Research Paper Track' },
  { value: 'HARDWARE', label: 'Hardware / IoT Project' },
  { value: 'INNOVATION', label: 'Innovation / Capstone' },
];

const AVAILABLE_DELIVERABLES = [
  { id: 'synopsis', label: 'Synopsis (PDF)' },
  { id: 'presentation', label: 'Presentation (PPT)' },
  { id: 'report', label: 'Project Report (PDF)' },
  { id: 'github', label: 'GitHub Repository' },
  { id: 'live_demo', label: 'Live Working Demo URL' },
  { id: 'research_paper', label: 'Research Paper Draft' },
  { id: 'media_files', label: 'Media Demo Files (Images/Video)' },
];

export default function HODDashboardPage() {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // Active Main Tab: 'tracks' | 'supervisors' | 'projects' | 'history'
  const [activeTab, setActiveTab] = useState<'tracks' | 'supervisors' | 'projects' | 'history'>('tracks');

  // Debounced Search Query for top navbar
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Data Collections
  const [facultyList, setFacultyList] = useState<FacultyApplication[]>([]);
  const [tracksList, setTracksList] = useState<ProjectTrackData[]>([]);
  const [dossiersList, setDossiersList] = useState<ProjectDossierData[]>([]);
  const [sessionsList, setSessionsList] = useState<AcademicSessionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // History Hierarchical Drill-down States: Year -> Term -> Department
  const [selectedHistoryYear, setSelectedHistoryYear] = useState<string | null>(null);
  const [selectedHistoryTerm, setSelectedHistoryTerm] = useState<'ODD' | 'EVEN' | null>(null);
  const [selectedHistoryDepartment, setSelectedHistoryDepartment] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL');

  // Sub-filter tabs
  const [supervisorStatusFilter, setSupervisorStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'HOD_APPROVED' | 'HOD_REJECTED' | 'ACTIVE'>('ALL');

  // Action status states
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Track Creation / Edit Modal
  const [isTrackModalOpen, setIsTrackModalOpen] = useState<boolean>(false);
  const [editingTrack, setEditingTrack] = useState<ProjectTrackData | null>(null);
  const [trackForm, setTrackForm] = useState({
    title: '',
    category: 'MINOR_1',
    target_program: 'BCA',
    target_semester: 5,
    max_group_size: 3,
    is_mandatory: true,
    coordinator: '' as string | number,
    required_deliverables: ['synopsis', 'presentation', 'github', 'report'] as string[],
  });

  // Track Details Modal (shows all groups in this track)
  const [selectedTrackForDetails, setSelectedTrackForDetails] = useState<ProjectTrackData | null>(null);

  // Deadlines & Format Templates Modal State
  const [selectedTrackForDeadlines, setSelectedTrackForDeadlines] = useState<ProjectTrackData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trackDeadlines, setTrackDeadlines] = useState<any[]>([]);
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState<boolean>(false);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState<boolean>(false);
  const [isSavingDeadline, setIsSavingDeadline] = useState<boolean>(false);
  const [deadlineForm, setDeadlineForm] = useState({
    deadline_type: 'SYNOPSIS',
    title: '',
    due_date: '',
    template_url: '',
    template_filename: '',
    instructions: '',
    late_submission_allowed: false,
    notify_students: true,
  });

  // Deep Detailed View Modal (shows full proposal, timestamps, teammates, supervisor, history)
  const [deepViewProject, setDeepViewProject] = useState<ProjectDossierData | null>(null);

  // Assign Supervisor Modal
  const [assignModalGroup, setAssignModalGroup] = useState<ProjectDossierData | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');

  // Dossier Decision Modal
  const [decisionModalGroup, setDecisionModalGroup] = useState<ProjectDossierData | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [decisionComment, setDecisionComment] = useState<string>('');

  // ─── DEBOUNCE EFFECT FOR NAVBAR SEARCH ──────────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // ─── DATA LOADERS ───────────────────────────────────────────────────
  const loadSessions = useCallback(async (token: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/accounts/sessions/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessionsList(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Failed to load academic sessions:', err);
    }
  }, []);

  const loadFaculty = useCallback(async (token: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/approvals/faculty/?status=all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFacultyList(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Failed to load faculty approvals:', err);
    }
  }, []);

  const loadTracks = useCallback(async (token: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/projects/tracks/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTracksList(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Failed to load tracks:', err);
    }
  }, []);

  const loadDossiers = useCallback(async (token: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/approvals/dossiers/?status=all&all_departments=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDossiersList(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Failed to load project dossiers:', err);
    }
  }, []);

  const refreshAllData = useCallback(async (token: string) => {
    setLoading(true);
    try {
      await Promise.all([
        loadFaculty(token),
        loadTracks(token),
        loadDossiers(token),
        loadSessions(token),
      ]);
    } catch (err) {
      console.error('Error refreshing HOD workspace data:', err);
    } finally {
      setLoading(false);
    }
  }, [loadFaculty, loadTracks, loadDossiers, loadSessions]);

  // ─── AUTH & DATA LOADING ──────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const raw = localStorage.getItem('aris_user');

    if (!token) {
      window.location.replace('/');
      return;
    }

    queueMicrotask(() => {
      setIsAuthorized(true);
      if (raw) {
        try {
          setCurrentUser(JSON.parse(raw));
        } catch {
          setCurrentUser(null);
        }
      }
      refreshAllData(token);
    });

    // bfcache protection
    const handlePageShow = (event: PageTransitionEvent) => {
      const currentToken = localStorage.getItem('access_token');
      if (event.persisted || !currentToken) {
        window.location.replace('/');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [refreshAllData]);

  // ─── FACULTY APPROVAL / DECLINE HANDLER ────────────────────────────
  const handleFacultyAction = async (supervisorId: number, action: 'APPROVE' | 'REJECT') => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    let reason = '';
    if (action === 'REJECT') {
      const input = prompt('Please provide a reason for declining this faculty registration:');
      if (input === null) return;
      reason = input.trim();
    }

    setActionLoading(`faculty-${supervisorId}`);
    setActionMessage(null);
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
        setActionMessage({
          type: 'success',
          text:
            action === 'APPROVE'
              ? `Approved ${updated.full_name}. Credentials are now active for supervisor login.`
              : `Declined application for ${updated.full_name}.`,
        });
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.detail || 'Failed to update faculty status.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network error while processing faculty decision.' });
    } finally {
      setActionLoading(null);
    }
  };

  // ─── TRACK CREATION & UPDATE ───────────────────────────────────────
  const openCreateTrackModal = () => {
    setEditingTrack(null);
    setTrackForm({
      title: '',
      category: 'MINOR_1',
      target_program: 'BCA',
      target_semester: 5,
      max_group_size: 3,
      is_mandatory: true,
      coordinator: '',
      required_deliverables: ['synopsis', 'presentation', 'github', 'report'],
    });
    setIsTrackModalOpen(true);
  };

  const openEditTrackModal = (track: ProjectTrackData) => {
    setEditingTrack(track);
    setTrackForm({
      title: track.title,
      category: track.category || 'MINOR_1',
      target_program: track.target_program || 'BCA',
      target_semester: track.target_semester || 5,
      max_group_size: track.max_group_size || 3,
      is_mandatory: track.is_mandatory,
      coordinator: track.coordinator || '',
      required_deliverables: track.required_deliverables || ['synopsis', 'presentation', 'github'],
    });
    setIsTrackModalOpen(true);
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) return;

    if (!trackForm.title.trim()) {
      alert('Track title is required.');
      return;
    }

    setActionLoading('save-track');
    setActionMessage(null);

    const payload = {
      title: trackForm.title.trim(),
      category: trackForm.category,
      target_program: trackForm.target_program,
      target_semester: Number(trackForm.target_semester),
      max_group_size: Number(trackForm.max_group_size),
      is_mandatory: trackForm.is_mandatory,
      coordinator: trackForm.coordinator ? Number(trackForm.coordinator) : null,
      required_deliverables: trackForm.required_deliverables,
    };

    try {
      const url = editingTrack
        ? `http://127.0.0.1:8000/api/projects/tracks/${editingTrack.id}/`
        : 'http://127.0.0.1:8000/api/projects/tracks/';
      const method = editingTrack ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsTrackModalOpen(false);
        loadTracks(token);
        setActionMessage({
          type: 'success',
          text: editingTrack
            ? `Project track "${payload.title}" updated successfully.`
            : `New project track "${payload.title}" published for the department.`,
        });
      } else {
        const err = await res.json();
        alert(err.detail || JSON.stringify(err) || 'Failed to save project track.');
      }
    } catch {
      alert('Network error while saving project track.');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── DEADLINES & FORMAT TEMPLATES HANDLERS ─────────────────────────
  const openDeadlinesModal = async (track: ProjectTrackData) => {
    setSelectedTrackForDeadlines(track);
    setIsLoadingDeadlines(true);
    setDeadlineForm({
      deadline_type: 'SYNOPSIS',
      title: '',
      due_date: '',
      template_url: '',
      template_filename: '',
      instructions: '',
      late_submission_allowed: false,
      notify_students: true,
    });

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/projects/tracks/${track.id}/deadlines/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrackDeadlines(data);
      }
    } catch (err) {
      console.error('Failed to load track deadlines:', err);
    } finally {
      setIsLoadingDeadlines(false);
    }
  };

  const handleTemplateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTemplate(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deliverable_type', 'TEMPLATE');
    formData.append('auto_attach', 'false');

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/submissions/upload/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.file || data.detail || 'Template format upload failed.' });
        return;
      }
      setDeadlineForm((prev) => ({
        ...prev,
        template_url: data.secure_url,
        template_filename: file.name,
      }));
      setActionMessage({ type: 'success', text: `Format template "${file.name}" uploaded successfully to Cloudinary.` });
    } catch {
      setActionMessage({ type: 'error', text: 'Network connection error during template upload.' });
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackForDeadlines) return;
    if (!deadlineForm.due_date) {
      setActionMessage({ type: 'error', text: 'Please select a valid deadline date & time.' });
      return;
    }

    setIsSavingDeadline(true);
    try {
      const token = localStorage.getItem('access_token');
      const isoDueDate = new Date(deadlineForm.due_date).toISOString();
      const res = await fetch(`http://127.0.0.1:8000/api/projects/tracks/${selectedTrackForDeadlines.id}/deadlines/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...deadlineForm,
          due_date: isoDueDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || data.due_date || 'Failed to save deadline.' });
        return;
      }

      const count = data.dispatched_notifications_count || 0;
      setActionMessage({
        type: 'success',
        text: `Milestone deadline configured! Official notification dispatched to ${count} student(s) in this track.`,
      });

      // Refresh deadlines list in modal
      const refreshed = await fetch(`http://127.0.0.1:8000/api/projects/tracks/${selectedTrackForDeadlines.id}/deadlines/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshed.ok) {
        setTrackDeadlines(await refreshed.json());
      }

      // Reset form fields
      setDeadlineForm({
        deadline_type: 'SYNOPSIS',
        title: '',
        due_date: '',
        template_url: '',
        template_filename: '',
        instructions: '',
        late_submission_allowed: false,
        notify_students: true,
      });
    } catch {
      setActionMessage({ type: 'error', text: 'Network error saving milestone deadline.' });
    } finally {
      setIsSavingDeadline(false);
    }
  };

  // ─── SUPERVISOR ALLOCATION HANDLER ─────────────────────────────────
  const handleAssignSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalGroup || !selectedSupervisorId) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setActionLoading(`assign-${assignModalGroup.id}`);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/approvals/groups/${assignModalGroup.id}/assign-supervisor/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ supervisor_id: Number(selectedSupervisorId) }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDossiersList((prev) => prev.map((g) => (g.id === assignModalGroup.id ? updated : g)));
        if (deepViewProject && deepViewProject.id === assignModalGroup.id) {
          setDeepViewProject(updated);
        }
        setAssignModalGroup(null);
        setSelectedSupervisorId('');
        setActionMessage({
          type: 'success',
          text: `Supervisor ${updated.supervisor_name} successfully assigned to ${updated.name}.`,
        });
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to assign supervisor.');
      }
    } catch {
      alert('Network error while assigning supervisor.');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── DOSSIER HOD DECISION (APPROVE / REJECT) ──────────────────────
  const handleDossierDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModalGroup) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    if (!decisionComment.trim()) {
      alert('Feedback / remarks are required for this decision.');
      return;
    }

    setActionLoading(`decision-${decisionModalGroup.id}`);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/approvals/dossiers/${decisionModalGroup.id}/action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: decisionType,
          comment: decisionComment.trim(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDossiersList((prev) => prev.map((g) => (g.id === decisionModalGroup.id ? updated : g)));
        if (deepViewProject && deepViewProject.id === decisionModalGroup.id) {
          setDeepViewProject(updated);
        }
        setDecisionModalGroup(null);
        setDecisionComment('');
        setActionMessage({
          type: 'success',
          text:
            decisionType === 'APPROVED'
              ? `Endorsed ${updated.name}. Forwarded to Dean of School for final university sign-off.`
              : `Requested revisions for ${updated.name}. Comments returned to student group.`,
        });
      } else {
        const err = await res.json();
        alert(err.detail || JSON.stringify(err) || 'Failed to submit dossier decision.');
      }
    } catch {
      alert('Network error while submitting dossier decision.');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── SIGN OUT ──────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('aris_user');
    localStorage.removeItem('user');
    localStorage.removeItem('aris_token');
    sessionStorage.clear();
    setIsAuthorized(false);
    window.location.replace('/');
  };

  // ─── FORMAT TIMESTAMP HELPER ──────────────────────────────────────
  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  // ─── FILTERED DATA COMPUTATION ────────────────────────────────────
  const pendingFacultyCount = useMemo(
    () => facultyList.filter((f) => f.approval_status === 'PENDING').length,
    [facultyList]
  );

  const pendingDossiersCount = useMemo(
    () => dossiersList.filter((d) => d.status === 'SUBMITTED').length,
    [dossiersList]
  );

  const filteredFaculty = useMemo(() => {
    return facultyList.filter((f) => {
      if (supervisorStatusFilter !== 'ALL' && f.approval_status !== supervisorStatusFilter) {
        return false;
      }
      if (debouncedSearch) {
        const matchName = f.full_name?.toLowerCase().includes(debouncedSearch);
        const matchId = f.university_id?.toLowerCase().includes(debouncedSearch);
        const matchDesig = f.designation?.toLowerCase().includes(debouncedSearch);
        const matchDomains = f.expertise_domains?.some((d) => d.toLowerCase().includes(debouncedSearch));
        const matchTech = f.expertise_tech?.some((t) => t.toLowerCase().includes(debouncedSearch));
        return matchName || matchId || matchDesig || matchDomains || matchTech;
      }
      return true;
    });
  }, [facultyList, supervisorStatusFilter, debouncedSearch]);

  const filteredTracks = useMemo(() => {
    return tracksList.filter((t) => {
      if (debouncedSearch) {
        const matchTitle = t.title?.toLowerCase().includes(debouncedSearch);
        const matchProg = t.target_program?.toLowerCase().includes(debouncedSearch);
        const matchCoord = t.coordinator_name?.toLowerCase().includes(debouncedSearch);
        const matchCat = t.category?.toLowerCase().includes(debouncedSearch);
        return matchTitle || matchProg || matchCoord || matchCat;
      }
      return true;
    });
  }, [tracksList, debouncedSearch]);

  const filteredDossiers = useMemo(() => {
    return dossiersList.filter((d) => {
      // For departmental Projects tab, filter by HOD's department
      if (currentUser?.department && d.department) {
        const normHOD = currentUser.department.toLowerCase().replace('department of ', '').trim();
        const normProj = d.department.toLowerCase().replace('department of ', '').trim();
        if (!normProj.includes(normHOD) && !normHOD.includes(normProj)) {
          return false;
        }
      }
      if (projectStatusFilter !== 'ALL' && d.status !== projectStatusFilter) {
        return false;
      }
      if (debouncedSearch) {
        const matchName = d.name?.toLowerCase().includes(debouncedSearch);
        const matchTrack = d.track_title?.toLowerCase().includes(debouncedSearch);
        const matchSupervisor = d.supervisor_name?.toLowerCase().includes(debouncedSearch);
        const matchProposal = d.approved_proposal?.title?.toLowerCase().includes(debouncedSearch);
        const matchMember = d.members?.some(
          (m) =>
            m.full_name?.toLowerCase().includes(debouncedSearch) ||
            m.university_id?.toLowerCase().includes(debouncedSearch)
        );
        return matchName || matchTrack || matchSupervisor || matchProposal || matchMember;
      }
      return true;
    });
  }, [dossiersList, projectStatusFilter, debouncedSearch, currentUser]);

  const approvedSupervisors = useMemo(
    () => facultyList.filter((f) => f.approval_status === 'APPROVED'),
    [facultyList]
  );

  // Groups enrolled in the currently inspected track
  const selectedTrackGroups = useMemo(() => {
    if (!selectedTrackForDetails) return [];
    return dossiersList.filter(
      (d) => d.track === selectedTrackForDetails.id || d.track_title === selectedTrackForDetails.title
    );
  }, [selectedTrackForDetails, dossiersList]);

  // ─── HISTORY TAB COMPUTED AUDIT HIERARCHY ─────────────────────────
  // 1. Academic Years list with project counts and terms
  const historyAcademicYears = useMemo(() => {
    const map = new Map<
      string,
      {
        year: string;
        totalProjects: number;
        totalTracks: number;
        oddProjects: number;
        evenProjects: number;
        isActive: boolean;
        departments: Set<string>;
      }
    >();

    // Seed from backend sessions
    sessionsList.forEach((s) => {
      if (!map.has(s.year)) {
        map.set(s.year, {
          year: s.year,
          totalProjects: 0,
          totalTracks: 0,
          oddProjects: 0,
          evenProjects: 0,
          isActive: s.is_active,
          departments: new Set<string>(),
        });
      }
      if (s.is_active) {
        map.get(s.year)!.isActive = true;
      }
    });

    // Accumulate from dossiers
    dossiersList.forEach((d) => {
      const yr = d.session_year || '2026-27';
      if (!map.has(yr)) {
        map.set(yr, {
          year: yr,
          totalProjects: 0,
          totalTracks: 0,
          oddProjects: 0,
          evenProjects: 0,
          isActive: yr === '2026-27',
          departments: new Set<string>(),
        });
      }
      const item = map.get(yr)!;
      item.totalProjects += 1;
      const isOdd = d.session_term === 'ODD' || (!d.session_term && (d.target_semester || 1) % 2 !== 0);
      if (isOdd) {
        item.oddProjects += 1;
      } else {
        item.evenProjects += 1;
      }
      if (d.department) item.departments.add(d.department);
    });

    // Accumulate from tracks
    tracksList.forEach((t) => {
      const yr = t.session_year || '2026-27';
      if (map.has(yr)) {
        map.get(yr)!.totalTracks += 1;
        if (t.department) map.get(yr)!.departments.add(t.department);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.year.localeCompare(a.year));
  }, [sessionsList, dossiersList, tracksList]);

  // 2. Terms Breakdown for selected Academic Year
  const historyTermsBreakdown = useMemo(() => {
    if (!selectedHistoryYear) return null;
    const yearDossiers = dossiersList.filter(
      (d) => (d.session_year || '2026-27') === selectedHistoryYear
    );
    const yearTracks = tracksList.filter(
      (t) => (t.session_year || '2026-27') === selectedHistoryYear
    );

    const oddDossiers = yearDossiers.filter(
      (d) => d.session_term === 'ODD' || (!d.session_term && (d.target_semester || 1) % 2 !== 0)
    );
    const evenDossiers = yearDossiers.filter(
      (d) => d.session_term === 'EVEN' || (!d.session_term && (d.target_semester || 1) % 2 === 0)
    );

    const oddTracks = yearTracks.filter(
      (t) => t.session_term === 'ODD' || (!t.session_term && (t.target_semester || 1) % 2 !== 0)
    );
    const evenTracks = yearTracks.filter(
      (t) => t.session_term === 'EVEN' || (!t.session_term && (t.target_semester || 1) % 2 === 0)
    );

    return {
      odd: {
        term: 'ODD' as const,
        title: 'Odd Semester (Autumn Session)',
        sublabel: 'Semesters 1, 3, 5, 7',
        months: 'August – December',
        projectCount: oddDossiers.length,
        trackCount: oddTracks.length,
        dossiers: oddDossiers,
      },
      even: {
        term: 'EVEN' as const,
        title: 'Even Semester (Spring Session)',
        sublabel: 'Semesters 2, 4, 6, 8',
        months: 'January – June',
        projectCount: evenDossiers.length,
        trackCount: evenTracks.length,
        dossiers: evenDossiers,
      },
    };
  }, [selectedHistoryYear, dossiersList, tracksList]);

  // 3. Departments list for selected Academic Year + Term
  const historyDepartmentsList = useMemo(() => {
    if (!selectedHistoryYear || !selectedHistoryTerm) return [];

    const termDossiers = dossiersList.filter((d) => {
      const matchYear = (d.session_year || '2026-27') === selectedHistoryYear;
      const isOdd = d.session_term === 'ODD' || (!d.session_term && (d.target_semester || 1) % 2 !== 0);
      const matchTerm = selectedHistoryTerm === 'ODD' ? isOdd : !isOdd;
      return matchYear && matchTerm;
    });

    const deptsMap = new Map<
      string,
      {
        department: string;
        projectCount: number;
        approvedCount: number;
        supervisors: Set<string>;
        programs: Set<string>;
      }
    >();

    termDossiers.forEach((d) => {
      const deptName = d.department || 'Department of Computer Applications';
      if (!deptsMap.has(deptName)) {
        deptsMap.set(deptName, {
          department: deptName,
          projectCount: 0,
          approvedCount: 0,
          supervisors: new Set<string>(),
          programs: new Set<string>(),
        });
      }
      const item = deptsMap.get(deptName)!;
      item.projectCount += 1;
      if (d.status === 'HOD_APPROVED' || d.status === 'DEAN_APPROVED') {
        item.approvedCount += 1;
      }
      if (d.supervisor_name) item.supervisors.add(d.supervisor_name);
      if (d.target_program) item.programs.add(d.target_program);
    });

    return Array.from(deptsMap.values()).sort((a, b) => b.projectCount - a.projectCount);
  }, [selectedHistoryYear, selectedHistoryTerm, dossiersList]);

  // 4. Projects list for selected Academic Year + Term + Department
  const historyProjectsList = useMemo(() => {
    if (!selectedHistoryYear || !selectedHistoryTerm) return [];

    let list = dossiersList.filter((d) => {
      const matchYear = (d.session_year || '2026-27') === selectedHistoryYear;
      const isOdd = d.session_term === 'ODD' || (!d.session_term && (d.target_semester || 1) % 2 !== 0);
      const matchTerm = selectedHistoryTerm === 'ODD' ? isOdd : !isOdd;
      return matchYear && matchTerm;
    });

    if (selectedHistoryDepartment && selectedHistoryDepartment !== 'ALL') {
      list = list.filter(
        (d) => (d.department || 'Department of Computer Applications') === selectedHistoryDepartment
      );
    }

    if (historyCategoryFilter !== 'ALL') {
      list = list.filter((d) => d.category === historyCategoryFilter);
    }

    const q = (historySearchQuery || debouncedSearch).trim().toLowerCase();
    if (q) {
      list = list.filter((d) => {
        const matchTitle = d.approved_proposal?.title?.toLowerCase().includes(q);
        const matchName = d.name?.toLowerCase().includes(q);
        const matchTrack = d.track_title?.toLowerCase().includes(q);
        const matchSupervisor = d.supervisor_name?.toLowerCase().includes(q);
        const matchMember = d.members?.some(
          (m) =>
            m.full_name?.toLowerCase().includes(q) ||
            m.university_id?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q)
        );
        return matchTitle || matchName || matchTrack || matchSupervisor || matchMember;
      });
    }

    return list;
  }, [
    selectedHistoryYear,
    selectedHistoryTerm,
    selectedHistoryDepartment,
    historyCategoryFilter,
    historySearchQuery,
    debouncedSearch,
    dossiersList,
  ]);

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
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── 1. CUSTOM TOP NAVBAR ────────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          
          {/* LEFT: DBUU LOGO ONLY */}
          <div className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.jpeg"
              alt="Dev Bhoomi Uttarakhand University"
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </div>

          {/* MIDDLE: MAIN TABS & BIGGER SEARCH BAR */}
          <div className="flex-1 flex items-center justify-center gap-3.5 mx-2 lg:mx-4">
            {/* Tabs Navigation */}
            <nav className="flex items-center bg-slate-100 p-1 rounded-sm border border-slate-200 shrink-0">
              <button
                onClick={() => setActiveTab('tracks')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'tracks'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5 text-[#B81D24]" />
                <span>Tracks</span>
              </button>

              <button
                onClick={() => setActiveTab('supervisors')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'supervisors'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#B81D24]" />
                <span>Supervisors</span>
                {pendingFacultyCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#B81D24] text-white text-[9px] font-black rounded-full animate-pulse">
                    {pendingFacultyCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'projects'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#B81D24]" />
                <span>Projects</span>
                {pendingDossiersCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full">
                    {pendingDossiersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-[#B81D24]" />
                <span>History</span>
              </button>
            </nav>

            {/* Global Search Input - Bigger, clearer, and responsive */}
            <div className="relative flex-1 hidden md:block max-w-sm lg:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search projects, supervisors, roll no, topics..."
                className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-[#B81D24] rounded-sm text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 shadow-2xs focus:ring-2 focus:ring-[#B81D24]/10 focus:outline-none transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  title="Clear Search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: HOD NAME, DESIGNATION, DEPARTMENT ON LEFT OF CIRCULAR PIC */}
          <div className="flex items-center gap-3 shrink-0">
            {/* HOD Text Details */}
            <div className="text-right hidden lg:block">
              <div className="text-xs font-black text-slate-900 leading-tight">
                {currentUser?.full_name || 'Dr. Department Head'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Head of Department •{' '}
                <span className="text-slate-700 font-semibold">
                  {currentUser?.department ? currentUser.department.replace('Department of ', '') : 'Computer Applications'}
                </span>
              </div>
            </div>

            {/* HOD Picture in Circle (Rightmost side) */}
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center shadow-xs">
              {currentUser?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name || 'HOD'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#B81D24] text-white flex items-center justify-center text-xs font-black">
                  {currentUser?.first_name ? currentUser.first_name[0] : 'H'}
                </div>
              )}
            </div>

            {/* Quick Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out of Session"
              className="p-1.5 text-slate-400 hover:text-[#B81D24] hover:bg-red-50 rounded-sm border border-slate-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Ribbon with Institutional Context & Mobile Search */}
        <div className="w-full bg-[#B81D24] text-white py-1.5 px-4 sm:px-6 lg:px-8 text-xs font-bold uppercase tracking-wider">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-red-200" />
              <span>Academic Governance &amp; Minor Project Directorate</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono text-red-100 font-normal">
              <span>Session: 2026-27 [ODD]</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Officer ID: {currentUser?.university_id || 'HODCA01'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── 2. MAIN CONTAINER ───────────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Action Notification Banner */}
        {actionMessage && (
          <div
            className={`p-3 rounded-sm text-xs font-medium flex items-center justify-between border shadow-xs animate-in fade-in duration-200 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 1: TRACKS MANAGEMENT ─────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'tracks' && (
          <div className="space-y-5">
            {/* Tracks Header Bar */}
            <div className="bg-white border border-slate-200 rounded-sm p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-[#B81D24]" />
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Project Tracks &amp; Academic Guidelines
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure semester minor/major project frameworks, deliverables, group limits, and assign faculty coordinators.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => refreshAllData(localStorage.getItem('access_token') || '')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm transition-colors cursor-pointer"
                >
                  Refresh
                </button>
                <button
                  onClick={openCreateTrackModal}
                  className="px-4 py-2 bg-[#B81D24] hover:bg-[#99151B] text-white text-xs font-bold rounded-sm shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Track</span>
                </button>
              </div>
            </div>

            {/* Tracks Grid */}
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-sm p-12 text-center text-xs text-slate-500 font-mono">
                Loading departmental project tracks...
              </div>
            ) : filteredTracks.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-sm p-12 text-center space-y-3">
                <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">No Project Tracks Found</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {debouncedSearch
                    ? `No project tracks matched your search query "${debouncedSearch}".`
                    : 'Get started by creating your department minor or major project track with semester deliverables.'}
                </p>
                <button
                  onClick={openCreateTrackModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B81D24] text-white text-xs font-bold rounded-sm shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Track
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTracks.map((track) => {
                  const categoryObj = CATEGORY_CHOICES.find((c) => c.value === track.category);
                  const enrolledGroups = dossiersList.filter(
                    (d) => d.track === track.id || d.track_title === track.title
                  );

                  return (
                    <div
                      key={track.id}
                      className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Minimal & Non-redundant Header */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-slate-200">
                            {categoryObj?.label || track.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {track.session_year || '2026-27'} [{track.session_term || 'ODD'}]
                          </span>
                        </div>

                        {/* Title & Target Program Line */}
                        <div>
                          <h3 className="text-base font-black text-slate-900 leading-snug tracking-tight">
                            {track.title}
                          </h3>
                          <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                            <span>Target:</span>
                            <span className="font-bold text-slate-800">
                              {track.target_program} • Semester {track.target_semester}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100 font-sans">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Coordinator:</span>
                            <span className="font-semibold text-slate-800">
                              {track.coordinator_name || 'Not Assigned'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Max Team Size:</span>
                            <span className="font-semibold text-slate-800">
                              {track.max_group_size} members / group
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Enrolled Groups:</span>
                            <span className="font-bold text-[#B81D24]">
                              {enrolledGroups.length} {enrolledGroups.length === 1 ? 'Group' : 'Groups'}
                            </span>
                          </div>
                        </div>

                        {/* Deliverables Checklist */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Required Deliverables:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(track.required_deliverables) && track.required_deliverables.length > 0 ? (
                              track.required_deliverables.map((del) => {
                                const matched = AVAILABLE_DELIVERABLES.find((d) => d.id === del);
                                return (
                                  <span
                                    key={del}
                                    className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium rounded-xs"
                                  >
                                    {matched?.label || del}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No specific deliverables set</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Bar with View Details, Deadlines & Formats, & Edit */}
                      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedTrackForDetails(track)}
                          className="px-2.5 py-1.5 bg-[#B81D24] hover:bg-[#99151B] text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details ({enrolledGroups.length})</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openDeadlinesModal(track)}
                            title="Setup Deliverable Deadlines & Upload Format Templates"
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition-colors border border-blue-200 shadow-2xs"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>Deadlines &amp; Formats</span>
                          </button>

                          <button
                            onClick={() => openEditTrackModal(track)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-sm flex items-center gap-1 cursor-pointer transition-colors border border-slate-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 2: SUPERVISORS APPROVAL & MANAGEMENT ─────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'supervisors' && (
          <div className="space-y-4">
            {/* Header with Sub-Filter Pills */}
            <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#B81D24]" />
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Faculty Supervisor Verification &amp; Capacity
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorize faculty credentials, inspect domain proficiencies, and manage minor project mentorship capacity.
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-sm border border-slate-200 flex-wrap">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSupervisorStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xs transition-all cursor-pointer ${
                      supervisorStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'PENDING' ? 'Pending' : st === 'APPROVED' ? 'Approved' : 'Declined'}
                    {st === 'PENDING' && pendingFacultyCount > 0 && (
                      <span className="ml-1 px-1 bg-[#B81D24] text-white text-[9px] font-black rounded-full">
                        {pendingFacultyCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Supervisors List */}
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-sm p-12 text-center text-xs text-slate-500 font-mono">
                Loading faculty supervisor roster...
              </div>
            ) : filteredFaculty.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-sm p-12 text-center text-xs text-slate-500">
                No faculty supervisors found for this filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredFaculty.map((faculty) => (
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
                      <div className="w-16 h-16 rounded-full border-2 border-slate-300 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
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
                          {faculty.email} • {faculty.phone || 'No phone recorded'} • Department: {faculty.department}
                        </p>

                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <span className="font-semibold text-slate-700">Capacity:</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-[#1A4DBE] border border-blue-200 rounded-sm text-[11px] font-bold">
                            Max {faculty.max_groups} Groups
                          </span>
                        </div>

                        {/* Expertise Domains & Tech */}
                        <div className="pt-2 space-y-1">
                          {faculty.expertise_domains && faculty.expertise_domains.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Domains:</span>
                              {faculty.expertise_domains.map((dom, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-sm bg-blue-50 border border-blue-200 text-[#1A4DBE] text-[10px] font-semibold"
                                >
                                  {dom}
                                </span>
                              ))}
                            </div>
                          )}

                          {faculty.expertise_tech && faculty.expertise_tech.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Tech:</span>
                              {faculty.expertise_tech.map((t, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {faculty.rejection_reason && (
                          <div className="mt-2 p-2 rounded-sm bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                            <span className="font-bold">Decline Reason:</span> {faculty.rejection_reason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex md:flex-col items-center justify-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                      {faculty.approval_status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading === `faculty-${faculty.id}`}
                            onClick={() => handleFacultyAction(faculty.id, 'APPROVE')}
                            className="w-full md:w-36 py-2 px-3 rounded-sm bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {actionLoading === `faculty-${faculty.id}` ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === `faculty-${faculty.id}`}
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
                          disabled={actionLoading === `faculty-${faculty.id}`}
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

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 3: PROJECTS, DOSSIERS & DELIVERABLES REVIEW ─────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {/* Header with Sub-Filter Pills */}
            <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#B81D24]" />
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Project Requests, Deliverables &amp; Dossiers
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review student team submissions, inspect synopsis &amp; code deliverables, audit revision histories, and endorse dossiers.
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-sm border border-slate-200 flex-wrap">
                {(['ALL', 'SUBMITTED', 'HOD_APPROVED', 'HOD_REJECTED', 'ACTIVE'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setProjectStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xs transition-all cursor-pointer ${
                      projectStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All Projects'
                      : st === 'SUBMITTED'
                      ? 'Pending Review'
                      : st === 'HOD_APPROVED'
                      ? 'Approved'
                      : st === 'HOD_REJECTED'
                      ? 'Revisions Requested'
                      : 'Active'}
                    {st === 'SUBMITTED' && pendingDossiersCount > 0 && (
                      <span className="ml-1 px-1.5 bg-[#B81D24] text-white text-[9px] font-black rounded-full animate-pulse">
                        {pendingDossiersCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dossiers List */}
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-sm p-12 text-center text-xs text-slate-500 font-mono">
                Loading project submissions and student dossiers...
              </div>
            ) : filteredDossiers.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-sm p-12 text-center space-y-3">
                <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">No Projects Found</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {debouncedSearch
                    ? `No project groups matched "${debouncedSearch}".`
                    : 'There are currently no student project groups under this filter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {filteredDossiers.map((group) => {
                  const hasSubmitted = group.status === 'SUBMITTED';
                  const isApproved = group.status === 'HOD_APPROVED' || group.status === 'DEAN_APPROVED';
                  const isRejected = group.status === 'HOD_REJECTED';

                  return (
                    <div
                      key={group.id}
                      className={`bg-white border rounded-sm p-5 shadow-xs transition-all space-y-4 ${
                        hasSubmitted
                          ? 'border-amber-400 bg-amber-50/15'
                          : isApproved
                          ? 'border-emerald-300'
                          : isRejected
                          ? 'border-rose-300'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Top Row: Group Name, Track, Status, and Supervisor Assignment */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-base font-black text-slate-900">{group.name}</h3>
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-mono rounded-xs">
                              {group.target_program} • Sem {group.target_semester}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-50 text-[#1A4DBE] border border-blue-200 text-[10px] font-semibold rounded-xs">
                              {group.track_title}
                            </span>

                            {/* Status Badges */}
                            {hasSubmitted && (
                              <span className="px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider rounded-xs flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-700" />
                                Awaiting HOD Sign-off
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                HOD Endorsed (Forwarded to Dean)
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-0.5 bg-rose-100 border border-rose-300 text-rose-900 text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Revisions Requested
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Supervisor Info & Quick Allocation Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-500">Supervisor:</span>
                          <span className="text-xs font-bold text-slate-800">
                            {group.supervisor_name || (
                              <span className="text-amber-700 italic">Unassigned</span>
                            )}
                          </span>
                          <button
                            onClick={() => {
                              setAssignModalGroup(group);
                              setSelectedSupervisorId(group.supervisor ? String(group.supervisor) : '');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-xs border border-slate-300 cursor-pointer"
                          >
                            Assign / Change
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Team Roster with CIRCULAR DPs */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Project Team Roster:
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Circular Overlapping DPs */}
                          <div className="flex items-center">
                            {group.members && group.members.map((member, idx) => (
                              <div
                                key={member.id}
                                title={`${member.full_name} (${member.university_id}) - ${member.member_role}`}
                                className="relative group/dp"
                              >
                                <div
                                  className={`w-9 h-9 rounded-full border-2 border-white shadow-xs overflow-hidden bg-slate-200 flex items-center justify-center ${
                                    idx !== 0 ? '-ml-2.5' : ''
                                  }`}
                                >
                                  {member.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={member.avatar_url}
                                      alt={member.full_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-600">
                                      {member.full_name ? member.full_name[0] : 'S'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Member Details Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {group.members && group.members.map((m) => (
                              <div
                                key={m.id}
                                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-sm text-xs flex items-center gap-1.5"
                              >
                                <span className="font-bold text-slate-800">{m.full_name}</span>
                                <span className="font-mono text-[10px] text-slate-500">({m.university_id})</span>
                                {m.member_role === 'LEADER' && (
                                  <span className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black rounded-xs">
                                    LEADER
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Proposal Details (Title, Abstract, Tech Stack) */}
                      {group.approved_proposal ? (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              Topic: {group.approved_proposal.title}
                            </span>
                            {group.approved_proposal.domain && (
                              <span className="px-1.5 py-0.2 bg-blue-100 text-[#1A4DBE] text-[10px] font-bold rounded-xs">
                                {group.approved_proposal.domain}
                              </span>
                            )}
                          </div>
                          {group.approved_proposal.abstract && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {group.approved_proposal.abstract}
                            </p>
                          )}
                          {group.approved_proposal.tech_stack && group.approved_proposal.tech_stack.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-1">
                              {group.approved_proposal.tech_stack.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.2 bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-xs"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-400 italic">
                          No project proposal submitted yet by this group.
                        </div>
                      )}

                      {/* Submitted Deliverables Links & Timestamps */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Submitted Deliverables &amp; Artifacts:
                        </div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {group.submission?.synopsis_url ? (
                            <a
                              href={group.submission.synopsis_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-sm inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#B81D24]" />
                              <span>Synopsis (PDF)</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-400 text-xs rounded-sm border border-slate-200">
                              Synopsis Pending
                            </span>
                          )}

                          {group.submission?.ppt_url ? (
                            <a
                              href={group.submission.ppt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-sm inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <Presentation className="w-3.5 h-3.5 text-amber-600" />
                              <span>Presentation (PPT)</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ) : null}

                          {group.submission?.github_repo_url ? (
                            <a
                              href={group.submission.github_repo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-sm inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <FileCode className="w-3.5 h-3.5 text-slate-800" />
                              <span>GitHub Codebase</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ) : null}

                          {group.submission?.live_demo_url ? (
                            <a
                              href={group.submission.live_demo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-sm inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Live Deployment</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ) : null}

                          {group.submission?.report_url ? (
                            <a
                              href={group.submission.report_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-sm inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Project Report</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ) : null}
                        </div>
                      </div>

                      {/* Review History / Rejection Audit Trail */}
                      {group.approval_records && group.approval_records.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            <History className="w-3.5 h-3.5" />
                            <span>Review Audit History:</span>
                          </div>
                          <div className="space-y-1.5">
                            {group.approval_records.map((rec) => (
                              <div
                                key={rec.id}
                                className={`p-2.5 rounded-sm border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                  rec.action === 'APPROVED'
                                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                                    : 'bg-rose-50/50 border-rose-200 text-rose-900'
                                }`}
                              >
                                <div>
                                  <span className="font-black">
                                    [{rec.stage} - {rec.action}]:
                                  </span>{' '}
                                  <span>{rec.comment}</span>
                                </div>
                                <div className="font-mono text-[10px] text-slate-500 shrink-0">
                                  {rec.actioned_by_name} ({rec.actioned_by_role}) •{' '}
                                  {formatTimestamp(rec.actioned_at)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                        <button
                          onClick={() => setDeepViewProject(group)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-red-400" />
                          <span>View Full Dossier Details</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setDecisionModalGroup(group);
                              setDecisionType('APPROVED');
                              setDecisionComment('Endorsed by HOD. Deliverables satisfy all departmental academic standards.');
                            }}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Endorse &amp; Forward to Dean</span>
                          </button>

                          <button
                            onClick={() => {
                              setDecisionModalGroup(group);
                              setDecisionType('REJECTED');
                              setDecisionComment('');
                            }}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Request Revisions</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 4: ACADEMIC HISTORY & AUDIT INSPECTION ARCHIVE ────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="space-y-5">
            {/* Header with Title, Stats & Inspection Action Buttons */}
            <div className="bg-white border border-slate-200 rounded-sm p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#B81D24]" />
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Academic Inspection &amp; Project Repository
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutional project archives structured for NAAC, NBA, and Academic Senate accreditation audits.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => {
                    setSelectedHistoryYear(null);
                    setSelectedHistoryTerm(null);
                    setSelectedHistoryDepartment(null);
                    setHistorySearchQuery('');
                    setHistoryCategoryFilter('ALL');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm transition-colors cursor-pointer"
                >
                  All Academic Years
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300" />
                  <span>Print / Export Audit Index</span>
                </button>
              </div>
            </div>

            {/* Hierarchical Inspection Breadcrumb Bar */}
            <div className="bg-white border border-slate-200 rounded-sm px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-slate-600 flex-wrap shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Audit Path:
              </span>

              <button
                onClick={() => {
                  setSelectedHistoryYear(null);
                  setSelectedHistoryTerm(null);
                  setSelectedHistoryDepartment(null);
                }}
                className={`cursor-pointer hover:text-[#B81D24] transition-colors flex items-center gap-1 ${
                  !selectedHistoryYear ? 'font-black text-[#B81D24]' : 'text-slate-600'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>1. Academic Years</span>
              </button>

              {selectedHistoryYear && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <button
                    onClick={() => {
                      setSelectedHistoryTerm(null);
                      setSelectedHistoryDepartment(null);
                    }}
                    className={`cursor-pointer hover:text-[#B81D24] transition-colors flex items-center gap-1 ${
                      selectedHistoryYear && !selectedHistoryTerm
                        ? 'font-black text-[#B81D24]'
                        : 'text-slate-600'
                    }`}
                  >
                    <span>Session: <strong>{selectedHistoryYear}</strong></span>
                  </button>
                </>
              )}

              {selectedHistoryTerm && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <button
                    onClick={() => setSelectedHistoryDepartment(null)}
                    className={`cursor-pointer hover:text-[#B81D24] transition-colors flex items-center gap-1 ${
                      selectedHistoryTerm && !selectedHistoryDepartment
                        ? 'font-black text-[#B81D24]'
                        : 'text-slate-600'
                    }`}
                  >
                    <span>Term: <strong>{selectedHistoryTerm === 'ODD' ? 'Odd Semester' : 'Even Semester'}</strong></span>
                  </button>
                </>
              )}

              {selectedHistoryDepartment && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-black text-[#B81D24] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Dept: <strong>{selectedHistoryDepartment === 'ALL' ? 'All Departments' : selectedHistoryDepartment}</strong></span>
                  </span>
                </>
              )}
            </div>

            {/* ── LEVEL 1: ACADEMIC YEARS ─────────────────────────────── */}
            {!selectedHistoryYear && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Academic Year to Inspect ({historyAcademicYears.length} Sessions on Record):
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {historyAcademicYears.map((ay) => (
                    <div
                      key={ay.year}
                      onClick={() => {
                        setSelectedHistoryYear(ay.year);
                        setSelectedHistoryTerm(null);
                        setSelectedHistoryDepartment(null);
                      }}
                      className="bg-white border border-slate-200 hover:border-[#B81D24] rounded-sm p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xl font-black text-slate-900 group-hover:text-[#B81D24] transition-colors">
                            {ay.year}
                          </span>
                          {ay.isActive ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-xs border border-emerald-200 animate-pulse">
                              Active Session
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-xs border border-slate-200">
                              Archived Audit
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 font-medium">
                          Academic Session • DBUU Governance Records
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div className="p-2 bg-slate-50 rounded-xs border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Odd Semester</div>
                            <div className="text-sm font-black text-slate-800 mt-0.5">
                              {ay.oddProjects} {ay.oddProjects === 1 ? 'Project' : 'Projects'}
                            </div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xs border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Even Semester</div>
                            <div className="text-sm font-black text-slate-800 mt-0.5">
                              {ay.evenProjects} {ay.evenProjects === 1 ? 'Project' : 'Projects'}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                          <span className="text-slate-400">Total Projects:</span>
                          <span className="font-bold text-[#B81D24]">
                            {ay.totalProjects} {ay.totalProjects === 1 ? 'Project' : 'Projects'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#B81D24] group-hover:translate-x-0.5 transition-transform">
                        <span>Inspect Academic Year</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── LEVEL 2: SEMESTER WISE (ODD OR EVEN) ────────────────── */}
            {selectedHistoryYear && !selectedHistoryTerm && historyTermsBreakdown && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Academic Year {selectedHistoryYear} ➔ Choose Semester Term:
                  </div>
                  <button
                    onClick={() => setSelectedHistoryYear(null)}
                    className="text-xs text-slate-600 hover:text-[#B81D24] flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to All Years</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* ODD SEMESTER CARD */}
                  <div
                    onClick={() => {
                      setSelectedHistoryTerm('ODD');
                      setSelectedHistoryDepartment(null);
                    }}
                    className="bg-white border-2 border-slate-200 hover:border-[#B81D24] rounded-sm p-6 shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-red-50 text-[#B81D24] text-[10px] font-black uppercase rounded-xs border border-red-200">
                          Term I • Autumn
                        </span>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-[#B81D24] transition-colors mt-1">
                          {historyTermsBreakdown.odd.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {historyTermsBreakdown.odd.sublabel} • ({historyTermsBreakdown.odd.months})
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#B81D24] font-black text-sm">
                        ODD
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-between text-xs">
                      <span className="text-slate-500">Archived Project Dossiers:</span>
                      <span className="text-base font-black text-slate-900">
                        {historyTermsBreakdown.odd.projectCount}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#B81D24] group-hover:translate-x-0.5 transition-transform">
                      <span>Open Odd Semester Audits</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* EVEN SEMESTER CARD */}
                  <div
                    onClick={() => {
                      setSelectedHistoryTerm('EVEN');
                      setSelectedHistoryDepartment(null);
                    }}
                    className="bg-white border-2 border-slate-200 hover:border-[#B81D24] rounded-sm p-6 shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-[#1A4DBE] text-[10px] font-black uppercase rounded-xs border border-blue-200">
                          Term II • Spring
                        </span>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-[#B81D24] transition-colors mt-1">
                          {historyTermsBreakdown.even.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {historyTermsBreakdown.even.sublabel} • ({historyTermsBreakdown.even.months})
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1A4DBE] font-black text-sm">
                        EVEN
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-between text-xs">
                      <span className="text-slate-500">Archived Project Dossiers:</span>
                      <span className="text-base font-black text-slate-900">
                        {historyTermsBreakdown.even.projectCount}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#B81D24] group-hover:translate-x-0.5 transition-transform">
                      <span>Open Even Semester Audits</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── LEVEL 3: DEPARTMENTS ─────────────────────────────────── */}
            {selectedHistoryYear && selectedHistoryTerm && !selectedHistoryDepartment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {selectedHistoryYear} • {selectedHistoryTerm === 'ODD' ? 'Odd Semester' : 'Even Semester'} ➔ Select Department:
                  </div>
                  <button
                    onClick={() => setSelectedHistoryTerm(null)}
                    className="text-xs text-slate-600 hover:text-[#B81D24] flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Semester</span>
                  </button>
                </div>

                {historyDepartmentsList.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-300 rounded-sm p-10 text-center space-y-2">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-sm font-bold text-slate-700">No Projects Found for this Semester</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No student groups or tracks were registered for {selectedHistoryYear} [{selectedHistoryTerm}].
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* All Departments Option */}
                    <div
                      onClick={() => setSelectedHistoryDepartment('ALL')}
                      className="bg-slate-900 text-white rounded-sm p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-black uppercase rounded-xs">
                            Combined View
                          </span>
                          <Building2 className="w-4 h-4 text-slate-300" />
                        </div>
                        <h3 className="text-base font-black tracking-tight">
                          All Departments Combined
                        </h3>
                        <p className="text-xs text-slate-300">
                          Comprehensive university-wide inspection dossiers for all programs.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-red-300">
                        <span>Inspect All Projects</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {historyDepartmentsList.map((d) => (
                      <div
                        key={d.department}
                        onClick={() => setSelectedHistoryDepartment(d.department)}
                        className="bg-white border border-slate-200 hover:border-[#B81D24] rounded-sm p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-9 h-9 rounded-sm bg-red-50 text-[#B81D24] flex items-center justify-center font-bold">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-xs">
                              {d.projectCount} {d.projectCount === 1 ? 'Project' : 'Projects'}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-black text-slate-900 group-hover:text-[#B81D24] transition-colors leading-snug">
                              {d.department}
                            </h3>
                            <div className="text-xs text-slate-500 font-medium mt-1">
                              Programs: {Array.from(d.programs).join(', ') || 'Undergraduate'}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                            <div className="p-2 bg-slate-50 rounded-xs border border-slate-100">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Supervisors</div>
                              <div className="text-xs font-bold text-slate-800 mt-0.5">
                                {d.supervisors.size} Mentors
                              </div>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-xs border border-slate-100">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Endorsed</div>
                              <div className="text-xs font-bold text-emerald-700 mt-0.5">
                                {d.approvedCount} Approved
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#B81D24] group-hover:translate-x-0.5 transition-transform">
                          <span>View Department Projects</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── LEVEL 4: COMPREHENSIVE PROJECT LIST WITH ALL DETAIL ─── */}
            {selectedHistoryYear && selectedHistoryTerm && selectedHistoryDepartment && (
              <div className="space-y-4">
                {/* Inspection Controls & Search */}
                <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">
                        {selectedHistoryDepartment === 'ALL' ? 'All University Departments' : selectedHistoryDepartment}
                      </h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-xs border border-slate-200">
                        {selectedHistoryYear} • {selectedHistoryTerm === 'ODD' ? 'Odd Sem' : 'Even Sem'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Showing {historyProjectsList.length} project {historyProjectsList.length === 1 ? 'dossier' : 'dossiers'} ready for technical inspection.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Search inside History */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        placeholder="Search student, roll no, topic..."
                        className="pl-8.5 pr-7 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-[#B81D24] rounded-sm text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-52 sm:w-64"
                      />
                      {historySearchQuery && (
                        <button
                          onClick={() => setHistorySearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter */}
                    <select
                      value={historyCategoryFilter}
                      onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All Categories</option>
                      {CATEGORY_CHOICES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setSelectedHistoryDepartment(null)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-sm border border-slate-200 cursor-pointer flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Dept</span>
                    </button>
                  </div>
                </div>

                {/* Projects Grid */}
                {historyProjectsList.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-300 rounded-sm p-12 text-center space-y-2">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-sm font-bold text-slate-700">No Projects Found</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      No project records matched your inspection query in this section.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyProjectsList.map((project) => {
                      const categoryObj = CATEGORY_CHOICES.find((c) => c.value === project.category);
                      const isApproved = project.status === 'HOD_APPROVED' || project.status === 'DEAN_APPROVED';
                      const isSubmitted = project.status === 'SUBMITTED';

                      return (
                        <div
                          key={project.id}
                          className="bg-white border border-slate-200 hover:border-slate-300 rounded-sm p-5 shadow-xs transition-all space-y-4"
                        >
                          {/* Top Row: Category, Semester & Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-black uppercase rounded-xs border border-slate-200">
                                {categoryObj?.label || project.category || 'Project'}
                              </span>
                              <span className="text-xs font-bold text-slate-700">
                                {project.target_program} • Semester {project.target_semester}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-500">
                                Track: {project.track_title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isApproved ? (
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-xs border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{project.status.replace('_', ' ')}</span>
                                </span>
                              ) : isSubmitted ? (
                                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black uppercase rounded-xs border border-amber-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Deliverables Submitted</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-xs border border-slate-200">
                                  {project.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Project Idea & Title */}
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Group Name &amp; Approved Title:
                            </div>
                            <h4 className="text-base font-black text-slate-900 leading-snug">
                              {project.approved_proposal?.title || project.name}
                            </h4>
                            <div className="text-xs font-bold text-[#B81D24] flex items-center gap-2">
                              <span>Group: {project.name}</span>
                              {project.approved_proposal?.domain && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="px-2 py-0.2 bg-blue-50 text-[#1A4DBE] rounded-xs font-bold text-[10px] border border-blue-200">
                                    {project.approved_proposal.domain}
                                  </span>
                                </>
                              )}
                            </div>
                            {project.approved_proposal?.problem_statement && (
                              <p className="text-xs text-slate-600 line-clamp-2 pt-1">
                                <span className="font-semibold text-slate-700">Problem:</span> {project.approved_proposal.problem_statement}
                              </p>
                            )}
                          </div>

                          {/* 2-Column Grid: Assigned Supervisor & Student Teammates */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* Supervisor Details Box */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm space-y-1.5">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                                <span>Assigned Faculty Supervisor</span>
                              </div>
                              <div className="text-xs font-black text-slate-900">
                                {project.supervisor_name || 'No Supervisor Assigned'}
                              </div>
                              <div className="text-[11px] text-slate-600">
                                {project.supervisor_designation || 'Faculty Mentor'} • {project.supervisor_department || project.department}
                              </div>
                              {project.supervisor_email && (
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {project.supervisor_email}
                                </div>
                              )}
                            </div>

                            {/* Student Teammates Box */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                <span>Student Team Members ({project.members?.length || 0})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {project.members?.map((m) => (
                                  <div
                                    key={m.id}
                                    className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xs shadow-2xs text-xs"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-[10px]">
                                      {m.full_name[0]}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1">
                                        <span className="font-bold text-slate-800">{m.full_name}</span>
                                        {m.member_role === 'LEADER' && (
                                          <span className="px-1 py-0.2 bg-amber-100 text-amber-900 text-[8px] font-black rounded-xs">
                                            LEADER
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[9px] font-mono text-slate-400">
                                        {m.university_id}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Deliverables Status Matrix & Submit Times */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Deliverables Status &amp; Submission Timestamps:
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                              {/* Synopsis */}
                              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700">Synopsis</span>
                                  {project.submission?.synopsis_url ? (
                                    <span className="text-emerald-700 font-black">Submitted</span>
                                  ) : (
                                    <span className="text-slate-400">Pending</span>
                                  )}
                                </div>
                                <div className="text-[9px] font-mono text-slate-500 truncate">
                                  {formatTimestamp(project.submission?.synopsis_submitted_at) || 'Not submitted'}
                                </div>
                                {project.submission?.synopsis_url && (
                                  <a
                                    href={project.submission.synopsis_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-[#B81D24] font-semibold hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>Open PDF</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>

                              {/* Presentation */}
                              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700">PPT Deck</span>
                                  {project.submission?.ppt_url ? (
                                    <span className="text-emerald-700 font-black">Submitted</span>
                                  ) : (
                                    <span className="text-slate-400">Pending</span>
                                  )}
                                </div>
                                <div className="text-[9px] font-mono text-slate-500 truncate">
                                  {formatTimestamp(project.submission?.ppt_submitted_at) || 'Not submitted'}
                                </div>
                                {project.submission?.ppt_url && (
                                  <a
                                    href={project.submission.ppt_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-amber-700 font-semibold hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>Open PPT</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>

                              {/* GitHub */}
                              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700">GitHub</span>
                                  {project.submission?.github_repo_url ? (
                                    <span className="text-emerald-700 font-black">Submitted</span>
                                  ) : (
                                    <span className="text-slate-400">Pending</span>
                                  )}
                                </div>
                                <div className="text-[9px] font-mono text-slate-500 truncate">
                                  {formatTimestamp(project.submission?.github_submitted_at) || 'Not submitted'}
                                </div>
                                {project.submission?.github_repo_url && (
                                  <a
                                    href={project.submission.github_repo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-slate-800 font-semibold hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>Repository</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>

                              {/* Report */}
                              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700">Final Report</span>
                                  {project.submission?.report_url ? (
                                    <span className="text-emerald-700 font-black">Submitted</span>
                                  ) : (
                                    <span className="text-slate-400">Pending</span>
                                  )}
                                </div>
                                <div className="text-[9px] font-mono text-slate-500 truncate">
                                  {formatTimestamp(project.submission?.report_submitted_at) || 'Not submitted'}
                                </div>
                                {project.submission?.report_url && (
                                  <a
                                    href={project.submission.report_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-[#B81D24] font-semibold hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>Open Report</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>

                              {/* Live Demo */}
                              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700">Live Demo</span>
                                  {project.submission?.live_demo_url ? (
                                    <span className="text-emerald-700 font-black">Active URL</span>
                                  ) : (
                                    <span className="text-slate-400">Pending</span>
                                  )}
                                </div>
                                <div className="text-[9px] font-mono text-slate-500 truncate">
                                  {project.submission?.live_demo_url ? 'Verified Online' : 'Not deployed'}
                                </div>
                                {project.submission?.live_demo_url && (
                                  <a
                                    href={project.submission.live_demo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>Open Demo</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Footer Action: View Deep Detailed Dossier */}
                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                            <div className="text-[10px] font-mono text-slate-400">
                              Registered: {formatTimestamp(project.created_at)}
                            </div>

                            <button
                              onClick={() => setDeepViewProject(project)}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-red-400" />
                              <span>View Deep Detailed Dossier</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>


      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── 3. MODALS & DIALOGS ─────────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      {/* MODAL 0: TRACK DEADLINES & FORMAT TEMPLATES */}
      {selectedTrackForDeadlines && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-slate-300 border-t-4 border-t-[#B81D24] shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#B81D24]" />
                  <h3 className="text-lg font-black text-slate-900">
                    Milestone Deadlines &amp; Deliverable Formats
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Track: <strong className="text-slate-800">{selectedTrackForDeadlines.title}</strong> • {selectedTrackForDeadlines.target_program} Sem-{selectedTrackForDeadlines.target_semester} [{selectedTrackForDeadlines.session_year || '2026-27'}]
                </p>
              </div>
              <button
                onClick={() => setSelectedTrackForDeadlines(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Deadlines List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Configured Track Milestones ({trackDeadlines.length})
                </h4>
                {isLoadingDeadlines && (
                  <span className="text-[11px] text-slate-400 font-mono">Syncing deadlines...</span>
                )}
              </div>

              {trackDeadlines.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-sm text-center text-xs text-slate-500">
                  No submission milestones configured for this track yet. Set up deadlines below so students can submit on time and follow university guidelines.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {trackDeadlines.map((dl) => {
                    const due = new Date(dl.due_date);
                    const isPassed = new Date() > due;
                    return (
                      <div
                        key={dl.id || dl.deadline_type}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-red-50 text-[#B81D24] border border-red-200 font-extrabold text-[10px] rounded-xs uppercase">
                              {dl.deadline_type}
                            </span>
                            <span className="font-bold text-slate-900">{dl.title || dl.deadline_type}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-xs font-mono font-bold text-[10px] ${
                              isPassed
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isPassed ? 'Past Due' : 'Active Due Date'}
                            </span>
                            <span className="font-mono text-slate-600 font-bold">
                              {due.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Guidelines and Template */}
                        {(dl.instructions || dl.template_url) && (
                          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {dl.instructions && (
                              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xs border border-slate-100">
                                <span className="font-bold text-slate-700 block mb-0.5">Instructions:</span>
                                {dl.instructions}
                              </div>
                            )}
                            {dl.template_url && (
                              <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-xs border border-blue-100">
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                <div className="truncate">
                                  <span className="text-[10px] text-blue-900 font-bold block">Format Template:</span>
                                  <a
                                    href={dl.template_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-blue-700 font-semibold hover:underline inline-flex items-center gap-1 truncate"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span className="truncate">{dl.template_filename || 'Download Template'}</span>
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>Late Submissions: <strong>{dl.late_submission_allowed ? 'Allowed' : 'Disallowed'}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              setDeadlineForm({
                                deadline_type: dl.deadline_type,
                                title: dl.title || '',
                                due_date: dl.due_date ? new Date(dl.due_date).toISOString().slice(0, 16) : '',
                                template_url: dl.template_url || '',
                                template_filename: dl.template_filename || '',
                                instructions: dl.instructions || '',
                                late_submission_allowed: dl.late_submission_allowed || false,
                                notify_students: true,
                              });
                            }}
                            className="text-[#B81D24] font-bold hover:underline cursor-pointer"
                          >
                            Load into Editor
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Set / Update Milestone Form */}
            <form onSubmit={handleSaveDeadline} className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Plus className="w-4 h-4 text-[#B81D24]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Set or Update Milestone Deadline
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Milestone Deliverable Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deliverable Milestone
                  </label>
                  <select
                    value={deadlineForm.deadline_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      const defaults: Record<string, string> = {
                        SYNOPSIS: 'Synopsis & Scope Document',
                        PPT: 'Presentation (PPT Deck)',
                        REPORT: 'Final Project Report Submission',
                        GITHUB: 'GitHub Repository Verification',
                        CUSTOM: 'Custom Evaluation Milestone',
                      };
                      setDeadlineForm((prev) => ({
                        ...prev,
                        deadline_type: type,
                        title: defaults[type] || '',
                      }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B81D24]"
                  >
                    <option value="SYNOPSIS">Synopsis Submission (PDF)</option>
                    <option value="PPT">Presentation Submission (PPT/PDF)</option>
                    <option value="REPORT">Final Report Submission (PDF)</option>
                    <option value="GITHUB">GitHub Repository Link</option>
                    <option value="CUSTOM">Custom Project Milestone</option>
                  </select>
                </div>

                {/* Milestone Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Milestone Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Synopsis Submission & physical PPT"
                    value={deadlineForm.title}
                    onChange={(e) => setDeadlineForm({ ...deadlineForm, title: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B81D24]"
                  />
                </div>

                {/* Due Date & Time */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date &amp; Time (Mandatory)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadlineForm.due_date}
                    onChange={(e) => setDeadlineForm({ ...deadlineForm, due_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B81D24]"
                  />
                </div>

                {/* Late Submission Flag */}
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="lateSub"
                    checked={deadlineForm.late_submission_allowed}
                    onChange={(e) => setDeadlineForm({ ...deadlineForm, late_submission_allowed: e.target.checked })}
                    className="accent-[#B81D24] cursor-pointer"
                  />
                  <label htmlFor="lateSub" className="text-xs text-slate-700 cursor-pointer">
                    Allow late submissions after due date (flagged for review)
                  </label>
                </div>
              </div>

              {/* Upload Format Template */}
              <div className="space-y-1.5 text-xs">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Official Format Template (PPT / Report / Synopsis Template)
                </label>
                <div className="p-3 bg-white border border-slate-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    {deadlineForm.template_url ? (
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Uploaded: {deadlineForm.template_filename}</span>
                        <a
                          href={deadlineForm.template_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-normal text-[11px]"
                        >
                          (Preview)
                        </a>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-xs">
                        Upload PPT format, report Word/PDF format, or ZIP starter kit for students to follow.
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">
                      Supported: .pdf, .ppt, .pptx, .doc, .docx, .zip (Max 35MB)
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>{isUploadingTemplate ? 'Uploading...' : 'Upload Format File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
                        disabled={isUploadingTemplate}
                        onChange={handleTemplateFileUpload}
                        className="hidden"
                      />
                    </label>
                    {deadlineForm.template_url && (
                      <button
                        type="button"
                        onClick={() => setDeadlineForm((prev) => ({ ...prev, template_url: '', template_filename: '' }))}
                        className="px-2 py-1.5 text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Academic Guidelines & Instructions */}
              <div className="space-y-1.5 text-xs">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Custom Guidelines &amp; Submission Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Include university cover page, problem statement, modular architecture diagram, and references in IEEE citation style. PPT must be exactly 12-15 slides."
                  value={deadlineForm.instructions}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, instructions: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-sm p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#B81D24] leading-relaxed"
                />
              </div>

              {/* Email Notification Option */}
              <label className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={deadlineForm.notify_students}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, notify_students: e.target.checked })}
                  className="mt-0.5 accent-[#B81D24] cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#B81D24]" />
                    Dispatch Institutional Announcement Email to all Enrolled Students
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Automatically emails every enrolled student in this track with official DBUU milestone details, due date, instructions, and download link for format templates.
                  </div>
                </div>
              </label>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTrackForDeadlines(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingDeadline}
                  className="px-5 py-2 bg-[#B81D24] hover:bg-[#99151B] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 shadow-sm cursor-pointer disabled:bg-slate-400 transition-colors"
                >
                  {isSavingDeadline ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving &amp; Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Save Deadline &amp; Dispatch Notice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: TRACK DETAILS & ENROLLED GROUPS */}
      {selectedTrackForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-slate-300 shadow-xl max-w-4xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-blue-50 text-[#1A4DBE] border border-blue-200 text-[10px] font-extrabold uppercase rounded-xs">
                    {selectedTrackForDetails.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Session: {selectedTrackForDetails.session_year || '2026-27'} [{selectedTrackForDetails.session_term || 'ODD'}]
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedTrackForDetails.title}
                </h3>
                <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                  <span>Target: <strong>{selectedTrackForDetails.target_program} • Sem {selectedTrackForDetails.target_semester}</strong></span>
                  <span>•</span>
                  <span>Coordinator: <strong>{selectedTrackForDetails.coordinator_name || 'Not Assigned'}</strong></span>
                  <span>•</span>
                  <span>Max Group Size: <strong>{selectedTrackForDetails.max_group_size} students</strong></span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTrackForDetails(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Enrolled Groups Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#B81D24]" />
                  <span>Enrolled Student Groups ({selectedTrackGroups.length})</span>
                </h4>
              </div>

              {selectedTrackGroups.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-sm p-8 text-center space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">No Student Groups Formed in this Track Yet</div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    When students from {selectedTrackForDetails.target_program} Semester {selectedTrackForDetails.target_semester} form project groups and submit proposals, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {selectedTrackGroups.map((group) => {
                    const hasSubmitted = group.status === 'SUBMITTED';
                    const isApproved = group.status === 'HOD_APPROVED' || group.status === 'DEAN_APPROVED';

                    return (
                      <div
                        key={group.id}
                        className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-sm font-black text-slate-900">{group.name}</h5>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded-xs">
                              Status: {group.status}
                            </span>
                            {hasSubmitted && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-xs">
                                Needs Review
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-xs">
                                Endorsed
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600">
                            <span className="text-slate-400">Supervisor:</span>{' '}
                            <span className="font-bold text-slate-800">{group.supervisor_name || 'Unassigned'}</span>
                          </div>
                        </div>

                        {/* Team Roster with Circular DPs */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center">
                            {group.members?.map((m, idx) => (
                              <div
                                key={m.id}
                                title={`${m.full_name} (${m.university_id}) - ${m.member_role}`}
                                className={`w-8 h-8 rounded-full border-2 border-white shadow-2xs overflow-hidden bg-slate-200 flex items-center justify-center ${
                                  idx !== 0 ? '-ml-2' : ''
                                }`}
                              >
                                {m.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.avatar_url} alt={m.full_name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-600">{m.full_name[0]}</span>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="text-xs text-slate-600">
                            {group.members?.map((m) => m.full_name).join(', ')}
                          </div>
                        </div>

                        {/* Proposal Title if available */}
                        {group.approved_proposal && (
                          <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-sm border border-slate-100">
                            <span className="font-bold text-slate-900">Topic:</span> {group.approved_proposal.title}
                          </div>
                        )}

                        {/* Inspect Button */}
                        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setDeepViewProject(group)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-red-400" />
                            <span>View Deep Detailed Dossier</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTrackForDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DEEP DETAILED VIEW OF PROJECT DOSSIER */}
      {deepViewProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-slate-300 shadow-2xl max-w-4xl w-full p-6 sm:p-7 space-y-6 my-8 max-h-[92vh] overflow-y-auto font-sans">
            {/* Top Bar */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-[#B81D24] text-white text-[10px] font-black uppercase rounded-xs">
                    {deepViewProject.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Track: {deepViewProject.track_title}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {deepViewProject.name}
                </h3>
                <div className="text-xs text-slate-500">
                  {deepViewProject.target_program} • Semester {deepViewProject.target_semester} • Department: {deepViewProject.department}
                </div>
              </div>

              <button
                onClick={() => setDeepViewProject(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-sm cursor-pointer border border-slate-200 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: PROJECT IDEA & SCOPE */}
            <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#B81D24]" />
                <span>Project Proposal &amp; Technical Scope</span>
              </div>

              {deepViewProject.approved_proposal ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Approved Project Title</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {deepViewProject.approved_proposal.title}
                    </div>
                  </div>

                  {deepViewProject.approved_proposal.domain && (
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Core Domain</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-100 text-[#1A4DBE] rounded-xs font-bold text-[11px]">
                        {deepViewProject.approved_proposal.domain}
                      </span>
                    </div>
                  )}

                  {deepViewProject.approved_proposal.tech_stack && deepViewProject.approved_proposal.tech_stack.length > 0 && (
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Technologies &amp; Frameworks</div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {deepViewProject.approved_proposal.tech_stack.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-xs shadow-2xs"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {deepViewProject.approved_proposal.problem_statement && (
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Problem Statement &amp; Need</div>
                      <p className="text-slate-700 leading-relaxed mt-0.5">
                        {deepViewProject.approved_proposal.problem_statement}
                      </p>
                    </div>
                  )}

                  {deepViewProject.approved_proposal.novelty && (
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Novelty &amp; Innovation</div>
                      <p className="text-slate-700 leading-relaxed mt-0.5">
                        {deepViewProject.approved_proposal.novelty}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">No formal proposal submitted yet for this project.</div>
              )}
            </div>

            {/* SECTION 2: DELIVERABLES STATUS & SUBMISSION TIMESTAMPS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-[#B81D24]" />
                  <span>Deliverables &amp; Artifact Verification Status</span>
                </div>
                {deepViewProject.submission?.all_completed_at && (
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200">
                    All Deliverables Finalized: {formatTimestamp(deepViewProject.submission.all_completed_at)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Synopsis */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#B81D24]" />
                      <span className="text-xs font-bold text-slate-800">Synopsis (PDF)</span>
                    </div>
                    {deepViewProject.submission?.synopsis_url ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-xs">
                        Submitted
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-xs">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Time: {formatTimestamp(deepViewProject.submission?.synopsis_submitted_at)}
                  </div>
                  {deepViewProject.submission?.synopsis_url && (
                    <a
                      href={deepViewProject.submission.synopsis_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#B81D24] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open Synopsis Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* 2. Presentation Slides */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Presentation className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-800">Presentation (PPT)</span>
                    </div>
                    {deepViewProject.submission?.ppt_url ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-xs">
                        Submitted
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-xs">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Time: {formatTimestamp(deepViewProject.submission?.ppt_submitted_at)}
                  </div>
                  {deepViewProject.submission?.ppt_url && (
                    <a
                      href={deepViewProject.submission.ppt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-700 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open Presentation Slides</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* 3. GitHub Codebase */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-slate-900" />
                      <span className="text-xs font-bold text-slate-800">GitHub Repository</span>
                    </div>
                    {deepViewProject.submission?.github_repo_url ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-xs">
                        Submitted
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-xs">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Time: {formatTimestamp(deepViewProject.submission?.github_submitted_at)}
                  </div>
                  {deepViewProject.submission?.github_repo_url && (
                    <a
                      href={deepViewProject.submission.github_repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-900 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>View GitHub Codebase</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* 4. Live Deployment */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-sm shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">Live Working Demo</span>
                    </div>
                    {deepViewProject.submission?.live_demo_url ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-xs">
                        Active URL
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-xs">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Time: {formatTimestamp(deepViewProject.submission?.all_completed_at)}
                  </div>
                  {deepViewProject.submission?.live_demo_url && (
                    <a
                      href={deepViewProject.submission.live_demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open Live Deployment</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: TEAMMATES DETAILS WITH CIRCULAR DPS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Users className="w-4 h-4 text-[#B81D24]" />
                <span>Student Teammates &amp; Biometric Verification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {deepViewProject.members?.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-sm shadow-2xs flex items-start gap-3"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-slate-300 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center shadow-xs">
                      {m.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.avatar_url} alt={m.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-slate-500">{m.full_name[0]}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{m.full_name}</span>
                        {m.member_role === 'LEADER' && (
                          <span className="px-1 py-0.2 bg-amber-100 text-amber-900 text-[9px] font-black rounded-xs">
                            LEADER
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{m.university_id}</div>
                      <div className="text-[10px] text-slate-600">{m.email}</div>
                      <div className="text-[9px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Biometrics Verified</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 4: ASSIGNED SUPERVISOR DETAILS */}
            <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Assigned Faculty Supervisor:
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {deepViewProject.supervisor_name || 'No Supervisor Assigned'}
                </div>
                <div className="text-xs text-slate-500">
                  Direct Institutional Mentor for Technical Supervision
                </div>
              </div>

              <button
                onClick={() => {
                  setAssignModalGroup(deepViewProject);
                  setSelectedSupervisorId(deepViewProject.supervisor ? String(deepViewProject.supervisor) : '');
                }}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-sm border border-slate-300 cursor-pointer"
              >
                Change / Reassign Supervisor
              </button>
            </div>

            {/* SECTION 5: AUDIT HISTORY & EARLIER REJECTIONS */}
            {deepViewProject.approval_records && deepViewProject.approval_records.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <History className="w-4 h-4 text-[#B81D24]" />
                  <span>Review Audit History &amp; Revision Log</span>
                </div>
                <div className="space-y-2">
                  {deepViewProject.approval_records.map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-3 rounded-sm border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        rec.action === 'APPROVED'
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                          : 'bg-rose-50/70 border-rose-300 text-rose-950'
                      }`}
                    >
                      <div>
                        <span className="font-black uppercase tracking-wider">
                          [{rec.stage} - {rec.action}]:
                        </span>{' '}
                        <span>{rec.comment}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 shrink-0">
                        {rec.actioned_by_name} ({rec.actioned_by_role}) • {formatTimestamp(rec.actioned_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => setDeepViewProject(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm hover:bg-slate-100 cursor-pointer"
              >
                Back to Track View
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setDecisionModalGroup(deepViewProject);
                    setDecisionType('APPROVED');
                    setDecisionComment('Endorsed by HOD. Deliverables satisfy all departmental academic standards.');
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Endorse Dossier (Send to Dean)</span>
                </button>

                <button
                  onClick={() => {
                    setDecisionModalGroup(deepViewProject);
                    setDecisionType('REJECTED');
                    setDecisionComment('');
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Request Revisions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE / EDIT PROJECT TRACK */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-slate-300 shadow-xl max-w-xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-[#B81D24]" />
                <h3 className="text-base font-black text-slate-900">
                  {editingTrack ? 'Edit Project Track' : 'Configure New Project Track'}
                </h3>
              </div>
              <button
                onClick={() => setIsTrackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTrack} className="space-y-4">
              {/* Track Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Track Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={trackForm.title}
                  onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                  placeholder="e.g. BCA 5th Sem Minor Project I (Full-Stack & Applied AI)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs focus:border-[#B81D24] focus:outline-none"
                />
              </div>

              {/* Category & Program */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Category</label>
                  <select
                    value={trackForm.category}
                    onChange={(e) => setTrackForm({ ...trackForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs bg-white focus:border-[#B81D24] focus:outline-none"
                  >
                    {CATEGORY_CHOICES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Target Program</label>
                  <select
                    value={trackForm.target_program}
                    onChange={(e) => setTrackForm({ ...trackForm, target_program: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs bg-white focus:border-[#B81D24] focus:outline-none"
                  >
                    <option value="BCA">BCA</option>
                    <option value="B.Tech CSE">B.Tech CSE</option>
                    <option value="MCA">MCA</option>
                    <option value="B.Sc IT">B.Sc IT</option>
                  </select>
                </div>
              </div>

              {/* Semester & Max Group Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Target Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={trackForm.target_semester}
                    onChange={(e) => setTrackForm({ ...trackForm, target_semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs focus:border-[#B81D24] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Max Group Size</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={trackForm.max_group_size}
                    onChange={(e) => setTrackForm({ ...trackForm, max_group_size: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs focus:border-[#B81D24] focus:outline-none"
                  />
                </div>
              </div>

              {/* Assign Track Coordinator */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Assign Track Coordinator
                </label>
                <select
                  value={trackForm.coordinator}
                  onChange={(e) => setTrackForm({ ...trackForm, coordinator: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs bg-white focus:border-[#B81D24] focus:outline-none"
                >
                  <option value="">None (HOD Coordinates)</option>
                  {approvedSupervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Deliverables Checkboxes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Select Required Deliverables
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-sm">
                  {AVAILABLE_DELIVERABLES.map((del) => {
                    const isChecked = trackForm.required_deliverables.includes(del.id);
                    return (
                      <label key={del.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTrackForm({
                                ...trackForm,
                                required_deliverables: [...trackForm.required_deliverables, del.id],
                              });
                            } else {
                              setTrackForm({
                                ...trackForm,
                                required_deliverables: trackForm.required_deliverables.filter((d) => d !== del.id),
                              });
                            }
                          }}
                          className="rounded-xs text-[#B81D24] focus:ring-0"
                        />
                        <span>{del.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTrackModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'save-track'}
                  className="px-5 py-2 bg-[#B81D24] hover:bg-[#99151B] disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-xs cursor-pointer"
                >
                  {actionLoading === 'save-track' ? 'Saving...' : editingTrack ? 'Update Track' : 'Publish Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ASSIGN SUPERVISOR TO GROUP */}
      {assignModalGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-300 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#B81D24]" />
                <h3 className="text-sm font-black text-slate-900">Assign Faculty Supervisor</h3>
              </div>
              <button
                onClick={() => setAssignModalGroup(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Project Group:</span>{' '}
                <span className="font-bold text-slate-800">{assignModalGroup.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Track:</span>{' '}
                <span className="font-semibold text-slate-700">{assignModalGroup.track_title}</span>
              </div>
            </div>

            <form onSubmit={handleAssignSupervisor} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Select Approved Faculty Supervisor
                </label>
                <select
                  required
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs bg-white focus:border-[#B81D24] focus:outline-none"
                >
                  <option value="">-- Choose Supervisor --</option>
                  {approvedSupervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.full_name} ({sup.designation}) • Max {sup.max_groups} groups
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssignModalGroup(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === `assign-${assignModalGroup.id}`}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-xs cursor-pointer"
                >
                  {actionLoading === `assign-${assignModalGroup.id}` ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DOSSIER HOD DECISION (APPROVE / REJECT) */}
      {decisionModalGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-300 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                {decisionType === 'APPROVED' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <h3 className="text-sm font-black text-slate-900">
                  {decisionType === 'APPROVED' ? 'Endorse & Approve Project Dossier' : 'Request Deliverable Revisions'}
                </h3>
              </div>
              <button
                onClick={() => setDecisionModalGroup(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400">Project Group:</span>{' '}
                <span className="font-bold text-slate-800">{decisionModalGroup.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Track:</span>{' '}
                <span className="font-semibold text-slate-700">{decisionModalGroup.track_title}</span>
              </div>
              {decisionType === 'APPROVED' && (
                <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xs border border-emerald-200">
                  Upon your endorsement, this project dossier will be locked in the departmental repository and automatically forwarded to the Dean of School for final university certification.
                </p>
              )}
            </div>

            <form onSubmit={handleDossierDecision} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Academic Feedback &amp; Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder={
                    decisionType === 'APPROVED'
                      ? 'e.g. Endorsed by HOD. Deliverables satisfy all departmental academic standards.'
                      : 'Specify required modifications (e.g. Methodology section needs enhancement in Synopsis, update GitHub readme)...'
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-sm text-xs focus:border-[#B81D24] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDecisionModalGroup(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === `decision-${decisionModalGroup.id}`}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-sm shadow-xs cursor-pointer ${
                    decisionType === 'APPROVED'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {actionLoading === `decision-${decisionModalGroup.id}`
                    ? 'Submitting...'
                    : decisionType === 'APPROVED'
                    ? 'Confirm & Endorse'
                    : 'Submit Revisions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

