import React, { useState } from 'react';
import Pagination from './Pagination';

const UserManagement = ({ users, usersTotal, usersPage, setUsersPage, formatDate, handleViewUser, handleDeleteUser, selectedUser, setSelectedUser }) => {
    const [ordersPage, setOrdersPage] = useState(1);
    const ordersPerPage = 5;

    if (selectedUser) {
        const indexOfLastOrder = ordersPage * ordersPerPage;
        const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
        const currentOrders = selectedUser.orders.slice(indexOfFirstOrder, indexOfLastOrder);

        return (
            <>
                <div className="admin-page-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button className="admin-secondary-btn" style={{ padding: '8px', minWidth: '40px', borderRadius: '50%' }} onClick={() => { setSelectedUser(null); setOrdersPage(1); }}>←</button>
                            <div>
                                <h2 className="admin-page-title">Kullanıcı Detayı: {selectedUser.user.firstName} {selectedUser.user.lastName}</h2>
                                <p className="admin-page-subtitle">Kullanıcı profil bilgileri ve işlem geçmişi.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-form-grid">
                    <div className="admin-card" style={{ height: 'fit-content' }}>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ width: '100px', height: '100px', background: '#e0f2fe', color: '#0369a1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px', fontWeight: '800' }}>
                                {selectedUser.user.firstName?.charAt(0)}{selectedUser.user.lastName?.charAt(0)}
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#2b3674', marginBottom: '4px' }}>{selectedUser.user.firstName} {selectedUser.user.lastName}</h3>
                            <p style={{ color: '#a3aed1', fontSize: '14px', marginBottom: '16px' }}>{selectedUser.user.role || 'Standart Kullanıcı'}</p>
                        </div>

                        <div style={{ marginTop: '24px', borderTop: '1px solid #f4f7fe', paddingTop: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ color: '#a3aed1' }}>📧</div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#a3aed1', fontWeight: '600' }}>E-POSTA</div>
                                    <div style={{ fontWeight: '700', color: '#2b3674' }}>{selectedUser.user.email}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ color: '#a3aed1' }}>📞</div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#a3aed1', fontWeight: '600' }}>TELEFON</div>
                                    <div style={{ fontWeight: '700', color: '#2b3674' }}>{selectedUser.user.phoneNumber || '-'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ color: '#a3aed1' }}>📅</div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#a3aed1', fontWeight: '600' }}>KAYIT TARİHİ</div>
                                    <div style={{ fontWeight: '700', color: '#2b3674' }}>{formatDate(selectedUser.user.createdAt)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h3 className="admin-card-title">🛍️ Sipariş Geçmişi</h3>
                        </div>
                        <div className="admin-table-wrapper">
                            <table className="admin-modern-table">
                                <thead>
                                    <tr>
                                        <th>SİPARİŞ NO</th>
                                        <th>TARİH</th>
                                        <th>TUTAR</th>
                                        <th>DURUM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentOrders.map(o => (
                                        <tr key={o.id}>
                                            <td style={{ color: '#a3aed1', fontWeight: '600' }}>#{o.orderNumber}</td>
                                            <td>{formatDate(o.createdAtUtc)}</td>
                                            <td style={{ fontWeight: '800', color: '#2b3674' }}>₺{o.totalPrice.toFixed(2)}</td>
                                            <td>
                                                <span className={`status-pill ${o.status === 5 ? 'danger' : o.status === 3 || o.status === 4 ? 'success' : 'warning'}`}>
                                                    {o.status === 1 ? 'Beklemede' : o.status === 2 ? 'Hazırlanıyor' : o.status === 3 ? 'Kargolandı' : o.status === 4 ? 'Teslim Edildi' : 'İptal'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {selectedUser.orders.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#a3aed1' }}>Henüz sipariş bulunmuyor.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {selectedUser.orders.length > ordersPerPage && (
                            <Pagination 
                                currentPage={ordersPage} 
                                totalCount={selectedUser.orders.length} 
                                pageSize={ordersPerPage} 
                                onPageChange={setOrdersPage} 
                            />
                        )}
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Kullanıcı Listesi</h2>
                    <p className="admin-page-subtitle">Sisteme kayıtlı kullanıcıları ve yetkilerini görüntüleyin.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-table-wrapper">
                    <table className="admin-modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '35%' }}>Kullanıcı (Ad Soyad)</th>
                                <th style={{ width: '35%' }}>E-Posta</th>
                                <th style={{ width: '20%' }}>Yetki</th>
                                <th style={{ width: '10%', textAlign: 'right' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', background: '#e0f2fe', color: '#0369a1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px' }}>
                                                {u.firstName?.charAt(0) || 'U'}{u.lastName?.charAt(0) || ''}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#2b3674' }}>{u.firstName} {u.lastName}</div>
                                                <div style={{ fontSize: '12px', color: '#a3aed1' }}>ID: #{u.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{u.email}</td>

                                    <td>
                                        <span className="status-pill" style={{
                                            background: u.role === 'Admin' ? '#fef3c7' : '#f1f5f9',
                                            color: u.role === 'Admin' ? '#d97706' : '#475569'
                                        }}>
                                            {u.role || 'Kullanıcı'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {u.id !== 1 && (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button className="action-icon-btn" title="Kullanıcıyı İncele" onClick={() => handleViewUser(u.id)}>
                                                    👁️
                                                </button>
                                                <button className="action-icon-btn delete" title="Kullanıcıyı Sil" onClick={() => handleDeleteUser(u.id)} style={{ color: '#ef4444' }}>
                                                    🗑️
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan="5">Kullanıcı bulunamadı.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    currentPage={usersPage} 
                    totalCount={usersTotal} 
                    pageSize={10} 
                    onPageChange={setUsersPage} 
                />
            </div>
        </>
    );
};

export default UserManagement;
