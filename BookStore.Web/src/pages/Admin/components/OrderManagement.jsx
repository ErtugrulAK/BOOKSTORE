import React from 'react';
import axios from 'axios';
import Pagination from './Pagination';

const OrderManagement = ({ 
    selectedOrder, 
    setSelectedOrder, 
    orders, 
    ordersTotal,
    ordersPage,
    setOrdersPage,
    formatDate, 
    getStatusText, 
    tempOrderStatus, 
    setTempOrderStatus, 
    token, 
    fetchData,
    handleViewOrder
}) => {
    const [searchCode, setSearchCode] = React.useState('');
    const [verifyCode, setVerifyCode] = React.useState('');
    const [cargoTrackingCode, setCargoTrackingCode] = React.useState('');

    const handleSearchByCode = async () => {
        if (!searchCode) return window.showToast("Lütfen bir kod giriniz.", true);
        try {
            const response = await axios.get(`/api/Orders/by-code/${searchCode}`, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const foundOrder = response.data;
            handleViewOrder({ ...foundOrder, isVerified: true });
            setSearchCode('');
        } catch (err) {
            window.showToast("Kod bulunamadı.", true);
        }
    };

    const handleVerifyPickup = async () => {
        if (!verifyCode) return window.showToast("Lütfen kodu giriniz.", true);
        try {
            await axios.post(`/api/Orders/${selectedOrder.id}/verify-pickup`, 
                JSON.stringify(verifyCode), 
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            window.showToast("Kod Doğrulandı!");
            setSelectedOrder({ ...selectedOrder, isVerified: true });
            setVerifyCode('');
            fetchData();
        } catch (err) {
            window.showToast(err.response?.data || "Doğrulama başarısız.", true);
        }
    };

    const renderOrderDetails = () => {
        if (!selectedOrder) return null;

        return (
            <>
                <div className="admin-page-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <h2 className="admin-page-title">Sipariş {selectedOrder.orderNumber}</h2>
                            <span className="status-pill" style={{
                                background: (selectedOrder.status === 5 || selectedOrder.status === 7) ? '#fee2e2' : selectedOrder.status === 3 || selectedOrder.status === 4 || selectedOrder.status === 6 ? '#dcfce7' : '#fef3c7',
                                color: (selectedOrder.status === 5 || selectedOrder.status === 7) ? '#dc2626' : selectedOrder.status === 3 || selectedOrder.status === 4 || selectedOrder.status === 6 ? '#16a34a' : '#d97706',
                                fontSize: '14px', marginTop: '6px'
                            }}>
                                {getStatusText(selectedOrder.status, selectedOrder.paymentMethod)}
                            </span>
                        </div>
                        <p className="admin-page-subtitle">Sipariş detaylarını inceleyin ve durumu güncelleyin.</p>
                    </div>
                    <div>
                        <button className="admin-secondary-btn" onClick={() => setSelectedOrder(null)}>⬅ Geri Dön</button>
                    </div>
                </div>

                <div className="admin-grid" style={{ gridTemplateColumns: '2fr 1.2fr' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="admin-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 className="admin-card-title">Müşteri & Teslimat Bilgileri</h3>
                                {selectedOrder.isVerified && (
                                    <span style={{ 
                                        padding: '8px 16px', 
                                        background: '#dcfce7', 
                                        color: '#15803d', 
                                        border: '1.5px solid #86efac',
                                        borderRadius: '8px', 
                                        fontSize: '15px', 
                                        fontWeight: '900',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.1)'
                                    }}>✅ KOD DOĞRULANDI</span>
                                )}
                            </div>
                            <div className="admin-info-grid">
                                <div className="info-item">
                                    <label>Müşteri Adı</label>
                                    <span>{selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : `Kullanıcı #${selectedOrder.userId}`}</span>
                                </div>
                                {selectedOrder.user?.phoneNumber && (
                                    <div className="info-item">
                                        <label>Telefon</label>
                                        <span>{selectedOrder.user.phoneNumber}</span>
                                    </div>
                                )}
                                {selectedOrder.user?.email && (
                                    <div className="info-item">
                                        <label>E-Posta</label>
                                        <span>{selectedOrder.user.email}</span>
                                    </div>
                                )}
                                <div className="info-item">
                                    <label>Sipariş Tarihi</label>
                                    <span>{formatDate(selectedOrder.createdAtUtc)}</span>
                                </div>
                                <div className="info-item">
                                    <label>Ödeme Yöntemi</label>
                                    <span style={{ fontWeight: '700', color: selectedOrder.paymentMethod === 'Nakit' ? '#16a34a' : '#1e3a8a' }}>
                                        {selectedOrder.paymentMethod === 'Nakit' ? '💵 Nakit' : '💳 Online'}
                                    </span>
                                </div>
                                <div className="info-item" style={{ gridColumn: 'span 2' }}>
                                    <label>Teslimat Adresi</label>
                                    <span>{selectedOrder.deliveryAddress}</span>
                                </div>
                                {selectedOrder.cargoTrackingNumber && (
                                    <div className="info-item" style={{ gridColumn: 'span 2' }}>
                                        <label>Kargo Takip Numarası (PTT)</label>
                                        <span>
                                            <a 
                                                href={`https://gonderitakip.ptt.gov.tr/Track/ActiveTrack?id=${selectedOrder.cargoTrackingNumber}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                style={{ color: '#4318ff', fontWeight: '700', textDecoration: 'underline' }}
                                            >
                                                {selectedOrder.cargoTrackingNumber} 🔗
                                            </a>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="admin-card">
                            <h3 className="admin-card-title">Sipariş Durumu Güncelle</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    {selectedOrder.paymentMethod === 'Nakit' ? (
                                        <select
                                            className="admin-select"
                                            style={{ width: '200px' }}
                                            value={tempOrderStatus !== null ? tempOrderStatus : selectedOrder.status}
                                            onChange={(e) => setTempOrderStatus(parseInt(e.target.value))}
                                        >
                                            <option value="6">Nakit</option>
                                            <option value="5">İptal Edildi</option>
                                            <option value="7">İade Edildi</option>
                                        </select>
                                    ) : selectedOrder.pickupCode ? (
                                        <select
                                            className="admin-select"
                                            style={{ width: '200px' }}
                                            value={tempOrderStatus !== null ? tempOrderStatus : selectedOrder.status}
                                            onChange={(e) => setTempOrderStatus(parseInt(e.target.value))}
                                        >
                                            <option value="2">Hazırlanıyor</option>
                                            <option value="6">Elden Teslim Edildi</option>
                                            <option value="5">İptal Edildi</option>
                                            <option value="7">İade Edildi</option>
                                        </select>
                                    ) : (
                                        <select
                                            className="admin-select"
                                            style={{ width: '200px' }}
                                            value={tempOrderStatus !== null ? tempOrderStatus : selectedOrder.status}
                                            onChange={(e) => setTempOrderStatus(parseInt(e.target.value))}
                                        >
                                            <option value="2">Hazırlanıyor</option>
                                            <option value="3">Kargoya Verildi</option>
                                            <option value="5">İptal Edildi</option>
                                            <option value="7">İade Edildi</option>
                                        </select>
                                    )}

                                    {tempOrderStatus !== null && tempOrderStatus !== selectedOrder.status && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="admin-primary-btn" onClick={async () => {
                                                try {
                                                    await axios.put(`/api/Orders/${selectedOrder.id}/status`,
                                                        { 
                                                            Status: tempOrderStatus,
                                                            CargoTrackingNumber: tempOrderStatus === 3 ? cargoTrackingCode : null
                                                        },
                                                        { headers: { Authorization: `Bearer ${token}` } });
                                                    window.showToast("Sipariş durumu güncellendi!");
                                                    setSelectedOrder({ 
                                                        ...selectedOrder, 
                                                        status: tempOrderStatus,
                                                        cargoTrackingNumber: tempOrderStatus === 3 ? cargoTrackingCode : selectedOrder.cargoTrackingNumber
                                                    });
                                                    setCargoTrackingCode('');
                                                    fetchData();
                                                } catch (err) {
                                                    window.showToast("Durum güncellenirken hata oluştu.", true);
                                                }
                                            }}>Değişiklikleri Kaydet</button>
                                            <button className="admin-secondary-btn" onClick={() => { setTempOrderStatus(selectedOrder.status); setCargoTrackingCode(''); }}>İptal Et</button>
                                        </div>
                                    )}
                                </div>
                                {tempOrderStatus === 3 && (
                                    <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Kargo Takip Numarası (PTT)</label>
                                        <input 
                                            type="text" 
                                            placeholder="PTT Takip Numarasını Girin (İsteğe Bağlı)"
                                            value={cargoTrackingCode}
                                            onChange={(e) => setCargoTrackingCode(e.target.value)}
                                            className="admin-input"
                                            style={{ maxWidth: '300px', height: '40px', padding: '0 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">Sipariş İçeriği</h3>
                                <span style={{ color: '#a3aed1', fontWeight: '500' }}>{selectedOrder.orderItems?.length || 0} Çeşit Ürün</span>
                            </div>

                            <div className="order-items-list">
                                {selectedOrder.orderItems?.map((item, index) => (
                                    <div key={index} className="order-detail-item">
                                        <div className="order-item-icon">📘</div>
                                        <div className="order-item-info">
                                            <h4>{item.book?.name || "Bilinmeyen Ürün"}</h4>
                                            <p>{item.book?.author || "Yazar Yok"} | ISBN: {item.book?.isbn || "-"}</p>
                                        </div>
                                        <div className="order-item-qty">
                                            {item.quantity} Adet
                                        </div>
                                        <div className="order-item-price">
                                            ₺{(item.unitPrice * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="admin-card">
                        <h3 className="admin-card-title">Ödeme Özeti</h3>
                        <div className="order-summary-box">
                            <div className="summary-divider"></div>
                            <div className="summary-row total">
                                <span>Toplam Tutar</span>
                                <span>₺{selectedOrder.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    if (selectedOrder) return renderOrderDetails();

    return (
        <>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Sipariş Listesi</h2>
                    <p className="admin-page-subtitle">Sistemdeki siparişleri görüntüleyin ve detaylarına ulaşın.</p>
                </div>
            </div>

            <div className="admin-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%)', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                            width: '48px', height: '48px', background: '#3b82f6', borderRadius: '12px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', color: '#fff'
                        }}>🛡️</div>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', color: '#1e3a8a', fontSize: '16px', fontWeight: '700' }}>Elden Teslimat Doğrulama</h3>
                            <p style={{ margin: 0, color: '#3b82f6', fontSize: '13px', fontWeight: '500' }}>Öğrencinin getirdiği teslimat kodunu girerek siparişi anında bulun.</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', flex: '1', maxWidth: '400px' }}>
                        <input 
                            type="text" 
                            placeholder="DK-FXXXXX" 
                            className="admin-input" 
                            style={{ 
                                flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: '800', 
                                letterSpacing: '1px', textTransform: 'uppercase', border: '2px solid #bfdbfe',
                                borderRadius: '12px', background: '#fff', height: '48px'
                            }}
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchByCode()}
                        />
                        <button 
                            className="admin-primary-btn" 
                            style={{ padding: '0 24px', borderRadius: '12px', height: '48px', fontWeight: '700' }}
                            onClick={handleSearchByCode}
                        >Bul & Doğrula</button>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-table-wrapper">
                    <table className="admin-modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>Sipariş No</th>
                                <th style={{ width: '15%' }}>Tarih</th>
                                <th style={{ width: '30%' }}>Müşteri Adı</th>
                                <th style={{ width: '15%' }}>Tutar</th>
                                <th style={{ width: '15%' }}>Durum</th>
                                <th style={{ width: '5%', textAlign: 'right' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id}>
                                    <td style={{ color: '#4318ff', fontWeight: '700' }}>{o.orderNumber}</td>
                                    <td>{new Date(o.createdAtUtc).toLocaleDateString()}</td>
                                    <td>{o.user ? `${o.user.firstName} ${o.user.lastName}` : `Kullanıcı #${o.userId}`}</td>
                                    <td style={{ fontWeight: '700' }}>₺{o.totalPrice.toFixed(2)}</td>
                                    <td>
                                        <span className="status-pill" style={{
                                            background: o.status === 5 ? '#fee2e2' : o.status === 3 || o.status === 4 || o.status === 6 ? '#dcfce7' : '#fef3c7',
                                            color: o.status === 5 ? '#dc2626' : o.status === 3 || o.status === 4 || o.status === 6 ? '#16a34a' : '#d97706'
                                        }}>
                                            {getStatusText(o.status, o.paymentMethod)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="action-icon-btn" title="İncele" onClick={() => handleViewOrder(o)}>
                                            👁️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && <tr><td colSpan="6">Sipariş bulunamadı.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination 
                    currentPage={ordersPage} 
                    totalCount={ordersTotal} 
                    pageSize={10} 
                    onPageChange={setOrdersPage} 
                />
            </div>
        </>
    );
};

export default OrderManagement;
