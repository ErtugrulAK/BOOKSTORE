import React, { useRef, useState, useMemo } from 'react';
import Pagination from './Pagination';

const BookManagement = ({ 
    activeTab, 
    books, 
    booksTotal,
    booksPage,
    setBooksPage,
    bookForm, 
    setBookForm, 
    handleSaveBook, 
    handleDeleteBook, 
    handleBulkAction,
    setActiveTab,
    CATEGORIES,
    token,
    fetchData,
    showOnlyInactiveBooks,
    setShowOnlyInactiveBooks,
    showOnlyCriticalBooks,
    setShowOnlyCriticalBooks,
    criticalStockCount,
    inactiveBooksCount,
    bulkPriceIncrease,
    setBulkPriceIncrease,
    openBookForm,
    formatISBN
}) => {
    const fileInputRef = useRef(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedAndFilteredBooks = useMemo(() => {
        let filtered = books.filter(b =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (sortConfig.key) {
            filtered = [...filtered].sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [books, searchQuery, sortConfig]);

    const SortIcon = ({ col }) => {
        if (sortConfig.key !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
        return <span style={{ marginLeft: 4, color: '#4318ff' }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const renderBookList = () => (
        <>
            <div className="admin-page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '20px' }}>
                <div>
                    <h2 className="admin-page-title" style={{ fontSize: '32px', marginBottom: '4px' }}>Kitap Listesi</h2>
                    <p className="admin-page-subtitle">Kitap envanterini yönetin, düzenleyin veya silin.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', padding: '16px', background: '#f4f7fe', borderRadius: '12px' }}>
                    <button className="admin-secondary-btn" style={{ backgroundColor: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0', fontWeight: '700' }} onClick={() => handleBulkAction('open_all')}>Tümünü Satışa Aç</button>
                    <button className="admin-secondary-btn" style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5', fontWeight: '700' }} onClick={() => handleBulkAction('close_all')}>Tümünü Satışa Kapat</button>

                    <button className={`admin-secondary-btn ${showOnlyCriticalBooks ? 'active' : ''}`} 
                        onClick={() => {
                            setShowOnlyCriticalBooks(!showOnlyCriticalBooks);
                            setShowOnlyInactiveBooks(false); // Karışıklık olmasın diye diğer filtreyi kapatıyoruz
                        }} 
                        style={{ 
                            position: 'relative', 
                            backgroundColor: showOnlyCriticalBooks ? '#4318ff' : 'white',
                            color: showOnlyCriticalBooks ? 'white' : '#2b3674'
                        }}>
                        {showOnlyCriticalBooks ? '👁️ Tümünü Göster' : '⚠️ Kritik Stok'}
                        {criticalStockCount > 0 && !showOnlyCriticalBooks && (
                            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#dc2626', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', border: '2px solid white', fontWeight: 'bold' }}>
                                {criticalStockCount}
                            </span>
                        )}
                    </button>

                    <button className={`admin-secondary-btn ${showOnlyInactiveBooks ? 'active' : ''}`} 
                        onClick={() => {
                            setShowOnlyInactiveBooks(!showOnlyInactiveBooks);
                            setShowOnlyCriticalBooks(false);
                        }}
                        style={{
                            position: 'relative',
                            backgroundColor: showOnlyInactiveBooks ? '#4318ff' : 'white',
                            color: showOnlyInactiveBooks ? 'white' : '#2b3674'
                        }}>
                        {showOnlyInactiveBooks ? '👁️ Tümünü Göster' : '🚫 Pasifteki Kitaplar'}
                        {inactiveBooksCount > 0 && !showOnlyInactiveBooks && (
                            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#dc2626', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', border: '2px solid white', fontWeight: 'bold' }}>
                                {inactiveBooksCount}
                            </span>
                        )}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', paddingLeft: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '15px', marginRight: '4px' }}>%</span>
                        <input
                            type="text"
                            placeholder="15"
                            value={bulkPriceIncrease}
                            onChange={(e) => setBulkPriceIncrease(e.target.value.replace(/[^0-9.]/g, ''))}
                            style={{ width: '45px', border: 'none', padding: '10px 0', outline: 'none', fontSize: '14px', background: 'transparent', fontWeight: '600' }}
                        />
                        <button className="admin-secondary-btn" 
                            style={{ 
                                border: 'none', 
                                borderLeft: '1px solid #e2e8f0', 
                                background: '#f8fafc', 
                                borderRadius: 0, 
                                padding: '10px 20px', 
                                fontWeight: '700',
                                color: '#4318ff',
                                transition: 'all 0.2s'
                            }} 
                            onClick={() => handleBulkAction('price_increase', bulkPriceIncrease)}>
                            Toplu Fiyat Arttır
                        </button>
                    </div>

                    <div style={{ width: '260px', flexShrink: 0, display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <span style={{ color: '#a3aed1', marginRight: '8px', fontSize: '16px' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Kitap ismi ara..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%', padding: '10px 0', background: 'transparent', color: '#2b3674' }}
                        />
                        {searchQuery && (
                            <span onClick={() => setSearchQuery('')} style={{ cursor: 'pointer', color: '#a3aed1', fontSize: '18px', lineHeight: 1 }}>×</span>
                        )}
                    </div>

                    <button className="admin-primary-btn" onClick={() => openBookForm()}>+ Yeni Kitap Ekle</button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-table-wrapper">
                    <table className="admin-modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '35%' }}>Kitaplar</th>
                                <th style={{ width: '20%', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('category')}>
                                    Kategori<SortIcon col="category" />
                                </th>
                                <th style={{ width: '10%', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('stockQuantity')}>
                                    Stok<SortIcon col="stockQuantity" />
                                </th>
                                <th style={{ width: '15%', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('price')}>
                                    Fiyat<SortIcon col="price" />
                                </th>
                                <th style={{ width: '10%', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('isActive')}>
                                    Durum<SortIcon col="isActive" />
                                </th>
                                <th style={{ width: '10%', textAlign: 'right' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredBooks.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#a3aed1' }}>🔍 "{searchQuery}" için sonuç bulunamadı.</td></tr>
                            )}
                            {sortedAndFilteredBooks.map(b => (
                                <tr key={b.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#2b3674' }}>{b.name}</div>
                                                <div style={{ fontSize: '12px', color: '#a3aed1', lineHeight: '1.4' }}>
                                                    {b.author?.split(',').map((a, i) => (
                                                        <div key={i}>{a.trim()}</div>
                                                    )).filter(a => a) || "-"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span style={{ color: '#4318ff', background: '#f4f7fe', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>{b.category || "Yok"}</span></td>
                                    <td>{b.stockQuantity}</td>
                                    <td style={{ fontWeight: '700' }}>₺{b.price.toFixed(2)}</td>
                                    <td>
                                        {b.isActive
                                            ? <span className="status-pill success">Yayında</span>
                                            : <span className="status-pill danger">Pasif</span>}
                                    </td>
                                    <td>
                                        <button className="action-icon-btn" onClick={() => openBookForm(b)}>✏️</button>
                                        <button className="action-icon-btn delete" onClick={() => handleDeleteBook(b.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    currentPage={booksPage} 
                    totalCount={booksTotal} 
                    pageSize={10} 
                    onPageChange={setBooksPage} 
                />
            </div>
        </>
    );

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBookForm({ ...bookForm, imageUrl: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleISBNChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setBookForm({ ...bookForm, isbn: value });
    };

    const renderBookForm = () => (
        <form onSubmit={handleSaveBook}>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">{bookForm.id ? 'Kitap Detayı' : 'Yeni Kitap Ekle'}</h2>
                    <p className="admin-page-subtitle">Kitabın tüm bilgilerini buradan yönetebilirsiniz.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="admin-secondary-btn" onClick={() => setActiveTab('books')}>İptal</button>
                    <button type="submit" className="admin-primary-btn">💾 {bookForm.id ? 'Değişiklikleri Kaydet' : 'Kaydet'}</button>
                </div>
            </div>

            <div className="admin-form-grid">
                <div>
                    <div className="form-section">
                        <h3 className="form-section-title">Temel Bilgiler</h3>
                        <div className="input-group">
                            <label>Kitap Adı</label>
                            <input type="text" placeholder="Kitap Adını Giriniz" value={bookForm.name} onChange={e => setBookForm({ ...bookForm, name: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>Yazar(lar)</label>
                            <input type="text" placeholder="Yazar Adını Giriniz (Birden fazla ise virgül ile ayırın)" value={bookForm.author || ''} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Açıklama</label>
                            <textarea rows="6" placeholder="Kitap hakkında detaylı bilgi içeriği..." value={bookForm.description || ''} onChange={e => setBookForm({ ...bookForm, description: e.target.value })}></textarea>
                        </div>

                        <div style={{ marginTop: '20px', backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', gap: '12px' }}>
                            <div style={{ width: '24px', height: '24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>i</div>
                            <div>
                                <h4 style={{ color: '#1d4ed8', margin: '0 0 4px 0', fontSize: '14px' }}>Ödeme ve Teslimat Bilgisi</h4>
                                <p style={{ color: '#1e40af', margin: 0, fontSize: '13px', fontWeight: '500' }}>Fiyatlara KDV dahildir. Kargo ücreti alıcıya aittir. Dilerseniz siparişinizi Dekanlık birimimizden şahsen teslim alabilirsiniz.</p>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section-title">Kitap Görseli</h3>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div 
                                style={{ 
                                    width: '120px', 
                                    height: '160px', 
                                    backgroundColor: '#f8fafc', 
                                    borderRadius: '12px', 
                                    border: '2px dashed #cbd5e1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                onClick={() => document.getElementById('book-image-input').click()}
                                onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
                                onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                            >
                                {bookForm.imageUrl ? (
                                    <>
                                        <img src={bookForm.imageUrl} alt="Önizleme" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'rgba(0,0,0,0.6)',
                                            color: 'white',
                                            fontSize: '11px',
                                            padding: '4px 0',
                                            textAlign: 'center',
                                            fontWeight: '600'
                                        }}>DEĞİŞTİR</div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                                        <div style={{ fontSize: '28px', marginBottom: '4px' }}>📸</div>
                                        <div style={{ fontSize: '11px', fontWeight: '600' }}>KAPAK SEÇ</div>
                                    </div>
                                )}
                                <input id="book-image-input" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                            </div>
                            <div style={{ flexGrow: 1 }}>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>Kitap Kapağı</h4>
                                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                                    Kapak görselini bilgisayarınızdan seçerek yükleyebilirsiniz.<br/>
                                    Önerilen: 600x900px, JPG veya PNG.
                                </p>
                                {bookForm.imageUrl && (
                                    <button 
                                        type="button" 
                                        onClick={(e) => { e.stopPropagation(); setBookForm({...bookForm, imageUrl: ''}); }}
                                        style={{ 
                                            padding: '6px 14px', 
                                            fontSize: '12px', 
                                            backgroundColor: '#fee2e2', 
                                            color: '#b91c1c', 
                                            border: '1px solid #fecaca', 
                                            borderRadius: '6px', 
                                            cursor: 'pointer', 
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#fecaca'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                    >
                                        🗑️ Görseli Kaldır
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="form-section">
                        <h3 className="form-section-title">Durum ve Görünürlük</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#2b3674' }}>Satışa Açık</span>
                            <label className="switch">
                                <input type="checkbox" checked={bookForm.isActive} onChange={e => setBookForm({ ...bookForm, isActive: e.target.checked })} />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#2b3674' }}>Öne Çıkarılan</span>
                            <label className="switch">
                                <input type="checkbox" checked={bookForm.isFeatured} onChange={e => setBookForm({ ...bookForm, isFeatured: e.target.checked })} />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section-title">Detaylar</h3>
                        <div className="input-group">
                            <label>Kategori</label>
                            <select value={bookForm.category || ''} onChange={e => setBookForm({ ...bookForm, category: e.target.value })}>
                                <option value="">Kategori Seçin</option>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="input-row">
                            <div className="input-group">
                                <label>Yayınevi</label>
                                <input type="text" placeholder="Yayınevi Adını Giriniz" value={bookForm.publisher || ''} onChange={e => setBookForm({ ...bookForm, publisher: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>ISBN No</label>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    placeholder="Örn: 978-605-..." 
                                    value={bookForm.isbn || ''} 
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9-]/g, '');
                                        setBookForm({ ...bookForm, isbn: val });
                                    }} 
                                />
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="input-group">
                                <label>Basım Yılı</label>
                                <input type="number" placeholder="Örn: 2024" value={bookForm.publicationYear} onChange={e => setBookForm({ ...bookForm, publicationYear: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Sayfa Sayısı</label>
                                <input type="number" placeholder="Örn: 350" value={bookForm.pageCount} onChange={e => setBookForm({ ...bookForm, pageCount: e.target.value })} />
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="input-group">
                                <label>Baskı Sayısı</label>
                                <input type="text" placeholder="Örn: 1. Baskı" value={bookForm.edition || ''} onChange={e => setBookForm({ ...bookForm, edition: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Dil</label>
                                <input type="text" placeholder="Örn: Türkçe" value={bookForm.language || ''} onChange={e => setBookForm({ ...bookForm, language: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section-title">Fiyat ve Stok</h3>
                        <div className="input-group">
                            <label>Fiyat (₺)</label>
                            <input type="number" step="0.01" placeholder="Örn: 150.00" value={bookForm.price} onChange={e => setBookForm({ ...bookForm, price: e.target.value })} />
                        </div>
                        <div className="input-row">
                            <div className="input-group">
                                <label>Stok Adedi</label>
                                <input type="number" placeholder="Örn: 100" value={bookForm.stockQuantity} onChange={e => setBookForm({ ...bookForm, stockQuantity: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Min Stok</label>
                                <input type="number" value={bookForm.minStockLevel} onChange={e => setBookForm({ ...bookForm, minStockLevel: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );

    return activeTab === 'books' ? renderBookList() : renderBookForm();
};

export default BookManagement;
