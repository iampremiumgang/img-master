
import React from 'react';

export const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background rounded rect */}
    <rect width="100" height="100" rx="20" fill="#0f172a" />
    
    {/* Aperture Blades */}
    {/* Top Right - Gold */}
    <path d="M50 50 L50 5 A45 45 0 0 1 95 50 Z" fill="#eab308" />
    
    {/* Bottom Right - Teal */}
    <path d="M50 50 L95 50 A45 45 0 0 1 50 95 Z" fill="#0f766e" />
    
    {/* Bottom Left - Dark Teal */}
    <path d="M50 50 L50 95 A45 45 0 0 1 5 50 Z" fill="#115e59" />
    
    {/* Top Left - Light Teal */}
    <path d="M50 50 L5 50 A45 45 0 0 1 50 5 Z" fill="#14b8a6" />

    {/* Center Circle */}
    <circle cx="50" cy="50" r="28" fill="white" />
    
    {/* Text */}
    <text x="50" y="52" fontFamily="sans-serif" fontWeight="900" fontSize="20" textAnchor="middle" fill="#0f172a">IMG</text>
    <text x="50" y="66" fontFamily="sans-serif" fontWeight="700" fontSize="7" textAnchor="middle" fill="#0f172a" letterSpacing="0.05em">MASTER</text>
  </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L11 12l4.293 4.293a1 1 0 01-1.414 1.414L10 13.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 12 4.293 7.707a1 1 0 011.414-1.414L10 10.586l4.293-4.293a1 1 0 011.414 0z" />
  </svg>
);

export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

export const TShirtIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3h6l-1 5a2 2 0 01-2 2H8a2 2 0 01-2-2L5 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3a1 1 0 012 0v5a1 1 0 01-2 0V3z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v11m0 0l-3-3m3 3l3-3m-3-3V10" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.5 8.5L8 12l3-2-2-4-2.5 2.5zM20.5 8.5L16 12l-3-2 2-4 2.5 2.5z" />
  </svg>
);

export const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"/>
 </svg>
);

export const BrushIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16" />
  </svg>
);

export const ExpandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" />
    </svg>
);

export const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);