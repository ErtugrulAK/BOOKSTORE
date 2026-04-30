import React from 'react';
import axios from 'axios';

const Settings = ({ 
    settingsForm, 
    setSettingsForm, 
    passwordForm, 
    setPasswordForm, 
    token 
}) => {
    return (
        <>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Genel Ayarlar</h2>
                    <p className="admin-page-subtitle">Site kimliği, iletişim bilgileri ve genel ayarları buradan yönetebilirsiniz.</p>
                </div>
            </div>

            <div className="admin-card">
                <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Site Kimliği ve İletişim</h3>
                <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="input-group">
                        <label>Site Adı</label>
                        <input type="text" value={settingsForm.siteName} onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Telefon Numarası</label>
                        <input type="text" value={settingsForm.phone} onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })} />
                    </div>
                </div>

                <div className="input-group" style={{ marginTop: '16px' }}>
                    <label>E-posta Adresi</label>
                    <input type="email" value={settingsForm.email} onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })} />
                </div>

                <div className="input-group" style={{ marginTop: '16px' }}>
                    <label>Açık Adres</label>
                    <textarea rows="3" value={settingsForm.address} onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
                    <button className="admin-secondary-btn" onClick={() => {
                        const saved = localStorage.getItem('site_settings');
                        if (saved) setSettingsForm(JSON.parse(saved));
                    }}>İptal Et</button>
                    <button className="admin-primary-btn" onClick={() => {
                        localStorage.setItem('site_settings', JSON.stringify(settingsForm));
                        window.showToast("Ayarlar başarıyla kaydedildi!");
                    }}>Ayarları Kaydet</button>
                </div>
            </div>

            <div className="admin-card" style={{ marginTop: '24px' }}>
                <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Yönetici Şifre Değiştirme</h3>
                <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="input-group">
                        <label>Mevcut Şifre</label>
                        <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Mevcut şifrenizi girin" />
                    </div>
                    <div className="input-group">
                        <label>Yeni Şifre</label>
                        <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Yeni şifrenizi girin" />
                    </div>
                    <div className="input-group">
                        <label>Yeni Şifre (Tekrar)</label>
                        <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Yeni şifrenizi tekrar girin" />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button className="admin-primary-btn" onClick={async () => {
                        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
                            window.showToast("Lütfen tüm alanları doldurun.", true);
                            return;
                        }
                        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                            window.showToast("Yeni şifreler eşleşmiyor.", true);
                            return;
                        }
                        window.showToast("Şifre güncelleniyor...", false);
                        try {
                            const config = { headers: { Authorization: `Bearer ${token}` } };
                            await axios.put('http://localhost:5229/api/Users/profile/password', {
                                CurrentPassword: passwordForm.currentPassword,
                                NewPassword: passwordForm.newPassword
                            }, config);
                            window.showToast("Şifreniz başarıyla güncellendi!");
                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        } catch (err) {
                            window.showToast(err.response?.data?.message || err.response?.data || "Şifre güncellenemedi.", true);
                        }
                    }}>Şifreyi Güncelle</button>
                </div>
            </div>
        </>
    );
};

export default Settings;
