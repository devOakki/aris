'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Mail,
  Camera,
  UploadCloud,
  Check,
  RotateCcw,
  Briefcase,
  Phone,
  X,
  Code2,
  ExternalLink,
} from 'lucide-react';
import SkillAutocompleteInput from '@/components/SkillAutocompleteInput';
import { DOMAINS_LIST, TECHNOLOGIES_LIST } from '@/constants/skillsData';


export interface BCAProfile {
  program: 'BCA';
  department: 'Department of Computer Applications';
  semester: 1 | 2 | 3 | 4 | 5 | 6;
  specialization: 'Core' | 'Cybersecurity' | 'Data Science' | 'Full Stack Development';
  section: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export interface BTechCSEProfile {
  program: 'B.Tech CSE';
  department: 'Department of Computer Science & Engineering';
  semester: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  specialization:
  | 'Core'
  | 'Cybersecurity'
  | 'AI & Machine Learning'
  | 'Data Science';
  section: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export interface BScITProfile {
  program: 'B.Sc IT';
  department: 'Department of Computer Applications';
  semester: 1 | 2 | 3 | 4 | 5 | 6;
  specialization: 'Core' | 'AI & Data Science' | 'Animation';
  section: 'A' | 'B' | 'C';
}

export interface MCAProfile {
  program: 'MCA';
  department: 'Department of Computer Applications';
  semester: 1 | 2 | 3 | 4;
  specialization: 'Core' | 'Data Science';
  section: 'A' | 'B' | 'C';
}

export type StudentAcademicProfile =
  | BCAProfile
  | BTechCSEProfile
  | MCAProfile
  | BScITProfile;

export type ProgramName = StudentAcademicProfile['program'];
export type DepartmentName = StudentAcademicProfile['department'];
export type SpecializationName = StudentAcademicProfile['specialization'];
export type SemesterNumber = StudentAcademicProfile['semester'];
export type SectionDesignation = StudentAcademicProfile['section'];


export interface SupervisorProfile {
  department:
  | 'Department of Computer Applications'
  | 'Department of Computer Science & Engineering';

  designation:
  | 'Assistant Professor'
  | 'Associate Professor'
  | 'Professor';

  expertise_domains: string[];
  expertise_tech: string[];
  max_groups: number;
}

export const ACADEMIC_PROGRAMS = {
  'BCA': {
    department: 'Department of Computer Applications',
    totalSemesters: 6,
    specializations: ['Core', 'Cybersecurity', 'Data Science', 'Full Stack Development'] as const,
    sections: ['A', 'B', 'C', 'D', 'E', 'F'] as const,
  },
  'B.Tech CSE': {
    department: 'Department of Computer Science & Engineering',
    totalSemesters: 8,
    specializations: ['Core', 'Cybersecurity', 'AI & Machine Learning', 'Data Science'] as const,
    sections: ['A', 'B', 'C', 'D', 'E', 'F'] as const,
  },
  'B.Sc IT': {
    department: 'Department of Computer Applications',
    totalSemesters: 6,
    specializations: ['Core', 'AI & Data Science', 'Animation'] as const,
    sections: ['A', 'B', 'C'] as const,
  },
  'MCA': {
    department: 'Department of Computer Applications',
    totalSemesters: 4,
    specializations: ['Core', 'Data Science'] as const,
    sections: ['A', 'B', 'C'] as const,
  },
} as const;

export const getDepartmentFromProgram = (prog: ProgramName): DepartmentName => {
  return ACADEMIC_PROGRAMS[prog].department;
};

export default function AuthPage() {
  const router = useRouter();
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  // Active View Mode (Institutional Sign-in vs Registration)
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [formUnlocked, setFormUnlocked] = useState<boolean>(false);

  // Sign In Credentials (strictly empty on load, no defaults)
  const [signInId, setSignInId] = useState<string>('');
  const [signInPassword, setSignInPassword] = useState<string>('');
  const [showSignInPassword, setShowSignInPassword] = useState<boolean>(false);

  // Registration Flow State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [role, setRole] = useState<'STUDENT' | 'SUPERVISOR'>('STUDENT');

  const [universityId, setUniversityId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(0);

  const [selectedProgram, setSelectedProgram] = useState<ProgramName>('BCA');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('Core');
  const [selectedSemester, setSelectedSemester] = useState<number>(5);
  const [selectedSection, setSelectedSection] = useState<string>('A');

  const [supDepartment, setSupDepartment] = useState<SupervisorProfile['department']>('Department of Computer Applications');
  const [supDesignation, setSupDesignation] = useState<SupervisorProfile['designation']>('Assistant Professor');
  const [domainInput, setDomainInput] = useState<string>('');
  const [domains, setDomains] = useState<string[]>([]);
  const [techInput, setTechInput] = useState<string>('');
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [maxGroups, setMaxGroups] = useState<number>(5);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isFaceScanning, setIsFaceScanning] = useState<boolean>(false);
  const [faceCheckStatus, setFaceCheckStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [faceCheckMessage, setFaceCheckMessage] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const sanitizeText = (input: string): string => {
    return input.replace(/<[^>]*>?/gm, '').trim();
  };

  const handleUniversityIdChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setUniversityId(cleaned);
  };

  // Reset fields on auth mode change to prevent any residual credential retention
  useEffect(() => {
    setSignInId('');
    setSignInPassword('');
    setUniversityId('');
    setPassword('');
    setEmail('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setDomains([]);
    setTechnologies([]);
    setErrorMessage('');
    setSuccessMessage('');
    setFormUnlocked(false);
  }, [authMode]);

  //OTP Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  //OTP Function
  const handleSendOtp = () => {
    const cleanEmail = sanitizeText(email).toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid institutional email address before requesting an OTP.');
      return;
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsOtpSent(true);
    setResendTimer(60);

    // Development preview
    setSuccessMessage(`Verification code sent to ${cleanEmail}! (Dev code: ${code})`);
  };


  const handleVerifyOtp = () => {
    if (enteredOtp.trim() === generatedOtp) {
      setIsEmailVerified(true);
      setErrorMessage('');
      setSuccessMessage('Email verified successfully! Proceeding to Academic details.');
      setTimeout(() => {
        setSuccessMessage('');
        setCurrentStep(3);
      }, 500);
    } else {
      setErrorMessage('Invalid verification code. Please check your email and try again.');
    }
  };



  //Face Detection
  const handlePhotoSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage('');
    setFaceCheckStatus('idle');
    setFaceCheckMessage('');

    // Pre-flight file security check: MIME type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Security Alert: Only valid image files (JPG, PNG, WebP) are allowed.');
      return;
    }

    // Pre-flight file security check: Size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5MB limit.');
      return;
    }

    // Create temporary browser memory URL for preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsFaceScanning(true);
    setFaceCheckMessage('Scanning photo for human face verification...');
    // Load image into memory to analyze pixel distribution
    const img = new Image();
    img.src = previewUrl;
    img.onload = async () => {
      try {
        let isFaceDetected = false;
        // METHOD A: Native Browser Shape Detection API (if supported by modern browser)
        if ('FaceDetector' in window) {
          try {
            // @ts-expect-error - FaceDetector is an experimental modern browser API
            const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
            const faces = await detector.detect(img);
            if (faces && faces.length > 0) {
              isFaceDetected = true;
            }
          } catch {
            isFaceDetected = false;
          }
        }
        // METHOD B: Canvas Pixel Heuristic (Biometric Skin & Oval Symmetry)
        if (!isFaceDetected) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 120;
          canvas.height = 120;
          if (ctx) {
            ctx.drawImage(img, 0, 0, 120, 120);
            const imageData = ctx.getImageData(0, 0, 120, 120);
            const data = imageData.data;
            let humanSkinPixels = 0;
            const totalSampledPixels = data.length / 4;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              // Biometric Skin-Tone Color Space (Peacock / Kovac Algorithm)
              const isSkin =
                r > 95 && g > 40 && b > 20 &&
                (Math.max(r, g, b) - Math.min(r, g, b)) > 15 &&
                Math.abs(r - g) > 15 &&
                r > g && r > b;
              if (isSkin) humanSkinPixels++;
            }
            const skinRatio = humanSkinPixels / totalSampledPixels;
            // Real human passport portraits have between 12% and 70% natural skin pixels
            // Anime / Cartoons / Scenery score either <5% or >85% (solid flat palette)
            if (skinRatio >= 0.12 && skinRatio <= 0.70) {
              isFaceDetected = true;
            }
          }
        }
        setIsFaceScanning(false);
        if (isFaceDetected) {
          setFaceCheckStatus('success');
          setFaceCheckMessage('Human face verified. Meets institutional portrait standards.');
          setAvatarFile(file);
        } else {
          setFaceCheckStatus('failed');
          setFaceCheckMessage('No human face detected. Anime, cartoon, or scenery photos are rejected.');
          setAvatarFile(null);
        }
      } catch {
        setIsFaceScanning(false);
        setFaceCheckStatus('success'); // Graceful fallback
        setAvatarFile(file);
      }
    };
  };

  const handleAddDomain = (customDomain?: string) => {
    const target = customDomain !== undefined ? customDomain : domainInput;
    const trimmed = sanitizeText(target);
    if (trimmed && !domains.includes(trimmed)) {
      setDomains((prev) => [...prev, trimmed]);
      setDomainInput('');
    }
  };
  const handleRemoveDomain = (tagToRemove: string) => {
    setDomains((prev) => prev.filter((d) => d !== tagToRemove));
  };
  const handleAddTech = (customTech?: string) => {
    const target = customTech !== undefined ? customTech : techInput;
    const trimmed = sanitizeText(target);
    if (trimmed && !technologies.includes(trimmed)) {
      setTechnologies((prev) => [...prev, trimmed]);
      setTechInput('');
    }
  };
  const handleRemoveTech = (tagToRemove: string) => {
    setTechnologies((prev) => prev.filter((t) => t !== tagToRemove));
  };


  // ─── 4. INSTITUTIONAL SIGN-IN HANDLER ─────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!signInId.trim() || !signInPassword) {
      setErrorMessage('Please enter both University ID and Password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university_id: signInId.trim().toUpperCase(),
          password: signInPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid University ID or password.');
      }
      // Store JWT Authentication & Session state in localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('aris_user', JSON.stringify(data.user));
      setSuccessMessage(`Welcome back, ${data.user.full_name}! Redirecting to workspace...`);
      // Role-based routing (replace prevents back-button returning to login page)
      setTimeout(() => {
        const userRole = data.user.role;
        if (userRole === 'STUDENT') {
          router.replace('/dashboard/student');
        } else if (userRole === 'SUPERVISOR') {
          router.replace('/dashboard/supervisor');
        } else if (userRole === 'HOD') {
          router.replace('/dashboard/hod');
        } else if (userRole === 'DEAN') {
          router.replace('/dashboard/dean');
        } else {
          router.replace('/dashboard');
        }
      }, 700);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to connect to university server. Please ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };
  // ─── 5. INSTITUTIONAL 4-STEP REGISTRATION HANDLER ──────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    // Pre-flight Validations
    if (!isEmailVerified) {
      setErrorMessage('Please verify your email via OTP before submitting registration.');
      setCurrentStep(2);
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please provide your full legal name.');
      setCurrentStep(1);
      return;
    }
    setLoading(true);
    try {

      const resolvedDepartment =
        role === 'STUDENT'
          ? getDepartmentFromProgram(selectedProgram)
          : supDepartment;

      // 1. Upload portrait to Cloudinary if available
      let uploadedAvatarUrl = '';
      if (avatarFile && faceCheckStatus === 'success') {
        try {
          const formData = new FormData();
          formData.append('file', avatarFile);
          const uploadRes = await fetch('http://127.0.0.1:8000/api/submissions/upload-portrait/', {
            method: 'POST',
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedAvatarUrl = uploadData.secure_url || '';
          }
        } catch (e) {
          console.warn('Pre-registration portrait upload error:', e);
        }
      }

      // 2. Build registration payload
      const registrationPayload = {
        university_id: universityId.trim().toUpperCase(),
        email: email.toLowerCase().trim(),
        password: password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        role: role,
        department: resolvedDepartment,
        program: role === 'STUDENT' ? selectedProgram : '',
        semester: role === 'STUDENT' ? selectedSemester : undefined,
        designation: role === 'SUPERVISOR' ? supDesignation : '',
        max_groups: role === 'SUPERVISOR' ? maxGroups : undefined,
        expertise_domains: role === 'SUPERVISOR' ? domains : [],
        expertise_tech: role === 'SUPERVISOR' ? technologies : [],
        avatar_url: uploadedAvatarUrl,
      };

      const res = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationPayload),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorDetails = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
          .join(' | ');
        throw new Error(errorDetails || 'Registration failed. Please review your details.');
      }

      // 3. Supervisors require HOD approval before login
      if (role === 'SUPERVISOR') {
        setAuthMode('signin');
        setCurrentStep(1);
        setPassword('');
        setSuccessMessage(
          `Faculty registration submitted successfully! Your application has been routed to the Head of Department (HOD) of ${resolvedDepartment} for verification. Your credentials will become active once approved by the HOD.`
        );
        return;
      }

      // 4. Students can log in immediately
      setSuccessMessage('Account registered successfully! Logging you in...');

      const loginRes = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university_id: universityId.trim().toUpperCase(),
          password: password,
        }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        const accessToken = loginData.access;
        if (uploadedAvatarUrl && loginData.user) {
          loginData.user.avatar_url = uploadedAvatarUrl;
        }
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', loginData.refresh);
        localStorage.setItem('aris_user', JSON.stringify(loginData.user));

        setTimeout(() => {
          router.replace('/dashboard/student');
        }, 800);
      } else {
        setAuthMode('signin');
        setSuccessMessage('Account created! Please sign in with your credentials.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── 6. JSX RENDER (OFFICIAL DBUU WHITE & CRIMSON RED THEME) ───────
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-100 text-slate-800 font-sans">
      {/* ── 1. OFFICIAL DBUU INSTITUTIONAL NAVBAR ─────────────────────── */}
      <header className="w-full bg-white border-b border-slate-200 z-20 shadow-xs">
        {/* Top White Bar with Official Logo (Thicker & Cleaner) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.jpeg"
              alt="Dev Bhoomi Uttarakhand University"
              className="h-12 sm:h-14 w-auto object-contain"
            />
            <div className="hidden sm:block pl-4 border-l-2 border-slate-300">
              <div className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase">
                Academic Repository &amp; Institutional System (ARIS)
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Project Governance &amp; Evaluation Portal
              </div>
            </div>
          </div>
        </div>

        {/* Official Crimson Red Sub-Bar (Thicker) */}
        <div className="w-full bg-[#B81D24] text-white py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm font-bold uppercase tracking-wider">
            <div className="flex items-center gap-3">
              <span>Institutional Portal Gateway</span>
              <span className="text-red-200 hidden sm:inline">|</span>
              <span className="text-red-100 font-normal normal-case hidden sm:inline">
                School of Engineering and Computing (SoEC)
              </span>
            </div>
            <div className="text-red-100 font-mono text-xs">
              Session: 2026-27
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. BODY CONTENT (Campus Background + Boxy White & Red Card) ── */}
      <main
        className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('/images/dbuu_campus.jpg')" }}
      >
        {/* Dark Collegiate Overlay */}
        <div className="absolute inset-0 bg-[#07111E]/75 backdrop-blur-[1px]" />

        {/* Main Boxy Card (No text above, clean red top stripe) */}
        <div className="w-full max-w-xl bg-white border border-slate-300 border-t-4 border-t-[#B81D24] rounded-sm p-6 sm:p-8 shadow-2xl z-10 text-slate-800">
          {/* Top Switcher: Boxy Segmented Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-300 rounded-sm mb-6 text-xs font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2.5 rounded-sm transition-colors text-center cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-[#B81D24] text-white font-extrabold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Institutional Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2.5 rounded-sm transition-colors text-center cursor-pointer ${
                authMode === 'register'
                  ? 'bg-[#B81D24] text-white font-extrabold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              New Registration
            </button>
          </div>

          {/* Global Feedback Banners */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-sm bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-sm bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* VIEW 1: INSTITUTIONAL SIGN-IN                                */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {authMode === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  University ID (ERP / Employee ID)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    readOnly={!formUnlocked}
                    onFocus={(e) => {
                      e.currentTarget.readOnly = false;
                      setFormUnlocked(true);
                    }}
                    onClick={(e) => {
                      e.currentTarget.readOnly = false;
                      setFormUnlocked(true);
                    }}
                    name="aris_erp_user_code"
                    id="aris_erp_user_code"
                    autoComplete="off"
                    placeholder="e.g., DBUU2023BCA001"
                    value={signInId}
                    onChange={(e) => setSignInId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24] focus:ring-1 focus:ring-[#B81D24] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    required
                    readOnly={!formUnlocked}
                    onFocus={(e) => {
                      e.currentTarget.readOnly = false;
                      setFormUnlocked(true);
                    }}
                    onClick={(e) => {
                      e.currentTarget.readOnly = false;
                      setFormUnlocked(true);
                    }}
                    name="aris_erp_user_token"
                    id="aris_erp_user_token"
                    autoComplete="new-password"
                    placeholder="Enter institutional password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-sm pl-9 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24] focus:ring-1 focus:ring-[#B81D24] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-sm bg-[#B81D24] hover:bg-[#9E181E] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to ARIS'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* ── MEET THE DEVELOPER SECTION ────────────────────────── */}
              <div className="mt-5 pt-4 border-t-2 border-slate-200">
                <div className="flex items-center gap-2 mb-2.5">
                  <Code2 className="w-3.5 h-3.5 text-[#B81D24]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B81D24]">
                    Meet the Developer
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      Akhil Puri
                      <span className="text-[9px] uppercase font-mono px-1 py-0.5 bg-red-100 text-[#B81D24] border border-red-200 rounded-sm font-bold">
                        BCA (2024-27)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dept. of Computer Applications • Dev Bhoomi Uttarakhand University
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://github.com/devOakki"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-semibold rounded-sm transition-colors shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      GitHub
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/akhil-puri"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0A66C2] hover:bg-[#084e96] text-white text-[11px] font-semibold rounded-sm transition-colors shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.46 1.46 0 1 0 0-2.92 1.46 1.46 0 0 0 0 2.92M7.86 18.5v-8.37H5.07v8.37h2.79z" />
                      </svg>
                      LinkedIn
                      <ExternalLink className="w-2.5 h-2.5 text-blue-200" />
                    </a>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* VIEW 2: PROGRESSIVE 4-STEP REGISTRATION                      */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {authMode === 'register' && (
            <div>
              {/* Boxy 4-Step Progress Tracker */}
              <div className="mb-5">
                <div className="grid grid-cols-4 gap-1 text-[11px] font-bold uppercase tracking-wider mb-2 text-center">
                  <div className={`p-1 border-b-2 ${currentStep >= 1 ? 'border-[#B81D24] text-[#B81D24]' : 'border-slate-300 text-slate-400'}`}>
                    1. Identity
                  </div>
                  <div className={`p-1 border-b-2 ${currentStep >= 2 ? 'border-[#B81D24] text-[#B81D24]' : 'border-slate-300 text-slate-400'}`}>
                    2. OTP
                  </div>
                  <div className={`p-1 border-b-2 ${currentStep >= 3 ? 'border-[#B81D24] text-[#B81D24]' : 'border-slate-300 text-slate-400'}`}>
                    3. Academic
                  </div>
                  <div className={`p-1 border-b-2 ${currentStep >= 4 ? 'border-[#B81D24] text-[#B81D24]' : 'border-slate-300 text-slate-400'}`}>
                    4. Photo
                  </div>
                </div>
              </div>

              {/* ── STEP 1: INSTITUTIONAL IDENTITY ────────────────────── */}
              {currentStep === 1 && (
                <div className="space-y-3.5">
                  {/* Role Switcher (Boxy) */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Institutional Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('STUDENT')}
                        className={`py-2 rounded-sm text-xs font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                          role === 'STUDENT'
                            ? 'bg-blue-50 border-2 border-[#1A4DBE] text-[#1A4DBE]'
                            : 'bg-slate-50 border border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('SUPERVISOR')}
                        className={`py-2 rounded-sm text-xs font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                          role === 'SUPERVISOR'
                            ? 'bg-red-50 border-2 border-[#B81D24] text-[#B81D24]'
                            : 'bg-slate-50 border border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                        Faculty Supervisor
                      </button>
                    </div>
                  </div>

                  {/* University ERP / Employee ID */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {role === 'STUDENT' ? 'University ERP ID' : 'Faculty Employee ID'}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        readOnly={!formUnlocked}
                        onFocus={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        onClick={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        autoComplete="off"
                        name="aris_reg_univ_id"
                        placeholder={role === 'STUDENT' ? 'e.g., DBUU2023BCA101' : 'e.g., EMP9824'}
                        value={universityId}
                        onChange={(e) => handleUniversityIdChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24] focus:ring-1 focus:ring-[#B81D24]"
                      />
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        readOnly={!formUnlocked}
                        onFocus={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        onClick={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        autoComplete="off"
                        name="aris_reg_first_name"
                        placeholder="e.g., Rajesh"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24] focus:ring-1 focus:ring-[#B81D24]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        readOnly={!formUnlocked}
                        onFocus={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        onClick={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        autoComplete="off"
                        name="aris_reg_last_name"
                        placeholder="e.g., Sharma"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24] focus:ring-1 focus:ring-[#B81D24]"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        readOnly={!formUnlocked}
                        onFocus={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        onClick={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        autoComplete="off"
                        name="aris_reg_email_addr"
                        placeholder="e.g., r.sharma@dbuu.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24] focus:ring-1 focus:ring-[#B81D24]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Contact Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        readOnly={!formUnlocked}
                        onFocus={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        onClick={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        autoComplete="off"
                        name="aris_reg_phone_num"
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24] focus:ring-1 focus:ring-[#B81D24]"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        readOnly={!formUnlocked}
                        onFocus={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        onClick={(e) => {
                          e.currentTarget.readOnly = false;
                          setFormUnlocked(true);
                        }}
                        autoComplete="new-password"
                        name="aris_reg_pass_secret"
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-sm pl-9 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24] focus:ring-1 focus:ring-[#B81D24]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!universityId.trim() || !firstName.trim() || !lastName.trim() || !email.trim() || password.length < 6) {
                        setErrorMessage('Please fill in all mandatory fields (Password must be at least 6 characters).');
                        return;
                      }
                      setErrorMessage('');
                      handleSendOtp();
                      setCurrentStep(2);
                    }}
                    className="w-full mt-2 py-2.5 rounded-sm bg-[#B81D24] hover:bg-[#9E181E] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Proceed to Email Verification
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── STEP 2: EMAIL OTP VERIFICATION ────────────────────── */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-center">
                    <Mail className="w-6 h-6 text-[#B81D24] mx-auto mb-1.5" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Email Verification Required</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      A 6-digit OTP was dispatched to <span className="text-[#B81D24] font-mono font-bold">{email}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="489201"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-sm px-4 py-2.5 text-center text-lg font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#B81D24] focus:ring-1 focus:ring-[#B81D24]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      disabled={resendTimer > 0}
                      onClick={handleSendOtp}
                      className="text-[#B81D24] font-semibold hover:underline disabled:text-slate-400 disabled:no-underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Edit Email
                    </button>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="w-1/3 py-2.5 rounded-sm border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="w-2/3 py-2.5 rounded-sm bg-[#B81D24] hover:bg-[#9E181E] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Verify &amp; Continue
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: ACADEMIC PROFILE / FACULTY MATRIX ───────────── */}
              {currentStep === 3 && (
                <div className="space-y-3.5">
                  {/* A. STUDENT PROFILE */}
                  {role === 'STUDENT' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Academic Degree Program
                        </label>
                        <select
                          value={selectedProgram}
                          onChange={(e) => {
                            const prog = e.target.value as ProgramName;
                            setSelectedProgram(prog);
                            setSelectedSpecialization(ACADEMIC_PROGRAMS[prog].specializations[0]);
                            setSelectedSection(ACADEMIC_PROGRAMS[prog].sections[0]);
                            if (selectedSemester > ACADEMIC_PROGRAMS[prog].totalSemesters) {
                              setSelectedSemester(ACADEMIC_PROGRAMS[prog].totalSemesters);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#B81D24]"
                        >
                          {(Object.keys(ACADEMIC_PROGRAMS) as ProgramName[]).map((prog) => (
                            <option key={prog} value={prog}>
                              {prog}
                            </option>
                          ))}
                        </select>
                      </div>

                     
                      <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-sm flex items-center justify-between">
                        <span className="text-xs text-amber-800 font-medium">Assigned Department:</span>
                        <span className="text-xs font-bold text-[#B81D24]">
                          {getDepartmentFromProgram(selectedProgram)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Current Semester
                          </label>
                          <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#B81D24]"
                          >
                            {Array.from(
                              { length: ACADEMIC_PROGRAMS[selectedProgram].totalSemesters },
                              (_, i) => i + 1
                            ).map((sem) => (
                              <option key={sem} value={sem}>
                                Semester {sem}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Section
                          </label>
                          <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#B81D24]"
                          >
                            {ACADEMIC_PROGRAMS[selectedProgram].sections.map((sec) => (
                              <option key={sec} value={sec}>
                                Section {sec}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Academic Specialization / Track
                        </label>
                        <select
                          value={selectedSpecialization}
                          onChange={(e) => setSelectedSpecialization(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#B81D24]"
                        >
                          {ACADEMIC_PROGRAMS[selectedProgram].specializations.map((spec) => (
                            <option key={spec} value={spec}>
                              {spec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                 
                  {role === 'SUPERVISOR' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Academic Department
                        </label>
                        <select
                          value={supDepartment}
                          onChange={(e) => setSupDepartment(e.target.value as SupervisorProfile['department'])}
                          className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#B81D24]"
                        >
                          <option value="Department of Computer Applications">
                            Department of Computer Applications
                          </option>
                          <option value="Department of Computer Science & Engineering">
                            Department of Computer Science & Engineering
                          </option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Designation
                          </label>
                          <select
                            value={supDesignation}
                            onChange={(e) => setSupDesignation(e.target.value as SupervisorProfile['designation'])}
                            className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#B81D24]"
                          >
                            <option value="">Select Designation</option>
                            <option value="Assistant Professor">Assistant Professor</option>
                            <option value="Associate Professor">Associate Professor</option>
                            <option value="Professor">Professor</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Max Groups
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            placeholder="5"
                            value={maxGroups}
                            onChange={(e) => setMaxGroups(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#B81D24]"
                          />
                        </div>
                      </div>

                      
                      <SkillAutocompleteInput
                        label="DOMAINS OF EXPERTISE"
                        placeholder="e.g., Cloud Computing"
                        selectedItems={domains}
                        onAddItem={handleAddDomain}
                        onRemoveItem={handleRemoveDomain}
                        masterList={DOMAINS_LIST}
                        badgeColorTheme="blue"
                        helperHint="Select from suggestions or add custom"
                      />

                      
                      <SkillAutocompleteInput
                        label="TECHNOLOGIES & FRAMEWORKS"
                        placeholder="e.g., Next.js, Django, PyTorch (type to search)"
                        selectedItems={technologies}
                        onAddItem={handleAddTech}
                        onRemoveItem={handleRemoveTech}
                        masterList={TECHNOLOGIES_LIST}
                        badgeColorTheme="red"
                        helperHint="Select from suggestions or add custom"
                      />
                    </>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-1/3 py-2.5 rounded-sm border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="w-2/3 py-2.5 rounded-sm bg-[#B81D24] hover:bg-[#9E181E] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Proceed to Portrait
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

             
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Upload Institutional Portrait</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Official passport-style photo with client-side human face validation.
                    </p>
                  </div>

                 
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-300 rounded-sm">
                    <div className="relative w-28 h-28 rounded-sm overflow-hidden border-2 border-slate-300 bg-white flex items-center justify-center mb-3 shadow-inner">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarPreview}
                          alt="Portrait Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-400" />
                      )}

                      {isFaceScanning && (
                        <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-[11px] text-white font-bold">
                          Scanning Face...
                        </div>
                      )}
                    </div>

                   
                    {faceCheckStatus === 'success' && (
                      <div className="mb-3 px-2.5 py-1 rounded-sm bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {faceCheckMessage}
                      </div>
                    )}

                    {faceCheckStatus === 'failed' && (
                      <div className="mb-3 px-2.5 py-1 rounded-sm bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        {faceCheckMessage}
                      </div>
                    )}

                    <label className="cursor-pointer px-3.5 py-2 rounded-sm bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-2 border border-slate-300 shadow-xs">
                      <UploadCloud className="w-4 h-4 text-[#B81D24]" />
                      {avatarFile ? 'Change Portrait' : 'Select Photo File (JPG / PNG)'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoSelection}
                        className="hidden"
                      />
                    </label>

                    <p className="text-[10px] text-slate-500 mt-2 text-center max-w-xs">
                      Institutional Standard: Natural frontal lighting. Anime or scenery photos are rejected.
                    </p>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="w-1/3 py-2.5 rounded-sm border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={loading || faceCheckStatus === 'failed'}
                      onClick={handleRegister}
                      className="w-2/3 py-2.5 rounded-sm bg-[#B81D24] hover:bg-[#9E181E] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        'Registering Account...'
                      ) : faceCheckStatus === 'failed' ? (
                        'Human Portrait Required'
                      ) : (
                        <>
                          Complete Registration
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="w-full py-6 bg-[#0F2137] text-slate-300 border-t-2 border-[#B81D24] z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="font-bold text-white tracking-wide">
            © 2026 Dev Bhoomi Uttarakhand University • Dehradun
          </div>
          <div className="text-slate-400 text-xs">
            Academic Repository &amp; Institutional System (ARIS) • Project Governance Portal
          </div>
        </div>
      </footer>
    </div>
  );
}