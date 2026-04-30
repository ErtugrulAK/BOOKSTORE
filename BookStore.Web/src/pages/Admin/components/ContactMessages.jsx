import React, { useState } from 'react';
import axios from 'axios';
import Pagination from './Pagination';

const ContactMessages = ({ messages = [], messagesTotal, messagesPage, setMessagesPage, token, fetchData }) => {
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleViewMessage = async (msg) => {
        setSelectedMsg(msg);
        setReplyText(msg.reply || '');
        
        // Mark as read in API if it's not read yet
        if (!msg.isRead) {
            try {
                await axios.put(`http://localhost:5229/api/Contact/read/${msg.id}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchData(); // Refresh messages list
            } catch (err) {
                console.error("Okundu bilgisi güncellenemedi:", err);
            }
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setIsSending(true);
        
        try {
            await axios.put(`http://localhost:5229/api/Contact/reply/${selectedMsg.id}`, 
                `"${replyText}"`, // Backend expects [FromBody] string (JSON string)
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            window.showToast("Cevabınız kaydedildi!");
            setIsSending(false);
            setSelectedMsg(null);
            fetchData();
        } catch (err) {
            window.showToast("Cevap gönderilirken hata oluştu.", true);
            setIsSending(false);
        }
    };

    return (
        <>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">İletişim Mesajları</h2>
                    <p className="admin-page-subtitle">Kullanıcılardan gelen destek talepleri ve mesajları yönetin.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-table-wrapper">
                    <table className="admin-modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th style={{ width: '25%' }}>Gönderen</th>
                                <th style={{ width: '35%' }}>Konu & Önizleme</th>
                                <th style={{ width: '15%' }}>Tarih</th>
                                <th style={{ width: '15%' }}>Durum</th>
                                <th style={{ width: '10%', textAlign: 'right' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map(m => (
                                <tr 
                                    key={m.id} 
                                    style={{ 
                                        backgroundColor: m.isRead ? 'transparent' : 'rgba(67, 24, 255, 0.05)',
                                        borderLeft: m.isRead ? 'none' : '4px solid #4318ff'
                                    }}
                                >
                                    <td>
                                        {!m.isRead && (
                                            <div title="Yeni Mesaj" style={{ 
                                                width: '12px', 
                                                height: '12px', 
                                                background: '#4318ff', 
                                                borderRadius: '50%', 
                                                margin: '0 auto',
                                                boxShadow: '0 0 10px rgba(67, 24, 255, 0.4)',
                                                animation: 'pulse 2s infinite'
                                            }}></div>
                                        )}
                                    </td>
                                    <td style={{ width: '220px' }}>
                                        <div style={{ fontWeight: m.isRead ? '600' : '800', color: m.isRead ? '#2b3674' : '#4318ff' }}>
                                            {m.senderName}
                                            {!m.isRead && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#4318ff', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>YENİ</span>}
                                        </div>
                                        <div style={{ fontSize: m.isRead ? '12px' : '13px', color: m.isRead ? '#a3aed1' : '#707eae' }}>{m.email}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: m.isRead ? '700' : '800', color: '#1e293b', marginBottom: m.isRead ? '4px' : '6px' }}>{m.subject}</div>
                                        <div style={{ 
                                            fontSize: '13px', 
                                            color: m.isRead ? '#64748b' : '#2b3674', 
                                            whiteSpace: 'nowrap', 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            maxWidth: '350px',
                                            fontWeight: m.isRead ? '400' : '500'
                                        }}>
                                            {m.content}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                        {new Date(m.createdAt).toLocaleString('tr-TR')}
                                    </td>
                                    <td>
                                        {m.reply ? (
                                            <span className="status-pill success" style={{ fontSize: '11px' }}>Yanıtlandı</span>
                                        ) : (
                                            <span className="status-pill warning" style={{ fontSize: '11px' }}>Bekliyor</span>
                                        )}
                                    </td>
                                    <td>
                                        <button className={m.isRead ? "admin-secondary-btn" : "admin-primary-btn"} style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => handleViewMessage(m)}>
                                            {m.isRead ? 'Görüntüle' : 'Oku & Yanıtla'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {messages.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#a3aed1' }}>Henüz mesaj bulunmuyor.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    currentPage={messagesPage} 
                    totalCount={messagesTotal} 
                    pageSize={10} 
                    onPageChange={setMessagesPage} 
                />
            </div>

            {/* Yanıt Modalı */}
            {selectedMsg && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content" style={{ maxWidth: '700px', width: '90%', animation: 'slideUp 0.3s ease-out' }}>
                        <div className="custom-modal-header" style={{ borderBottom: '1px solid #f4f7fe', paddingBottom: '20px' }}>
                            <h3 className="custom-modal-title">Mesaj Detayı ve Yanıtla</h3>
                            <button className="modal-close-icon-btn" onClick={() => setSelectedMsg(null)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <div style={{ background: '#f4f7fe', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #4318ff, #3311db)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', border: '2px solid white', boxShadow: '0 2px 8px rgba(67, 24, 255, 0.2)' }}>
                                            {selectedMsg.senderName?.[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#2b3674' }}>{selectedMsg.senderName}</div>
                                            <div style={{ fontSize: '12px', color: '#a3aed1' }}>{selectedMsg.email}</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#a3aed1' }}>{new Date(selectedMsg.createdAt).toLocaleString('tr-TR')}</span>
                                </div>
                                <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px', marginBottom: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>Konu: {selectedMsg.subject}</div>
                                <div style={{ fontSize: '14px', color: '#2b3674', lineHeight: '1.7', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #f4f7fe' }}>{selectedMsg.content}</div>
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: '700' }}>Yanıtınız</span>
                                    {selectedMsg.repliedAt && <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>Son Yanıt: {new Date(selectedMsg.repliedAt).toLocaleString('tr-TR')}</span>}
                                </label>
                                <textarea 
                                    rows="6" 
                                    placeholder="Cevabınızı buraya yazın..." 
                                    value={replyText} 
                                    onChange={(e) => setReplyText(e.target.value)}
                                    style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px', fontSize: '14px', outline: 'none', transition: '0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = '#4318ff'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                ></textarea>
                            </div>
                        </div>
                        <div className="custom-modal-footer" style={{ borderTop: '1px solid #f4f7fe', paddingTop: '20px' }}>
                            <button className="admin-secondary-btn" onClick={() => setSelectedMsg(null)}>Kapat</button>
                            <button 
                                className="admin-primary-btn" 
                                onClick={handleSendReply}
                                disabled={isSending || !replyText.trim()}
                            >
                                {isSending ? 'Kaydediliyor...' : (selectedMsg.reply ? 'Yanıtı Güncelle' : 'Cevabı Gönder')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .modal-close-icon-btn {
                    background: #f4f7fe;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #a3aed1;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .modal-close-icon-btn:hover {
                    background: #fee2e2;
                    color: #ef4444;
                    transform: rotate(90deg);
                }
            `}</style>
        </>
    );
};

export default ContactMessages;
