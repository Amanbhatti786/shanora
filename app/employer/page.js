'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function EmployerJobForm({ onClose }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    category: 'Software & IT',
    job_type: 'Full-time',
    experience_level: 'Mid Level',
    location: '',
    salary_range: '',
    description: '',
    requirements: '',
    contact_email: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company_name || !formData.description) {
      alert('Kripya zaroori details (Job Title, Company, Description) fill karein!');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || formData.contact_email || 'employer@shanora.pk';

      const { error } = await supabase.from('jobs').insert([
        {
          employer_email: userEmail.toLowerCase(),
          company_name: formData.company_name.trim(),
          title: formData.title.trim(),
          category: formData.category,
          job_type: formData.job_type,
          location: formData.location.trim() || 'Pakistan',
          salary_range: formData.salary_range.trim() || 'Negotiable',
          description: formData.description.trim(),
          requirements: formData.requirements.trim()
        }
      ]);

      if (error) throw error;

      alert('Job opening successfully publish ho gayi hai! 🚀');
      if (onClose) {
        onClose();
      } else {
        router.push('/jobs');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#0c1322',
      border: '1px solid #1e293b',
      borderRadius: '16px',
      padding: '1.25rem',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Form Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.8rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💼</span> Post New Job Opening
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
            Find the right talent across Pakistan on Shanora Network
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#94a3b8',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        
        {/* Job Title */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
            Job Title <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Senior Frontend Developer, Graphic Designer"
            value={formData.title}
            onChange={handleChange}
            style={{
              width: '100%',
              backgroundColor: '#070b14',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Company Name & Location (2 Columns) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Company / Business <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="company_name"
              required
              placeholder="e.g. Shanora Tech"
              value={formData.company_name}
              onChange={handleChange}
              style={{
                width: '100%',
                backgroundColor: '#070b14',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Location / City
            </label>
            <input
              type="text"
              name="location"
              placeholder="e.g. Karachi / Remote"
              value={formData.location}
              onChange={handleChange}
              style={{
                width: '100%',
                backgroundColor: '#070b14',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Category, Job Type & Experience (3 Select dropdowns) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                backgroundColor: '#070b14',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0.65rem 0.4rem',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            >
              <option value="Software & IT">IT / Software</option>
              <option value="Design & Creative">Design</option>
              <option value="Marketing & Sales">Marketing</option>
              <option value="Customer Support">Support</option>
              <option value="Education & Office">Office / Admin</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Job Type
            </label>
            <select
              name="job_type"
              value={formData.job_type}
              onChange={handleChange}
              style={{
                width: '100%',
                backgroundColor: '#070b14',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0.65rem 0.4rem',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Remote">Remote</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Salary / Range
            </label>
            <input
              type="text"
              name="salary_range"
              placeholder="e.g. 60k - 90k"
              value={formData.salary_range}
              onChange={handleChange}
              style={{
                width: '100%',
                backgroundColor: '#070b14',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0.65rem 0.5rem',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
            Job Description & Responsibilities <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            rows={4}
            name="description"
            required
            placeholder="Role ki details, daily tasks aur company overview yahan likhein..."
            value={formData.description}
            onChange={handleChange}
            style={{
              width: '100%',
              backgroundColor: '#070b14',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              color: '#fff',
              fontSize: '0.83rem',
              outline: 'none',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Requirements / Key Skills */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
            Candidate Requirements & Skills
          </label>
          <input
            type="text"
            name="requirements"
            placeholder="e.g. React.js, Tailwind CSS, 2+ Years Exp, Good English"
            value={formData.requirements}
            onChange={handleChange}
            style={{
              width: '100%',
              backgroundColor: '#070b14',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: loading ? '#0284c7' : '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '0.85rem',
            fontSize: '0.92rem',
            fontWeight: '800',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            marginTop: '0.3rem'
          }}
        >
          {loading ? 'Publishing...' : '🚀 Publish Vacancy'}
        </button>
      </form>
    </div>
  );
}
