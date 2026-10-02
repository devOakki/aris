'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FolderGit2, Layers, LogOut, Users, CheckCircle,
  Download, ExternalLink, Upload, AlertCircle,
  ChevronRight, Code2, X, Menu, ChevronLeft, BookOpen,
  Plus, UserPlus, FolderOpen, ArrowLeft,
  Search, Send, Paperclip, Lightbulb, BookMarked,
  Check, Sparkles, Lock, FileText,
  Clock, Ban,
} from 'lucide-react';

// ─── TECH SUGGESTIONS ─────────────────────────────────────────────────
const TECH_SUGGESTIONS = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express.js',
  'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel',
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'PHP', 'Go', 'Rust',
  'PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Redis', 'Firebase',
  'TensorFlow', 'PyTorch', 'scikit-learn', 'OpenCV', 'Keras',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Android',
  'Arduino', 'Raspberry Pi', 'MQTT', 'IoT', 'Blockchain', 'Web3',
  'Tailwind CSS', 'Bootstrap', 'Material UI',
];

// ─── TYPES ────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  university_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: string;
  department: string;
  avatar_url?: string;
  student_profile?: {
    id: number;
    program: string;
    department: string;
    semester: number;
  };
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
  joined_at: string;
}

export interface ProposalData {
  id: string;
  group: string;
  group_name: string;
  proposal_type: string;
  project_idea?: string;
  supervisor?: number;
  supervisor_id?: number;
  supervisor_name?: string;
  supervisor_details?: SupervisorDetails | null;
  title: string;
  problem_statement: string;
  novelty: string;
  solution?: string;
  domain: string;
  technologies: string[];
  supporting_doc_url?: string;
  supporting_doc_name?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  version: number;
  supervisor_feedback: string;
  decided_at?: string;
  created_at: string;
}

export interface SubmissionData {
  id: string;
  synopsis_url?: string;
  synopsis_submitted_at?: string;
  ppt_url?: string;
  ppt_submitted_at?: string;
  report_url?: string;
  report_submitted_at?: string;
  github_repo_url?: string;
  media_urls?: string[];
  all_completed_at?: string;
}

export interface SupervisorDetails {
  id: string | number;
  full_name: string;
  email: string;
  avatar_url?: string;
  designation: string;
  department: string;
  expertise_domains?: string[];
  expertise_tech?: string[];
  is_accepting?: boolean;
}

export interface GroupJoinRequestData {
  id: string;
  group: string;
  student: string;
  student_id: string;
  university_id: string;
  student_name: string;
  full_name: string;
  email: string;
  program: string;
  semester: number;
  avatar_url?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  message?: string;
  created_at: string;
  updated_at?: string;
}

export interface StudentGroupData {
  id: string;
  name: string;
  track: string;
  track_id: string;
  track_title: string;
  max_group_size?: number;
  category: string;
  department: string;
  target_program: string;
  target_semester: number;
  session_year: string;
  session_term: string;
  supervisor: number | string;
  supervisor_name: string;
  supervisor_details?: SupervisorDetails | null;
  created_by: string;
  created_by_name: string;
  status: string;
  members: GroupMemberData[];
  latest_proposal?: ProposalData | null;
  submission?: SubmissionData | null;
  join_requests?: GroupJoinRequestData[];
  my_join_request?: {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface TrackDeadlineData {
  id: string;
  track: string;
  deadline_type: 'SYNOPSIS' | 'PPT' | 'REPORT' | 'GITHUB' | string;
  title: string;
  due_date: string;
  template_url: string;
  template_filename: string;
  instructions: string;
  font_family?: string;
  typography?: string;
  spacing_alignment?: string;
  page_margins?: string;
  page_limit?: string;
  file_format?: string;
  late_submission_allowed: boolean;
  is_passed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectTrackOption {
  id: string;
  title: string;
  category: string;
  target_program: string;
  target_semester: number;
  max_group_size: number;
  max_groups_per_supervisor?: number;
  is_active: boolean;
  required_deliverables?: string[];
  deadlines?: TrackDeadlineData[];
}

export interface SupervisorMarketplaceItem {
  id: number;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  avatar_url?: string;
  is_accepting: boolean;
  is_quota_full?: boolean;
  available_slots?: number;
  max_groups?: number;
  active_groups?: number;
  expertise_domains?: string[];
  expertise_tech?: string[];
}

export interface ProjectIdeaData {
  id: string;
  supervisor: number | string;
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
  created_at: string;
}

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'tracks', label: 'My Tracks', icon: FolderGit2 },
  { key: 'deliverables', label: 'Formats', icon: FileText },
];

// ─── AVATAR COMPONENT ─────────────────────────────────────────────────
function Avatar({ url, name, size = 8 }: { url?: string; name?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const pxSize = size * 4;
  if (url && !err) {
    return (
      <img
        src={url}
        alt={name || ''}
        style={{ width: `${pxSize}px`, height: `${pxSize}px` }}
        className="rounded-full border border-slate-200 overflow-hidden bg-slate-100 object-cover shrink-0"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      style={{ width: `${pxSize}px`, height: `${pxSize}px`, fontSize: `${Math.max(10, size * 2.2)}px` }}
      className="rounded-full border border-slate-200 overflow-hidden bg-[#B81D24] text-white flex items-center justify-center font-black shrink-0"
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ─── SECTION WRAPPER ──────────────────────────────────────────────────
function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="px-3.5 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-600">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── JOIN REQUESTS MODAL ──────────────────────────────────────────────
function JoinRequestsModal({
  open,
  onClose,
  requests,
  onRespond,
  respondingId,
  isGroupFull,
  currentMembers,
  maxMembers,
}: {
  open: boolean;
  onClose: () => void;
  requests: GroupJoinRequestData[];
  onRespond: (requestId: string, action: 'ACCEPT' | 'REJECT') => void;
  respondingId: string | null;
  isGroupFull: boolean;
  currentMembers: number;
  maxMembers: number;
}) {
  if (!open) return null;

  return (
    <Modal onClose={onClose} title="Group Join Requests" wide>
      <div className="space-y-4">
        {/* Capacity status banner */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs gap-3">
          <div>
            <p className="font-bold text-slate-800">
              Team Capacity: <span className="font-mono text-slate-900">{currentMembers} / {maxMembers}</span> members
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isGroupFull
                ? 'Group has reached maximum size set by HOD. No additional members can be accepted.'
                : `${maxMembers - currentMembers} open slot${maxMembers - currentMembers > 1 ? 's' : ''} available.`}
            </p>
          </div>
          {isGroupFull ? (
            <span className="px-2.5 py-1 bg-red-100 text-[#B81D24] text-[10px] font-black uppercase rounded-full shrink-0">
              Full
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full shrink-0">
              Open Slots
            </span>
          )}
        </div>

        {/* Requests list */}
        {requests.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <Users className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No pending join requests</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              When eligible students request to join your team, their requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {requests.map((req) => {
              const name = req.full_name || req.student_name || 'Student';
              const id = req.university_id || req.student_id || '';
              const isProcessing = respondingId === req.id;

              return (
                <div
                  key={req.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar url={req.avatar_url} name={name} size={10} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-black text-slate-900">{name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">({id})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {req.program} · Semester {req.semester}
                        </p>
                        <p className="text-[10px] text-blue-600 font-mono">{req.email}</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(req.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {req.message && (
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 italic">
                      "{req.message}"
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onRespond(req.id, 'REJECT')}
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-3 py-2 sm:py-1.5 text-xs font-bold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 text-center"
                    >
                      {isProcessing ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => onRespond(req.id, 'ACCEPT')}
                      disabled={isProcessing || isGroupFull}
                      title={isGroupFull ? 'Group is already at maximum capacity' : 'Accept member into group'}
                      className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 bg-[#B81D24] hover:bg-[#9E181E] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Accept & Add to Team
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── MODAL SHELL ──────────────────────────────────────────────────────
function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col ${
          wide ? 'w-full max-w-lg' : 'w-full max-w-sm'
        }`}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3.5 sm:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────
function UploadModal({
  open,
  type,
  file,
  onFileChange,
  onClose,
  onSubmit,
  uploading,
}: {
  open: boolean;
  type: string;
  file: File | null;
  onFileChange: (f: File | null) => void;
  onClose: () => void;
  onSubmit: () => void;
  uploading: boolean;
}) {
  if (!open) return null;
  const isPpt = type === 'PPT';
  const acceptedTypes = isPpt ? '.ppt,.pptx,.pdf' : '.pdf';
  const typeHint = isPpt ? 'PPT, PPTX, or PDF up to 25MB' : 'PDF document up to 20MB';

  return (
    <Modal title={`Upload ${type}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#B81D24]/40 transition-colors">
          <Upload className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <label className="cursor-pointer text-xs font-bold text-[#B81D24] hover:underline">
            Choose Document File
            <input
              type="file"
              className="hidden"
              accept={acceptedTypes}
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
          </label>
          <p className="text-[10px] text-slate-400 mt-1">{typeHint}</p>
          {file && (
            <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-left flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-700 truncate">{file.name}</span>
              <span className="text-[9px] text-slate-400 shrink-0 ml-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!file || uploading}
            className="flex-1 py-2 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
          >
            {uploading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              'Submit Deliverable'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── LINK MODAL ───────────────────────────────────────────────────────
function LinkModal({
  open,
  value,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (!open) return null;
  return (
    <Modal title="GitHub Repository URL" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-[11px] text-slate-500">Provide the public repository link for your project source code.</p>
        <input
          type="url"
          placeholder="https://github.com/organization/repo"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#B81D24]"
        />
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !value.trim()}
            className="flex-1 py-2 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            {saving ? 'Saving...' : 'Save Link'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── PROPOSAL SUBMISSION FULL PAGE COMPONENT ──────────────────────────
function ProposalSubmissionPage({
  mode,
  selectedIdea,
  supervisors,
  supervisorsLoading,
  selectedSupervisorId,
  onSelectSupervisor,
  form,
  setForm,
  techInput,
  setTechInput,
  techSuggestions,
  setTechSuggestions,
  proposeFile,
  setProposeFile,
  existingDocUrl,
  existingDocName,
  onBack,
  onSubmit,
  submitting,
}: {
  mode: 'custom' | 'pool';
  selectedIdea: ProjectIdeaData | null;
  supervisors: SupervisorMarketplaceItem[];
  supervisorsLoading: boolean;
  selectedSupervisorId: number | null;
  onSelectSupervisor: (id: number) => void;
  form: {
    title: string;
    problem_statement: string;
    solution: string;
    novelty: string;
    domain: string;
    technologies: string[];
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      title: string;
      problem_statement: string;
      solution: string;
      novelty: string;
      domain: string;
      technologies: string[];
    }>
  >;
  techInput: string;
  setTechInput: (v: string) => void;
  techSuggestions: string[];
  setTechSuggestions: (v: string[]) => void;
  proposeFile: File | null;
  setProposeFile: (f: File | null) => void;
  existingDocUrl?: string;
  existingDocName?: string;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [isChangingSupervisor, setIsChangingSupervisor] = useState(false);

  // Selected supervisor details
  const selectedSupervisor = useMemo(() => {
    if (!selectedSupervisorId) return null;
    return supervisors.find((s) => s.id === selectedSupervisorId) || null;
  }, [supervisors, selectedSupervisorId]);

  // Filtered supervisors for custom search
  const filteredSupervisors = useMemo(() => {
    const q = supervisorSearch.trim().toLowerCase();
    if (!q) return supervisors;
    return supervisors.filter((s) => {
      const matchName = s.full_name?.toLowerCase().includes(q);
      const matchDept = s.department?.toLowerCase().includes(q);
      const matchDomains = (s.expertise_domains || []).some((d) => d.toLowerCase().includes(q));
      const matchTech = (s.expertise_tech || []).some((t) => t.toLowerCase().includes(q));
      return matchName || matchDept || matchDomains || matchTech;
    });
  }, [supervisors, supervisorSearch]);

  const handleTechInput = (val: string) => {
    setTechInput(val);
    if (val.trim().length > 0) {
      setTechSuggestions(
        TECH_SUGGESTIONS.filter(
          (t) => t.toLowerCase().includes(val.toLowerCase()) && !form.technologies.includes(t)
        ).slice(0, 8)
      );
    } else {
      setTechSuggestions([]);
    }
  };

  const addTech = (t: string) => {
    if (!form.technologies.includes(t)) {
      setForm((prev) => ({ ...prev, technologies: [...prev.technologies, t] }));
    }
    setTechInput('');
    setTechSuggestions([]);
  };

  const removeTech = (t: string) => {
    setForm((prev) => ({ ...prev, technologies: prev.technologies.filter((x) => x !== t) }));
  };

  const domainPills = [
    'AI & Machine Learning',
    'Web & Cloud Systems',
    'Cyber Security',
    'Mobile Application Development',
    'IoT & Smart Systems',
    'Data Science & Analytics',
    'Blockchain & Decentralized Tech',
  ];

  return (
    <div className="flex-1 p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full">
      {/* Top Breadcrumb & Action */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#B81D24] cursor-pointer transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:border-[#B81D24] w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          Back to Project Overview
        </button>
      </div>

      {/* Page Title & Context Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          {mode === 'pool' ? 'Submit Proposal for Idea Pool' : 'Propose New Project Idea'}
        </h2>
        <p className="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed">
          {mode === 'pool'
            ? 'You are adopting this project idea proposed by faculty. Provide your proposed technical architecture, solution approach, and team implementation plan.'
            : 'Formulate your group project idea, choose the most suitable faculty mentor based on their research domains, and submit for approval.'}
        </p>
      </div>

      {/* ── SECTION 1: FACULTY SUPERVISOR SELECTION ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 flex-wrap">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              Faculty Supervisor & Mentor <span className="text-red-500">*</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {mode === 'pool'
                ? 'Supervisor is locked to the faculty member who proposed this idea.'
                : 'Select the mentor whose domain expertise matches your project scope.'}
            </p>
          </div>
          {mode === 'pool' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Pre-assigned Mentor (Locked)
            </span>
          )}
        </div>

        {/* In Pool Mode: Locked Supervisor View */}
        {mode === 'pool' ? (
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200">
            {selectedSupervisor ? (
              <div className="flex items-start gap-4">
                <Avatar url={selectedSupervisor.avatar_url} name={selectedSupervisor.full_name} size={12} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-slate-900">{selectedSupervisor.full_name}</p>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                      Idea Proposer
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {selectedSupervisor.designation} · {selectedSupervisor.department}
                  </p>
                  <p className="text-[11px] text-blue-600 font-mono mt-0.5">{selectedSupervisor.email}</p>

                  {selectedSupervisor.expertise_domains && selectedSupervisor.expertise_domains.length > 0 && (
                    <div className="mt-2.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                        Domain Expertise
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedSupervisor.expertise_domains.map((d) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 bg-white text-slate-700 text-[10px] font-semibold rounded border border-slate-200"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSupervisor.expertise_tech && selectedSupervisor.expertise_tech.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                        Technologies
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedSupervisor.expertise_tech.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-slate-200/70 text-slate-700 text-[9px] font-mono rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedIdea ? (
              <div className="flex items-start gap-4">
                <Avatar url={selectedIdea.supervisor_avatar} name={selectedIdea.supervisor_name} size={12} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-slate-900">{selectedIdea.supervisor_name}</p>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                      Idea Proposer
                    </span>
                  </div>
                  {selectedIdea.supervisor_designation && (
                    <p className="text-xs text-slate-600 mt-0.5">{selectedIdea.supervisor_designation}</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* In Custom Mode: Interactive Selector with Search & Full Details */
          <div>
            {selectedSupervisor && !isChangingSupervisor ? (
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 min-w-0">
                  <Avatar url={selectedSupervisor.avatar_url} name={selectedSupervisor.full_name} size={12} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-900">{selectedSupervisor.full_name}</p>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected Mentor
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {selectedSupervisor.designation} · {selectedSupervisor.department}
                    </p>
                    <p className="text-[11px] text-blue-600 font-mono mt-0.5">{selectedSupervisor.email}</p>

                    {selectedSupervisor.expertise_domains && selectedSupervisor.expertise_domains.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedSupervisor.expertise_domains.map((d) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 bg-white text-slate-700 text-[9px] font-bold rounded border border-emerald-200"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}

                    {selectedSupervisor.expertise_tech && selectedSupervisor.expertise_tech.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {selectedSupervisor.expertise_tech.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 bg-emerald-100/60 text-emerald-800 text-[9px] font-mono rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChangingSupervisor(true)}
                  className="px-3.5 py-1.5 border border-emerald-300 hover:bg-emerald-100/80 text-emerald-900 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Change Mentor
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={supervisorSearch}
                    onChange={(e) => setSupervisorSearch(e.target.value)}
                    placeholder="Search faculty by name, department, domain, or technology..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#B81D24] focus:bg-white transition-all"
                  />
                  {supervisorSearch && (
                    <button
                      onClick={() => setSupervisorSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {supervisorsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-[3px] border-slate-200 border-t-[#B81D24] rounded-full animate-spin" />
                  </div>
                ) : filteredSupervisors.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-600">No matching faculty supervisors found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different keyword</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {filteredSupervisors.map((s) => {
                      const isSelected = selectedSupervisorId === s.id;
                      const maxGroups = s.max_groups || 10;
                      const activeGroups = s.active_groups || 0;
                      const isQuotaFull = s.is_quota_full || (s.available_slots !== undefined && s.available_slots <= 0) || (activeGroups >= maxGroups) || !s.is_accepting;

                      return (
                        <div
                          key={s.id}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'bg-red-50/50 border-[#B81D24] shadow-xs'
                              : isQuotaFull
                              ? 'bg-slate-50/60 border-slate-200 opacity-80'
                              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar url={s.avatar_url} name={s.full_name} size={10} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <p className="text-xs font-black text-slate-900 truncate">{s.full_name}</p>
                                {isQuotaFull ? (
                                  <span className="px-2 py-0.5 bg-red-100 text-[#B81D24] text-[9px] font-black uppercase rounded-full">
                                    Quota Full ({activeGroups}/{maxGroups})
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">
                                    Available ({activeGroups}/{maxGroups})
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                {s.designation} · {s.department}
                              </p>
                              <p className="text-[10px] text-blue-600 font-mono truncate">{s.email}</p>

                              {s.expertise_domains && s.expertise_domains.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {s.expertise_domains.slice(0, 3).map((d) => (
                                    <span
                                      key={d}
                                      className="px-1.5 py-0.5 bg-white text-slate-600 text-[8px] font-bold rounded border border-slate-200 truncate max-w-[130px]"
                                    >
                                      {d}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {s.expertise_tech && s.expertise_tech.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {s.expertise_tech.slice(0, 4).map((t) => (
                                    <span
                                      key={t}
                                      className="px-1.5 py-0.2 bg-slate-200/70 text-slate-700 text-[8px] font-mono rounded"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-end pt-2.5 border-t border-slate-200/60 mt-auto">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isQuotaFull) {
                                  onSelectSupervisor(s.id);
                                  setIsChangingSupervisor(false);
                                }
                              }}
                              disabled={isQuotaFull}
                              title={isQuotaFull ? 'This mentor has reached maximum group quota' : 'Choose this supervisor'}
                              className={`w-full sm:w-auto px-4 py-1.5 text-xs font-bold rounded-lg transition-colors text-center ${
                                isQuotaFull
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-[#B81D24] text-white'
                                  : 'bg-white border border-slate-300 hover:border-[#B81D24] hover:text-[#B81D24] text-slate-700 cursor-pointer'
                              }`}
                            >
                              {isQuotaFull ? 'Quota Full' : isSelected ? 'Selected' : 'Select Mentor'}
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
      </div>

      {/* ── SECTION 2: PROJECT TITLE & DOMAIN ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
          Project Information
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. AI-Driven Smart Traffic Monitoring and Emergency Vehicle Routing"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#B81D24] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Domain / Category
          </label>
          <input
            type="text"
            value={form.domain}
            onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))}
            placeholder="e.g. AI & Machine Learning, Web Systems, IoT..."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#B81D24] focus:bg-white transition-all"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {domainPills.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, domain: d }))}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  form.domain === d
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Problem Statement <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-slate-500 mb-1.5">
            Clearly explain the real-world problem or inefficiency this project intends to address.
          </p>
          <textarea
            value={form.problem_statement}
            onChange={(e) => setForm((prev) => ({ ...prev, problem_statement: e.target.value }))}
            placeholder="Describe the challenge, target beneficiaries, and shortcomings of current systems..."
            rows={4}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:border-[#B81D24] focus:bg-white transition-all resize-y leading-relaxed"
          />
        </div>
      </div>

      {/* ── SECTION 3: PROPOSED SOLUTION & ARCHITECTURE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
          Technical Approach & Solution
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Proposed Solution & Technical Approach <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-slate-500 mb-1.5">
            Describe how your team intends to solve the problem: architectural diagram summary, algorithms, pipeline,
            and expected deliverables.
          </p>
          <textarea
            value={form.solution}
            onChange={(e) => setForm((prev) => ({ ...prev, solution: e.target.value }))}
            placeholder="Outline your planned system architecture, workflow, data sources, core modules, and implementation methodology..."
            rows={5}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:border-[#B81D24] focus:bg-white transition-all resize-y leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Novelty / Key Innovations
          </label>
          <p className="text-[11px] text-slate-500 mb-1.5">
            What makes your approach innovative, distinct, or superior compared to existing tools?
          </p>
          <textarea
            value={form.novelty}
            onChange={(e) => setForm((prev) => ({ ...prev, novelty: e.target.value }))}
            placeholder="Highlight unique features, proprietary dataset, integration of specialized models, or cost advantages..."
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:border-[#B81D24] focus:bg-white transition-all resize-y leading-relaxed"
          />
        </div>

        {/* Tech Stack Chips & Autocomplete */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Technologies & Frameworks
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.technologies.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 text-[11px] font-bold rounded-lg border border-blue-200"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTech(t)}
                  className="cursor-pointer text-blue-600 hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="relative">
            <input
              value={techInput}
              onChange={(e) => handleTechInput(e.target.value)}
              placeholder="Search or type a technology (e.g. React, PyTorch, Docker, PostgreSQL)..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#B81D24] focus:bg-white transition-all"
            />
            {techSuggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {techSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addTech(s)}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 cursor-pointer text-slate-800 font-semibold border-b border-slate-50 last:border-0"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Supporting Document Attachment */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Supporting Document (Optional)
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            Attach your project synopsis draft, flow diagram, or technical paper in PDF or DOCX format (up to 30MB).
          </p>

          {existingDocUrl && !proposeFile && (
            <div className="mb-2 p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-blue-900 truncate">
                  {existingDocName || 'Attached Idea Specification Document'}
                </span>
              </div>
              <a
                href={existingDocUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-700 font-bold hover:underline shrink-0"
              >
                View File
              </a>
            </div>
          )}

          {proposeFile ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-900 truncate">{proposeFile.name}</span>
                <span className="text-[10px] text-emerald-700 font-mono shrink-0">
                  ({(proposeFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProposeFile(null)}
                className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 hover:border-[#B81D24]/50 rounded-xl p-5 text-center transition-colors">
              <label className="cursor-pointer text-xs font-bold text-[#B81D24] hover:underline flex flex-col items-center justify-center gap-1.5">
                <Paperclip className="w-5 h-5 text-slate-400" />
                <span>Upload PDF or DOCX synopsis/draft</span>
                <span className="text-[10px] text-slate-400 font-normal">Click to browse from your device</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setProposeFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-3.5 sm:p-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 sticky bottom-2 sm:bottom-4 z-10">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-2.5 text-slate-600 text-xs font-bold hover:bg-slate-100 rounded-xl cursor-pointer transition-colors text-center"
        >
          Cancel & Return
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={
            submitting ||
            !selectedSupervisorId ||
            !form.title.trim() ||
            !form.problem_statement.trim() ||
            !form.solution.trim()
          }
          className="w-full sm:w-auto justify-center px-6 py-2.5 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs md:text-sm font-bold rounded-xl cursor-pointer flex items-center gap-2 transition-colors shadow-sm"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting Proposal...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Proposal to Faculty Mentor
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── SIDEBAR SHELL ────────────────────────────────────────────────────
function SidebarShell({
  sidebarOpen,
  setSidebarOpen,
  user,
  activeTab,
  setActiveTab,
  deliverablesProgress,
  handleLogout,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  user: UserProfile | null;
  activeTab: string;
  setActiveTab: (t: string) => void;
  deliverablesProgress: { completed: number; total: number };
  handleLogout: () => void;
}) {
  const [avatarErr, setAvatarErr] = useState(false);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center transition-all duration-150 cursor-pointer group ${
                    sidebarOpen ? 'px-4 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'
                  } ${
                    isActive
                      ? 'bg-red-50 text-[#B81D24] border-r-3 border-[#B81D24] font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#B81D24]' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {sidebarOpen && (
                    <span className="text-[12px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Details (Name, ERP, Sign Out)  */}
        <div className={`border-t border-slate-100 py-3.5 bg-slate-50/60 shrink-0 ${sidebarOpen ? 'px-4 space-y-2.5' : 'px-0 py-3 flex flex-col items-center gap-2'}`}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                  {user?.avatar_url && !avatarErr ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setAvatarErr(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#B81D24] text-white flex items-center justify-center text-xs font-black">
                      {user?.first_name?.[0] || 'S'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || 'Student'}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{user?.university_id}</p>
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
              <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100">
                {user?.avatar_url && !avatarErr ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setAvatarErr(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#B81D24] text-white flex items-center justify-center text-xs font-black">
                    {user?.first_name?.[0] || 'S'}
                  </div>
                )}
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
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>
      </aside>
    </>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────
export default function StudentDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tracks' | 'deliverables'>('tracks');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  const [group, setGroup] = useState<StudentGroupData | null>(null);
  const [deadlines, setDeadlines] = useState<TrackDeadlineData[]>([]);
  const [availableTracks, setAvailableTracks] = useState<ProjectTrackOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Track detail view — null means tracks list, string = viewing track id
  const [viewingTrackId, setViewingTrackId] = useState<string | null>(null);

  // Existing groups for join flow
  const [trackGroups, setTrackGroups] = useState<StudentGroupData[]>([]);
  const [trackGroupsLoading, setTrackGroupsLoading] = useState(false);

  // Modals
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isJoinListOpen, setIsJoinListOpen] = useState(false);
  const [isJoinRequestsModalOpen, setIsJoinRequestsModalOpen] = useState(false);
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [pendingJoinTrackId, setPendingJoinTrackId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  // Supervisor marketplace
  const [supervisors, setSupervisors] = useState<SupervisorMarketplaceItem[]>([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(false);

  // Deliverable upload / link modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDeliverableType, setSelectedDeliverableType] = useState<'SYNOPSIS' | 'PPT' | 'REPORT'>('SYNOPSIS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);

  // Idea pool
  const [showIdeaPool, setShowIdeaPool] = useState(false);
  const [ideas, setIdeas] = useState<ProjectIdeaData[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideaSearch, setIdeaSearch] = useState('');
  const [ideaSort, setIdeaSort] = useState<'newest' | 'oldest' | 'faculty'>('newest');
  const [ideaFilterFaculty, setIdeaFilterFaculty] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<ProjectIdeaData | null>(null);

  // Proposal Submission View (Full Page)
  const [proposalMode, setProposalMode] = useState<'custom' | 'pool' | null>(null);
  const [proposalSupervisorId, setProposalSupervisorId] = useState<number | null>(null);
  const [proposalForm, setProposalForm] = useState({
    title: '',
    problem_statement: '',
    solution: '',
    novelty: '',
    domain: '',
    technologies: [] as string[],
  });
  const [proposalTechInput, setProposalTechInput] = useState('');
  const [proposalTechSuggestions, setProposalTechSuggestions] = useState<string[]>([]);
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState('');
  const [uploadedDocName, setUploadedDocName] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── COMPUTED ───────────────────────────────────────────────────
  const deliverablesProgress = useMemo(() => {
    if (!group?.submission) return { completed: 0, total: 4 };
    let c = 0;
    if (group.submission.synopsis_url) c++;
    if (group.submission.ppt_url) c++;
    if (group.submission.report_url) c++;
    if (group.submission.github_repo_url) c++;
    return { completed: c, total: 4 };
  }, [group]);

  const isLeader = useMemo(() => {
    if (!user || !group) return false;
    return (
      group.members?.find((m) => m.university_id === user.university_id || m.email === user.email)?.member_role ===
      'LEADER'
    );
  }, [user, group]);

  const myTrack = useMemo(
    () => availableTracks.find((t) => t.id === group?.track_id || t.id === group?.track) || null,
    [availableTracks, group]
  );

  const maxGroupCapacity = useMemo(() => {
    return group?.max_group_size || myTrack?.max_group_size || 4;
  }, [group, myTrack]);

  const isGroupFull = useMemo(() => {
    return (group?.members?.length || 0) >= maxGroupCapacity;
  }, [group, maxGroupCapacity]);

  const pendingJoinRequests = useMemo(() => {
    return group?.join_requests || [];
  }, [group]);

  const filteredIdeas = useMemo(() => {
    let list = [...ideas];
    if (ideaSearch) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(ideaSearch.toLowerCase()) ||
          i.supervisor_name.toLowerCase().includes(ideaSearch.toLowerCase()) ||
          i.domain.toLowerCase().includes(ideaSearch.toLowerCase())
      );
    }
    if (ideaFilterFaculty) {
      list = list.filter((i) => i.supervisor_name === ideaFilterFaculty);
    }
    if (ideaSort === 'newest') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (ideaSort === 'oldest') {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      list.sort((a, b) => a.supervisor_name.localeCompare(b.supervisor_name));
    }
    return list;
  }, [ideas, ideaSearch, ideaSort, ideaFilterFaculty]);

  const uniqueFaculties = useMemo(() => [...new Set(ideas.map((i) => i.supervisor_name))].sort(), [ideas]);

  // ─── DATA LOAD ──────────────────────────────────────────────────
  const API = 'http://127.0.0.1:8000';
  const tok = useCallback(() => localStorage.getItem('access_token') || '', []);

  const loadAllData = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const [groupRes, trackRes] = await Promise.all([
        fetch(`${API}/api/projects/groups/my-group/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/projects/tracks/?eligible_only=true`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      let currentGroup: StudentGroupData | null = null;
      if (groupRes.ok) {
        currentGroup = await groupRes.json();
        setGroup(currentGroup);
      } else if (groupRes.status === 404) {
        setGroup(null);
      }

      let trList: ProjectTrackOption[] = [];
      if (trackRes.ok) {
        trList = await trackRes.json();
        setAvailableTracks(trList);
      }

      const trackId = currentGroup?.track_id || currentGroup?.track || (trList.length > 0 ? trList[0].id : null);
      if (trackId) {
        const dlRes = await fetch(`${API}/api/projects/tracks/${trackId}/deadlines/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (dlRes.ok) {
          setDeadlines(await dlRes.json());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrackGroups = useCallback(
    async (trackId: string) => {
      setTrackGroupsLoading(true);
      try {
        const res = await fetch(`${API}/api/projects/tracks/${trackId}/groups/`, {
          headers: { Authorization: `Bearer ${tok()}` },
        });
        if (res.ok) {
          setTrackGroups(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setTrackGroupsLoading(false);
      }
    },
    [tok]
  );

  const loadSupervisors = useCallback(
    async (trackIdParam?: string) => {
      setSupervisorsLoading(true);
      try {
        const activeTrackId = trackIdParam || group?.track_id || (group?.track as string) || viewingTrackId;
        const url = activeTrackId
          ? `${API}/api/accounts/supervisors/?track_id=${activeTrackId}`
          : `${API}/api/accounts/supervisors/`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${tok()}` },
        });
        if (res.ok) {
          setSupervisors(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSupervisorsLoading(false);
      }
    },
    [tok, group?.track_id, group?.track, viewingTrackId]
  );

  const loadIdeas = useCallback(async () => {
    setIdeasLoading(true);
    try {
      const res = await fetch(`${API}/api/projects/ideas/?available_only=true`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (res.ok) {
        setIdeas(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIdeasLoading(false);
    }
  }, [tok]);

  // Auth bootstrap
  useEffect(() => {
    const raw = localStorage.getItem('aris_user') || localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (!raw || !token) {
      router.push('/');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed.role !== 'STUDENT') {
        router.push('/');
        return;
      }
      queueMicrotask(() => {
        setUser(parsed);
        setIsAuthorized(true);
        loadAllData(token);
      });

      // Also refresh full user details from backend to ensure student_profile is current
      fetch(`${API}/api/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((freshUser) => {
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('aris_user', JSON.stringify(freshUser));
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        })
        .catch(() => {});
    } catch {
      router.push('/');
    }
  }, [router, loadAllData, API]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  // ─── ACTION HANDLERS ─────────────────────────────────────────────
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !pendingJoinTrackId) return;
    setIsCreatingGroup(true);
    try {
      const res = await fetch(`${API}/api/projects/groups/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim(), track_id: pendingJoinTrackId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || JSON.stringify(data) });
        return;
      }
      setActionMessage({ type: 'success', text: `Group "${data.name}" created successfully!` });
      setIsCreateGroupModalOpen(false);
      setIsJoinListOpen(false);
      setNewGroupName('');
      setViewingTrackId(pendingJoinTrackId);
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Network error creating group.' });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroupId(groupId);
    try {
      const res = await fetch(`${API}/api/projects/groups/${groupId}/request-join/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || JSON.stringify(data) });
        return;
      }
      setActionMessage({
        type: 'success',
        text: data.detail || 'Join request sent to the team leader! You will be added once approved.',
      });
      if (pendingJoinTrackId) {
        await loadTrackGroups(pendingJoinTrackId);
      }
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Network error sending join request.' });
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleCancelJoinRequest = async (groupId: string, requestId: string) => {
    setCancellingRequestId(requestId);
    try {
      const res = await fetch(`${API}/api/projects/groups/${groupId}/join-requests/${requestId}/cancel/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || JSON.stringify(data) });
        return;
      }
      setActionMessage({ type: 'success', text: 'Join request cancelled successfully.' });
      if (pendingJoinTrackId) {
        await loadTrackGroups(pendingJoinTrackId);
      }
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Network error cancelling join request.' });
    } finally {
      setCancellingRequestId(null);
    }
  };

  const handleRespondJoinRequest = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    if (!group) return;
    setRespondingRequestId(requestId);
    try {
      const res = await fetch(`${API}/api/projects/groups/${group.id}/join-requests/${requestId}/respond/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tok()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || JSON.stringify(data) });
        return;
      }
      setActionMessage({
        type: 'success',
        text: data.detail || `Request ${action.toLowerCase()}ed successfully!`,
      });
      if (data.group) {
        setGroup(data.group);
      }
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Network error processing join request.' });
    } finally {
      setRespondingRequestId(null);
    }
  };



  const handleDeliverableUpload = async () => {
    if (!selectedFile || !group) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('deliverable_type', selectedDeliverableType);
      fd.append('auto_attach', 'true');
      const res = await fetch(`${API}/api/submissions/upload/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg =
          data.file?.[0] ||
          data.deliverable_type?.[0] ||
          data.detail ||
          (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Upload failed.');
        setActionMessage({ type: 'error', text: errorMsg });
        return;
      }
      setActionMessage({ type: 'success', text: `${selectedDeliverableType} uploaded successfully.` });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Upload failed due to network error.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveLink = async () => {
    if (!linkInputValue.trim() || !group) return;
    setIsSavingLink(true);
    let url = linkInputValue.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    try {
      const res = await fetch(`${API}/api/submissions/my-submission/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_repo_url: url }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg =
          data.github_repo_url?.[0] ||
          data.detail ||
          (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save link.');
        setActionMessage({ type: 'error', text: errorMsg });
        return;
      }
      setActionMessage({ type: 'success', text: 'GitHub repository linked successfully.' });
      setIsLinkModalOpen(false);
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to save GitHub link.' });
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleOpenCustomProposal = () => {
    setProposalMode('custom');
    setSelectedIdea(null);
    setProposalSupervisorId(null);
    setProposalForm({
      title: '',
      problem_statement: '',
      solution: '',
      novelty: '',
      domain: '',
      technologies: [],
    });
    setProposalTechInput('');
    setProposalTechSuggestions([]);
    setProposalFile(null);
    setUploadedDocUrl('');
    setUploadedDocName('');
    loadSupervisors();
  };

  const handleStartPoolProposal = (idea: ProjectIdeaData) => {
    setSelectedIdea(idea);
    setProposalMode('pool');
    setShowIdeaPool(false);
    const supId = typeof idea.supervisor === 'number' ? idea.supervisor : parseInt(String(idea.supervisor), 10);
    setProposalSupervisorId(!isNaN(supId) ? supId : null);
    setProposalForm({
      title: idea.title,
      problem_statement: idea.problem_statement,
      solution: '',
      novelty: idea.novelty || '',
      domain: idea.domain || '',
      technologies: [...(idea.technologies || [])],
    });
    setProposalTechInput('');
    setProposalTechSuggestions([]);
    setProposalFile(null);
    setUploadedDocUrl(idea.supporting_doc_url || '');
    setUploadedDocName(idea.supporting_doc_name || '');
    loadSupervisors();
  };

  const handleSubmitProposal = async () => {
    if (!group) return;
    if (!proposalForm.title.trim()) {
      setActionMessage({ type: 'error', text: 'Project title is required.' });
      return;
    }
    if (!proposalForm.problem_statement.trim()) {
      setActionMessage({ type: 'error', text: 'Problem statement is required.' });
      return;
    }
    if (!proposalForm.solution.trim()) {
      setActionMessage({ type: 'error', text: 'Proposed solution and technical approach is required.' });
      return;
    }
    if (!proposalSupervisorId) {
      setActionMessage({ type: 'error', text: 'Please select a faculty supervisor for your proposal.' });
      return;
    }

    setIsSubmittingProposal(true);
    try {
      let docUrl = uploadedDocUrl;
      let docName = uploadedDocName;

      // If user selected a supporting doc file, upload it
      if (proposalFile) {
        const fd = new FormData();
        fd.append('file', proposalFile);
        fd.append('deliverable_type', 'DOC');
        fd.append('auto_attach', 'false');
        try {
          const uploadRes = await fetch(`${API}/api/submissions/upload/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tok()}` },
            body: fd,
          });
          if (uploadRes.ok) {
            const upData = await uploadRes.json();
            docUrl = upData.secure_url || upData.url || '';
            docName = upData.file_name || proposalFile.name;
          }
        } catch (uploadErr) {
          console.warn('Doc upload network warning:', uploadErr);
        }
      }

      const res = await fetch(`${API}/api/projects/proposals/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: group.id,
          proposal_type: proposalMode === 'pool' ? 'FROM_LIST' : 'CUSTOM',
          project_idea: proposalMode === 'pool' && selectedIdea ? selectedIdea.id : null,
          supervisor_id: proposalSupervisorId,
          title: proposalForm.title.trim(),
          problem_statement: proposalForm.problem_statement.trim(),
          solution: proposalForm.solution.trim(),
          novelty: proposalForm.novelty.trim() || proposalForm.solution.trim(),
          domain: proposalForm.domain.trim(),
          technologies: proposalForm.technologies,
          supporting_doc_url: docUrl,
          supporting_doc_name: docName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail || (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Submission failed');
        setActionMessage({ type: 'error', text: msg });
        return;
      }

      const assignedSupervisor = supervisors.find((s) => s.id === proposalSupervisorId);
      const supName = assignedSupervisor ? assignedSupervisor.full_name : 'the faculty supervisor';
      setActionMessage({ type: 'success', text: `Proposal submitted! Request sent to ${supName} for review.` });
      setProposalMode(null);
      setSelectedIdea(null);
      setProposalFile(null);
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Network error submitting proposal.' });
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const formatDate = (ts?: string | null): string => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return ts;
    }
  };

  // ─── LOADING GATE ───────────────────────────────────────────────
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center gap-3">
        <div className="w-8 h-8 border-[3px] border-slate-700 border-t-[#B81D24] rounded-full animate-spin" />
      </div>
    );
  }

  const sidebarProps = {
    sidebarOpen,
    setSidebarOpen,
    user,
    activeTab,
    setActiveTab: (t: string) => {
      setActiveTab(t as 'tracks' | 'deliverables');
      setViewingTrackId(null);
      setShowIdeaPool(false);
    },
    deliverablesProgress,
    handleLogout,
  };

  const topBarTitle = proposalMode === 'pool'
    ? 'Adopt Idea & Propose Solution'
    : proposalMode === 'custom'
    ? 'Propose Project Idea'
    : showIdeaPool
    ? 'Idea Pool'
    : viewingTrackId && group
    ? group.name
    : activeTab === 'tracks'
    ? 'My Tracks'
    : 'Formats';

  const topBarSub = proposalMode && group
    ? `${group.name} · ${group.track_title}`
    : viewingTrackId && group
    ? group.track_title
    : null;

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9] flex font-sans">
      <SidebarShell {...sidebarProps} />

      <div className="flex-1 flex flex-col overflow-auto min-w-0">
        {/* Top Navbar — University Red Theme matching Dashboard Student hand-drawn design */}
        <header className="bg-[#B81D24] px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            {(viewingTrackId || showIdeaPool || proposalMode) && (
              <button
                onClick={() => {
                  if (proposalMode) {
                    setProposalMode(null);
                  } else if (showIdeaPool) {
                    setShowIdeaPool(false);
                    setSelectedIdea(null);
                  } else {
                    setViewingTrackId(null);
                  }
                }}
                className="text-white/80 hover:text-white cursor-pointer shrink-0 p-1 rounded-lg hover:bg-white/10"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <button
              className="lg:hidden p-1.5 text-red-100 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight truncate">
                {topBarTitle}
              </h1>
              {topBarSub && <p className="text-[10px] sm:text-[11px] text-red-100/90 font-mono truncate">{topBarSub}</p>}
            </div>
          </div>

          {/* Right Header: Notification toast only */}
          <div className="flex items-center gap-3 shrink-0">
            {actionMessage && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white border border-white/30 rounded-lg text-xs font-semibold">
                {actionMessage.type === 'success' ? (
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="max-w-[200px] truncate">{actionMessage.text}</span>
                <button onClick={() => setActionMessage(null)} className="cursor-pointer opacity-70 hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Action toast for mobile */}
        {actionMessage && (
          <div className="sm:hidden px-4 py-2 bg-[#9E181E] text-white text-xs flex items-center justify-between">
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── PROPOSAL SUBMISSION FULL-PAGE VIEW ── */}
        {proposalMode && group && (
          <ProposalSubmissionPage
            mode={proposalMode}
            selectedIdea={selectedIdea}
            supervisors={supervisors}
            supervisorsLoading={supervisorsLoading}
            selectedSupervisorId={proposalSupervisorId}
            onSelectSupervisor={setProposalSupervisorId}
            form={proposalForm}
            setForm={setProposalForm}
            techInput={proposalTechInput}
            setTechInput={setProposalTechInput}
            techSuggestions={proposalTechSuggestions}
            setTechSuggestions={setProposalTechSuggestions}
            proposeFile={proposalFile}
            setProposeFile={setProposalFile}
            existingDocUrl={uploadedDocUrl}
            existingDocName={uploadedDocName}
            onBack={() => {
              setProposalMode(null);
            }}
            onSubmit={handleSubmitProposal}
            submitting={isSubmittingProposal}
          />
        )}

        {/* ── IDEA POOL VIEW (Matching After student click Choose from pool.jpeg) ── */}
        {!proposalMode && showIdeaPool && (
          <div className="flex-1 p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-w-6xl mx-auto w-full">
            {selectedIdea ? (
              <div className="space-y-5 max-w-3xl mx-auto w-full">
                <button
                  onClick={() => setSelectedIdea(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#B81D24] cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Idea Pool
                </button>

                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <Avatar url={selectedIdea.supervisor_avatar} name={selectedIdea.supervisor_name} size={11} />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Proposed By</p>
                      <p className="text-sm font-black text-slate-900">{selectedIdea.supervisor_name}</p>
                      {selectedIdea.supervisor_designation && (
                        <p className="text-[11px] text-slate-500">{selectedIdea.supervisor_designation}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight mb-2">{selectedIdea.title}</h2>
                    {selectedIdea.domain && (
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded border border-blue-100">
                        {selectedIdea.domain}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Problem Statement</p>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {selectedIdea.problem_statement}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Novelty</p>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {selectedIdea.novelty}
                    </p>
                  </div>

                  {selectedIdea.technologies?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Suggested Technologies</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedIdea.technologies.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedIdea.supporting_doc_url && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1.5">Supporting Document</p>
                      <a
                        href={selectedIdea.supporting_doc_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-mono"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        {selectedIdea.supporting_doc_name || 'Download Supporting Doc'}
                      </a>
                    </div>
                  )}
                </div>

                {/* Solution Proposal Action Banner */}
                {group && !group.latest_proposal && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Want to work on this idea?</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Proceed to submit your proposed technical solution and request {selectedIdea.supervisor_name} as your project mentor.
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartPoolProposal(selectedIdea)}
                      className="w-full sm:w-auto justify-center px-5 py-2.5 bg-[#B81D24] hover:bg-[#9E181E] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2 transition-colors shadow-sm text-center"
                    >
                      <Sparkles className="w-4 h-4" />
                      Adopt Idea & Propose Solution
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Search & Filter Header */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={ideaSearch}
                      onChange={(e) => setIdeaSearch(e.target.value)}
                      placeholder="Search ideas by title, keyword, or supervisor..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#B81D24]"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={ideaSort}
                      onChange={(e) => setIdeaSort(e.target.value as 'newest' | 'oldest' | 'faculty')}
                      className="flex-1 sm:flex-initial px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#B81D24]"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="faculty">By Faculty</option>
                    </select>
                    {uniqueFaculties.length > 0 && (
                      <select
                        value={ideaFilterFaculty}
                        onChange={(e) => setIdeaFilterFaculty(e.target.value)}
                        className="flex-1 sm:flex-initial px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#B81D24]"
                      >
                        <option value="">All Faculty</option>
                        {uniqueFaculties.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {ideasLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-7 h-7 border-[3px] border-slate-200 border-t-[#B81D24] rounded-full animate-spin" />
                  </div>
                ) : filteredIdeas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Lightbulb className="w-10 h-10 text-slate-200" />
                    <p className="text-sm font-bold text-slate-600">No project ideas available yet</p>
                    <p className="text-xs text-slate-400">Department faculty supervisors will add ideas here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredIdeas.map((idea) => {
                      const sup = supervisors.find((s) => s.id === idea.supervisor || s.full_name === idea.supervisor_name);
                      const maxG = sup?.max_groups || 10;
                      const actG = sup?.active_groups || 0;
                      const isSupFull = sup ? (sup.is_quota_full || (sup.available_slots !== undefined && sup.available_slots <= 0) || actG >= maxG || !sup.is_accepting) : false;

                      return (
                        <div
                          key={idea.id}
                          className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar url={idea.supervisor_avatar} name={idea.supervisor_name} size={9} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-slate-900 truncate">{idea.supervisor_name}</p>
                              {idea.supervisor_designation && (
                                <p className="text-[10px] text-slate-400 truncate">{idea.supervisor_designation}</p>
                              )}
                            </div>
                            {isSupFull && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-[#B81D24] text-[8px] font-black uppercase rounded shrink-0">
                                Full ({actG}/{maxG})
                              </span>
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-sm font-black text-slate-900 leading-snug mb-1">{idea.title}</h3>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {idea.problem_statement}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {idea.domain && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black uppercase rounded border border-blue-100">
                                {idea.domain}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedIdea(idea)}
                              className="flex-1 flex items-center justify-center py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
                            {isSupFull ? (
                              <button
                                disabled
                                title={`Faculty supervisor ${idea.supervisor_name} has reached maximum group quota (${actG}/${maxG})`}
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed"
                              >
                                <Ban className="w-3 h-3" />
                                Quota Full
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartPoolProposal(idea)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#B81D24] hover:bg-[#9E181E] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3" />
                                Adopt & Propose
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── GROUP DETAIL VIEW (Matching UI After Student clicks view.jpeg) ── */}
        {!proposalMode && !showIdeaPool && viewingTrackId && group && (
          <div className="flex-1 p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl mx-auto w-full">
            {/* Box 1: Team Member Details */}
            <Section
              title="Team member details"
              action={
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {group.members.length} / {maxGroupCapacity} members
                  </span>
                  {isLeader && (
                    <button
                      onClick={() => setIsJoinRequestsModalOpen(true)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs relative"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                      <span>Join Requests</span>
                      {pendingJoinRequests.length > 0 && (
                        <span className="px-1.5 py-0.2 bg-[#B81D24] text-white text-[9px] font-black rounded-full animate-pulse">
                          {pendingJoinRequests.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              }
            >
              <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
                {group.members.map((m) => (
                  <div key={m.id} className="flex flex-col items-center gap-1.5 group/mem">
                    <div className="relative">
                      <Avatar url={m.avatar_url} name={m.full_name} size={12} />
                      {m.member_role === 'LEADER' && (
                        <span
                          title="Team Leader"
                          className="absolute -bottom-1 -right-1 bg-amber-500 text-[9px] font-black text-white px-1.5 py-0.2 rounded-full border-2 border-white shadow-xs"
                        >
                          LEADER
                        </span>
                      )}
                    </div>
                    <div className="text-center mt-1">
                      <p className="text-[11px] font-bold text-slate-800 max-w-[84px] truncate">{m.full_name}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{m.university_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Box 2: Supervisor Details */}
            <Section title="Supervisor details">
              {group.supervisor_details ? (
                <div className="flex items-center gap-4 flex-wrap">
                  <Avatar url={group.supervisor_details.avatar_url} name={group.supervisor_details.full_name} size={13} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900">{group.supervisor_details.full_name}</p>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">
                        Assigned Supervisor
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {group.supervisor_details.designation} · {group.supervisor_details.department}
                    </p>
                    <p className="text-[11px] text-blue-600 font-mono mt-0.5">{group.supervisor_details.email}</p>
                    {group.supervisor_details.expertise_domains && group.supervisor_details.expertise_domains.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {group.supervisor_details.expertise_domains.map((d) => (
                          <span key={d} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : group.latest_proposal && group.latest_proposal.status === 'PENDING' ? (
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                        Supervisor Request Pending Faculty Approval
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                      Under Review
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Your project proposal has been sent to{' '}
                    <span className="font-bold">
                      {group.latest_proposal.supervisor_name ||
                        group.latest_proposal.supervisor_details?.full_name ||
                        'the faculty mentor'}
                    </span>
                    . Once they review and accept your request, they will be confirmed as your supervisor.
                  </p>
                  {group.latest_proposal.supervisor_details && (
                    <div className="flex items-center gap-3 pt-2 border-t border-amber-200/50">
                      <Avatar
                        url={group.latest_proposal.supervisor_details.avatar_url}
                        name={group.latest_proposal.supervisor_details.full_name}
                        size={10}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">
                          {group.latest_proposal.supervisor_details.full_name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {group.latest_proposal.supervisor_details.designation} ·{' '}
                          {group.latest_proposal.supervisor_details.department}
                        </p>
                        <p className="text-[10px] text-blue-600 font-mono">
                          {group.latest_proposal.supervisor_details.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  <p className="text-xs font-bold text-slate-700">No supervisor assigned yet.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your supervisor will be chosen when you propose your project idea below. Once the faculty mentor accepts your request, they will appear here.
                  </p>
                </div>
              )}
            </Section>

            {/* Box 3: Project Title (Propose Idea or Choose from pool) */}
            <Section title="Project Title">
              {group.latest_proposal ? (
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900">{group.latest_proposal.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {group.latest_proposal.domain && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black uppercase rounded border border-blue-100">
                            {group.latest_proposal.domain}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          Submitted on {formatDate(group.latest_proposal.created_at)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full ${
                        group.latest_proposal.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : group.latest_proposal.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {group.latest_proposal.status === 'APPROVED'
                        ? 'Approved'
                        : group.latest_proposal.status === 'REJECTED'
                        ? 'Proposal Rejected'
                        : 'Proposal Under Review'}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Problem Statement</p>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      {group.latest_proposal.problem_statement}
                    </p>
                  </div>

                  {group.latest_proposal.solution && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Proposed Solution / Approach</p>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                        {group.latest_proposal.solution}
                      </p>
                    </div>
                  )}

                  {group.latest_proposal.technologies && group.latest_proposal.technologies.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Technologies</p>
                      <div className="flex flex-wrap gap-1">
                        {group.latest_proposal.technologies.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {group.latest_proposal.supporting_doc_url && (
                    <div className="pt-1">
                      <a
                        href={group.latest_proposal.supporting_doc_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        {group.latest_proposal.supporting_doc_name || 'Download Attached Supporting Document'}
                      </a>
                    </div>
                  )}

                  {group.latest_proposal.supervisor_feedback && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                      <span className="font-bold">Supervisor Remark: </span>
                      {group.latest_proposal.supervisor_feedback}
                    </div>
                  )}

                  {group.latest_proposal.status === 'REJECTED' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={handleOpenCustomProposal}
                        className="px-3.5 py-1.5 bg-[#B81D24] text-white text-xs font-bold rounded-lg hover:bg-[#9E181E] cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        Re-propose Idea
                      </button>
                      <button
                        onClick={() => {
                          setShowIdeaPool(true);
                          loadIdeas();
                          loadSupervisors();
                        }}
                        className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <BookMarked className="w-3.5 h-3.5" />
                        Choose from Pool
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">No project idea finalized yet</p>
                    <p className="text-[11px] text-slate-400">
                      Propose your own custom idea or select one from the faculty idea pool.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={handleOpenCustomProposal}
                      className="w-full sm:w-auto justify-center px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 transition-colors text-center"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Propose Idea
                    </button>
                    <button
                      onClick={() => {
                        setShowIdeaPool(true);
                        loadIdeas();
                        loadSupervisors();
                      }}
                      className="w-full sm:w-auto justify-center px-4 py-2 bg-[#B81D24] hover:bg-[#9E181E] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors text-center"
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                      Choose from pool
                    </button>
                  </div>
                </div>
              )}
            </Section>

            {/* Box 4: Deliverables Table (Responsive: Mobile Cards + Desktop Table) */}
            <Section title="Deliverables">
              {/* Mobile View: Clean Card List */}
              <div className="md:hidden space-y-3">
                {(['PPT', 'SYNOPSIS', 'REPORT', 'GITHUB'] as const).map((type, idx) => {
                  const dl = deadlines.find((d) => d.deadline_type === type);
                  const submitted =
                    type === 'SYNOPSIS'
                      ? !!group.submission?.synopsis_url
                      : type === 'PPT'
                      ? !!group.submission?.ppt_url
                      : type === 'REPORT'
                      ? !!group.submission?.report_url
                      : !!group.submission?.github_repo_url;

                  const subUrl =
                    type === 'SYNOPSIS'
                      ? group.submission?.synopsis_url
                      : type === 'PPT'
                      ? group.submission?.ppt_url
                      : type === 'REPORT'
                      ? group.submission?.report_url
                      : group.submission?.github_repo_url;

                  const subAt =
                    type === 'SYNOPSIS'
                      ? group.submission?.synopsis_submitted_at
                      : type === 'PPT'
                      ? group.submission?.ppt_submitted_at
                      : type === 'REPORT'
                      ? group.submission?.report_submitted_at
                      : null;

                  const label =
                    type === 'PPT'
                      ? 'PPT Presentation'
                      : type === 'SYNOPSIS'
                      ? 'Synopsis'
                      : type === 'REPORT'
                      ? 'Final Report'
                      : 'GitHub Repo';

                  return (
                    <div
                      key={type}
                      className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{label}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                            submitted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {submitted ? 'Delivered' : 'Not Delivered'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                        <span>
                          <span className="font-semibold text-slate-600">Deadline: </span>
                          <span className="font-mono">{dl ? formatDate(dl.due_date) : '—'}</span>
                        </span>
                        <span>
                          {submitted ? (
                            subAt ? `Submitted ${formatDate(subAt)}` : 'Submitted'
                          ) : dl?.is_passed ? (
                            <span className="text-rose-500 font-semibold">Overdue</span>
                          ) : (
                            'Pending'
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {subUrl && (
                          <a
                            href={subUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 px-3 bg-white border border-slate-200 hover:border-blue-400 text-blue-600 hover:text-blue-800 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </a>
                        )}
                        {type !== 'GITHUB' ? (
                          <button
                            onClick={() => {
                              setSelectedDeliverableType(type);
                              setSelectedFile(null);
                              setIsUploadModalOpen(true);
                            }}
                            className="flex-1 py-1.5 px-3 bg-[#B81D24] hover:bg-[#9E181E] text-white text-[11px] font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <Upload className="w-3 h-3" />
                            {submitted ? 'Replace File' : 'Upload File'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setLinkInputValue(group.submission?.github_repo_url || '');
                              setIsLinkModalOpen(true);
                            }}
                            className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            {submitted ? 'Update URL' : 'Link GitHub'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-2.5 px-3">Deliverables</th>
                      <th className="py-2.5 px-3">Deadline</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Remark</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(['PPT', 'SYNOPSIS', 'REPORT', 'GITHUB'] as const).map((type, idx) => {
                      const dl = deadlines.find((d) => d.deadline_type === type);
                      const submitted =
                        type === 'SYNOPSIS'
                          ? !!group.submission?.synopsis_url
                          : type === 'PPT'
                          ? !!group.submission?.ppt_url
                          : type === 'REPORT'
                          ? !!group.submission?.report_url
                          : !!group.submission?.github_repo_url;

                      const subUrl =
                        type === 'SYNOPSIS'
                          ? group.submission?.synopsis_url
                          : type === 'PPT'
                          ? group.submission?.ppt_url
                          : type === 'REPORT'
                          ? group.submission?.report_url
                          : group.submission?.github_repo_url;

                      const subAt =
                        type === 'SYNOPSIS'
                          ? group.submission?.synopsis_submitted_at
                          : type === 'PPT'
                          ? group.submission?.ppt_submitted_at
                          : type === 'REPORT'
                          ? group.submission?.report_submitted_at
                          : null;

                      const label =
                        type === 'PPT'
                          ? 'PPT Presentation'
                          : type === 'SYNOPSIS'
                          ? 'Synopsis'
                          : type === 'REPORT'
                          ? 'Final Report'
                          : 'GitHub Repo';

                      return (
                        <tr key={type} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-mono font-bold">
                              {idx + 1}
                            </span>
                            <span>{label}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {dl ? formatDate(dl.due_date) : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                                submitted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {submitted ? 'Delivered' : 'Not Delivered'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-500">
                            {submitted ? (
                              subAt ? `Submitted on ${formatDate(subAt)}` : 'Submitted'
                            ) : dl?.is_passed ? (
                              <span className="text-rose-500 font-semibold">Overdue</span>
                            ) : (
                              'Pending submission'
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {subUrl && (
                                <a
                                  href={subUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                  title="View Uploaded File"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {type !== 'GITHUB' ? (
                                <button
                                  onClick={() => {
                                    setSelectedDeliverableType(type);
                                    setSelectedFile(null);
                                    setIsUploadModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                                >
                                  <Upload className="w-3 h-3" />
                                  {submitted ? 'Replace' : 'Upload'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setLinkInputValue(group.submission?.github_repo_url || '');
                                    setIsLinkModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                                >
                                  <Code2 className="w-3 h-3" />
                                  {submitted ? 'Update' : 'Link'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

        {/* ── TRACKS TAB (Matching Dashboard Student.jpeg) ── */}
        {!showIdeaPool && !viewingTrackId && activeTab === 'tracks' && (
          <div className="flex-1 p-3.5 sm:p-6 max-w-6xl mx-auto w-full">
            {loading ? (
              <div className="flex justify-center py-32">
                <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#B81D24] rounded-full animate-spin" />
              </div>
            ) : availableTracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
                <FolderOpen className="w-12 h-12 text-slate-300" />
                <p className="text-base font-bold text-slate-700">No tracks available</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  There are currently no active project tracks assigned for {user?.student_profile?.program} Sem{' '}
                  {user?.student_profile?.semester}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {availableTracks.map((track) => {
                  const enrolled = group?.track_id === track.id || group?.track === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`bg-white rounded-2xl border shadow-xs flex flex-col transition-all hover:shadow-md ${
                        enrolled ? 'border-[#B81D24]/50 ring-1 ring-[#B81D24]/10' : 'border-slate-200'
                      }`}
                    >
                      {/* Track Header */}
                      <div
                        className={`px-5 py-4 rounded-t-2xl border-b ${
                          enrolled ? 'bg-red-50/70 border-red-100' : 'bg-slate-50/80 border-slate-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-black text-slate-900 leading-snug">{track.title}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {track.target_program} · Sem {track.target_semester}
                            </p>
                          </div>
                          {enrolled && (
                            <span className="px-2 py-0.5 bg-[#B81D24] text-white text-[9px] font-black uppercase rounded-full shrink-0">
                              Enrolled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Deliverables & Deadlines */}
                      <div className="p-5 flex-1 space-y-4">
                        {track.required_deliverables && track.required_deliverables.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Deliverables
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {track.required_deliverables.map((d) => (
                                <span
                                  key={d}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {track.deadlines && track.deadlines.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Timeline & Deadlines
                            </p>
                            <div className="space-y-1">
                              {track.deadlines.map((d) => (
                                <div key={d.id} className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-600 font-medium">{d.title || d.deadline_type}</span>
                                  <span className="font-mono text-slate-400">{formatDate(d.due_date)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Action Button */}
                      <div className="p-4 border-t border-slate-100">
                        {enrolled ? (
                          <button
                            onClick={() => setViewingTrackId(track.id)}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#B81D24] hover:bg-[#9E181E] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
                          >
                            <BookOpen className="w-4 h-4" />
                            View Track
                          </button>
                        ) : !group ? (
                          <button
                            onClick={() => {
                              setPendingJoinTrackId(track.id);
                              loadTrackGroups(track.id);
                              setIsJoinListOpen(true);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#B81D24] hover:bg-[#9E181E] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
                          >
                            <UserPlus className="w-4 h-4" />
                            Join
                          </button>
                        ) : (
                          <p className="text-center text-[11px] text-slate-400 py-1 font-medium">
                            Enrolled in another track
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FORMATS TAB ── */}
        {!showIdeaPool && !viewingTrackId && activeTab === 'deliverables' && (
          <div className="flex-1 p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full">

            {(() => {
              const formatDeadlines = deadlines.filter((d) => d.deadline_type !== 'GITHUB');

              if (formatDeadlines.length === 0) {
                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
                    <p className="text-sm font-semibold text-slate-800">No format guidelines published yet</p>
                    <p className="text-xs text-slate-500">
                      Format templates and typography guidelines will appear here once configured by the Head of Department.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {formatDeadlines.map((dl) => {
                    const hasMetrics =
                      dl.font_family ||
                      dl.typography ||
                      dl.spacing_alignment ||
                      dl.page_margins ||
                      dl.page_limit ||
                      dl.file_format;

                    return (
                      <div
                        key={dl.id || dl.deadline_type}
                        className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-slate-900">
                            {dl.title || dl.deadline_type}
                          </h3>

                          {/* Metrics Box */}
                          {hasMetrics && (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-[11px]">
                              {dl.font_family && (
                                <div className="flex items-center justify-between text-slate-700">
                                  <span className="text-slate-500 font-medium">Font Family</span>
                                  <span className="font-semibold text-slate-900">{dl.font_family}</span>
                                </div>
                              )}
                              {dl.typography && (
                                <div className="flex items-center justify-between text-slate-700">
                                  <span className="text-slate-500 font-medium">Typography</span>
                                  <span className="font-mono text-[10px] text-slate-800">{dl.typography}</span>
                                </div>
                              )}
                              {dl.spacing_alignment && (
                                <div className="flex items-center justify-between text-slate-700">
                                  <span className="text-slate-500 font-medium">Spacing & Alignment</span>
                                  <span className="text-slate-800">{dl.spacing_alignment}</span>
                                </div>
                              )}
                              {dl.page_margins && (
                                <div className="flex items-center justify-between text-slate-700">
                                  <span className="text-slate-500 font-medium">Page Margins</span>
                                  <span className="font-mono text-[10px] text-slate-800">{dl.page_margins}</span>
                                </div>
                              )}
                              {dl.page_limit && (
                                <div className="flex items-center justify-between text-slate-700">
                                  <span className="text-slate-500 font-medium">No. of Pages</span>
                                  <span className="font-semibold text-slate-900">{dl.page_limit}</span>
                                </div>
                              )}
                              {dl.file_format && (
                                <div className="flex items-center justify-between text-slate-700">
                                  <span className="text-slate-500 font-medium">Type</span>
                                  <span className="font-mono font-bold text-slate-900 text-[10px]">{dl.file_format}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* HOD Instruction (if present) */}
                          {dl.instructions && (
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                              <span className="font-bold text-slate-900">HOD Instruction: </span>
                              {dl.instructions}
                            </div>
                          )}
                        </div>

                        {dl.template_url ? (
                          <a
                            href={dl.template_url}
                            download={dl.template_filename || `${dl.deadline_type}_Format`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 px-4 bg-[#B81D24] hover:bg-[#9E181E] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Format
                          </a>
                        ) : (
                          <div className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 text-xs font-medium rounded-lg flex items-center justify-center gap-2 border border-slate-200 select-none">
                            <Download className="w-3.5 h-3.5 text-slate-300" />
                            Format File Pending Upload
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Create Group Modal */}
      {isCreateGroupModalOpen && pendingJoinTrackId && (
        <Modal onClose={() => setIsCreateGroupModalOpen(false)} title="Create New Group">
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">
              You will be assigned as the Team Leader. You only need to enter your group name.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Group Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Team ByteCrafters"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#B81D24]"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
            <button
              onClick={() => setIsCreateGroupModalOpen(false)}
              className="px-4 py-2 text-slate-600 text-xs font-bold hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !newGroupName.trim()}
              className="px-4 py-2 bg-[#B81D24] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              {isCreatingGroup ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" />
                  Create Group
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* Join Existing Group Modal (Matching Dashboard Student.jpeg Groups Modal) */}
      {isJoinListOpen && pendingJoinTrackId && (
        <Modal onClose={() => setIsJoinListOpen(false)} title="Groups" wide>
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">
              List of current formed groups in this track. Join an existing team or create a new group.
            </p>

            {trackGroupsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-[3px] border-slate-200 border-t-[#B81D24] rounded-full animate-spin" />
              </div>
            ) : trackGroups.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">No groups formed yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Be the first to create a group for this track.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {trackGroups.map((g) => {
                  const maxCap = g.max_group_size || 4;
                  const isFull = g.members.length >= maxCap;
                  const myReq = g.my_join_request;
                  const isPending = myReq?.status === 'PENDING';
                  const isJoined = g.members.some(
                    (m) => m.university_id === user?.university_id || m.email === user?.email
                  );

                  return (
                    <div
                      key={g.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 truncate">{g.name}</p>
                          {isJoined ? (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">
                              Joined
                            </span>
                          ) : isPending ? (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                              Request Pending
                            </span>
                          ) : isFull ? (
                            <span className="px-1.5 py-0.2 bg-red-100 text-[#B81D24] text-[9px] font-bold rounded">
                              Full
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                              Open
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {g.members.length} / {maxCap} members
                        </p>
                        <div className="flex items-center gap-1 mt-1.5">
                          {g.members.slice(0, 4).map((m) => (
                            <Avatar key={m.id} url={m.avatar_url} name={m.full_name} size={6} />
                          ))}
                        </div>
                      </div>

                      {isJoined ? (
                        <span className="w-full sm:w-auto text-center px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg select-none">
                          Your Team
                        </span>
                      ) : isPending ? (
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-lg flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Request Pending
                          </span>
                          <button
                            onClick={() => handleCancelJoinRequest(g.id, myReq!.id)}
                            disabled={cancellingRequestId === myReq!.id}
                            className="px-2.5 py-1 text-slate-600 hover:text-red-700 hover:bg-red-50 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border border-slate-200 disabled:opacity-50"
                          >
                            {cancellingRequestId === myReq!.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      ) : isFull ? (
                        <span className="w-full sm:w-auto text-center px-3 py-1.5 bg-slate-200 text-slate-500 text-[10px] font-bold rounded-lg select-none">
                          Group Full
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinGroup(g.id)}
                          disabled={joiningGroupId === g.id}
                          className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                        >
                          {joiningGroupId === g.id ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              Request to Join
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <p className="text-[11px] text-slate-500 text-center sm:text-left">Want to lead your own team?</p>
              <button
                onClick={() => {
                  setIsJoinListOpen(false);
                  setIsCreateGroupModalOpen(true);
                }}
                className="w-full sm:w-auto justify-center px-3.5 py-2 sm:py-1.5 bg-[#B81D24] hover:bg-[#9E181E] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors text-center"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Group
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Team Join Requests Modal (Leader Only) */}
      {isJoinRequestsModalOpen && group && (
        <JoinRequestsModal
          open={isJoinRequestsModalOpen}
          onClose={() => setIsJoinRequestsModalOpen(false)}
          requests={pendingJoinRequests}
          onRespond={handleRespondJoinRequest}
          respondingId={respondingRequestId}
          isGroupFull={isGroupFull}
          currentMembers={group.members.length}
          maxMembers={maxGroupCapacity}
        />
      )}

      {/* Deliverable Upload Modal */}
      <UploadModal
        open={isUploadModalOpen}
        type={selectedDeliverableType}
        file={selectedFile}
        onFileChange={setSelectedFile}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleDeliverableUpload}
        uploading={isUploading}
      />

      {/* GitHub Link Modal */}
      <LinkModal
        open={isLinkModalOpen}
        value={linkInputValue}
        onChange={setLinkInputValue}
        onClose={() => setIsLinkModalOpen(false)}
        onSave={handleSaveLink}
        saving={isSavingLink}
      />
    </div>
  );
}
