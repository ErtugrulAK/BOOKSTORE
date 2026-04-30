import React, { useState } from 'react';
import axios from 'axios';

const PersonalInfo = ({ user, token, setUser }) => {
    const [formData, setFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phoneNumber || ''
    });

    // Name/Surname: Only letters
    const handleNameChange = (e, field) => {
        const value = e.target.value;
        const onlyLetters = value.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '');
        setFormData({ ...formData, [field]: onlyLetters });
    };

    // Phone: Auto format with better backspace handling
    const handlePhoneChange = (e) => {
        let value = e.target.value;
        
        // If it's a delete operation and the last char was a space, remove one more char
        const isDelete = e.nativeEvent.inputType === 'deleteContentBackward';
        
        // Get raw digits
        let digits = value.replace(/[^\d]/g, '');
        
        // Format logic
        let formatted = '';
        if (digits.length > 0) {
            formatted = digits.slice(0, 4);
            if (digits.length > 4) {
                formatted += ' ' + digits.slice(4, 7);
            }
            if (digits.length > 7) {
                formatted += ' ' + digits.slice(7, 9);
            }
            if (digits.length > 9) {
                formatted += ' ' + digits.slice(9, 11);
            }
        }

        setFormData({ ...formData, phone: formatted });
    };

    const handleSave = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phone
            };
            
            const response = await axios.put('http://localhost:5229/api/Users/profile', updateData, config);
            
            // Update local state and storage
            const updatedUser = response.data;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            window.showToast("Bilgileriniz başarıyla güncellendi!");
        } catch (error) {
            console.error("Profil güncellenemedi:", error);
            window.showToast("Bilgiler güncellenirken bir hata oluştu.", true);
        }
    };

    return (
        <div className="animate-slide-up">
            <div className="user-page-header">
                <h2 className="user-panel-title">Profil Ayarları</h2>
                <p className="user-panel-subtitle">Kişisel bilgilerinizi buradan görüntüleyebilir ve güncelleyebilirsiniz.</p>
            </div>

            <div className="user-panel-card">
                <div className="user-section-title">
                    <span style={{ fontSize: '20px' }}>🆔</span> Kimlik ve İletişim Bilgileri
                </div>
                
                <div className="user-form-grid" style={{ gap: '30px' }}>
                    <div className="user-input-group">
                        <label>Ad</label>
                        <input 
                            type="text" 
                            value={formData.firstName} 
                            onChange={e => handleNameChange(e, 'firstName')} 
                            placeholder="Adınız"
                        />
                    </div>
                    <div className="user-input-group">
                        <label>Soyad</label>
                        <input 
                            type="text" 
                            value={formData.lastName} 
                            onChange={e => handleNameChange(e, 'lastName')} 
                            placeholder="Soyadınız"
                        />
                    </div>
                    <div className="user-input-group">
                        <label>E-posta Adresi</label>
                        <input 
                            type="email" 
                            value={formData.email} 
                            disabled 
                            style={{ cursor: 'not-allowed', opacity: 0.7 }}
                        />
                    </div>
                    <div className="user-input-group">
                        <label>Telefon Numarası</label>
                        <input 
                            type="text" 
                            value={formData.phone} 
                            onChange={handlePhoneChange} 
                            placeholder="05xx xxx xx xx"
                            maxLength="14"
                        />
                    </div>
                </div>

                <div className="user-panel-actions" style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #f4f7fe' }}>
                    <button className="user-secondary-btn" onClick={() => window.location.reload()}>Vazgeç</button>
                    <button className="user-primary-btn" onClick={handleSave}>Değişiklikleri Kaydet</button>
                </div>
            </div>
        </div>
    );
};

export default PersonalInfo;
