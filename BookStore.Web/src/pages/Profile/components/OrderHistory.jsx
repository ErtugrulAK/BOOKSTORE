import React, { useState } from 'react';
import axios from 'axios';

const OrderHistory = ({ orders = [], token, onRefresh }) => {
    const [selectedOrder, setSelectedOrder] = useState(null);

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Bu siparişi iptal etmek/iade etmek istediğinize emin misiniz?")) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`http://localhost:5229/api/Orders/${orderId}/cancel`, {}, config);
            window.showToast("Sipariş iptal/iade talebi başarıyla alındı.");
            
            if (onRefresh) await onRefresh();
            
            // Update local selected order status
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: 'Cancelled' });
            }
        } catch (error) {
            console.error("Sipariş iptal edilemedi:", error);
            window.showToast(error.response?.data || "İşlem sırasında bir hata oluştu.", true);
        }
    };

    if (selectedOrder) {
        return (
            <div className="animate-slide-up">
                <button className="user-secondary-btn" style={{ marginBottom: '30px', padding: '10px 20px', fontSize: '14px' }} onClick={() => setSelectedOrder(null)}>
                    ← Sipariş Listesine Dön
                </button>
                
                <div className="user-panel-card animate-slide-up" style={{ padding: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                        <div>
                            <h2 className="user-panel-title" style={{ margin: 0, fontSize: '28px', color: '#1b2559' }}>Sipariş {selectedOrder.orderNumber}</h2>
                            <p className="user-panel-subtitle" style={{ margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#a3aed1' }}>🗓️ Sipariş Tarihi:</span> 
                                <span style={{ fontWeight: '700', color: '#2b3674' }}>{new Date(selectedOrder.createdAtUtc).toLocaleDateString('tr-TR')} {new Date(selectedOrder.createdAtUtc).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className={`status-pill ${(selectedOrder.status === 'Processing' || selectedOrder.status === 2 || selectedOrder.status === 'Pending' || selectedOrder.status === 0) ? 'warning' : (selectedOrder.status === 'Cancelled' || selectedOrder.status === 5) ? 'danger' : 'success'}`} style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '12px' }}>
                                {selectedOrder.status === 'Pending' || selectedOrder.status === 0 ? 'Hazırlanıyor' : 
                                 selectedOrder.status === 'Processing' || selectedOrder.status === 2 ? 'Hazırlanıyor' :
                                 selectedOrder.status === 'Shipped' || selectedOrder.status === 3 ? 'Kargoya Verildi' :
                                 selectedOrder.status === 'Delivered' || selectedOrder.status === 4 ? 'Teslim Edildi' :
                                 selectedOrder.status === 'Cancelled' || selectedOrder.status === 5 ? 'İptal Edildi' : selectedOrder.status}
                            </span>
                        </div>
                    </div>

                    <div className="order-timeline" style={{ background: '#f8fafc', padding: '30px', borderRadius: '24px', marginBottom: '40px' }}>
                        <div className={`timeline-step ${(selectedOrder.status === 'Processing' || selectedOrder.status === 2 || selectedOrder.status === 'Shipped' || selectedOrder.status === 3 || selectedOrder.status === 'Delivered' || selectedOrder.status === 4) ? 'completed' : 'active'}`}>
                            <div className="step-icon">📦</div>
                            <div className="step-label">Hazırlanıyor</div>
                            <div className="step-time" style={{ fontWeight: '700' }}>{(selectedOrder.status === 'Processing' || selectedOrder.status === 2) ? 'İşleniyor' : 'Tamamlandı'}</div>
                        </div>
                        <div className={`timeline-step ${(selectedOrder.status === 'Shipped' || selectedOrder.status === 3) ? 'active' : (selectedOrder.status === 'Delivered' || selectedOrder.status === 4) ? 'completed' : ''}`}>
                            <div className="step-icon">🚚</div>
                            <div className="step-label">Kargoya Verildi</div>
                            <div className="step-time" style={{ fontWeight: '700' }}>{(selectedOrder.status === 'Shipped' || selectedOrder.status === 3) ? 'Yolda' : (selectedOrder.status === 'Delivered' || selectedOrder.status === 4) ? 'Teslim Edildi' : 'Bekleniyor'}</div>
                        </div>
                    </div>

                    {selectedOrder.pickupCode && (
                        <div style={{
                            marginBottom: '40px',
                            background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                            border: '2px dashed #3b82f6',
                            padding: '30px',
                            borderRadius: '24px',
                            textAlign: 'center',
                            boxShadow: '0 10px 20px rgba(59, 130, 246, 0.1)'
                        }}>
                            <h4 style={{margin: '0 0 10px 0', color: '#3b82f6', fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px'}}>🔐 Dekanlık Teslimat Kodunuz</h4>
                            <div style={{fontSize: '36px', fontWeight: '900', letterSpacing: '4px', color: '#1e293b', textShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                                {selectedOrder.pickupCode}
                            </div>
                            <p style={{ margin: '15px 0 0 0', fontSize: '13px', color: '#64748b' }}>Bu kodu kitapları dekanlıktan teslim alırken görevliye göstermeniz yeterlidir.</p>
                        </div>
                    )}

                    <div className="user-section-title" style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>📚</span> Sipariş İçeriği
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {selectedOrder.orderItems?.map((item, idx) => (
                            <div key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: '20px', 
                                padding: '20px', 
                                border: '1px solid #f1f5f9', 
                                borderRadius: '20px', 
                                background: 'white',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ 
                                    width: '60px', 
                                    height: '80px', 
                                    background: '#f8fafc', 
                                    borderRadius: '12px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontSize: '28px',
                                    border: '1px solid #e2e8f0'
                                }}>📖</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', color: '#1b2559', fontSize: '16px', marginBottom: '4px' }}>{item.book?.name || "Kitap Bilgisi Yok"}</div>
                                    <div style={{ fontSize: '14px', color: '#a3aed1', fontWeight: '500' }}>{item.book?.author || "Yazar Bilgisi Yok"}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', color: '#a3aed1', marginBottom: '4px' }}>{item.quantity} Adet</div>
                                    <div style={{ fontWeight: '900', color: '#4318ff', fontSize: '18px' }}>₺{(item.unitPrice || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="user-grid" style={{ marginTop: '40px', gap: '30px' }}>
                        <div style={{ padding: '30px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontWeight: '800', color: '#1b2559', marginBottom: '15px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📍</span> Teslimat Adresi
                            </div>
                            <div style={{ fontSize: '14px', color: '#707eae', lineHeight: '1.8' }}>
                                {selectedOrder.deliveryAddress || "Adres bilgisi bulunamadı."}
                            </div>
                        </div>
                        <div style={{ padding: '30px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontWeight: '800', color: '#1b2559', marginBottom: '15px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>💳</span> Ödeme Özeti
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#a3aed1', fontWeight: '500' }}>Ara Toplam</span>
                                    <span style={{ fontWeight: '700', color: '#2b3674' }}>₺{selectedOrder.totalPrice?.toFixed(2)}</span>
                                </div>
                                <div style={{ height: '1px', background: '#e2e8f0', margin: '5px 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: '800', color: '#1b2559' }}>Genel Toplam</span>
                                    <span style={{ fontWeight: '900', color: '#4318ff', fontSize: '24px' }}>₺{selectedOrder.totalPrice?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {(selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 5) && (
                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                className="user-primary-btn" 
                                style={{ 
                                    background: '#fff5f5', 
                                    color: '#ef4444',
                                    borderColor: '#fee2e2',
                                    padding: '15px 30px',
                                    borderRadius: '16px',
                                    fontWeight: '700',
                                    fontSize: '14px'
                                }}
                                onClick={() => handleCancelOrder(selectedOrder.id)}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.color = '#ef4444'; }}
                            >
                                ⚠️ Siparişi İptal Et / İade Talebi Oluştur
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up">
            <div className="user-page-header">
                <h2 className="user-panel-title">Sipariş Geçmişi</h2>
                <p className="user-panel-subtitle">Geçmiş siparişlerinizi ve durumlarını buradan takip edebilirsiniz.</p>
            </div>

            <div className="user-panel-card" style={{ padding: 0, overflow: 'hidden' }}>
                {orders.length > 0 ? (
                    <table className="user-modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>SİPARİŞ NO</th>
                                <th style={{ width: '20%' }}>TARİH</th>
                                <th style={{ width: '20%' }}>TUTAR</th>
                                <th style={{ width: '25%' }}>DURUM</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>İŞLEMLER</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <div className="order-id">{order.orderNumber}</div>
                                        <div style={{ fontSize: '12px', color: '#a3aed1', fontWeight: 500 }}>{order.orderItems?.length || 0} Ürün</div>
                                    </td>
                                    <td>
                                        <div className="order-date">{new Date(order.createdAtUtc).toLocaleDateString('tr-TR')}</div>
                                    </td>
                                    <td style={{ fontWeight: '800', color: '#2b3674' }}>₺{order.totalPrice?.toFixed(2)}</td>
                                    <td>
                                        <span className={`status-pill ${(order.status === 'Processing' || order.status === 2 || order.status === 'Pending' || order.status === 0 || order.status === 'Paid' || order.status === 1) ? 'warning' : (order.status === 'Cancelled' || order.status === 5) ? 'danger' : 'success'}`}>
                                            {order.status === 'Pending' || order.status === 0 || order.status === 'Paid' || order.status === 1 || order.status === 'Processing' || order.status === 2 ? 'Hazırlanıyor' : 
                                             order.status === 'Cancelled' || order.status === 5 ? 'İptal Edildi' : 'Kargoya Verildi'}
                                        </span>
                                    </td>
                                     <td style={{ textAlign: 'right' }}>
                                         <button className="action-icon-btn" title="Detayları Görüntüle" onClick={() => {
                                             console.log("Sipariş seçildi:", order);
                                             setSelectedOrder(order);
                                         }}>
                                             👁️
                                         </button>
                                     </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#a3aed1' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
                        <div style={{ fontWeight: '700', color: '#2b3674', fontSize: '18px' }}>Henüz Siparişiniz Yok</div>
                        <p style={{ marginTop: '8px' }}>Verdiğiniz siparişler burada listelenecektir.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
