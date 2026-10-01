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
  title: string;
  problem_statement: string;
  novelty: string;
  domain: string;
  technologies: string[];
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
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  designation: string;
  department: string;
  expertise_domains?: string[];
  expertise_tech?: string[];
}

export interface StudentGroupData {
  id: string;
  name: string;
  track: string;
  track_id: string;
  track_title: string;
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
  created_at: string;
  updated_at: string;
}

export interface TrackDeadlineData {
  id: string;
  track: string;
  deadline_type: 'SYNOPSIS' | 'PPT' | 'REPORT' | 'GITHUB';
  title: string;
  due_date: string;
  template_url: string;
  template_filename: string;
  instructions: string;
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
  expertise_domains?: string[];
  expertise_tech?: string[];
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
  created_at: string;
}

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'tracks', label: 'My Tracks', icon: FolderGit2 },
  { key: 'deliverables', label: 'Deliverable Formats', icon: Layers },
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
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80">
        <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-600">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6 ${
          wide ? 'w-full max-w-lg' : 'w-full max-w-sm'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
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
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
          </label>
          <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, PPT up to 25MB</p>
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

// ─── CHOOSE SUPERVISOR MODAL ──────────────────────────────────────────
function ChooseSupervisorModal({
  open,
  supervisors,
  loading,
  onClose,
  onSelect,
  selectingId,
}: {
  open: boolean;
  supervisors: SupervisorMarketplaceItem[];
  loading: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
  selectingId: number | null;
}) {
  const [search, setSearch] = useState('');
  if (!open) return null;

  const filtered = supervisors.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      (s.expertise_domains || []).some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <Modal title="Choose Your Supervisor" onClose={onClose} wide>
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by faculty name or domain..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#B81D24]"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-[3px] border-slate-200 border-t-[#B81D24] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs font-bold text-slate-600">No supervisors found</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar url={s.avatar_url} name={s.full_name} size={10} />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{s.full_name}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {s.designation} · {s.department}
                    </p>
                    {s.expertise_domains && s.expertise_domains.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.expertise_domains.slice(0, 3).map((d) => (
                          <span
                            key={d}
                            className="px-1.5 py-0.5 bg-white text-slate-600 text-[8px] font-bold rounded border border-slate-200"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onSelect(s.id)}
                  disabled={selectingId === s.id || !s.is_accepting}
                  className="px-3 py-1.5 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-[10px] font-bold rounded-lg cursor-pointer shrink-0 transition-colors"
                >
                  {selectingId === s.id ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : s.is_accepting ? (
                    'Select'
                  ) : (
                    'Not Accepting'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── PROPOSE IDEA MODAL ───────────────────────────────────────────────
function ProposeIdeaModal({
  form,
  setForm,
  techInput,
  setTechInput,
  techSuggestions,
  setTechSuggestions,
  proposeFile,
  setProposeFile,
  onClose,
  onSubmit,
  submitting,
}: {
  form: { title: string; problem_statement: string; novelty: string; domain: string; technologies: string[] };
  setForm: (f: { title: string; problem_statement: string; novelty: string; domain: string; technologies: string[] }) => void;
  techInput: string;
  setTechInput: (v: string) => void;
  techSuggestions: string[];
  setTechSuggestions: (v: string[]) => void;
  proposeFile: File | null;
  setProposeFile: (f: File | null) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const handleTechInput = (val: string) => {
    setTechInput(val);
    if (val.length > 0) {
      setTechSuggestions(
        TECH_SUGGESTIONS.filter((t) => t.toLowerCase().includes(val.toLowerCase()) && !form.technologies.includes(t)).slice(0, 6)
      );
    } else {
      setTechSuggestions([]);
    }
  };

  const addTech = (t: string) => {
    setForm({ ...form, technologies: [...form.technologies, t] });
    setTechInput('');
    setTechSuggestions([]);
  };

  const removeTech = (t: string) => {
    setForm({ ...form, technologies: form.technologies.filter((x) => x !== t) });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">Propose Your Project Idea</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {([
            { label: 'Project Title *', key: 'title', placeholder: 'e.g. Smart Campus Navigation & Resource Management' },
            { label: 'Problem Statement *', key: 'problem_statement', placeholder: 'Describe the core challenge this project addresses...' },
            { label: 'Novelty / Approach', key: 'novelty', placeholder: 'What makes your solution unique or superior?' },
            { label: 'Domain', key: 'domain', placeholder: 'e.g. Machine Learning, Cloud Systems, IoT' },
          ] as const).map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">{label}</label>
              <textarea
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                rows={key === 'title' || key === 'domain' ? 1 : 2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#B81D24] resize-none"
              />
            </div>
          ))}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tech Stack</label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {form.technologies.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100"
                >
                  {t}
                  <button onClick={() => removeTech(t)} className="cursor-pointer opacity-60 hover:opacity-100">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                value={techInput}
                onChange={(e) => handleTechInput(e.target.value)}
                placeholder="Type to search tech stack..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#B81D24]"
              />
              {techSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 top-full mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                  {techSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => addTech(s)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer text-slate-800 font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Supporting Document (optional)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center">
              <label className="cursor-pointer text-xs font-bold text-slate-500 hover:text-[#B81D24]">
                <Paperclip className="w-3.5 h-3.5 inline mr-1" />
                {proposeFile ? proposeFile.name : 'Attach PDF or DOCX synopsis/draft'}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setProposeFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 text-xs font-bold hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !form.title.trim() || !form.problem_statement.trim()}
            className="px-5 py-2 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            {submitting ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                Submit Proposal
              </>
            )}
          </button>
        </div>
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
    <aside
      className={`sticky top-0 h-screen flex flex-col justify-between bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ease-in-out shrink-0 z-30 ${
        sidebarOpen ? 'w-56' : 'w-[64px]'
      }`}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Sidebar Logo */}
        <div className="flex items-center justify-center border-b border-slate-100 py-3.5 px-2 overflow-hidden h-[74px] shrink-0">
          {sidebarOpen ? (
            <div className="w-full flex items-center justify-center transition-all duration-200">
              <Image
                src="/images/logo.jpeg"
                alt="Dev Bhoomi Uttarakhand University"
                width={190}
                height={56}
                priority
                className="object-contain w-full max-h-12"
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-200">
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
                onClick={() => setActiveTab(item.key)}
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
                {sidebarOpen && item.key === 'deliverables' && (
                  <span
                    className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                      isActive ? 'bg-red-100 text-[#B81D24]' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {deliverablesProgress.completed}/{deliverablesProgress.total}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Details (Name, ERP, Sign Out) - Always visible pinned at bottom */}
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

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-16 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-slate-50 z-10 transition-transform"
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        )}
      </button>
    </aside>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────
export default function StudentDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracks' | 'deliverables'>('tracks');

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
  const [pendingJoinTrackId, setPendingJoinTrackId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  // Supervisor selection
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [supervisors, setSupervisors] = useState<SupervisorMarketplaceItem[]>([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(false);
  const [selectingSupervisorId, setSelectingSupervisorId] = useState<number | null>(null);

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
  const [ideaSolutionDesc, setIdeaSolutionDesc] = useState('');
  const [ideaSolutionFile, setIdeaSolutionFile] = useState<File | null>(null);
  const [isSubmittingIdeaProposal, setIsSubmittingIdeaProposal] = useState(false);

  // Propose own idea
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposeForm, setProposeForm] = useState({
    title: '',
    problem_statement: '',
    novelty: '',
    domain: '',
    technologies: [] as string[],
  });
  const [proposeTechInput, setProposeTechInput] = useState('');
  const [proposeTechSuggestions, setProposeTechSuggestions] = useState<string[]>([]);
  const [proposeFile, setProposeFile] = useState<File | null>(null);
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

      if (trackRes.ok) {
        const trData = await trackRes.json();
        setAvailableTracks(trData);
      }

      const trackId = currentGroup?.track_id || currentGroup?.track;
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

  const loadSupervisors = useCallback(async () => {
    setSupervisorsLoading(true);
    try {
      const res = await fetch(`${API}/api/accounts/supervisors/`, {
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
  }, [tok]);

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
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || JSON.stringify(data) });
        return;
      }
      setActionMessage({ type: 'success', text: 'Successfully joined group!' });
      setIsJoinListOpen(false);
      if (pendingJoinTrackId) setViewingTrackId(pendingJoinTrackId);
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Network error joining group.' });
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleSelectSupervisor = async (supervisorId: number) => {
    setSelectingSupervisorId(supervisorId);
    try {
      const res = await fetch(`${API}/api/projects/groups/my-group/select-supervisor/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisor_id: supervisorId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || JSON.stringify(data) });
        return;
      }
      setActionMessage({ type: 'success', text: 'Supervisor selected successfully!' });
      setShowSupervisorModal(false);
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to select supervisor.' });
    } finally {
      setSelectingSupervisorId(null);
    }
  };

  const handleDeliverableUpload = async () => {
    if (!selectedFile || !group) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      const res = await fetch(`${API}/api/submissions/upload/${selectedDeliverableType.toLowerCase()}/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || JSON.stringify(data) });
        return;
      }
      setActionMessage({ type: 'success', text: `${selectedDeliverableType} uploaded successfully.` });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveLink = async () => {
    if (!linkInputValue.trim() || !group) return;
    setIsSavingLink(true);
    try {
      const res = await fetch(`${API}/api/submissions/link/github/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkInputValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || JSON.stringify(data) });
        return;
      }
      setActionMessage({ type: 'success', text: 'GitHub repository linked.' });
      setIsLinkModalOpen(false);
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to save GitHub link.' });
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleSubmitProposal = async () => {
    if (!group || !proposeForm.title.trim() || !proposeForm.problem_statement.trim()) return;
    setIsSubmittingProposal(true);
    try {
      const res = await fetch(`${API}/api/projects/proposals/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: group.id,
          proposal_type: 'CUSTOM',
          title: proposeForm.title,
          problem_statement: proposeForm.problem_statement,
          novelty: proposeForm.novelty,
          domain: proposeForm.domain,
          technologies: proposeForm.technologies,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || JSON.stringify(data) });
        return;
      }
      setActionMessage({ type: 'success', text: 'Project proposal submitted for review.' });
      setShowProposeModal(false);
      setProposeForm({ title: '', problem_statement: '', novelty: '', domain: '', technologies: [] });
      setProposeFile(null);
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Network error submitting proposal.' });
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const handleSubmitIdeaProposal = async () => {
    if (!group || !selectedIdea) return;
    setIsSubmittingIdeaProposal(true);
    try {
      const res = await fetch(`${API}/api/projects/proposals/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: group.id,
          proposal_type: 'FROM_LIST',
          project_idea: selectedIdea.id,
          title: selectedIdea.title,
          problem_statement: selectedIdea.problem_statement,
          novelty: ideaSolutionDesc.trim() || selectedIdea.novelty,
          domain: selectedIdea.domain,
          technologies: selectedIdea.technologies,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.detail || JSON.stringify(data) });
        return;
      }
      setActionMessage({ type: 'success', text: 'Idea selected and proposal sent to supervisor.' });
      setSelectedIdea(null);
      setShowIdeaPool(false);
      await loadAllData(tok());
    } catch {
      setActionMessage({ type: 'error', text: 'Network error submitting idea proposal.' });
    } finally {
      setIsSubmittingIdeaProposal(false);
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

  const topBarTitle = showIdeaPool
    ? 'Idea Pool'
    : viewingTrackId && group
    ? group.name
    : activeTab === 'tracks'
    ? 'My Tracks'
    : 'Deliverable Formats';

  const topBarSub = viewingTrackId && group ? group.track_title : null;

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9] flex font-sans">
      <SidebarShell {...sidebarProps} />

      <div className="flex-1 flex flex-col overflow-auto min-w-0">
        {/* Top Navbar — University Red Theme matching Dashboard Student hand-drawn design */}
        <header className="bg-[#B81D24] px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-4 min-w-0">
            {(viewingTrackId || showIdeaPool) && (
              <button
                onClick={() => {
                  setViewingTrackId(null);
                  setShowIdeaPool(false);
                  setSelectedIdea(null);
                }}
                className="text-white/80 hover:text-white cursor-pointer shrink-0 p-1"
                title="Back to Tracks"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {!viewingTrackId && !showIdeaPool && (
              <button
                className="lg:hidden p-1.5 text-red-200 hover:text-white cursor-pointer"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight truncate">
                {topBarTitle}
              </h1>
              {topBarSub && <p className="text-[11px] text-red-100/90 font-mono truncate">{topBarSub}</p>}
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

        {/* ── IDEA POOL VIEW (Matching After student click Choose from pool.jpeg) ── */}
        {showIdeaPool && (
          <div className="flex-1 p-6 space-y-5 max-w-6xl mx-auto w-full">
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

                {/* Solution Proposal Section */}
                {group && !group.latest_proposal && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                    <h3 className="text-sm font-black text-slate-900">Choose Idea & Propose Solution</h3>
                    <p className="text-[11px] text-slate-500">
                      You can optionally describe your implementation approach before requesting the supervisor.
                    </p>
                    <textarea
                      value={ideaSolutionDesc}
                      onChange={(e) => setIdeaSolutionDesc(e.target.value)}
                      placeholder="Outline your approach, architecture, or custom features for this idea..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#B81D24] resize-none"
                    />
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center">
                      <label className="cursor-pointer text-xs font-bold text-slate-500 hover:text-[#B81D24]">
                        <Paperclip className="w-3.5 h-3.5 inline mr-1" />
                        {ideaSolutionFile ? ideaSolutionFile.name : 'Attach Solution Document (optional)'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setIdeaSolutionFile(e.target.files?.[0] || null)}
                          accept=".pdf,.doc,.docx"
                        />
                      </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSelectedIdea(null)}
                        className="px-4 py-2 text-slate-600 text-xs font-bold hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitIdeaProposal}
                        disabled={isSubmittingIdeaProposal}
                        className="px-5 py-2 bg-[#B81D24] hover:bg-[#9E181E] disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        {isSubmittingIdeaProposal ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            Choose Idea and Propose Solution
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Search & Filter Header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={ideaSearch}
                      onChange={(e) => setIdeaSearch(e.target.value)}
                      placeholder="Search ideas by title, keyword, or supervisor..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#B81D24]"
                    />
                  </div>
                  <select
                    value={ideaSort}
                    onChange={(e) => setIdeaSort(e.target.value as 'newest' | 'oldest' | 'faculty')}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#B81D24]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="faculty">By Faculty Name</option>
                  </select>
                  {uniqueFaculties.length > 0 && (
                    <select
                      value={ideaFilterFaculty}
                      onChange={(e) => setIdeaFilterFaculty(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#B81D24]"
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
                    {filteredIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar url={idea.supervisor_avatar} name={idea.supervisor_name} size={9} />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{idea.supervisor_name}</p>
                            {idea.supervisor_designation && (
                              <p className="text-[10px] text-slate-400 truncate">{idea.supervisor_designation}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-sm font-black text-slate-900 leading-snug mb-1">{idea.title}</h3>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {idea.problem_statement}
                          </p>
                        </div>

                        {idea.domain && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black uppercase rounded border border-blue-100 self-start">
                            {idea.domain}
                          </span>
                        )}

                        <button
                          onClick={() => setSelectedIdea(idea)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-[#B81D24] hover:text-white hover:border-[#B81D24] text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── GROUP DETAIL VIEW (Matching UI After Student clicks view.jpeg) ── */}
        {!showIdeaPool && viewingTrackId && group && (
          <div className="flex-1 p-6 space-y-5 max-w-5xl mx-auto w-full">
            {/* Box 1: Team Member Details */}
            <Section title="Team member details">
              <div className="flex items-center gap-5 flex-wrap">
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
                    <p className="text-sm font-black text-slate-900">{group.supervisor_details.full_name}</p>
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
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">No supervisor selected yet.</p>
                    <p className="text-[11px] text-slate-400">Choose a faculty member to mentor and review your project.</p>
                  </div>
                  <button
                    onClick={() => {
                      loadSupervisors();
                      setShowSupervisorModal(true);
                    }}
                    className="px-4 py-2 border border-slate-300 hover:border-[#B81D24] hover:text-[#B81D24] text-slate-700 text-xs font-bold rounded-lg hover:bg-red-50 cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Choose Your Supervisor
                  </button>
                </div>
              )}
            </Section>

            {/* Box 3: Project Title (Propose Idea or Choose from pool) */}
            <Section title="Project Title">
              {group.latest_proposal ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900">{group.latest_proposal.title}</h3>
                      {group.latest_proposal.domain && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black uppercase rounded border border-blue-100">
                          {group.latest_proposal.domain}
                        </span>
                      )}
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

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    {group.latest_proposal.problem_statement}
                  </p>

                  {group.latest_proposal.supervisor_feedback && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                      <span className="font-bold">Supervisor Remark: </span>
                      {group.latest_proposal.supervisor_feedback}
                    </div>
                  )}

                  {group.latest_proposal.status === 'REJECTED' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setShowProposeModal(true)}
                        className="px-3 py-1.5 bg-[#B81D24] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Re-propose Idea
                      </button>
                      <button
                        onClick={() => {
                          setShowIdeaPool(true);
                          loadIdeas();
                        }}
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        Choose from Pool
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 flex-wrap py-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">No project idea finalized yet</p>
                    <p className="text-[11px] text-slate-400">
                      Propose your own custom idea or select one from the faculty idea pool.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setShowProposeModal(true)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Propose Idea
                    </button>
                    <button
                      onClick={() => {
                        setShowIdeaPool(true);
                        loadIdeas();
                      }}
                      className="px-4 py-2 bg-[#B81D24] hover:bg-[#9E181E] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                      Choose from pool
                    </button>
                  </div>
                </div>
              )}
            </Section>

            {/* Box 4: Deliverables Table (Matching UI After Student clicks view.jpeg) */}
            <Section title="Deliverables">
              <div className="overflow-x-auto">
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
          <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
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

        {/* ── DELIVERABLES TAB ── */}
        {!showIdeaPool && !viewingTrackId && activeTab === 'deliverables' && (
          <div className="flex-1 p-6 space-y-5 max-w-5xl mx-auto w-full">
            {loading ? (
              <div className="flex justify-center py-32">
                <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#B81D24] rounded-full animate-spin" />
              </div>
            ) : !group ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
                <Users className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Not in a group yet</p>
                <p className="text-xs text-slate-400">Join a project track first to access deliverable formats.</p>
                <button
                  onClick={() => setActiveTab('tracks')}
                  className="mt-2 px-4 py-2 bg-[#B81D24] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Go to My Tracks
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-xs flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar url={user?.avatar_url} name={user?.full_name} size={11} />
                    <div>
                      <p className="text-sm font-black text-slate-900">{group.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {group.track_title} · {user?.university_id}
                        {isLeader && (
                          <span className="ml-2 px-1.5 py-0.2 bg-amber-100 text-amber-700 font-bold rounded text-[9px] uppercase">
                            Leader
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">
                      {deliverablesProgress.completed} / {deliverablesProgress.total} completed
                    </span>
                    {myTrack && (
                      <button
                        onClick={() => setViewingTrackId(myTrack.id)}
                        className="px-3.5 py-2 bg-[#B81D24] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        View Group
                      </button>
                    )}
                  </div>
                </div>

                {deadlines.filter((d) => d.template_url).length > 0 && (
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3">Format Templates</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {deadlines
                        .filter((d) => d.template_url)
                        .map((d) => (
                          <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                              {d.deadline_type}
                            </span>
                            <p className="text-xs font-bold text-slate-800">{d.title}</p>
                            <a
                              href={d.template_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-[#B81D24] hover:text-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {d.template_filename || 'Download Template'}
                            </a>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
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
                {trackGroups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{g.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {g.members.length} member{g.members.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {g.members.slice(0, 4).map((m) => (
                          <Avatar key={m.id} url={m.avatar_url} name={m.full_name} size={6} />
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinGroup(g.id)}
                      disabled={joiningGroupId === g.id}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
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
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">Want to lead your own team?</p>
              <button
                onClick={() => {
                  setIsJoinListOpen(false);
                  setIsCreateGroupModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-[#B81D24] hover:bg-[#9E181E] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Group
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Choose Supervisor Modal */}
      <ChooseSupervisorModal
        open={showSupervisorModal}
        supervisors={supervisors}
        loading={supervisorsLoading}
        onClose={() => setShowSupervisorModal(false)}
        onSelect={handleSelectSupervisor}
        selectingId={selectingSupervisorId}
      />

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

      {/* Propose Idea Modal */}
      {showProposeModal && (
        <ProposeIdeaModal
          form={proposeForm}
          setForm={setProposeForm}
          techInput={proposeTechInput}
          setTechInput={setProposeTechInput}
          techSuggestions={proposeTechSuggestions}
          setTechSuggestions={setProposeTechSuggestions}
          proposeFile={proposeFile}
          setProposeFile={setProposeFile}
          onClose={() => setShowProposeModal(false)}
          onSubmit={handleSubmitProposal}
          submitting={isSubmittingProposal}
        />
      )}
    </div>
  );
}
