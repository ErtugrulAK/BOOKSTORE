import React, { useState } from 'react';
import './BookCover.css';

const BookCover = ({ imageUrl, title, author, className = '', size = 'medium' }) => {
  const [hasError, setHasError] = useState(false);

  // Generate a stable color index based on the title to keep the gradient consistent for each book
  const getGradientIndex = (str) => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 5;
  };

  const gradientClasses = [
    'bg-gradient-indigo',
    'bg-gradient-emerald',
    'bg-gradient-sunset',
    'bg-gradient-teal',
    'bg-gradient-rose'
  ];

  const gradientClass = gradientClasses[getGradientIndex(title || '')];

  // Helper to format/truncate text
  const displayTitle = title || 'Kitap';
  const displayAuthor = author || 'Dokuz Eylül Üniversitesi';

  if (imageUrl && !hasError) {
    return (
      <img
        src={imageUrl}
        alt={title}
        className={`book-cover-image ${className}`}
        onError={() => setHasError(true)}
      />
    );
  }

  // Beautiful fallback cover
  return (
    <div className={`premium-book-cover ${gradientClass} ${size} ${className}`}>
      {/* 3D Spine effect */}
      <div className="book-cover-spine"></div>
      
      {/* Texture and light effects */}
      <div className="book-cover-overlay"></div>
      
      {/* Content */}
      <div className="book-cover-content">
        <div className="book-cover-branding">DEÜ YAYINLARI</div>
        
        <div className="book-cover-center">
          <div className="book-cover-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h3 className="book-cover-title" title={displayTitle}>
            {displayTitle}
          </h3>
        </div>
        
        <div className="book-cover-footer">
          <span className="book-cover-author" title={displayAuthor}>
            {displayAuthor}
          </span>
          <div className="book-cover-footer-accent"></div>
        </div>
      </div>
    </div>
  );
};

export default BookCover;
