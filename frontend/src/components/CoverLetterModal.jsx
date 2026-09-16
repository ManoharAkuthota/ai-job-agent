import React, { useState, useEffect } from 'react';
import { generateCoverLetter, getCoverLetterPdfUrl } from '../services/api';

export default function CoverLetterModal({ job, onClose }) {
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!job) return;
    loadCoverLetter();
  }, [job]);

  const loadCoverLetter = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateCoverLetter(job.id);
      setCoverLetter(res.data);
    } catch (err) {
      console.error('Failed to generate cover letter:', err);
      setError('Unable to generate cover letter right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0b0f19] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-[#070b14]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">AI Cover Letter</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  OpenPDF Ready
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate max-w-[260px] sm:max-w-md">
                {job.title} • {job.company}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/80 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm text-gray-300 leading-relaxed">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-gray-300">Synthesizing tailored cover letter...</p>
              <p className="text-xs text-gray-500">Aligning candidate experience with {job.company}'s requirements</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-center">
              <p>{error}</p>
              <button
                onClick={loadCoverLetter}
                className="mt-3 px-4 py-1.5 text-xs font-semibold bg-red-800/50 hover:bg-red-700/60 rounded-lg transition-colors text-white"
              >
                Try Again
              </button>
            </div>
          ) : coverLetter ? (
            <div className="space-y-4 bg-[#030712] border border-gray-800/80 rounded-xl p-4 sm:p-6 shadow-inner font-sans">
              <div className="border-b border-gray-800 pb-3 mb-4 text-xs text-gray-400 flex flex-wrap justify-between gap-2">
                <div>
                  <span className="font-semibold text-white">{coverLetter.candidateName}</span>
                  <div className="text-[11px] text-gray-500">{coverLetter.candidateEmail} • {coverLetter.candidatePhone}</div>
                </div>
                <div className="text-right text-[11px] text-gray-500">
                  Targeting: <span className="text-indigo-400 font-medium">{coverLetter.company}</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm text-gray-200">
                <div className="whitespace-pre-line leading-relaxed">
                  {coverLetter.openingParagraph}
                </div>
                <div className="whitespace-pre-line leading-relaxed">
                  {coverLetter.bodyParagraph}
                </div>
                <div className="whitespace-pre-line leading-relaxed">
                  {coverLetter.closingParagraph}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800/80 text-xs text-gray-400">
                Sincerely,<br />
                <span className="font-semibold text-white">{coverLetter.candidateName}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        {coverLetter && !loading && (
          <div className="px-5 py-3.5 border-t border-gray-800 bg-[#070b14] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="text-[11px] text-gray-500 text-center sm:text-left">
              Tailored for {coverLetter.jobTitle}
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <a
                href={getCoverLetterPdfUrl(coverLetter.id)}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all text-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
