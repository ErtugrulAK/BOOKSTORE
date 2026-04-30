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
    const [verifyCode, setVerifyCode] = React.useState('');

    const handleVerifyPickup = async () => {
        if (!verifyCode) return window.showToast("Lütfen kodu giriniz.", true);
        try {
            await axios.post(`http://localhost:5229/api/Orders/${selectedOrder.id}/verify-pickup`, 
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
                                background: selectedOrder.status === 2 || selectedOrder.status === 5 || selectedOrder.status === 6 ? '#fee2e2' : selectedOrder.status === 1 || selectedOrder.status === 3 || selectedOrder.status === 4 ? '#dcfce7' : '#fef3c7',
                                color: selectedOrder.status === 2 || selectedOrder.status === 5 || selectedOrder.status === 6 ? '#dc2626' : selectedOrder.status === 1 || selectedOrder.status === 3 || selectedOrder.status === 4 ? '#16a34a' : '#d97706',
                                fontSize: '14px', marginTop: '6px'
                            }}>
                                • {getStatusText(selectedOrder.status)}
                            </span>
                        </div>
                    </div>
                    <div>
                        <button className="admin-secondary-btn" onClick={() => setSelectedOrder(null)}>⬅ Geri Dön</button>
                    </div>
                </div>

                <div className="admin-card">
                    <h3 className="admin-card-title">Sipariş Durumu Güncelle</h3>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'center' }}>
                        <select
                            className="admin-select"
                            style={{ width: '200px' }}
                            value={tempOrderStatus !== null ? tempOrderStatus : selectedOrder.status}
                            onChange={(e) => setTempOrderStatus(parseInt(e.target.value))}
                        >
                            <option value="2">Hazırlanıyor</option>
                            <option value="3">Kargoya Verildi</option>
                            <option value="5">İptal / İade</option>
                        </select>

                        {tempOrderStatus !== null && tempOrderStatus !== selectedOrder.status && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="admin-primary-btn" onClick={async () => {
                                    try {
                                        await axios.put(`http://localhost:5229/api/Orders/${selectedOrder.id}/status`,
                                            { Status: tempOrderStatus },
                                            { headers: { Authorization: `Bearer ${token}` } });
                                        window.showToast("Sipariş durumu güncellendi!");
                                        setSelectedOrder({ ...selectedOrder, status: tempOrderStatus });
                                        fetchData();
                                    } catch (err) {
                                        window.showToast("Durum güncellenirken hata oluştu.", true);
                                    }
                                }}>Değişiklikleri Kaydet</button>
                                <button className="admin-secondary-btn" onClick={() => setTempOrderStatus(selectedOrder.status)}>İptal Et</button>
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

                <div className="admin-form-grid" style={{ marginTop: '24px' }}>
                    <div className="admin-card">
                        <h3 className="admin-card-title">Teslimat Adresi & Müşteri</h3>
                        <div style={{ marginTop: '16px', lineHeight: '1.6' }}>
                            <p style={{ margin: '0 0 8px 0', fontWeight: '700', color: '#2b3674' }}>
                                {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                            </p>
                            <p style={{ margin: '0 0 16px 0', color: '#a3aed1', fontSize: '14px' }}>
                                E-posta: {selectedOrder.user?.email}
                            </p>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', color: '#2b3674', fontSize: '14px' }}>
                                {selectedOrder.deliveryAddress || "Adres bilgisi bulunamadı."}
                            </div>
                            {selectedOrder.pickupCode && !selectedOrder.isVerified && selectedOrder.status !== 4 && (
                                <div style={{ 
                                    marginTop: '16px', 
                                    padding: '28px', 
                                    background: 'linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%)', 
                                    border: '1px solid #bfdbfe', 
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ 
                                        width: '56px', 
                                        height: '56px', 
                                        background: '#3b82f6', 
                                        borderRadius: '16px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '28px',
                                        marginBottom: '16px',
                                        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)',
                                        color: '#fff'
                                    }}>🛡️</div>
                                    <h4 style={{ fontSize: '15px', color: '#1e3a8a', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>GÜVENLİ TESLİMAT DOĞRULAMA</h4>
                                    <p style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '24px', fontWeight: '600' }}>Lütfen alıcının teslimat kodunu giriniz</p>
                                    
                                    <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
                                        <input 
                                            type="text" 
                                            placeholder="DK-FXXXXX" 
                                            className="admin-input" 
                                            style={{ 
                                                flex: 1,
                                                textAlign: 'center', 
                                                fontSize: '18px', 
                                                fontWeight: '800', 
                                                letterSpacing: '2px', 
                                                textTransform: 'uppercase',
                                                border: '2px solid #bfdbfe',
                                                borderRadius: '14px',
                                                background: '#fff',
                                                height: '50px'
                                            }}
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value)}
                                        />
                                        <button 
                                            className="admin-primary-btn" 
                                            style={{ 
                                                padding: '0 24px', 
                                                borderRadius: '14px', 
                                                background: '#3b82f6',
                                                height: '50px',
                                                fontWeight: '700',
                                                fontSize: '14px'
                                            }}
                                            onClick={handleVerifyPickup}
                                        >Doğrula</button>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '16px', lineHeight: '1.4' }}>
                                        Kod doğrulaması yapıldıktan sonra sipariş durumunu üstteki panelden güncelleyebilirsiniz.
                                    </p>
                                </div>
                            )}
                            {selectedOrder.isVerified && (
                                <div style={{ 
                                    marginTop: '16px', 
                                    padding: '20px', 
                                    background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)', 
                                    border: '1px solid #86efac', 
                                    borderRadius: '16px', 
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <div style={{ fontSize: '24px' }}>✅</div>
                                    <span style={{ fontSize: '15px', color: '#166534', fontWeight: '800' }}>KOD DOĞRULANDI</span>
                                </div>
                            )}
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

            <div className="admin-card">
                <div className="admin-table-wrapper">
                    <table className="admin-modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>Sipariş No</th>
                                <th style={{ width: '15%' }}>Tarih</th>
                                <th style={{ width: '30%' }}>Kullanıcı (ID)</th>
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
                                    <td>#{o.userId}</td>
                                    <td style={{ fontWeight: '700' }}>₺{o.totalPrice.toFixed(2)}</td>
                                    <td>
                                        <span className="status-pill" style={{
                                            background: o.status === 5 ? '#fee2e2' : o.status === 3 || o.status === 4 ? '#dcfce7' : '#fef3c7',
                                            color: o.status === 5 ? '#dc2626' : o.status === 3 || o.status === 4 ? '#16a34a' : '#d97706'
                                        }}>
                                            {getStatusText(o.status)}
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
