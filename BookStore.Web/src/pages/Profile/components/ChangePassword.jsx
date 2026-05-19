import React, { useState } from 'react';
import axios from 'axios';

const ChangePassword = ({ token, user }) => {
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isCodeSent, setIsCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const handleRequestPasswordChange = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            window.showToast("Lütfen tüm şifre alanlarını doldurun.", true);
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
        } catch (error) {
            console.error("Şifre güncelleme hatası:", error);
            const errMsg = error.response?.data?.message || error.response?.data || error.message || "Şifre güncellenirken bir hata oluştu.";
            window.showToast(errMsg, true);
        }
    };

    const handleVerifyAndChangePassword = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            window.showToast("Lütfen 6 haneli doğrulama kodunu girin.", true);
            return;
        }

        window.showToast("Şifre güncelleniyor...", false);

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put('/api/Users/profile/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                code: verificationCode
            }, config);

            window.showToast("Şifreniz başarıyla güncellendi!");
            setIsCodeSent(false);
            setVerificationCode('');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error("Şifre doğrulama hatası:", error);
            const errMsg = error.response?.data?.message || error.response?.data || error.message || "Şifre güncellenirken bir hata oluştu.";
            window.showToast(errMsg, true);
        }
    };

    return (
        <div className="user-panel-card animate-slide-up">
            <div className="user-section-title">
                <span style={{ fontSize: '20px' }}>{isCodeSent ? '📧' : '🔑'}</span> {isCodeSent ? 'E-Posta Doğrulama' : 'Şifre Değiştir'}
            </div>

            {isCodeSent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px', marginTop: '20px' }}>
                    <p style={{ color: '#4a5568', fontSize: '14px', marginBottom: '10px', lineHeight: '1.5' }}>
                        Şifrenizi güncellemek için <strong>{user?.email}</strong> adresinize gönderilen 6 haneli doğrulama kodunu giriniz.
                    </p>
                    <div className="user-input-group">
                        <label>Doğrulama Kodu</label>
                        <input 
                            type="text" 
                            value={verificationCode} 
                            onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                            placeholder="6 Haneli Kod"
                            style={{ 
                                letterSpacing: '4px', 
                                textAlign: 'center', 
                                fontSize: '20px', 
                                fontWeight: 'bold' 
                            }}
                        />
                    </div>
                    <div className="user-panel-actions" style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #f4f7fe' }}>
                        <button 
                            className="user-secondary-btn" 
                            onClick={() => {
                                setIsCodeSent(false);
                                setVerificationCode('');
                                setPasswordForm({
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: ''
                                });
                            }}
                        >
                            İptal
                        </button>
                        <button 
                            className="user-primary-btn" 
                            onClick={handleVerifyAndChangePassword}
                        >
                            Doğrula ve Şifreyi Değiştir
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px', marginTop: '20px' }}>
                        <div className="user-input-group">
                            <label>Mevcut Şifre</label>
                            <input 
                                type="password" 
                                value={passwordForm.currentPassword} 
                                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                                placeholder="Mevcut şifreniz"
                            />
                        </div>
                        <div className="user-input-group">
                            <label>Yeni Şifre</label>
                            <input 
                                type="password" 
                                value={passwordForm.newPassword} 
                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                                placeholder="Yeni şifreniz"
                            />
                        </div>
                        <div className="user-input-group">
                            <label>Yeni Şifre (Tekrar)</label>
                            <input 
                                type="password" 
                                value={passwordForm.confirmPassword} 
                                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                                placeholder="Yeni şifreniz tekrar"
                            />
                        </div>
                    </div>

                    <div className="user-panel-actions" style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #f4f7fe' }}>
                        <button className="user-primary-btn" onClick={handleRequestPasswordChange}>Şifreyi Güncelle</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChangePassword;
