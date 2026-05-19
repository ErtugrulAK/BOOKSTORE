import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchableSelect from '../../../components/SearchableSelect';
import { turkeyCities } from '../../../data/turkeyCities';

const Addresses = ({ token }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAddress, setCurrentAddress] = useState(null);
    const [tempPhone, setTempPhone] = useState('');

    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [addressDetails, setAddressDetails] = useState('');

    const parseAddressDetails = (detailsStr) => {
        if (!detailsStr) return { city: '', district: '', details: '' };
        const match = detailsStr.match(/^([^\/]+)\s*\/\s*([^-]+)\s*-\s*(.*)$/);
        if (match) {
            const city = match[1].trim();
            const district = match[2].trim();
            const details = match[3].trim();
            if (turkeyCities[city]) {
                return { city, district, details };
            }
        }
        return { city: '', district: '', details: detailsStr };
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    useEffect(() => {
        if (currentAddress) {
            const parsed = parseAddressDetails(currentAddress.addressDetails);
            setSelectedCity(parsed.city);
            setSelectedDistrict(parsed.district);
            setAddressDetails(parsed.details);
        } else {
            setSelectedCity('');
            setSelectedDistrict('');
            setAddressDetails('');
        }
    }, [currentAddress]);

    const fetchAddresses = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get('/api/Addresses', config);
            setAddresses(response.data || []);
            setLoading(false);
        } catch (error) {
            console.error("Adresler getirilemedi:", error);
            setLoading(false);
        }
    };

    const formatPhone = (value) => {
        let digits = value.replace(/[^\d]/g, '');
        let formatted = '';
        if (digits.length > 0) {
            formatted = digits.slice(0, 4);
            if (digits.length > 4) formatted += ' ' + digits.slice(4, 7);
            if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
            if (digits.length > 9) formatted += ' ' + digits.slice(9, 11);
        }
        return formatted;
    };

    const handleEdit = (addr) => {
        setCurrentAddress(addr);
        setTempPhone(addr.phoneNumber);
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if(window.confirm("Bu adresi silmek istediğinize emin misiniz?")) {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`/api/Addresses/${id}`, config);
                setAddresses(addresses.filter(a => a.id !== id));
                window.showToast("Adres silindi.");
            } catch (error) {
                console.error("Adres silinemedi:", error);
                window.showToast("Adres silinirken bir hata oluştu.", true);
            }
        }
    };

    const handleSetDefault = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/Addresses/${id}/default`, {}, config);
            setAddresses(addresses.map(a => ({
                ...a,
                isDefault: a.id === id
            })));
            window.showToast("Varsayılan adres güncellendi.");
        } catch (error) {
            console.error("Varsayılan adres ayarlanamadı:", error);
            window.showToast("Hata oluştu.", true);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!selectedCity || !selectedDistrict) {
            window.showToast("Lütfen il ve ilçe seçiniz.", true);
            return;
        }

        const formData = new FormData(e.target);
        const fullAddress = `${selectedCity} / ${selectedDistrict} - ${addressDetails}`;
        const addrData = {
            title: formData.get('label'),
            receiverName: formData.get('name'),
            addressDetails: fullAddress,
            phoneNumber: tempPhone,
            isDefault: currentAddress?.isDefault || false
        };

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (currentAddress) {
                const response = await axios.put(`/api/Addresses/${currentAddress.id}`, addrData, config);
                setAddresses(addresses.map(a => a.id === currentAddress.id ? response.data : a));
            } else {
                const response = await axios.post('/api/Addresses', addrData, config);
                setAddresses([...addresses, response.data]);
            }
            setIsEditing(false);
            setCurrentAddress(null);
            setTempPhone('');
            window.showToast("Adres kaydedildi.");
        } catch (error) {
            console.error("Adres kaydedilemedi:", error);
            window.showToast("Adres kaydedilirken bir hata oluştu.", true);
        }
    };

    if (isEditing) {
        return (
            <div className="animate-slide-up">
                <div className="user-page-header">
                    <h2 className="user-panel-title">{currentAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</h2>
                </div>
                <div className="user-panel-card">
                    <form onSubmit={handleSave}>
                        <div className="user-form-grid" style={{ gap: '24px' }}>
                            <div className="user-input-group">
                                <label>Adres Başlığı (Örn: Ev, İş)</label>
                                <input name="label" defaultValue={currentAddress?.title} required />
                            </div>
                            <div className="user-input-group">
                                <label>Alıcı Ad Soyad</label>
                                <input 
                                    name="name" 
                                    defaultValue={currentAddress?.receiverName} 
                                    required 
                                    onChange={(e) => {
                                        e.target.value = e.target.value.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '');
                                    }}
                                />
                            </div>
                            <div className="user-input-group">
                                <label>İl *</label>
                                <SearchableSelect 
                                    options={Object.keys(turkeyCities)}
                                    value={selectedCity}
                                    onChange={(city) => {
                                        setSelectedCity(city);
                                        setSelectedDistrict('');
                                    }}
                                    placeholder="İl Seçiniz"
                                />
                            </div>
                            <div className="user-input-group">
                                <label>İlçe *</label>
                                <SearchableSelect 
                                    options={selectedCity ? turkeyCities[selectedCity] : []}
                                    value={selectedDistrict}
                                    onChange={(district) => setSelectedDistrict(district)}
                                    placeholder={selectedCity ? "İlçe Seçiniz" : "Önce İl Seçiniz"}
                                    disabled={!selectedCity}
                                />
                            </div>
                            <div className="user-input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Açık Adres (Mahalle, Cadde, Sokak, No, Daire vs.) *</label>
                                <textarea 
                                    value={addressDetails}
                                    onChange={(e) => setAddressDetails(e.target.value)}
                                    placeholder="Mahalle, cadde, sokak, apartman, daire vb. detayları yazın."
                                    required 
                                    rows="3"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1.5px solid #e2e8f0',
                                        borderRadius: '12px',
                                        fontFamily: 'inherit',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div className="user-input-group">
                                <label>Telefon Numarası</label>
                                <input 
                                    value={tempPhone} 
                                    onChange={(e) => setTempPhone(formatPhone(e.target.value))} 
                                    placeholder="05xx xxx xx xx"
                                    maxLength="14"
                                    required 
                                />
                            </div>
                        </div>
                        <div className="user-panel-actions" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f4f7fe' }}>
                            <button type="button" className="user-secondary-btn" onClick={() => setIsEditing(false)}>Vazgeç</button>
                            <button type="submit" className="user-primary-btn">Adresi Kaydet</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up">
            <div className="user-panel-header" style={{ marginBottom: '40px' }}>
                <h2 className="user-panel-title">Adreslerim</h2>
                <p className="user-panel-subtitle">Siparişlerinizin teslim edileceği adresleri yönetin.</p>
            </div>

            <div className="address-grid" style={{ gap: '30px' }}>
                {addresses.map(addr => (
                    <div key={addr.id} className={`address-card ${addr.isDefault ? 'active' : ''}`}>
                        <div className="address-actions">
                            <button className="action-icon-btn" title="Düzenle" onClick={() => handleEdit(addr)}>
                                ✏️
                            </button>
                            <button className="action-icon-btn delete" title="Sil" onClick={() => handleDelete(addr.id)}>
                                🗑️
                            </button>
                        </div>
                        
                        <div className="address-header">
                            <div className="address-label">
                                <i>🏠</i> {addr.title}
                                {addr.isDefault && <span className="address-tag" style={{ marginLeft: '10px' }}>Varsayılan</span>}
                            </div>
                        </div>
                        <div className="address-details" style={{ marginTop: '15px' }}>
                            <div style={{ fontWeight: '700', color: '#2b3674', marginBottom: '8px', fontSize: '15px' }}>{addr.receiverName}</div>
                            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#707eae' }}>{addr.addressDetails}</p>
                            <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#2b3674', fontWeight: '600' }}>
                                <i>📞</i> {addr.phoneNumber}
                            </div>
                            
                            {!addr.isDefault && (
                                <button 
                                    className="user-secondary-btn" 
                                    style={{ width: '100%', marginTop: '16px', padding: '8px', fontSize: '12px', borderColor: '#4318ff', color: '#4318ff' }}
                                    onClick={() => handleSetDefault(addr.id)}
                                >
                                    Varsayılan Yap
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                <div className="address-card" 
                     style={{ borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', opacity: '0.8', cursor: 'pointer', backgroundColor: 'transparent' }} 
                     onClick={() => {
                         setCurrentAddress(null);
                         setTempPhone('');
                         setIsEditing(true);
                     }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px', color: '#4318ff' }}>➕</div>
                    <div style={{ fontWeight: '700', color: '#2b3674', fontSize: '16px' }}>Yeni Adres Ekle</div>
                    <div style={{ fontSize: '13px', color: '#a3aed1', marginTop: '4px' }}>Farklı bir teslimat noktası tanımlayın</div>
                </div>
            </div>
        </div>
    );
};

export default Addresses;
