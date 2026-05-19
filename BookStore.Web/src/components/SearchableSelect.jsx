import React, { useState, useEffect, useRef } from 'react';
import './SearchableSelect.css';

const SearchableSelect = ({ options, value, onChange, placeholder = 'Seçiniz', disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset search term when dropdown closes/opens
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase()
           .replace(/ı/g, 'i')
           .replace(/ş/g, 's')
           .replace(/ğ/g, 'g')
           .replace(/ç/g, 'c')
           .replace(/ö/g, 'o')
           .replace(/ü/g, 'u')
           .includes(searchTerm.toLowerCase()
               .replace(/ı/g, 'i')
               .replace(/ş/g, 's')
               .replace(/ğ/g, 'g')
               .replace(/ç/g, 'c')
               .replace(/ö/g, 'o')
               .replace(/ü/g, 'u'))
    );

    const handleSelect = (opt) => {
        onChange(opt);
        setIsOpen(false);
    };

    return (
        <div className={`searchable-select-container ${disabled ? 'disabled' : ''}`} ref={containerRef}>
            <div 
                className={`searchable-select-trigger ${isOpen ? 'open' : ''}`} 
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={value ? 'selected-value' : 'placeholder-value'}>
                    {value || placeholder}
                </span>
                <span className="arrow-icon">▼</span>
            </div>

            {isOpen && (
                <div className="searchable-select-dropdown">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className="options-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, index) => (
                                <div 
                                    key={index} 
                                    className={`option-item ${opt === value ? 'selected' : ''}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    {opt}
                                </div>
                            ))
                        ) : (
                            <div className="no-options">Bulunamadı</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
