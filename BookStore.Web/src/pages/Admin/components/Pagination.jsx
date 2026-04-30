import React from 'react';

const Pagination = ({ currentPage, totalCount, pageSize, onPageChange }) => {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <div className="admin-pagination">
            <button 
                className="pagination-btn" 
                disabled={currentPage === 1} 
                onClick={() => onPageChange(currentPage - 1)}
            >
                &laquo; Önceki
            </button>
            
            {pages.map(p => (
                <button 
                    key={p} 
                    className={`pagination-btn ${currentPage === p ? 'active' : ''}`}
                    onClick={() => onPageChange(p)}
                >
                    {p}
                </button>
            ))}

            <button 
                className="pagination-btn" 
                disabled={currentPage === totalPages} 
                onClick={() => onPageChange(currentPage + 1)}
            >
                Sonraki &raquo;
            </button>
        </div>
    );
};

export default Pagination;
