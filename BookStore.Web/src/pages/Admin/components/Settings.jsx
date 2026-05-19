import React, { useState } from 'react';
import axios from 'axios';

const Settings = ({ 
    passwordForm, 
    setPasswordForm, 
    token 
}) => {
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const handleSendCode = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            window.showToast("Lütfen tüm alanları doldurun.", true);
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            window.showToast("Yeni şifreler eşleşmiyor.", true);
            return;
        }
        window.showToast("Doğrulama kodu gönderiliyor...", false);

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('/api/Users/profile/password/send-code', {}, config);
            window.showToast("Doğrulama kodu e-postanıza gönderildi!");
            setIsCodeSent(true);
        } catch (err) {
            console.error("Şifre güncelleme kodu gönderme hatası:", err);
            window.showToast(err.response?.data?.message || err.response?.data || "Şifre güncellenemedi.", true);
        }
    };

    const handleVerifyAndChange = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            window.showToast("Lütfen 6 haneli doğrulama kodunu girin.", true);
            return;
        }
        window.showToast("Şifre güncelleniyor...", false);

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put('/api/Users/profile/password', {
                CurrentPassword: passwordForm.currentPassword,
                NewPassword: passwordForm.newPassword,
                Code: verificationCode
            }, config);
            window.showToast("Şifreniz başarıyla güncellendi!");
            setIsCodeSent(false);
            setVerificationCode('');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error("Şifre doğrulama hatası:", err);
            window.showToast(err.response?.data?.message || err.response?.data || "Şifre güncellenemedi.", true);
        }
    };

    return (
        <>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Şifre Değiştir</h2>
                    <p className="admin-page-subtitle">Yönetici hesabınızın şifresini buradan güncelleyebilirsiniz.</p>
                </div>
            </div>

            <div className="admin-card" style={{ maxWidth: '600px' }}>
                <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>
                    {isCodeSent ? "E-Posta Doğrulama" : "Yönetici Şifre Değiştirme"}
                </h3>
                
                {isCodeSent ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px', marginTop: '20px' }}>
                        <p style={{ color: '#475569', fontSize: '14px', marginBottom: '10px', lineHeight: '1.5' }}>
                            Şifrenizi güncellemek için kayıtlı e-posta adresinize gönderilen 6 haneli doğrulama kodunu giriniz.
                        </p>
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Doğrulama Kodu</label>
                            <input 
                                type="text" 
                                value={verificationCode} 
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                                placeholder="6 Haneli Kod"
                                style={{ 
                                    width: '100%',
                                    letterSpacing: '4px', 
                                    textAlign: 'center', 
                                    fontSize: '20px', 
                                    fontWeight: 'bold' 
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-start', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                            <button 
                                className="admin-secondary-btn" 
                                onClick={() => {
                                    setIsCodeSent(false);
                                    setVerificationCode('');
                                    setPasswordForm({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: ''
                                    });
                                }}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    color: '#475569',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                İptal
                            </button>
                            <button 
                                className="admin-primary-btn" 
                                onClick={handleVerifyAndChange}
                            >
                                Doğrula ve Şifreyi Değiştir
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px', marginTop: '20px' }}>
                            <div className="input-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Mevcut Şifre</label>
                                <input 
                                    type="password" 
                                    value={passwordForm.currentPassword} 
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                                    placeholder="Mevcut şifrenizi girin" 
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Yeni Şifre</label>
                                <input 
                                    type="password" 
                                    value={passwordForm.newPassword} 
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                                    placeholder="Yeni şifrenizi girin" 
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Yeni Şifre (Tekrar)</label>
                                <input 
                                    type="password" 
                                    value={passwordForm.confirmPassword} 
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                                    placeholder="Yeni şifrenizi tekrar girin" 
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                            <button className="admin-primary-btn" onClick={handleSendCode}>Şifreyi Güncelle</button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default Settings;
