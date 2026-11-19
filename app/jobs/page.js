'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Freelance',
  'Temporary'
];

const WORKPLACE_TYPES = ['On-site', 'Remote', 'Hybrid'];

const EXPERIENCE_LEVELS = [
  'No Experience',
  'Entry Level',
  'Junior Level',
  'Mid-Level',
  'Senior Level',
  'Manager',
  'Director'
];

const JOB_CATEGORIES = [
  'Software & IT',
  'Design & Creative',
  'Marketing & Growth',
  'Sales & Business',
  'Finance & Accounting',
  'Education & Training',
  'Operations & Admin',
  'Customer Support',
  'Engineering',
  'Other'
];

const CURRENCIES = ['PKR', 'USD', 'GBP', 'EUR', 'AED', 'SAR', 'CAD', 'AUD'];
const SALARY_PERIODS = ['Hourly', 'Weekly', 'Monthly', 'Yearly'];
const APPLICATION_STATUSES = [
  'Submitted',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Rejected',
  'Hired'
];

const EMPTY_JOB_FORM = {
  id: null,
  title: '',
  company_name: '',
  category: 'Software & IT',
  vacancies: 1,
  job_type: 'Full-time',
  workplace_type: 'Remote',
  experience_level: 'Junior Level',
  skillsText: '',
  description: '',
  company_logo_url: '',
  required_education: '',
  responsibilities: '',
  qualifications: '',
  benefits: '',
  country: 'Pakistan',
  state_province: '',
  city: '',
  salary_min: '',
  salary_max: '',
  currency: 'PKR',
  salary_period: 'Monthly',
  apply_method: 'shanora', // 'shanora' | 'website' | 'email'
  apply_link: '',
  application_email: '',
  application_deadline: '',
  application_instructions: ''
};

function computeEffectiveStatus(job) {
  const rawStatus = job.status || (job.is_draft ? 'Draft' : 'Active');
  if (rawStatus === 'Draft' || rawStatus === 'Closed') return rawStatus;
  if (job.application_deadline) {
    const deadlineMs = new Date(job.application_deadline).getTime();
    if (!Number.isNaN(deadlineMs) && Date.now() > deadlineMs) {
      return 'Expired';
    }
  }
  return 'Active';
}

function formatSalary(job) {
  const min = job.salary_min;
  const max = job.salary_max;
  const curr = job.currency || 'PKR';
  const period = job.salary_period ? `/${job.salary_period.toLowerCase()}` : '';
  if (min && max) return `${curr} ${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}${period}`;
  if (min) return `From ${curr} ${Number(min).toLocaleString()}${period}`;
  if (max) return `Up to ${curr} ${Number(max).toLocaleString()}${period}`;
  return job.salary_range || job.salary || 'Negotiable';
}

function JobsContent() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [verifiedCompaniesSet, setVerifiedCompaniesSet] = useState(new Set());

  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [employerApplications, setEmployerApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'employer' | 'my_apps'
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedWorkplace, setSelectedWorkplace] = useState('All');
  const [banner, setBanner] = useState(null);

  // Two-Step Job Form + Preview Modal
  const [showJobModal, setShowJobModal] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1 | 2
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);
  const [savingJob, setSavingJob] = useState(false);

  // Apply Modal State
  const [activeApplyJob, setActiveApplyJob] = useState(null);
  const [applyForm, setApplyForm] = useState({
    applicant_name: '',
    applicant_email: '',
    phone: '',
    city: '',
    experience: '',
    resume_link: '',
    cover_note: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [submittingApp, setSubmittingApp] = useState(false);

  // Employer Applicants & Interview Modal
  const [viewingApplicantsJob, setViewingApplicantsJob] = useState(null);
  const [interviewDates, setInterviewDates] = useState({});

  // Report Job Modal
  const [reportingJob, setReportingJob] = useState(null);
  const [reportReason, setReportReason] = useState('Fake or Misleading Job');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const notify = useCallback((type, text) => {
    setBanner({ type, text });
    setTimeout(() => {
      setBanner((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  }, []);

  const createNotification = useCallback(async ({
    recipientEmail,
    senderName,
    senderEmail,
    actionType,
    content,
    jobId
  }) => {
    if (!recipientEmail) return;
    try {
      await supabase.from('notifications').insert([
        {
          recipient_email: recipientEmail.trim().toLowerCase(),
          sender_name: senderName || 'SHANORA',
          sender_email: senderEmail ? senderEmail.trim().toLowerCase() : null,
          action_type: actionType,
          content,
          job_id: jobId ? String(jobId) : null,
          is_read: false
        }
      ]);
    } catch (err) {
      console.error('Notification insert warning:', err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let user = session?.user || null;
      if (!user) {
        const { data: uData } = await supabase.auth.getUser();
        user = uData?.user || null;
      }
      setCurrentUser(user);

      // Load verified companies from profiles
      const { data: verifiedProfs } = await supabase
        .from('profiles')
        .select('company_name, is_verified, verified, verification_status')
        .or('is_verified.eq.true,verified.eq.true,verification_status.eq.approved');

      const vSet = new Set();
      (verifiedProfs || []).forEach((p) => {
        if (p.company_name) vSet.add(p.company_name.trim().toLowerCase());
      });
      setVerifiedCompaniesSet(vSet);

      // Load jobs & auto-expire past deadline active jobs
      const { data: rawJobs, error: jobsErr } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsErr) throw jobsErr;

      const normalizedJobs = [];
      for (const j of rawJobs || []) {
        const computed = computeEffectiveStatus(j);
        if (computed === 'Expired' && j.status !== 'Expired') {
          await supabase.from('jobs').update({ status: 'Expired' }).eq('id', j.id);
          normalizedJobs.push({ ...j, status: 'Expired' });
        } else {
          normalizedJobs.push({ ...j, status: computed });
        }
      }
      setJobs(normalizedJobs);

      if (user) {
        const emailLower = (user.email || '').trim().toLowerCase();

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${user.id},email.eq.${emailLower}`)
          .maybeSingle();

        setUserProfile(prof || null);

        const { data: candApps } = await supabase
          .from('job_applications')
          .select('*')
          .or(`applicant_id.eq.${user.id},applicant_email.eq.${emailLower}`)
          .order('created_at', { ascending: false });

        setMyApplications(candApps || []);

        const { data: empApps } = await supabase
          .from('job_applications')
          .select('*')
          .eq('employer_id', user.id)
          .order('created_at', { ascending: false });

        setEmployerApplications(empApps || []);
      } else {
        setUserProfile(null);
        setMyApplications([]);
        setEmployerApplications([]);
      }
    } catch (err) {
      console.error('Error loading jobs system:', err);
      notify('error', 'Failed to load jobs data.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Realtime subscription for applications & notifications
  useEffect(() => {
    const channel = supabase
      .channel('shanora-jobs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_applications' },
        () => {
          loadAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAllData]);

  function openNewJobModal() {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    setJobForm({
      ...EMPTY_JOB_FORM,
      company_name: userProfile?.company_name || '',
      city: userProfile?.city || '',
      country: userProfile?.country || 'Pakistan',
      application_email: currentUser.email || ''
    });
    setFormStep(1);
    setIsPreviewMode(false);
    setShowJobModal(true);
  }

  function openEditJobModal(job) {
    setJobForm({
      id: job.id,
      title: job.title || '',
      company_name: job.company_name || job.company || '',
      category: job.category || 'Software & IT',
      vacancies: job.vacancies || 1,
      job_type: job.job_type || job.type || 'Full-time',
      workplace_type: job.workplace_type || job.workplace || 'Remote',
      experience_level: job.experience_level || 'Junior Level',
      skillsText: Array.isArray(job.requirements) ? job.requirements.join(', ') : '',
      description: job.description || '',
      company_logo_url: job.company_logo_url || '',
      required_education: job.required_education || '',
      responsibilities: job.responsibilities || '',
      qualifications: job.qualifications || '',
      benefits: job.benefits || '',
      country: job.country || 'Pakistan',
      state_province: job.state_province || '',
      city: job.city || '',
      salary_min: job.salary_min ?? '',
      salary_max: job.salary_max ?? '',
      currency: job.currency || 'PKR',
      salary_period: job.salary_period || 'Monthly',
      apply_method: job.apply_method || 'shanora',
      apply_link: job.apply_link || '',
      application_email: job.application_email || job.contact_email || '',
      application_deadline: job.application_deadline
        ? new Date(job.application_deadline).toISOString().slice(0, 16)
        : '',
      application_instructions: job.application_instructions || ''
    });
    setFormStep(1);
    setIsPreviewMode(false);
    setShowJobModal(true);
  }

  function validateStep1() {
    if (!jobForm.title.trim()) return 'Job Title is required.';
    if (!jobForm.company_name.trim()) return 'Company Name is required.';
    if (!jobForm.description.trim()) return 'Job Description is required.';
    if (!jobForm.skillsText.trim()) return 'Please list at least one required skill.';
    return null;
  }

  function validateStep2(isDraft) {
    if (isDraft) return null;
    if (!jobForm.country.trim()) return 'Country is required before publishing.';
    if (!jobForm.city.trim()) return 'City is required before publishing.';
    if (jobForm.apply_method === 'website' && !jobForm.apply_link.trim()) {
      return 'External Application URL is required for website applications.';
    }
    if (jobForm.apply_method === 'email' && !jobForm.application_email.trim()) {
      return 'Application Email is required for email applications.';
    }
    return null;
  }

  function handleNextStep() {
    const err = validateStep1();
    if (err) {
      notify('error', err);
      return;
    }
    setFormStep(2);
  }

  function handleTogglePreview() {
    if (!isPreviewMode) {
      const s1Err = validateStep1();
      if (s1Err) {
        notify('error', s1Err);
        return;
      }
    }
    setIsPreviewMode((prev) => !prev);
  }

  async function handleSaveJob(saveAsDraft) {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    const s1Err = validateStep1();
    if (s1Err) {
      notify('error', s1Err);
      setFormStep(1);
      setIsPreviewMode(false);
      return;
    }

    const s2Err = validateStep2(saveAsDraft);
    if (s2Err) {
      notify('error', s2Err);
      setFormStep(2);
      setIsPreviewMode(false);
      return;
    }

    setSavingJob(true);
    try {
      const skillsArray = jobForm.skillsText
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      // Duplicate job check for new active jobs
      if (!jobForm.id && !saveAsDraft) {
        const dup = jobs.find(
          (existing) =>
            existing.status !== 'Draft' &&
            (existing.title || '').trim().toLowerCase() === jobForm.title.trim().toLowerCase() &&
            (existing.company_name || existing.company || '').trim().toLowerCase() ===
              jobForm.company_name.trim().toLowerCase() &&
            (existing.city || '').trim().toLowerCase() === jobForm.city.trim().toLowerCase()
        );
        if (dup) {
          notify('error', 'A similar active job for this company and city already exists.');
          setSavingJob(false);
          return;
        }
      }

      const formattedLocation = [jobForm.city.trim(), jobForm.state_province.trim(), jobForm.country.trim()]
        .filter(Boolean)
        .join(', ') || 'Remote';

      const minVal = jobForm.salary_min !== '' ? Number(jobForm.salary_min) : null;
      const maxVal = jobForm.salary_max !== '' ? Number(jobForm.salary_max) : null;
      const salaryText =
        minVal && maxVal
          ? `${jobForm.currency} ${minVal.toLocaleString()} - ${maxVal.toLocaleString()} (${jobForm.salary_period})`
          : minVal
          ? `${jobForm.currency} ${minVal.toLocaleString()}+ (${jobForm.salary_period})`
          : null;

      const isCompanyVerified =
        verifiedCompaniesSet.has(jobForm.company_name.trim().toLowerCase()) ||
        Boolean(userProfile?.is_verified || userProfile?.verified);

      const nextStatus = saveAsDraft ? 'Draft' : 'Active';

      const payload = {
        title: jobForm.title.trim(),
        company_name: jobForm.company_name.trim(),
        company: jobForm.company_name.trim(),
        category: jobForm.category,
        vacancies: Math.max(1, Number(jobForm.vacancies) || 1),
        job_type: jobForm.job_type,
        type: jobForm.job_type,
        workplace_type: jobForm.workplace_type,
        workplace: jobForm.workplace_type,
        experience_level: jobForm.experience_level,
        requirements: skillsArray,
        description: jobForm.description.trim(),
        company_logo_url: jobForm.company_logo_url.trim() || null,
        required_education: jobForm.required_education.trim() || null,
        responsibilities: jobForm.responsibilities.trim() || null,
        qualifications: jobForm.qualifications.trim() || null,
        benefits: jobForm.benefits.trim() || null,
        country: jobForm.country.trim() || 'Pakistan',
        state_province: jobForm.state_province.trim() || null,
        city: jobForm.city.trim() || null,
        location: formattedLocation,
        salary_min: minVal,
        salary_max: maxVal,
        currency: jobForm.currency,
        salary_period: jobForm.salary_period,
        salary_range: salaryText,
        salary: salaryText,
        apply_method: jobForm.apply_method,
        apply_link: jobForm.apply_method === 'website' ? jobForm.apply_link.trim() || null : null,
        application_email:
          jobForm.apply_method === 'email'
            ? jobForm.application_email.trim() || currentUser.email
            : jobForm.application_email.trim() || null,
        contact_email: jobForm.application_email.trim() || currentUser.email,
        application_deadline: jobForm.application_deadline
          ? new Date(jobForm.application_deadline).toISOString()
          : null,
        application_instructions: jobForm.application_instructions.trim() || null,
        is_draft: saveAsDraft,
        status: nextStatus,
        company_verified: isCompanyVerified,
        created_by: currentUser.id
      };

      if (jobForm.id) {
        const { data: updated, error } = await supabase
          .from('jobs')
          .update(payload)
          .eq('id', jobForm.id)
          .select()
          .single();

        if (error) throw error;
        setJobs((prev) => prev.map((item) => (item.id === jobForm.id ? updated : item)));
        notify('success', saveAsDraft ? 'Draft updated!' : 'Job updated & published!');
      } else {
        const { data: created, error } = await supabase
          .from('jobs')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        setJobs((prev) => [created, ...prev]);
        notify('success', saveAsDraft ? 'Saved to Drafts!' : 'Job published live on SHANORA!');
      }

      setShowJobModal(false);
      setJobForm(EMPTY_JOB_FORM);
      setFormStep(1);
      setIsPreviewMode(false);
    } catch (err) {
      notify('error', 'Failed to save job: ' + err.message);
    } finally {
      setSavingJob(false);
    }
  }

  async function handleDeleteJob(jobId) {
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      notify('success', 'Job deleted.');
    } catch (err) {
      notify('error', 'Delete failed: ' + err.message);
    }
  }

  async function handleToggleOpenClosed(job) {
    const nextStatus = job.status === 'Closed' ? 'Active' : 'Closed';
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: nextStatus, is_draft: false })
        .eq('id', job.id);
      if (error) throw error;
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j)));
      notify('success', `Job marked as ${nextStatus}.`);
    } catch (err) {
      notify('error', 'Status update failed: ' + err.message);
    }
  }

  function openApplyModal(job) {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    const effective = computeEffectiveStatus(job);
    if (effective !== 'Active') {
      notify('error', `Cannot apply: this job is ${effective}.`);
      return;
    }
    if (job.apply_method === 'website' && job.apply_link) {
      window.open(job.apply_link, '_blank', 'noopener,noreferrer');
      return;
    }

    const defaultName =
      userProfile?.full_name ||
      userProfile?.name ||
      currentUser.user_metadata?.full_name ||
      (currentUser.email || '').split('@')[0];

    setApplyForm({
      applicant_name: defaultName || '',
      applicant_email: (currentUser.email || '').toLowerCase(),
      phone: userProfile?.phone || '',
      city: userProfile?.city || '',
      experience: userProfile?.target_role || '',
      resume_link: userProfile?.resume_url || '',
      cover_note: ''
    });
    setResumeFile(null);
    setActiveApplyJob(job);
  }

  async function handleSubmitApplication(e) {
    e.preventDefault();
    if (!currentUser || !activeApplyJob) return;

    const alreadyApplied = myApplications.some((a) => a.job_id === activeApplyJob.id);
    if (alreadyApplied) {
      notify('error', 'You have already applied for this job.');
      return;
    }

    setSubmittingApp(true);
    try {
      let finalResumeLink = applyForm.resume_link.trim() || null;

      if (resumeFile) {
        const cleanFileName = resumeFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${currentUser.id}/${activeApplyJob.id}_${Date.now()}_${cleanFileName}`;
        const { error: uploadErr } = await supabase.storage
          .from('resumes')
          .upload(storagePath, resumeFile, { upsert: false });

        if (uploadErr) throw uploadErr;
        finalResumeLink = `resumes://${storagePath}`;
      }

      const employerId = activeApplyJob.created_by || currentUser.id;
      const payload = {
        job_id: activeApplyJob.id,
        applicant_id: currentUser.id,
        employer_id: employerId,
        applicant_name: applyForm.applicant_name.trim(),
        applicant_email: applyForm.applicant_email.trim().toLowerCase(),
        phone: applyForm.phone.trim() || null,
        city: applyForm.city.trim() || null,
        experience: applyForm.experience.trim() || null,
        resume_link: finalResumeLink,
        cover_note: applyForm.cover_note.trim() || 'Applied via SHANORA.',
        status: 'Submitted'
      };

      const { data: createdApp, error } = await supabase
        .from('job_applications')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setMyApplications((prev) => [createdApp, ...prev]);
      if (createdApp.employer_id === currentUser.id) {
        setEmployerApplications((prev) => [createdApp, ...prev]);
      }

      // Notify employer if contact/application email exists
      const empEmail = activeApplyJob.application_email || activeApplyJob.contact_email;
      if (empEmail) {
        await createNotification({
          recipientEmail: empEmail,
          senderName: payload.applicant_name,
          senderEmail: payload.applicant_email,
          actionType: 'job_application',
          content: `${payload.applicant_name} applied for "${activeApplyJob.title}".`,
          jobId: activeApplyJob.id
        });
      }

      setActiveApplyJob(null);
      setResumeFile(null);
      notify('success', 'Application submitted successfully!');
    } catch (err) {
      notify('error', 'Application failed: ' + err.message);
    } finally {
      setSubmittingApp(false);
    }
  }

  async function handleWithdrawApplication(appId) {
    try {
      const { error } = await supabase.from('job_applications').delete().eq('id', appId);
      if (error) throw error;
      setMyApplications((prev) => prev.filter((a) => a.id !== appId));
      notify('success', 'Application withdrawn.');
    } catch (err) {
      notify('error', 'Could not withdraw: ' + err.message);
    }
  }

  async function handleUpdateApplicationStatus(app, nextStatus, scheduledDateStr = null) {
    try {
      const updatePayload = {
        status: nextStatus,
        updated_at: new Date().toISOString()
      };
      if (scheduledDateStr) {
        updatePayload.interview_date = new Date(scheduledDateStr).toISOString();
      }

      const { error } = await supabase
        .from('job_applications')
        .update(updatePayload)
        .eq('id', app.id);

      if (error) throw error;

      setEmployerApplications((prev) =>
        prev.map((item) => (item.id === app.id ? { ...item, ...updatePayload } : item))
      );

      const jobInfo = jobs.find((j) => j.id === app.job_id);
      const jobTitleLabel = jobInfo?.title || `Job #${app.job_id}`;

      await createNotification({
        recipientEmail: app.applicant_email,
        senderName: jobInfo?.company_name || jobInfo?.company || 'Employer',
        senderEmail: currentUser?.email || null,
        actionType: 'application_status',
        content: `Your application for "${jobTitleLabel}" is now ${nextStatus}${
          scheduledDateStr ? ` (${new Date(scheduledDateStr).toLocaleString()})` : ''
        }.`,
        jobId: app.job_id
      });

      notify('success', `Status updated to ${nextStatus}.`);
    } catch (err) {
      notify('error', 'Failed to update status: ' + err.message);
    }
  }

  async function handleDownloadResume(resumeLink) {
    if (!resumeLink) return;
    if (!resumeLink.startsWith('resumes://')) {
      window.open(resumeLink, '_blank', 'noopener,noreferrer');
      return;
    }
    const path = resumeLink.replace('resumes://', '');
    const { data, error } = await supabase.storage.from('resumes').createSignedUrl(path, 120);
    if (error || !data?.signedUrl) {
      notify('error', 'Unable to generate secure CV link.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleSubmitReport(e) {
    e.preventDefault();
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    if (!reportingJob) return;

    setSubmittingReport(true);
    try {
      const { error } = await supabase.from('job_reports').insert([
        {
          job_id: reportingJob.id,
          reporter_id: currentUser.id,
          reporter_email: currentUser.email,
          reason: reportReason,
          details: reportDetails.trim() || null
        }
      ]);
      if (error) throw error;
      setReportingJob(null);
      setReportDetails('');
      notify('success', 'Job report submitted for safety review.');
    } catch (err) {
      notify('error', 'Report failed: ' + err.message);
    } finally {
      setSubmittingReport(false);
    }
  }

  const publicJobs = useMemo(
    () => jobs.filter((j) => computeEffectiveStatus(j) !== 'Draft'),
    [jobs]
  );

  const myPostedJobs = useMemo(
    () => (currentUser ? jobs.filter((j) => j.created_by === currentUser.id) : []),
    [jobs, currentUser]
  );

  const appliedStatusByJobId = useMemo(() => {
    const map = {};
    myApplications.forEach((a) => {
      map[a.job_id] = a.status || 'Submitted';
    });
    return map;
  }, [myApplications]);

  const filteredJobs = useMemo(() => {
    return publicJobs.filter((j) => {
      const title = (j.title || '').toLowerCase();
      const company = (j.company_name || j.company || '').toLowerCase();
      const loc = (j.location || j.city || '').toLowerCase();
      const q = searchFilter.trim().toLowerCase();

      const matchQuery = !q || title.includes(q) || company.includes(q) || loc.includes(q);
      const jobTypeVal = j.job_type || j.type || '';
      const matchType = selectedType === 'All' || jobTypeVal === selectedType;
      const wpVal = j.workplace_type || j.workplace || '';
      const matchWp = selectedWorkplace === 'All' || wpVal === selectedWorkplace;
      return matchQuery && matchType && matchWp;
    });
  }, [publicJobs, searchFilter, selectedType, selectedWorkplace]);

  const applicantsForModal = useMemo(() => {
    if (!viewingApplicantsJob) return [];
    return employerApplications.filter((a) => a.job_id === viewingApplicantsJob.id);
  }, [employerApplications, viewingApplicantsJob]);

  const employerStats = useMemo(() => {
    const activeCount = myPostedJobs.filter((j) => computeEffectiveStatus(j) === 'Active').length;
    const draftCount = myPostedJobs.filter((j) => computeEffectiveStatus(j) === 'Draft').length;
    const shortlistedCount = employerApplications.filter(
      (a) => a.status === 'Shortlisted' || a.status === 'Interview Scheduled' || a.status === 'Hired'
    ).length;
    return {
      totalJobs: myPostedJobs.length,
      activeCount,
      draftCount,
      totalApplicants: employerApplications.length,
      shortlistedCount
    };
  }, [myPostedJobs, employerApplications]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#070b14', borderBottom: '1px solid #1e293b', padding: '0.65rem 1rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#cbd5e1', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', flexShrink: 0 }}
            >
              ←
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0f172a', padding: '0.35rem 0.75rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ backgroundColor: '#0284c7', color: '#fff', fontWeight: '900', fontSize: '0.9rem', width: '24px', height: '24px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>S</span>
              <span style={{ fontWeight: '900', fontSize: '1rem', color: '#fff', whiteSpace: 'nowrap' }}>
                SHANORA<span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>.PK</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={openNewJobModal}
            style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            + Post Job
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '0.9rem 0.85rem 5rem 0.85rem' }}>
        {banner && (
          <div
            style={{
              backgroundColor: banner.type === 'error' ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.14)',
              border: `1px solid ${banner.type === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
              color: banner.type === 'error' ? '#fca5a5' : '#6ee7b7',
              borderRadius: '10px',
              padding: '0.65rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              marginBottom: '0.85rem'
            }}
          >
            {banner.text}
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {[
            { id: 'browse', label: `Jobs (${publicJobs.length})` },
            { id: 'employer', label: `Employer Hub (${myPostedJobs.length})` },
            { id: 'my_apps', label: `My Applications (${myApplications.length})` }
          ].map((t) => {
            const isAct = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  backgroundColor: isAct ? '#0284c7' : '#0f172a',
                  color: isAct ? '#fff' : '#94a3b8',
                  border: isAct ? '1px solid #0284c7' : '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#38bdf8', fontWeight: '700' }}>
            Loading SHANORA Recruitment Hub...
          </div>
        ) : activeTab === 'browse' ? (
          <>
            {/* Search & Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.5rem 0.85rem' }}>
                <span style={{ marginRight: '0.5rem', color: '#94a3b8' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search role, company, or city..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.15rem' }}>
                {['All', ...EMPLOYMENT_TYPES].map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setSelectedType(tp)}
                    style={{
                      backgroundColor: selectedType === tp ? '#0284c7' : '#0f172a',
                      color: selectedType === tp ? '#fff' : '#94a3b8',
                      border: selectedType === tp ? '1px solid #0284c7' : '1px solid #1e293b',
                      borderRadius: '999px',
                      padding: '0.28rem 0.7rem',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tp}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.15rem' }}>
                {['All', ...WORKPLACE_TYPES].map((wp) => (
                  <button
                    key={wp}
                    type="button"
                    onClick={() => setSelectedWorkplace(wp)}
                    style={{
                      backgroundColor: selectedWorkplace === wp ? '#1e293b' : '#0b1120',
                      color: selectedWorkplace === wp ? '#38bdf8' : '#64748b',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.24rem 0.65rem',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {wp === 'All' ? 'All Workplaces' : wp}
                  </button>
                ))}
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                No matching job listings found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {filteredJobs.map((job) => {
                  const status = computeEffectiveStatus(job);
                  const appStatus = appliedStatusByJobId[job.id];
                  const isApplied = Boolean(appStatus);
                  const isOwner = currentUser && job.created_by === currentUser.id;
                  const companyLabel = job.company_name || job.company || 'Company';
                  const isVerified =
                    Boolean(job.company_verified) ||
                    verifiedCompaniesSet.has(companyLabel.trim().toLowerCase());
                  const canApply = status === 'Active' && !isApplied && !isOwner;

                  return (
                    <div key={job.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#fff', fontWeight: '800', fontSize: '1rem', wordBreak: 'break-word' }}>{job.title}</div>
                          <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: '700', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span>{companyLabel}</span>
                            {isVerified && (
                              <span style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.35)', fontSize: '0.66rem', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                          <span style={{ backgroundColor: 'rgba(2,132,199,0.15)', color: '#38bdf8', fontSize: '0.68rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            {job.job_type || job.type || 'Full-time'}
                          </span>
                          <span
                            style={{
                              backgroundColor:
                                status === 'Active'
                                  ? 'rgba(16,185,129,0.14)'
                                  : status === 'Expired'
                                  ? 'rgba(245,158,11,0.14)'
                                  : 'rgba(239,68,68,0.14)',
                              color:
                                status === 'Active'
                                  ? '#6ee7b7'
                                  : status === 'Expired'
                                  ? '#fcd34d'
                                  : '#fca5a5',
                              fontSize: '0.68rem',
                              fontWeight: '800',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px'
                            }}
                          >
                            {status}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', fontSize: '0.74rem', color: '#94a3b8' }}>
                        <span>📍 {job.location || job.city || 'Remote'}</span>
                        <span>🏢 {job.workplace_type || job.workplace || 'Remote'}</span>
                        {job.experience_level && <span>🎯 {job.experience_level}</span>}
                        <span>💰 {formatSalary(job)}</span>
                        {job.vacancies > 1 && <span>👥 {job.vacancies} openings</span>}
                      </div>

                      {job.description && (
                        <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.45 }}>
                          {job.description}
                        </div>
                      )}

                      {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {job.requirements.map((sk, idx) => (
                            <span key={idx} style={{ backgroundColor: '#070b14', border: '1px solid #1e293b', color: '#cbd5e1', fontSize: '0.7rem', padding: '0.18rem 0.5rem', borderRadius: '6px' }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.65rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', fontSize: '0.7rem', color: '#64748b' }}>
                          <span>Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'recently'}</span>
                          {!isOwner && (
                            <button
                              type="button"
                              onClick={() => setReportingJob(job)}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                            >
                              ⚑ Report
                            </button>
                          )}
                        </div>

                        {isOwner ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('employer');
                              setViewingApplicantsJob(job);
                            }}
                            style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '8px', padding: '0.42rem 0.85rem', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Manage ({employerApplications.filter((a) => a.job_id === job.id).length})
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canApply}
                            onClick={() => openApplyModal(job)}
                            style={{
                              backgroundColor: canApply ? '#0284c7' : '#1e293b',
                              color: canApply ? '#fff' : '#64748b',
                              border: canApply ? 'none' : '1px solid #334155',
                              borderRadius: '8px',
                              padding: '0.45rem 1rem',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: canApply ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {isApplied
                              ? `✓ ${appStatus}`
                              : status !== 'Active'
                              ? status
                              : job.apply_method === 'website'
                              ? 'Apply on Site ↗'
                              : 'Apply Now'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : activeTab === 'employer' ? (
          /* EMPLOYER DASHBOARD */
          !currentUser ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              Sign in to access the Employer Dashboard.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Application & Job Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '0.6rem' }}>
                {[
                  { label: 'Posted Jobs', val: employerStats.totalJobs },
                  { label: 'Active', val: employerStats.activeCount },
                  { label: 'Drafts', val: employerStats.draftCount },
                  { label: 'Applicants', val: employerStats.totalApplicants },
                  { label: 'Shortlisted/Hire', val: employerStats.shortlistedCount }
                ].map((st) => (
                  <div key={st.label} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.75rem' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: '700' }}>{st.label}</div>
                    <div style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: '0.2rem' }}>{st.val}</div>
                  </div>
                ))}
              </div>

              {myPostedJobs.length === 0 ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  You haven&apos;t created any jobs or drafts yet.
                </div>
              ) : (
                myPostedJobs.map((job) => {
                  const status = computeEffectiveStatus(job);
                  const appsCount = employerApplications.filter((a) => a.job_id === job.id).length;

                  return (
                    <div key={job.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.96rem' }}>{job.title}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.76rem', marginTop: '0.15rem' }}>
                            {job.company_name || job.company} • {job.location || job.city || 'Remote'}
                          </div>
                        </div>
                        <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', fontSize: '0.7rem', fontWeight: '800', padding: '0.22rem 0.55rem', borderRadius: '6px' }}>
                          {status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', borderTop: '1px solid #1e293b', paddingTop: '0.65rem' }}>
                        <button
                          type="button"
                          onClick={() => setViewingApplicantsJob(job)}
                          style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Applicants ({appsCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditJobModal(job)}
                          style={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        {status !== 'Draft' && (
                          <button
                            type="button"
                            onClick={() => handleToggleOpenClosed(job)}
                            style={{ backgroundColor: '#1e293b', color: '#fcd34d', border: '1px solid #334155', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            {status === 'Closed' ? 'Reopen Job' : 'Close Job'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteJob(job.id)}
                          style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )
        ) : (
          /* CANDIDATE APPLICATIONS TRACKER */
          !currentUser ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              Sign in to track and manage your applications.
            </div>
          ) : myApplications.length === 0 ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              You haven&apos;t applied to any jobs yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myApplications.map((app) => {
                const matchedJob = jobs.find((j) => j.id === app.job_id);
                return (
                  <div key={app.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.92rem' }}>
                          {matchedJob?.title || `Job #${app.job_id}`}
                        </div>
                        <div style={{ color: '#38bdf8', fontSize: '0.76rem', fontWeight: '700' }}>
                          {matchedJob?.company_name || matchedJob?.company || 'Company'}
                        </div>
                      </div>
                      <span style={{ backgroundColor: 'rgba(2,132,199,0.16)', color: '#38bdf8', border: '1px solid rgba(2,132,199,0.35)', fontSize: '0.72rem', fontWeight: '800', padding: '0.22rem 0.6rem', borderRadius: '999px' }}>
                        {app.status || 'Submitted'}
                      </span>
                    </div>

                    {app.interview_date && (
                      <div style={{ color: '#6ee7b7', fontSize: '0.75rem', fontWeight: '700' }}>
                        📅 Interview: {new Date(app.interview_date).toLocaleString()}
                      </div>
                    )}

                    {app.cover_note && (
                      <div style={{ color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.4 }}>
                        “{app.cover_note}”
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.55rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Applied {app.created_at ? new Date(app.created_at).toLocaleDateString() : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleWithdrawApplication(app.id)}
                        style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '7px', padding: '0.32rem 0.7rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      {/* TWO-STEP JOB FORM + PREVIEW MODAL */}
      {showJobModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.86)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0.85rem', overflowY: 'auto' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '560px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.65rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>
                  {jobForm.id ? 'Edit Job Posting' : 'Create Job Posting'} — {isPreviewMode ? 'Preview' : `Step ${formStep} of 2`}
                </h3>
                <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '0.15rem' }}>
                  {isPreviewMode
                    ? 'Review how job seekers will see your listing'
                    : formStep === 1
                    ? 'Step 1: Role Details, Type, Experience & Skills'
                    : 'Step 2: Location, Compensation & Application Method'}
                </div>
              </div>
              <button type="button" onClick={() => setShowJobModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {isPreviewMode ? (
              <div style={{ backgroundColor: '#070b14', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ color: '#fff', fontWeight: '800', fontSize: '1.05rem' }}>{jobForm.title || 'Untitled Role'}</div>
                <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '0.82rem' }}>
                  {jobForm.company_name || 'Company'} • {jobForm.category}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.76rem', display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
                  <span>📍 {[jobForm.city, jobForm.state_province, jobForm.country].filter(Boolean).join(', ') || 'Location'}</span>
                  <span>🏢 {jobForm.workplace_type}</span>
                  <span>💼 {jobForm.job_type}</span>
                  <span>🎯 {jobForm.experience_level}</span>
                  <span>👥 {jobForm.vacancies} opening(s)</span>
                </div>
                <div style={{ color: '#6ee7b7', fontSize: '0.78rem', fontWeight: '700' }}>
                  💰 {formatSalary(jobForm)}
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.45 }}>{jobForm.description}</div>
                {jobForm.responsibilities && (
                  <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}>
                    <strong style={{ color: '#e2e8f0' }}>Responsibilities:</strong> {jobForm.responsibilities}
                  </div>
                )}
                {jobForm.benefits && (
                  <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}>
                    <strong style={{ color: '#e2e8f0' }}>Benefits:</strong> {jobForm.benefits}
                  </div>
                )}
              </div>
            ) : formStep === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Job Title *</label>
                  <input type="text" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g. Full-Stack Next.js Engineer" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.65rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Company Name *</label>
                    <input type="text" value={jobForm.company_name} onChange={(e) => setJobForm({ ...jobForm, company_name: e.target.value })} placeholder="Company name" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.65rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Job Category *</label>
                    <select value={jobForm.category} onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.55rem', color: '#fff', fontSize: '0.8rem' }}>
                      {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.55rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Vacancies *</label>
                    <input type="number" min={1} value={jobForm.vacancies} onChange={(e) => setJobForm({ ...jobForm, vacancies: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.55rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Employment Type *</label>
                    <select value={jobForm.job_type} onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.45rem', color: '#fff', fontSize: '0.78rem' }}>
                      {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Workplace *</label>
                    <select value={jobForm.workplace_type} onChange={(e) => setJobForm({ ...jobForm, workplace_type: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.45rem', color: '#fff', fontSize: '0.78rem' }}>
                      {WORKPLACE_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Experience Level *</label>
                    <select value={jobForm.experience_level} onChange={(e) => setJobForm({ ...jobForm, experience_level: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.55rem', color: '#fff', fontSize: '0.8rem' }}>
                      {EXPERIENCE_LEVELS.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Required Skills * (comma sep.)</label>
                    <input type="text" value={jobForm.skillsText} onChange={(e) => setJobForm({ ...jobForm, skillsText: e.target.value })} placeholder="React, SQL, TypeScript" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.65rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Job Description *</label>
                  <textarea rows={3} value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Role summary and expectations..." style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.65rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                </div>

                {/* Optional Step 1 Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Company Logo URL (Optional)</label>
                    <input type="url" value={jobForm.company_logo_url} onChange={(e) => setJobForm({ ...jobForm, company_logo_url: e.target.value })} placeholder="https://..." style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.45rem 0.6rem', color: '#fff', fontSize: '0.78rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Required Education (Optional)</label>
                    <input type="text" value={jobForm.required_education} onChange={(e) => setJobForm({ ...jobForm, required_education: e.target.value })} placeholder="e.g. BSCS / B.Sc." style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.45rem 0.6rem', color: '#fff', fontSize: '0.78rem', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Responsibilities & Qualifications (Optional)</label>
                  <input type="text" value={jobForm.responsibilities} onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })} placeholder="Key responsibilities..." style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.45rem 0.6rem', color: '#fff', fontSize: '0.78rem', boxSizing: 'border-box', marginBottom: '0.4rem' }} />
                  <input type="text" value={jobForm.benefits} onChange={(e) => setJobForm({ ...jobForm, benefits: e.target.value })} placeholder="Benefits & perks (bonus, remote allowance, health)..." style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.45rem 0.6rem', color: '#fff', fontSize: '0.78rem', boxSizing: 'border-box' }} />
                </div>
              </div>
            ) : (
              /* STEP 2 */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.55rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Country *</label>
                    <input type="text" value={jobForm.country} onChange={(e) => setJobForm({ ...jobForm, country: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>State / Province</label>
                    <input type="text" value={jobForm.state_province} onChange={(e) => setJobForm({ ...jobForm, state_province: e.target.value })} placeholder="e.g. Sindh" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>City *</label>
                    <input type="text" value={jobForm.city} onChange={(e) => setJobForm({ ...jobForm, city: e.target.value })} placeholder="e.g. Karachi" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.9fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Min Salary</label>
                    <input type="number" value={jobForm.salary_min} onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })} placeholder="50000" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.55rem', color: '#fff', fontSize: '0.78rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Max Salary</label>
                    <input type="number" value={jobForm.salary_max} onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })} placeholder="120000" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.55rem', color: '#fff', fontSize: '0.78rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Currency</label>
                    <select value={jobForm.currency} onChange={(e) => setJobForm({ ...jobForm, currency: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.4rem', color: '#fff', fontSize: '0.76rem' }}>
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Period</label>
                    <select value={jobForm.salary_period} onChange={(e) => setJobForm({ ...jobForm, salary_period: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.4rem', color: '#fff', fontSize: '0.76rem' }}>
                      {SALARY_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Application Method</label>
                  <select value={jobForm.apply_method} onChange={(e) => setJobForm({ ...jobForm, apply_method: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.6rem', color: '#fff', fontSize: '0.8rem' }}>
                    <option value="shanora">Apply Through SHANORA</option>
                    <option value="website">Apply Through Company Website</option>
                    <option value="email">Apply Through Email</option>
                  </select>
                </div>

                {jobForm.apply_method === 'website' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '0.25rem', fontWeight: '700' }}>External Application URL *</label>
                    <input type="url" value={jobForm.apply_link} onChange={(e) => setJobForm({ ...jobForm, apply_link: e.target.value })} placeholder="https://company.com/careers/apply" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.65rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                  </div>
                )}

                {jobForm.apply_method === 'email' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '0.25rem', fontWeight: '700' }}>Application Email *</label>
                    <input type="email" value={jobForm.application_email} onChange={(e) => setJobForm({ ...jobForm, application_email: e.target.value })} placeholder="hr@company.com" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.65rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Application Deadline</label>
                    <input type="datetime-local" value={jobForm.application_deadline} onChange={(e) => setJobForm({ ...jobForm, application_deadline: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 0.6rem', color: '#fff', fontSize: '0.78rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: '700' }}>Instructions</label>
                    <input type="text" value={jobForm.application_instructions} onChange={(e) => setJobForm({ ...jobForm, application_instructions: e.target.value })} placeholder="Portfolio or GitHub required..." style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 0.6rem', color: '#fff', fontSize: '0.78rem', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid #1e293b', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                {!isPreviewMode && formStep === 2 && (
                  <button type="button" onClick={() => setFormStep(1)} style={{ backgroundColor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
                    ← Back
                  </button>
                )}
                <button type="button" onClick={handleTogglePreview} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
                  {isPreviewMode ? 'Edit Details' : 'Preview Job'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" disabled={savingJob} onClick={() => handleSaveJob(true)} style={{ backgroundColor: 'transparent', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '8px', padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
                  Save Draft
                </button>
                {!isPreviewMode && formStep === 1 ? (
                  <button type="button" onClick={handleNextStep} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                    Next Step →
                  </button>
                ) : (
                  <button type="button" disabled={savingJob} onClick={() => handleSaveJob(false)} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                    {savingJob ? 'Publishing...' : 'Publish Job'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE APPLY MODAL */}
      {activeApplyJob && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.86)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0.85rem', overflowY: 'auto' }}>
          <form onSubmit={handleSubmitApplication} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '490px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.65rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Apply: {activeApplyJob.title}</h3>
                <div style={{ color: '#38bdf8', fontSize: '0.78rem' }}>{activeApplyJob.company_name || activeApplyJob.company}</div>
              </div>
              <button type="button" onClick={() => setActiveApplyJob(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {activeApplyJob.application_instructions && (
              <div style={{ backgroundColor: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.55rem 0.7rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                ℹ️ {activeApplyJob.application_instructions}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>Full Name *</label>
                <input type="text" required value={applyForm.applicant_name} onChange={(e) => setApplyForm({ ...applyForm, applicant_name: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>Email *</label>
                <input type="email" required value={applyForm.applicant_email} onChange={(e) => setApplyForm({ ...applyForm, applicant_email: e.target.value })} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>Phone</label>
                <input type="text" value={applyForm.phone} onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })} placeholder="+92 3xx xxxxxxx" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>City</label>
                <input type="text" value={applyForm.city} onChange={(e) => setApplyForm({ ...applyForm, city: e.target.value })} placeholder="City" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>Upload CV / Resume (PDF, DOC, DOCX)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} style={{ width: '100%', color: '#94a3b8', fontSize: '0.76rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>Or Resume / Portfolio Link</label>
              <input type="url" value={applyForm.resume_link} onChange={(e) => setApplyForm({ ...applyForm, resume_link: e.target.value })} placeholder="https://..." style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>Cover Letter / Note</label>
              <textarea rows={3} value={applyForm.cover_note} onChange={(e) => setApplyForm({ ...applyForm, cover_note: e.target.value })} placeholder="Why are you a great fit for this role?" style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.65rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setActiveApplyJob(null)} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 0.9rem', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={submittingApp} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 1.1rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
                {submittingApp ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EMPLOYER APPLICANTS & INTERVIEW MODAL */}
      {viewingApplicantsJob && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.86)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0.85rem', overflowY: 'auto' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '560px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.65rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Applicants — {viewingApplicantsJob.title}</h3>
                <div style={{ color: '#38bdf8', fontSize: '0.76rem' }}>{applicantsForModal.length} candidate(s)</div>
              </div>
              <button type="button" onClick={() => setViewingApplicantsJob(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {applicantsForModal.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem', padding: '1.5rem 0', textAlign: 'center' }}>No applicants yet.</div>
            ) : (
              applicantsForModal.map((app) => (
                <div key={app.id} style={{ backgroundColor: '#070b14', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.9rem' }}>{app.applicant_name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{app.applicant_email}</div>
                    </div>
                    <select
                      value={app.status || 'Submitted'}
                      onChange={(e) => handleUpdateApplicationStatus(app, e.target.value, interviewDates[app.id])}
                      style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', borderRadius: '8px', padding: '0.32rem 0.55rem', fontSize: '0.74rem', fontWeight: '700' }}
                    >
                      {APPLICATION_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.74rem', color: '#94a3b8' }}>
                    {app.phone && <span>📞 {app.phone}</span>}
                    {app.city && <span>📍 {app.city}</span>}
                    {app.experience && <span>💼 {app.experience}</span>}
                  </div>

                  {app.resume_link && (
                    <button
                      type="button"
                      onClick={() => handleDownloadResume(app.resume_link)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                    >
                      📎 View / Download CV
                    </button>
                  )}

                  {app.cover_note && (
                    <div style={{ color: '#cbd5e1', fontSize: '0.78rem', backgroundColor: '#0f172a', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                      {app.cover_note}
                    </div>
                  )}

                  {/* Schedule Interview Control */}
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                    <input
                      type="datetime-local"
                      value={interviewDates[app.id] || ''}
                      onChange={(e) => setInterviewDates((prev) => ({ ...prev, [app.id]: e.target.value }))}
                      style={{ backgroundColor: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '7px', padding: '0.32rem 0.5rem', fontSize: '0.72rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!interviewDates[app.id]) {
                          notify('error', 'Select interview date & time first.');
                          return;
                        }
                        handleUpdateApplicationStatus(app, 'Interview Scheduled', interviewDates[app.id]);
                      }}
                      style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '7px', padding: '0.35rem 0.7rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Schedule Interview
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* REPORT JOB MODAL */}
      {reportingJob && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.86)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0.85rem' }}>
          <form onSubmit={handleSubmitReport} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '0.98rem' }}>Report Job Listing</h3>
              <button type="button" onClick={() => setReportingJob(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}>{reportingJob.title} — {reportingJob.company_name || reportingJob.company}</div>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Reason</label>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.6rem', color: '#fff', fontSize: '0.8rem' }}>
                <option value="Fake or Misleading Job">Fake or Misleading Job</option>
                <option value="Spam or Scam">Spam or Scam</option>
                <option value="Inappropriate Content">Inappropriate Content</option>
                <option value="Incorrect Salary or Location">Incorrect Salary or Location</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Additional Details</label>
              <textarea rows={2} value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Optional details..." style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #334155', borderRadius: '8px', padding: '0.48rem 0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setReportingJob(null)} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', padding: '0.42rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={submittingReport} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.42rem 0.95rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
                {submittingReport ? 'Sending...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading opportunities...</div>}>
      <JobsContent />
    </Suspense>
  );
}
