import React from 'react';

const Favorites = () => {
    const favorites = [
        { id: 1, name: 'Termodinamik Prensipleri', author: 'Doç. Dr. Ayşe Yılmaz', price: '₺180.00', category: 'Makina Mühendisliği' },
        { id: 2, name: 'Akışkanlar Mekaniği', author: 'Prof. Dr. Mehmet Demir', price: '₺210.00', category: 'İnşaat Mühendisliği' }
    ];

    return (
        <div className="animate-slide-up">
            <div className="user-panel-header">
                <h2 className="user-panel-title">Favorilerim</h2>
                <p className="user-panel-subtitle">Beğendiğiniz ve daha sonra satın almak istediğiniz kitaplar.</p>
            </div>

            {favorites.length > 0 ? (
                <div className="address-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {favorites.map(book => (
                        <div key={book.id} className="address-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ width: '100%', height: '180px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', marginBottom: '16px' }}>
                                📖
                            </div>
                            <div style={{ fontWeight: '700', color: '#2b3674', fontSize: '14px', marginBottom: '4px' }}>{book.name}</div>
                            <div style={{ fontSize: '12px', color: '#a3aed1', marginBottom: '8px' }}>{book.author}</div>
                            <div style={{ fontWeight: '800', color: '#4318ff', marginBottom: '12px' }}>{book.price}</div>
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                <button className="user-primary-btn" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>🛒 Sepete Ekle</button>
                                <button className="user-secondary-btn" style={{ padding: '8px', color: '#ee5d50' }}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="user-panel-card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>❤️</div>
                    <h3 style={{ color: '#2b3674' }}>Henüz Favoriniz Yok</h3>
                    <p style={{ color: '#a3aed1' }}>Kitaplar sayfasından beğendiğiniz kitapları favorilerinize ekleyebilirsiniz.</p>
                </div>
            )}
        </div>
    );
};

export default Favorites;
