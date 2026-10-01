'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  LogOut,
  CheckCircle,
  Users,
  Search,
  Plus,
  Layers,
  ExternalLink,
  FileText,
  FileCode,
  Globe,
  AlertCircle,
  Sparkles,
  Presentation,
  CheckCircle2,
  Eye,
  X,
  Download,
  Upload,
  Send,
  Check,
  Tag,
  FileCheck,
} from 'lucide-react';

// ─── TYPES ──────────────────────────────────────────────────────────
export interface GroupMemberData {
  id: number;
  university_id: string;
  full_name: string;
  email: string;
  program: string;
  semester: number;
  member_role: 'LEADER' | 'MEMBER';
  avatar_url?: string;
  joined_at?: string;
}

export interface ProposalData {
  id: string;
  group: string;
  group_name: string;
  proposal_type: 'FROM_LIST' | 'OWN_IDEA';
  project_idea?: string | null;
  title: string;
  problem_statement: string;
  novelty: string;
  domain: string;
  technologies: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  version: number;
  supervisor_feedback: string;
  decided_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionData {
  id: string;
  synopsis_url: string;
  synopsis_submitted_at?: string | null;
  ppt_url: string;
  ppt_submitted_at?: string | null;
  report_url: string;
  report_submitted_at?: string | null;
  research_paper_url: string;
  github_repo_url: string;
  live_demo_url: string;
  media_urls: string[];
  all_completed_at?: string | null;
}

export interface SupervisorGroupData {
  id: string;
  name: string;
  track: string;
  track_id?: string;
  track_title: string;
  category: string;
  department: string;
  target_program: string;
  target_semester: number;
  session_year: string;
  session_term: string;
  supervisor: string;
  supervisor_name: string;
  created_by: number;
  created_by_name: string;
  status: string;
  members: GroupMemberData[];
  latest_proposal?: ProposalData | null;
  submission?: SubmissionData | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectIdeaData {
  id: string;
  supervisor: string;
  supervisor_name: string;
  supervisor_designation?: string;
  supervisor_avatar?: string;
  title: string;
  problem_statement: string;
  novelty: string;
  domain: string;
  technologies: string[];
  supporting_doc_url?: string;
  supporting_doc_name?: string;
  is_taken: boolean;
  taken_by?: string | null;
  taken_by_name?: string | null;
  created_at: string;
  updated_at?: string;
}

const COMMON_DOMAINS = [
  'Artificial Intelligence & Machine Learning',
  'Full Stack Web Applications',
  'Cloud Computing & DevOps',
  'Internet of Things (IoT) & Embedded',
  'Cybersecurity & Ethical Hacking',
  'Blockchain & Web3 Technologies',
  'Data Science & Big Data Analytics',
  'Mobile Application Development (iOS/Android)',
  'Computer Vision & Augmented Reality',
];

const SUGGESTED_TECH = [
  'Python',
  'React',
  'Next.js',
  'PyTorch',
  'TensorFlow',
  'Node.js',
  'FastAPI',
  'PostgreSQL',
  'Docker',
  'Flutter',
  'TailwindCSS',
  'OpenCV',
  'AWS',
];

export default function SupervisorDashboardPage() {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // Active Main Tab: 'groups' | 'ideas' | 'deliverables'
  const [activeTab, setActiveTab] = useState<'groups' | 'ideas' | 'deliverables'>('groups');

  // Debounced Global Search Bar
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Data Collections
  const [assignedGroups, setAssignedGroups] = useState<SupervisorGroupData[]>([]);
  const [supervisorIdeas, setSupervisorIdeas] = useState<ProjectIdeaData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sub-filter for Groups Tab
  const [groupStatusFilter, setGroupStatusFilter] = useState<string>('ALL');

  // Action status message banner
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Proposal Review Modal State
  const [selectedProposalForReview, setSelectedProposalForReview] = useState<{
    group: SupervisorGroupData;
    proposal: ProposalData;
  } | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Deep Dossier Inspection Modal
  const [selectedGroupDossier, setSelectedGroupDossier] = useState<SupervisorGroupData | null>(null);

  // Post New Idea Modal State
  const [isPostIdeaModalOpen, setIsPostIdeaModalOpen] = useState<boolean>(false);
  const [isSubmittingIdea, setIsSubmittingIdea] = useState<boolean>(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [ideaTechInput, setIdeaTechInput] = useState<string>('');
  const [ideaForm, setIdeaForm] = useState({
    title: '',
    domain: COMMON_DOMAINS[0],
    customDomain: '',
    technologies: [] as string[],
    problem_statement: '',
    novelty: '',
    supporting_doc_url: '',
    supporting_doc_name: '',
  });

  // ─── DEBOUNCE EFFECT FOR NAVBAR SEARCH ──────────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // ─── AUTH & DATA LOADING ──────────────────────────────────────────
  const refreshDashboardData = useCallback(async (token: string) => {
    setLoading(true);
    try {
      // 1. Fetch Supervisor Assigned Groups
      const groupsRes = await fetch('http://127.0.0.1:8000/api/projects/groups/supervisor-groups/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setAssignedGroups(Array.isArray(groupsData) ? groupsData : groupsData.results || []);
      }

      // 2. Fetch Supervisor Ideas
      const ideasRes = await fetch('http://127.0.0.1:8000/api/projects/ideas/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ideasRes.ok) {
        const ideasData = await ideasRes.json();
        setSupervisorIdeas(Array.isArray(ideasData) ? ideasData : ideasData.results || []);
      }
    } catch (err) {
      console.error('Failed to load supervisor data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
          setUser(JSON.parse(raw));
        } catch {
          setUser(null);
        }
      }
    });

    // Refresh current user and fetch assigned groups & ideas
    fetch('http://127.0.0.1:8000/api/auth/me/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('aris_user');
          localStorage.removeItem('user');
          localStorage.removeItem('aris_token');
          sessionStorage.clear();
          window.location.replace('/');
          return null;
        }
        return res.json();
      })
      .then((freshUser) => {
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem('aris_user', JSON.stringify(freshUser));
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
      })
      .catch((err) => console.warn('User profile sync skipped:', err));

    queueMicrotask(() => {
      refreshDashboardData(token);
    });

    const handlePageShow = (event: PageTransitionEvent) => {
      const currentToken = localStorage.getItem('access_token');
      if (event.persisted || !currentToken) {
        window.location.replace('/');
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [refreshDashboardData]);

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

  // ─── PROPOSAL REVIEW HANDLER ───────────────────────────────────────
  const handleReviewProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposalForReview) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    if (!reviewFeedback.trim() || reviewFeedback.trim().length < 5) {
      setActionMessage({ type: 'error', text: 'Please provide at least 5 characters of feedback remarks for the student group.' });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/projects/proposals/${selectedProposalForReview.proposal.id}/review/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: reviewStatus,
            supervisor_feedback: reviewFeedback.trim(),
          }),
        }
      );

      if (res.ok) {
        const updatedProposal = await res.json();
        setActionMessage({
          type: 'success',
          text: `Proposal ${reviewStatus === 'APPROVED' ? 'approved' : 'rejected'} for ${selectedProposalForReview.group.name}. Feedback communicated to the student group.`,
        });

        // Update local group data
        setAssignedGroups((prev) =>
          prev.map((g) => {
            if (g.id === selectedProposalForReview.group.id) {
              return {
                ...g,
                status: reviewStatus === 'APPROVED' ? 'ACTIVE' : 'PROPOSAL_REJECTED',
                latest_proposal: updatedProposal,
              };
            }
            return g;
          })
        );
        setSelectedProposalForReview(null);
        setReviewFeedback('');
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.detail || err.supervisor_feedback || 'Failed to submit proposal review.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network connection error while submitting review.' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // ─── POST NEW IDEA HANDLERS ────────────────────────────────────────
  const handleAddTechTag = (tagToAdd?: string) => {
    const raw = tagToAdd || ideaTechInput;
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (!ideaForm.technologies.includes(cleaned)) {
      setIdeaForm((prev) => ({
        ...prev,
        technologies: [...prev.technologies, cleaned],
      }));
    }
    setIdeaTechInput('');
  };

  const handleRemoveTechTag = (tagToRemove: string) => {
    setIdeaForm((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSupportingDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deliverable_type', 'DOC');
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
        setActionMessage({ type: 'error', text: data.file || data.detail || 'Supporting document upload failed.' });
        return;
      }
      setIdeaForm((prev) => ({
        ...prev,
        supporting_doc_url: data.secure_url,
        supporting_doc_name: file.name,
      }));
      setActionMessage({ type: 'success', text: `Supporting document "${file.name}" uploaded successfully.` });
    } catch {
      setActionMessage({ type: 'error', text: 'Network error during supporting document upload.' });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handlePostIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) return;

    if (!ideaForm.title.trim()) {
      setActionMessage({ type: 'error', text: 'Project Idea Title is required.' });
      return;
    }
    if (!ideaForm.problem_statement.trim()) {
      setActionMessage({ type: 'error', text: 'Problem Statement is required.' });
      return;
    }

    const finalDomain =
      ideaForm.domain === 'Custom' ? ideaForm.customDomain.trim() || 'General' : ideaForm.domain;

    setIsSubmittingIdea(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/projects/ideas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: ideaForm.title.trim(),
          domain: finalDomain,
          technologies: ideaForm.technologies,
          problem_statement: ideaForm.problem_statement.trim(),
          novelty: ideaForm.novelty.trim() || 'Innovative architectural formulation and practical application.',
          supporting_doc_url: ideaForm.supporting_doc_url,
          supporting_doc_name: ideaForm.supporting_doc_name,
        }),
      });

      if (res.ok) {
        const newIdea = await res.json();
        setSupervisorIdeas((prev) => [newIdea, ...prev]);
        setActionMessage({
          type: 'success',
          text: `Project idea "${newIdea.title}" published to department pool! Students can now adopt it.`,
        });
        setIsPostIdeaModalOpen(false);
        setIdeaForm({
          title: '',
          domain: COMMON_DOMAINS[0],
          customDomain: '',
          technologies: [],
          problem_statement: '',
          novelty: '',
          supporting_doc_url: '',
          supporting_doc_name: '',
        });
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.detail || JSON.stringify(err) || 'Failed to publish idea.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network connection error publishing idea.' });
    } finally {
      setIsSubmittingIdea(false);
    }
  };

  // ─── FILTERED DATA ────────────────────────────────────────────────
  const filteredGroups = useMemo(() => {
    return assignedGroups.filter((g) => {
      // 1. Status Filter
      if (groupStatusFilter === 'PENDING' && !['PROPOSAL_PENDING', 'SUPERVISOR_PENDING'].includes(g.status)) {
        return false;
      }
      if (groupStatusFilter === 'ACTIVE' && g.status !== 'ACTIVE') return false;
      if (groupStatusFilter === 'SUBMITTED' && g.status !== 'SUBMITTED') return false;
      if (groupStatusFilter === 'ARCHIVED' && !['HOD_APPROVED', 'DEAN_APPROVED'].includes(g.status)) {
        return false;
      }

      // 2. Debounced Search Query
      if (!debouncedSearch) return true;
      const matchName = g.name.toLowerCase().includes(debouncedSearch);
      const matchTrack = g.track_title.toLowerCase().includes(debouncedSearch);
      const matchTopic = g.latest_proposal?.title?.toLowerCase().includes(debouncedSearch);
      const matchMember = g.members?.some(
        (m) =>
          m.full_name.toLowerCase().includes(debouncedSearch) ||
          m.university_id.toLowerCase().includes(debouncedSearch)
      );

      return matchName || matchTrack || matchTopic || matchMember;
    });
  }, [assignedGroups, groupStatusFilter, debouncedSearch]);

  const filteredIdeas = useMemo(() => {
    return supervisorIdeas.filter((idea) => {
      if (!debouncedSearch) return true;
      const matchTitle = idea.title.toLowerCase().includes(debouncedSearch);
      const matchDomain = idea.domain.toLowerCase().includes(debouncedSearch);
      const matchTech = idea.technologies?.some((t) => t.toLowerCase().includes(debouncedSearch));
      const matchProb = idea.problem_statement.toLowerCase().includes(debouncedSearch);
      return matchTitle || matchDomain || matchTech || matchProb;
    });
  }, [supervisorIdeas, debouncedSearch]);

  const pendingReviewCount = useMemo(() => {
    return assignedGroups.filter((g) => ['PROPOSAL_PENDING', 'SUPERVISOR_PENDING'].includes(g.status)).length;
  }, [assignedGroups]);

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return null;
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-xs uppercase">Submitted for Review</span>;
      case 'ACTIVE':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-[10px] rounded-xs uppercase">Active Mentorship</span>;
      case 'PROPOSAL_PENDING':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded-xs uppercase">Proposal Under Review</span>;
      case 'PROPOSAL_REJECTED':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-extrabold text-[10px] rounded-xs uppercase">Proposal Revision Requested</span>;
      case 'HOD_APPROVED':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-extrabold text-[10px] rounded-xs uppercase">HOD Verified</span>;
      case 'DEAN_APPROVED':
        return <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold text-[10px] rounded-xs uppercase">Dean Approved &amp; Archived</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-extrabold text-[10px] rounded-xs uppercase">{status}</span>;
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-9 h-9 border-3 border-slate-700 border-t-[#B81D24] rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
          Verifying Faculty Supervisor Credentials...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans">
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── 1. TOP INSTITUTIONAL NAVBAR ─────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          
          {/* Left: DBUU University Logo */}
          <div className="flex items-center gap-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.jpeg" alt="DBUU" className="h-9 sm:h-11 w-auto object-contain" />
            <div className="hidden md:block pl-3 border-l-2 border-slate-300">
              <div className="text-xs font-black uppercase tracking-wider text-slate-800">
                ARIS Faculty Workspace
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Dev Bhoomi Uttarakhand University • Dehradun
              </div>
            </div>
          </div>

          {/* Center: Main Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'groups'
                  ? 'bg-[#B81D24] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Assigned Groups</span>
              {assignedGroups.length > 0 && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                    activeTab === 'groups' ? 'bg-white text-[#B81D24]' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {assignedGroups.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ideas')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ideas'
                  ? 'bg-[#B81D24] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Post &amp; Manage Ideas</span>
              {supervisorIdeas.length > 0 && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                    activeTab === 'ideas' ? 'bg-white text-[#B81D24]' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {supervisorIdeas.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('deliverables')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'deliverables'
                  ? 'bg-[#B81D24] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deliverables Review</span>
              <span className="sm:hidden">Deliverables</span>
            </button>
          </nav>

          {/* Right: Search Bar & Faculty Info */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search Bar */}
            <div className="relative hidden lg:block w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search groups or ideas..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24]"
              />
            </div>

            {/* Supervisor Profile Summary */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-black text-slate-900 leading-tight">
                  {user?.full_name || 'Prof. Dhajvir Singh'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight">
                  {user?.supervisor_profile?.designation || 'Assistant Professor'} • {user?.department || 'Computer Applications'}
                </div>
              </div>

              {/* Circular Avatar */}
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                {user?.avatar_url && !avatarError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || 'Profile'}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#B81D24] text-white flex items-center justify-center text-xs font-black">
                    {user?.first_name ? user.first_name[0] : 'S'}
                  </div>
                )}
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                title="Sign Out of Session"
                className="p-1.5 text-slate-400 hover:text-[#B81D24] hover:bg-red-50 rounded-sm border border-slate-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Ribbon with Session Context */}
        <div className="w-full bg-[#B81D24] text-white py-1.5 px-4 sm:px-6 lg:px-8 text-xs font-bold uppercase tracking-wider">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-red-200" />
              <span>Faculty Supervisor Portal</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono text-red-100 font-normal">
              <span>Session: 2026-27 [ODD]</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Faculty ID: {user?.university_id || 'DBUUF0001'}</span>
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
        {/* ── TAB 1: ASSIGNED PROJECT GROUPS ───────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'groups' && (
          <div className="space-y-5">
            {/* Header with Sub-Filter Pills */}
            <div className="bg-white border border-slate-200 rounded-sm p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#B81D24]" />
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Assigned Project Groups &amp; Mentorship Panel
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supervise student innovation teams, inspect proposals, review milestone deliverables, and evaluate project dossiers.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-sm border border-slate-200">
                  {(['ALL', 'PENDING', 'ACTIVE', 'SUBMITTED', 'ARCHIVED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setGroupStatusFilter(st)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xs transition-all cursor-pointer ${
                        groupStatusFilter === st
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st === 'ALL'
                        ? 'All Groups'
                        : st === 'PENDING'
                        ? 'Pending Review'
                        : st === 'ACTIVE'
                        ? 'Active'
                        : st === 'SUBMITTED'
                        ? 'Submitted'
                        : 'Archived'}
                      {st === 'PENDING' && pendingReviewCount > 0 && (
                        <span className="ml-1 px-1 bg-[#B81D24] text-white text-[9px] font-black rounded-full">
                          {pendingReviewCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => refreshDashboardData(localStorage.getItem('access_token') || '')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Groups Grid */}
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-sm p-12 text-center text-xs font-mono text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-[#B81D24] rounded-full animate-spin mx-auto mb-3" />
                Loading Assigned Groups from Database...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-sm p-12 text-center space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No Assigned Groups Matching Filter</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchInput
                    ? `No project groups matched "${searchInput}". Try clearing the search bar.`
                    : 'Groups assigned to you by the department HOD or students who selected you will appear here.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {filteredGroups.map((group) => {
                  const proposal = group.latest_proposal;
                  const submission = group.submission;
                  const hasPendingProposal = proposal && proposal.status === 'PENDING';

                  return (
                    <div
                      key={group.id}
                      className="bg-white border border-slate-200 border-t-3 border-t-[#B81D24] rounded-sm p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                    >
                      {/* Card Header: Group Name, Track, Status Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-50 text-[#1A4DBE] border border-blue-200 text-[10px] font-extrabold uppercase rounded-xs">
                              {group.category || 'MINOR_PROJECT'}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {group.session_year || '2026-27'} [{group.session_term || 'ODD'}]
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-600 font-semibold">
                              {group.track_title} ({group.target_program || 'BCA'} Sem-{group.target_semester || 5})
                            </span>
                          </div>

                          <h3 className="text-lg font-black text-slate-900 tracking-tight">
                            {group.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(group.status)}
                        </div>
                      </div>

                      {/* Proposal Section */}
                      {proposal ? (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                Proposal v{proposal.version}:
                              </span>
                              <span className="font-bold text-slate-900 text-xs">{proposal.title}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold rounded-xs">
                              {proposal.domain}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {proposal.problem_statement}
                          </p>

                          {/* Tech Tags */}
                          {proposal.technologies && proposal.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {proposal.technologies.map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-medium rounded-xs"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Existing Feedback */}
                          {proposal.supervisor_feedback && (
                            <div className="mt-2 p-2 bg-white border-l-3 border-[#B81D24] text-[11px] text-slate-600 italic rounded-xs">
                              <span className="font-bold text-slate-800 not-italic block mb-0.5">Your Feedback:</span>
                              &ldquo;{proposal.supervisor_feedback}&rdquo;
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-sm text-xs text-slate-500 italic">
                          No project proposal submitted yet by this group.
                        </div>
                      )}

                      {/* Student Teammates Roster */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Student Team Members ({group.members?.length || 0})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {group.members?.map((m) => (
                            <div
                              key={m.id}
                              className="p-2 bg-white border border-slate-200 rounded-xs flex items-center gap-2 text-xs shadow-2xs"
                            >
                              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-[11px] shrink-0">
                                {m.full_name[0]}
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-1 truncate">
                                  <span className="font-bold text-slate-900 truncate">{m.full_name}</span>
                                  {m.member_role === 'LEADER' && (
                                    <span className="px-1 py-0.2 bg-amber-100 text-amber-900 text-[8px] font-black rounded-xs shrink-0">
                                      LEADER
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 truncate">
                                  {m.university_id}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deliverables Checklist Chips */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Deliverables Progress:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                          {/* Synopsis */}
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-700">Synopsis</span>
                              {submission?.synopsis_url ? (
                                <span className="text-emerald-700 font-black">Submitted</span>
                              ) : (
                                <span className="text-slate-400">Pending</span>
                              )}
                            </div>
                            <div className="text-[9px] font-mono text-slate-500 truncate">
                              {formatTimestamp(submission?.synopsis_submitted_at) || 'Not submitted'}
                            </div>
                            {submission?.synopsis_url && (
                              <a
                                href={submission.synopsis_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#B81D24] font-semibold hover:underline inline-flex items-center gap-1"
                              >
                                <span>View PDF</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* PPT */}
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-700">Presentation</span>
                              {submission?.ppt_url ? (
                                <span className="text-emerald-700 font-black">Submitted</span>
                              ) : (
                                <span className="text-slate-400">Pending</span>
                              )}
                            </div>
                            <div className="text-[9px] font-mono text-slate-500 truncate">
                              {formatTimestamp(submission?.ppt_submitted_at) || 'Not submitted'}
                            </div>
                            {submission?.ppt_url && (
                              <a
                                href={submission.ppt_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
                              >
                                <span>Open PPT</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* Report */}
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-700">Report</span>
                              {submission?.report_url ? (
                                <span className="text-emerald-700 font-black">Submitted</span>
                              ) : (
                                <span className="text-slate-400">Pending</span>
                              )}
                            </div>
                            <div className="text-[9px] font-mono text-slate-500 truncate">
                              {formatTimestamp(submission?.report_submitted_at) || 'Not submitted'}
                            </div>
                            {submission?.report_url && (
                              <a
                                href={submission.report_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#B81D24] font-semibold hover:underline inline-flex items-center gap-1"
                              >
                                <span>Open Report</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* GitHub */}
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-700">Repository</span>
                              {submission?.github_repo_url ? (
                                <span className="text-emerald-700 font-black">Linked</span>
                              ) : (
                                <span className="text-slate-400">Pending</span>
                              )}
                            </div>
                            <div className="text-[9px] font-mono text-slate-500 truncate">
                              {submission?.github_repo_url ? 'GitHub linked' : 'Not linked'}
                            </div>
                            {submission?.github_repo_url && (
                              <a
                                href={submission.github_repo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-slate-900 font-semibold hover:underline inline-flex items-center gap-1 truncate"
                              >
                                <span>Repo</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* Demo */}
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-700">Live Demo</span>
                              {submission?.live_demo_url ? (
                                <span className="text-emerald-700 font-black">Live</span>
                              ) : (
                                <span className="text-slate-400">Pending</span>
                              )}
                            </div>
                            <div className="text-[9px] font-mono text-slate-500 truncate">
                              {submission?.live_demo_url ? 'Hosted Online' : 'Not submitted'}
                            </div>
                            {submission?.live_demo_url && (
                              <a
                                href={submission.live_demo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1 truncate"
                              >
                                <span>Live Demo</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                        <button
                          onClick={() => setSelectedGroupDossier(group)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-red-400" />
                          <span>Inspect Full Dossier</span>
                        </button>

                        {hasPendingProposal && (
                          <button
                            onClick={() => {
                              setSelectedProposalForReview({ group, proposal });
                              setReviewStatus('APPROVED');
                              setReviewFeedback(proposal.supervisor_feedback || '');
                            }}
                            className="px-3 py-1.5 bg-[#B81D24] hover:bg-[#99151B] text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Review Proposal &amp; Decision</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 2: POST & MANAGE IDEAS ───────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'ideas' && (
          <div className="space-y-5">
            {/* Header Bar */}
            <div className="bg-white border border-slate-200 rounded-sm p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#B81D24]" />
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Faculty Project Idea Pool &amp; Research Topics
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publish cutting-edge project ideas, required domains, technologies, and attach specification documents for student groups to adopt.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsPostIdeaModalOpen(true)}
                  className="px-4 py-2 bg-[#B81D24] hover:bg-[#99151B] text-white text-xs font-bold rounded-sm shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post New Project Idea</span>
                </button>
              </div>
            </div>

            {/* Ideas Grid */}
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-sm p-12 text-center text-xs font-mono text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-[#B81D24] rounded-full animate-spin mx-auto mb-3" />
                Loading Faculty Idea Pool...
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-sm p-12 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No Project Ideas in Your Pool Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click &ldquo;Post New Project Idea&rdquo; above to publish your research topics, problem statements, and supporting format documents for students to choose.
                </p>
                <button
                  onClick={() => setIsPostIdeaModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B81D24] text-white text-xs font-bold rounded-sm hover:bg-[#99151B] cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post First Project Idea
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                {filteredIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="bg-white border border-slate-200 border-t-3 border-t-[#B81D24] rounded-sm p-5 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-extrabold uppercase rounded-xs">
                          {idea.domain}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                            idea.is_taken
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {idea.is_taken ? `Taken by ${idea.taken_by_name || 'Group'}` : 'Available for Adoption'}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {idea.title}
                      </h3>

                      <div className="space-y-1 text-xs text-slate-600">
                        <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                          Problem Statement:
                        </span>
                        <p className="line-clamp-3 leading-relaxed">{idea.problem_statement}</p>
                      </div>

                      {idea.novelty && (
                        <div className="space-y-1 text-xs text-slate-600">
                          <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                            Novelty / Innovation Quotient:
                          </span>
                          <p className="line-clamp-2 leading-relaxed italic text-slate-500">{idea.novelty}</p>
                        </div>
                      )}

                      {/* Tech Chips */}
                      {idea.technologies && idea.technologies.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Target Technologies:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {idea.technologies.map((tech) => (
                              <span
                                key={tech}
                                className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium rounded-xs"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Supporting Document / Attachment */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      {idea.supporting_doc_url ? (
                        <a
                          href={idea.supporting_doc_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-bold truncate"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{idea.supporting_doc_name || 'Specification Document'}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No supporting document attached</span>
                      )}

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formatTimestamp(idea.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 3: DELIVERABLES MATRIX ───────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'deliverables' && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-sm p-4.5 shadow-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#B81D24]" />
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Assigned Groups Milestone Deliverables Matrix
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive inspection panel of all student deliverables (Synopsis, PPT, Reports, Code Repositories, and Demo Links).
              </p>
            </div>

            {assignedGroups.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-sm p-12 text-center text-xs text-slate-500">
                No assigned groups currently enrolled under your supervision.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-sm overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Project Group</th>
                      <th className="p-3">Track / Category</th>
                      <th className="p-3">Synopsis (PDF)</th>
                      <th className="p-3">Presentation (PPT)</th>
                      <th className="p-3">Report (PDF)</th>
                      <th className="p-3">GitHub Code</th>
                      <th className="p-3">Live Demo</th>
                      <th className="p-3">Group Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {assignedGroups.map((g) => {
                      const sub = g.submission;
                      return (
                        <tr key={g.id} className="hover:bg-slate-50/75 transition-colors">
                          <td className="p-3 font-bold text-slate-900">
                            <div>{g.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {g.members?.length || 0} Members
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-700 truncate max-w-[160px]">{g.track_title}</div>
                            <div className="text-[10px] font-mono text-slate-400">{g.session_year}</div>
                          </td>
                          <td className="p-3">
                            {sub?.synopsis_url ? (
                              <a
                                href={sub.synopsis_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>PDF</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-slate-400">Pending</span>
                            )}
                          </td>
                          <td className="p-3">
                            {sub?.ppt_url ? (
                              <a
                                href={sub.ppt_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-blue-600" />
                                <span>Deck</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-slate-400">Pending</span>
                            )}
                          </td>
                          <td className="p-3">
                            {sub?.report_url ? (
                              <a
                                href={sub.report_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-700 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-purple-600" />
                                <span>Report</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-slate-400">Pending</span>
                            )}
                          </td>
                          <td className="p-3">
                            {sub?.github_repo_url ? (
                              <a
                                href={sub.github_repo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-900 font-bold hover:underline inline-flex items-center gap-1 truncate max-w-[110px]"
                              >
                                <span>Repo</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-slate-400">Pending</span>
                            )}
                          </td>
                          <td className="p-3">
                            {sub?.live_demo_url ? (
                              <a
                                href={sub.live_demo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 truncate max-w-[110px]"
                              >
                                <span>Demo</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-slate-400">Pending</span>
                            )}
                          </td>
                          <td className="p-3">
                            {getStatusBadge(g.status)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── 3. MODALS ───────────────────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      {/* MODAL 1: PROPOSAL REVIEW MODAL */}
      {selectedProposalForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-slate-300 border-t-4 border-t-[#B81D24] shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#B81D24]" />
                  <h3 className="text-lg font-black text-slate-900">
                    Project Proposal Review &amp; Evaluation
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Group: <strong className="text-slate-800">{selectedProposalForReview.group.name}</strong> • Track: {selectedProposalForReview.group.track_title}
                </p>
              </div>
              <button
                onClick={() => setSelectedProposalForReview(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Proposal Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Proposal Title:
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xs font-bold text-[10px]">
                  {selectedProposalForReview.proposal.domain}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">
                {selectedProposalForReview.proposal.title}
              </h4>

              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Problem Statement:</span>
                <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-xs border border-slate-200">
                  {selectedProposalForReview.proposal.problem_statement}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Novelty &amp; Innovation:</span>
                <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-xs border border-slate-200">
                  {selectedProposalForReview.proposal.novelty}
                </p>
              </div>

              {selectedProposalForReview.proposal.technologies?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Target Technologies:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedProposalForReview.proposal.technologies.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-medium rounded-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Review Form */}
            <form onSubmit={handleReviewProposalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Supervisor Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('APPROVED')}
                    className={`py-2.5 rounded-sm font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      reviewStatus === 'APPROVED'
                        ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve Proposal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('REJECTED')}
                    className={`py-2.5 rounded-sm font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      reviewStatus === 'REJECTED'
                        ? 'bg-rose-50 border-2 border-rose-600 text-rose-800'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <X className="w-4 h-4 text-rose-600" />
                    <span>Request Revisions</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Faculty Supervisor Guidance &amp; Feedback Remarks (Mandatory)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide constructive feedback, suggestions on scope, architecture requirements, or reasons for revision..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-sm p-3 text-xs text-slate-800 focus:outline-none focus:border-[#B81D24] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProposalForReview(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 bg-[#B81D24] hover:bg-[#99151B] text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm cursor-pointer disabled:bg-slate-400 flex items-center gap-2"
                >
                  {isSubmittingReview ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Decision...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Official Decision</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: POST NEW PROJECT IDEA */}
      {isPostIdeaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-slate-300 border-t-4 border-t-[#B81D24] shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#B81D24]" />
                  <h3 className="text-lg font-black text-slate-900">
                    Post New Project Idea to Department Pool
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Publish research concepts, expected domain, frameworks, and supporting specifications for student groups to adopt.
                </p>
              </div>
              <button
                onClick={() => setIsPostIdeaModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePostIdeaSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Project Idea Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Decentralized Academic Credential Verifier using Ethereum"
                  value={ideaForm.title}
                  onChange={(e) => setIdeaForm({ ...ideaForm, title: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#B81D24]"
                />
              </div>

              {/* Domain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Expected Academic Domain *
                  </label>
                  <select
                    value={ideaForm.domain}
                    onChange={(e) => setIdeaForm({ ...ideaForm, domain: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#B81D24]"
                  >
                    {COMMON_DOMAINS.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                    <option value="Custom">Custom Domain (Enter Below)</option>
                  </select>
                </div>

                {ideaForm.domain === 'Custom' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Custom Domain Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Quantum Computing / Bioinformatics"
                      value={ideaForm.customDomain}
                      onChange={(e) => setIdeaForm({ ...ideaForm, customDomain: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#B81D24]"
                    />
                  </div>
                )}
              </div>

              {/* Technologies & Frameworks */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Technologies &amp; Frameworks
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Type a technology and press Enter (e.g., PyTorch, Next.js)"
                      value={ideaTechInput}
                      onChange={(e) => setIdeaTechInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTechTag();
                        }
                      }}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-sm text-xs text-slate-900 focus:outline-none focus:border-[#B81D24]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTechTag()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-sm cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Suggestions */}
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Suggestions:</span>
                  {SUGGESTED_TECH.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddTechTag(s)}
                      disabled={ideaForm.technologies.includes(s)}
                      className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] rounded-xs hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                {/* Selected Tags */}
                {ideaForm.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 p-2.5 bg-slate-50 rounded-xs border border-slate-200">
                    {ideaForm.technologies.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-white border border-slate-300 text-slate-800 text-[11px] font-bold rounded-xs flex items-center gap-1.5"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTechTag(t)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Problem Statement */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Problem Statement &amp; Research Scope *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain the background problem, challenges, and objectives of the project..."
                  value={ideaForm.problem_statement}
                  onChange={(e) => setIdeaForm({ ...ideaForm, problem_statement: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-sm p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#B81D24] leading-relaxed"
                />
              </div>

              {/* Novelty */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Innovation &amp; Novelty Quotient
                </label>
                <textarea
                  rows={2}
                  placeholder="What makes this idea original, competitive, or practically impactful?"
                  value={ideaForm.novelty}
                  onChange={(e) => setIdeaForm({ ...ideaForm, novelty: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-sm p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#B81D24] leading-relaxed"
                />
              </div>

              {/* Supporting Document Upload */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Supporting Specification Document / PPT Format (Optional)
                </label>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {ideaForm.supporting_doc_url ? (
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Attached: {ideaForm.supporting_doc_name}</span>
                        <a
                          href={ideaForm.supporting_doc_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-normal text-[11px]"
                        >
                          (Preview)
                        </a>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-xs">
                        Attach project architecture diagrams, SRS template, or PPT format.
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">
                      Supported: PDF, PPT, PPTX, DOC, DOCX, ZIP (Max 30MB)
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-sm border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>{isUploadingDoc ? 'Uploading...' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.txt"
                        disabled={isUploadingDoc}
                        onChange={handleSupportingDocUpload}
                        className="hidden"
                      />
                    </label>
                    {ideaForm.supporting_doc_url && (
                      <button
                        type="button"
                        onClick={() => setIdeaForm((prev) => ({ ...prev, supporting_doc_url: '', supporting_doc_name: '' }))}
                        className="px-2 py-1 text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostIdeaModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-sm hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIdea}
                  className="px-5 py-2 bg-[#B81D24] hover:bg-[#99151B] text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm cursor-pointer disabled:bg-slate-400 flex items-center gap-2"
                >
                  {isSubmittingIdea ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing Idea...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Publish to Idea Pool</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DEEP DOSSIER INSPECTION */}
      {selectedGroupDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-slate-300 border-t-4 border-t-[#B81D24] shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-blue-50 text-[#1A4DBE] border border-blue-200 text-[10px] font-extrabold uppercase rounded-xs">
                    {selectedGroupDossier.category || 'PROJECT'}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {selectedGroupDossier.session_year || '2026-27'} [{selectedGroupDossier.session_term || 'ODD'}]
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedGroupDossier.name} — Project Dossier
                </h3>
                <p className="text-xs text-slate-500">
                  Track: {selectedGroupDossier.track_title} ({selectedGroupDossier.target_program} Sem-{selectedGroupDossier.target_semester})
                </p>
              </div>
              <button
                onClick={() => setSelectedGroupDossier(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Team Roster */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Student Team Members ({selectedGroupDossier.members?.length || 0})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedGroupDossier.members?.map((m) => (
                  <div key={m.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                      {m.full_name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{m.full_name}</span>
                        {m.member_role === 'LEADER' && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[8px] font-black rounded-xs">
                            LEADER
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Roll: {m.university_id} • {m.program} Sem-{m.semester}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables Dossier Links */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                Submitted Deliverables &amp; Artifacts
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Synopsis */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                  <span className="font-bold text-slate-700 block">1. Synopsis Document (PDF)</span>
                  {selectedGroupDossier.submission?.synopsis_url ? (
                    <a
                      href={selectedGroupDossier.submission.synopsis_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download / Inspect Synopsis</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not submitted yet</span>
                  )}
                </div>

                {/* PPT */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                  <span className="font-bold text-slate-700 block">2. Presentation Deck (PPT)</span>
                  {selectedGroupDossier.submission?.ppt_url ? (
                    <a
                      href={selectedGroupDossier.submission.ppt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      <Presentation className="w-3.5 h-3.5 text-blue-600" />
                      <span>Download / Inspect Presentation</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not submitted yet</span>
                  )}
                </div>

                {/* Report */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                  <span className="font-bold text-slate-700 block">3. Final Project Report</span>
                  {selectedGroupDossier.submission?.report_url ? (
                    <a
                      href={selectedGroupDossier.submission.report_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-700 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      <span>Download / Inspect Report</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not submitted yet</span>
                  )}
                </div>

                {/* GitHub */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xs space-y-1">
                  <span className="font-bold text-slate-700 block">4. GitHub Code Repository</span>
                  {selectedGroupDossier.submission?.github_repo_url ? (
                    <a
                      href={selectedGroupDossier.submission.github_repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-900 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Open GitHub Repository</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No repository linked</span>
                  )}
                </div>

                {/* Live Demo */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xs space-y-1 sm:col-span-2">
                  <span className="font-bold text-slate-700 block">5. Live Production / Demo URL</span>
                  {selectedGroupDossier.submission?.live_demo_url ? (
                    <a
                      href={selectedGroupDossier.submission.live_demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Open Live Working Application</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No live demo URL provided</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedGroupDossier(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-sm hover:bg-slate-800 cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

