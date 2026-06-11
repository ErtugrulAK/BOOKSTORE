import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import './Cart.css';
import SearchableSelect from '../../components/SearchableSelect';
import BookCover from '../../components/BookCard/BookCover';
import { turkeyCities } from '../../data/turkeyCities';

function Cart({ localCart, setLocalCart, token, setApiCartCount }) {
    const navigate = useNavigate();
    const [apiCart, setApiCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Sepet, 2: Bilgiler, 3: Ödeme, 4: Onay
    const [preInfoAccepted, setPreInfoAccepted] = useState(false);
    const [showPreInfoModal, setShowPreInfoModal] = useState(false);

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const isAdmin = user?.role === 'Admin';

    const [deliveryMethod, setDeliveryMethod] = useState('kargo'); // 'kargo' or 'dekanlik'
    const [userAddresses, setUserAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

    const [formData, setFormData] = useState({
        ad: '',
        soyad: '',
        telefon: '',
        adres: '',
        kartNo: '',
        kartIsim: '',
        kartSkt: '',
        kartCvv: ''
    });

    const [orderResult, setOrderResult] = useState(null);
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    useEffect(() => {
        if (token) {
            // Sepeti çek
            axios.get('/api/Cart', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                setApiCart(res.data.orderItems || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

            // Adresleri çek
            axios.get('/api/Addresses', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                setUserAddresses(res.data || []);
                const defaultAddr = res.data.find(a => a.isDefault);
                if (defaultAddr) setSelectedAddressId(defaultAddr.id);
            })
            .catch(err => console.error("Adres çekme hatası", err));
        } else {
            setLoading(false);
        }
    }, [token]);

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

    const handleInputChange = (e) => {
        let val = e.target.value;
        if (e.target.name === 'telefon') {
            val = formatPhone(val);
        }
        setFormData({ ...formData, [e.target.name]: val });
    };

    const handleRemoveFromLocal = (bookId) => {
        setLocalCart(localCart.filter(item => item.book.id !== bookId));
    };

    const handleRemoveFromApi = async (bookId) => {
        try {
            await axios.delete(`/api/Cart/items/${bookId}`, { headers: { Authorization: `Bearer ${token}` } });
            const newItems = apiCart.filter(item => item.bookId !== bookId);
            setApiCart(newItems);
            if (setApiCartCount) setApiCartCount(newItems.reduce((sum, item) => sum + item.quantity, 0));
        } catch (err) { 
            console.error("Silme hatası", err);
        }
    };

    const handleClearCart = async () => {
        const result = await Swal.fire({
            title: 'Sepeti Boşalt?',
            text: 'Tüm ürünler sepetinizden kaldırılacak. Bu işlemi onaylıyor musunuz?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Boşalt',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#707eae'
        });

        if (result.isConfirmed) {
            if (token) {
                try {
                    await axios.delete('/api/Cart', { headers: { Authorization: `Bearer ${token}` } });
                    setApiCart([]);
                    if (setApiCartCount) setApiCartCount(0);
                    window.showToast("Sepetiniz boşaltıldı.");
                } catch (err) {
                    window.showToast("Sepet boşaltılırken bir hata oluştu.", true);
                }
            } else {
                setLocalCart([]);
                localStorage.removeItem('guest_cart');
                window.showToast("Sepetiniz boşaltıldı.");
            }
        }
    };

    const handleUpdateQuantity = async (bookId, newQty) => {
        if (newQty < 1) {
            Swal.fire({
                title: 'Emin misiniz?',
                text: "Bu ürünü sepetten çıkarmak istiyor musunuz?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#707eae',
                confirmButtonText: 'Evet, çıkar!',
                cancelButtonText: 'Hayır'
            }).then((result) => {
                if (result.isConfirmed) {
                    isLocal ? handleRemoveFromLocal(bookId) : handleRemoveFromApi(bookId);
                }
            });
            return;
        }

        if (isLocal) {
            setLocalCart(localCart.map(item => 
                item.book.id === bookId ? { ...item, quantity: newQty } : item
            ));
        } else {
            try {
                await axios.put(`/api/Cart/items/${bookId}`, newQty, { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } 
                });
                setApiCart(apiCart.map(item => 
                    item.bookId === bookId ? { ...item, quantity: newQty } : item
                ));
            } catch (err) {
                console.error("Güncelleme hatası", err);
            } finally {
                // Her durumda global sayacı yenile ki senkron kalsın
                axios.get('/api/Cart', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    const count = res.data.orderItems?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                    if (setApiCartCount) setApiCartCount(count);
                });
            }
        }
    };

    const handleFinalCheckout = async () => {
        if (!token) {
            window.showToast('Siparişi tamamlamak için lütfen giriş yapın.');
            navigate('/login');
            return;
        }

        if (!preInfoAccepted) {
            window.showToast('Lütfen Ön Bilgilendirme Formunu okuyup kabul ediniz.', true);
            return;
        }

        let addressString = "";
        if (deliveryMethod === 'dekanlik') {
            addressString = "Dekanlıktan Gelip Alma";
        } else if (selectedAddressId) {
            const addr = userAddresses.find(a => a.id === selectedAddressId);
            addressString = `${addr.title}: ${addr.addressDetails} - Alıcı: ${addr.receiverName} (${addr.phoneNumber})`;
        } else {
            addressString = `${selectedCity} / ${selectedDistrict} - ${formData.adres} - Alıcı: ${formData.ad} ${formData.soyad} (${formData.telefon})`;
        }

        try {
            const response = await axios.post('/api/Cart/checkout', 
                { DeliveryAddress: addressString }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrderResult(response.data);
            setStep(4);
            
            // Clear cart globally
            if (setApiCartCount) setApiCartCount(0);
            setApiCart([]);
            setLocalCart([]);
            localStorage.removeItem('guest_cart');

            window.showToast('Siparişiniz başarıyla alındı!');
        } catch (err) {
            window.showToast(err.response?.data || 'Sipariş tamamlanırken hata oluştu.', true);
        }
    };

    const handleAdminCheckout = async () => {
        try {
            // Sepet geçerliliğini doğrula
            const valRes = await axios.get('/api/Cart/validate', { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            if (!valRes.data.isValid) {
                window.showToast(valRes.data.message, true);
                return;
            }

            const response = await axios.post('/api/Cart/admin-checkout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setOrderResult(response.data);
            setStep(4);
            
            // Sepeti temizle
            if (setApiCartCount) setApiCartCount(0);
            setApiCart([]);
            setLocalCart([]);
            localStorage.removeItem('guest_cart');

            window.showToast('Elden satış başarıyla tamamlandı!');
        } catch (err) {
            window.showToast(err.response?.data || 'Elden satış tamamlanırken hata oluştu.', true);
        }
    };

    const items = token ? apiCart : localCart;
    const isLocal = !token;

    if (loading) return <div className="cart-container"><h2>Yükleniyor...</h2></div>;

    const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    const renderStepper = () => (
        <div className="checkout-stepper">
            <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
                <div className="step-label">Sepetim</div>
                <div className="step-line"></div>
            </div>
            <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
                <div className="step-label">Bilgiler</div>
                <div className="step-line"></div>
            </div>
            <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                <div className="step-circle">{step > 3 ? '✓' : '3'}</div>
                <div className="step-label">Ödeme</div>
                <div className="step-line"></div>
            </div>
            <div className={`step-item ${step >= 4 ? 'active' : ''}`}>
                <div className="step-circle">4</div>
                <div className="step-label">Onay</div>
            </div>
        </div>
    );

    const renderSummary = (buttonText, onNext) => (
        <div className="summary-card">
            <h2>Sipariş Özeti</h2>
            <div className="summary-items-list" style={{marginBottom: '20px', maxHeight: '150px', overflowY: 'auto'}}>
                {items.map((item, idx) => (
                    <div key={idx} style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px'}}>
                        <span style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                            {item.book?.name || item.book?.isim}
                        </span>
                        <span>x{item.quantity}</span>
                    </div>
                ))}
            </div>
            <div className="summary-total" style={{marginTop: 0, borderTop: '1px solid #f1f5f9', paddingTop: '15px'}}>
                <span>Toplam</span>
                <span>{totalAmount.toFixed(2)} ₺</span>
            </div>
            {deliveryMethod === 'kargo' && (
                <div className="shipping-notice" style={{
                    marginTop: '15px',
                    padding: '10px 14px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#1e40af',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center'
                }}>
                    <span>🚚</span>
                    <span>Kargo ücreti alıcıya aittir.</span>
                </div>
            )}
            {buttonText === 'Siparişi Onayla' && (
                <div className="agreement-container" style={{ textAlign: 'left', marginTop: '15px', marginBottom: '15px' }}>
                    <div className="kvkk-notice-box" style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '11px',
                        color: '#475569',
                        lineHeight: '1.4',
                        marginBottom: '10px'
                    }}>
                        <strong>KVKK Bilgilendirmesi:</strong> Üniversitemiz; kişisel verilerin işlenmesi esnasında hukuka ve dürüstlük kurallarına uygun hareket etmekte; orantılılık ve gereklilik prensiplerini dikkate almakta, kişisel verileri, veri işleme amaçlarına uygun düşecek seviyede işlemekte olup, Aydınlatma ve Açık Rıza Metinlerine <a href="https://kvkk.deu.edu.tr/" target="_blank" rel="noopener noreferrer" style={{color: '#2563eb', textDecoration: 'underline'}}>https://kvkk.deu.edu.tr/</a> adresinden ulaşılabilmektedir.
                    </div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                        <input 
                            type="checkbox" 
                            checked={preInfoAccepted} 
                            onChange={(e) => setPreInfoAccepted(e.target.checked)}
                            style={{ marginTop: '2px' }}
                        />
                        <span>
                            <a href="#" onClick={(e) => { e.preventDefault(); setShowPreInfoModal(true); }} style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '600' }}>Ön Bilgilendirme Formunu</a> Okudum ve Kabul Ediyorum.
                        </span>
                    </label>
                </div>
            )}
            <button className="btn-primary-lg" onClick={onNext} style={{ marginTop: buttonText === 'Siparişi Onayla' ? '10px' : '25px' }}>
                {buttonText} {step < 3 && deliveryMethod === 'kargo' && '→'}
            </button>
            <div style={{marginTop: '20px', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px'}}>
                {/* SSL text removed as per user request */}
            </div>
        </div>
    );

    if (items.length === 0 && step === 1) {
        return (
            <div className="cart-container animate-fade-in">
                <div className="empty-cart">
                    <div className="empty-cart-icon">🛒</div>
                    <h2>Sepetiniz Boş</h2>
                    <p>Görünüşe göre sepetinize henüz bir kitap eklememişsiniz. Harika kitaplarımızı keşfetmeye ne dersiniz?</p>
                    <button className="btn-return" onClick={() => navigate('/')}>Alışverişe Devam Et</button>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-container">
            {renderStepper()}

            {step === 1 && (
                <div className="checkout-layout animate-fade-in">
                    <div className="checkout-main">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h1 style={{ margin: 0, color: '#1e293b' }}>Alışveriş Sepetim</h1>
                            <button className="btn-clear-cart" onClick={handleClearCart}>
                                🗑️ Sepeti Boşalt
                            </button>
                        </div>
                        {items.map((item, index) => {
                            const book = item.book;
                            const qty = item.quantity;
                            const bookId = isLocal ? book?.id : item.bookId;
                            return (
                                <div className="cart-card" key={index}>
                                    <BookCover 
                                        imageUrl={book?.imageUrl} 
                                        title={book?.name || book?.isim} 
                                        author={book?.author || book?.yazar}
                                        className="cart-card-img" 
                                        size="small" 
                                    />
                                    <div className="cart-card-info">
                                        <h3>{book?.name || book?.isim}</h3>
                                        <p>Kategori: {book?.category || 'Genel'}</p>
                                        <div className="cart-card-price">{item.unitPrice} ₺</div>
                                    </div>
                                    <div className="cart-card-actions">
                                        <div className="quantity-selector">
                                            <button className="qty-btn" onClick={() => handleUpdateQuantity(bookId, qty - 1)}>-</button>
                                            <span className="qty-value">{qty}</span>
                                            <button className="qty-btn" onClick={() => handleUpdateQuantity(bookId, qty + 1)}>+</button>
                                        </div>
                                        <button className="btn-remove-icon" onClick={() => {
                                            Swal.fire({
                                                title: 'Silinsin mi?',
                                                text: 'Ürün sepetten kaldırılacak.',
                                                icon: 'question',
                                                showCancelButton: true,
                                                confirmButtonText: 'Sil',
                                                confirmButtonColor: '#ef4444'
                                            }).then(r => r.isConfirmed && (isLocal ? handleRemoveFromLocal(bookId) : handleRemoveFromApi(bookId)));
                                        }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {isAdmin ? (
                        <div className="summary-card">
                            <h2>Elden Satış Özeti</h2>
                            <div className="summary-items-list" style={{marginBottom: '20px', maxHeight: '150px', overflowY: 'auto'}}>
                                {items.map((item, idx) => (
                                    <div key={idx} style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px'}}>
                                        <span style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                            {item.book?.name || item.book?.isim}
                                        </span>
                                        <span>x{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <label style={{fontSize: '14px', fontWeight: '700', color: '#475569'}}>Ödeme Yöntemi</label>
                                <div style={{
                                    padding: '10px 14px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0', 
                                    fontSize: '14px', 
                                    fontWeight: '600', 
                                    color: '#475569',
                                    backgroundColor: '#f1f5f9'
                                }}>
                                    💵 Nakit (Yalnızca Elden Satış)
                                </div>
                            </div>

                            <div className="summary-total" style={{marginTop: 0, borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginBottom: '20px'}}>
                                <span>Toplam</span>
                                <span>{totalAmount.toFixed(2)} ₺</span>
                            </div>
                            <button className="btn-primary-lg" onClick={handleAdminCheckout}>
                                🏪 Elden Satışı Tamamla
                            </button>
                        </div>
                    ) : (
                        renderSummary(isLocal ? 'Giriş Yap' : 'Sepeti Onayla', async () => {
                            if (isLocal) {
                                navigate('/login');
                            } else {
                                try {
                                    const res = await axios.get('/api/Cart/validate', { 
                                        headers: { Authorization: `Bearer ${token}` } 
                                    });
                                    if (!res.data.isValid) {
                                        window.showToast(res.data.message, true);
                                        return;
                                    }
                                    setStep(2);
                                } catch (err) {
                                    window.showToast("İşleminiz şu anda gerçekleştirilemiyor. Lütfen kısa bir süre sonra tekrar deneyiniz.", true);
                                }
                            }
                        })
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="checkout-layout animate-fade-in">
                    <div className="checkout-main">
                        <button className="btn-back" onClick={() => setStep(1)}>← Sepete Dön</button>
                        <h1 style={{marginBottom: '25px', color: '#1e293b'}}>Teslimat Yöntemi & Bilgileri</h1>
                        
                        <div className="delivery-method-toggle">
                            <div className={`method-card ${deliveryMethod === 'kargo' ? 'active' : ''}`} onClick={() => setDeliveryMethod('kargo')}>
                                <div className="method-icon">🚚</div>
                                <div className="method-info">
                                    <h4>Eve Kargo</h4>
                                    <p>Kitaplarınız adresinize gönderilir. (Kargo ücreti alıcıya aittir.)</p>
                                </div>
                                <div className="method-radio"></div>
                            </div>
                            <div className={`method-card ${deliveryMethod === 'dekanlik' ? 'active' : ''}`} onClick={() => setDeliveryMethod('dekanlik')}>
                                <div className="method-icon">🏢</div>
                                <div className="method-info">
                                    <h4>Dekanlıktan Gelip Alma</h4>
                                    <p>Kargo ücreti ödemeden teslim alın.</p>
                                </div>
                                <div className="method-radio"></div>
                            </div>
                        </div>

                        {deliveryMethod === 'kargo' && (
                            <div className="animate-fade-in">
                                {userAddresses.length > 0 && (
                                    <>
                                        <h3 style={{fontSize: '16px', color: '#64748b', marginBottom: '15px'}}>Kayıtlı Adreslerim</h3>
                                        <div className="saved-addresses">
                                            {userAddresses.map(addr => (
                                                <div 
                                                    key={addr.id} 
                                                    className={`addr-select-card ${selectedAddressId === addr.id ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setSelectedAddressId(addr.id);
                                                        setFormData({...formData, adres: ''}); // Yeni adres formunu temizle
                                                    }}
                                                >
                                                    <div className="method-radio"></div>
                                                    <div className="addr-select-info">
                                                        <h4>{addr.title}</h4>
                                                        <p>{addr.receiverName} - {addr.addressDetails}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div 
                                                className={`addr-select-card ${!selectedAddressId ? 'active' : ''}`}
                                                onClick={() => setSelectedAddressId(null)}
                                            >
                                                <div className="method-radio"></div>
                                                <div className="addr-select-info">
                                                    <h4>➕ Yeni Adres Kullan</h4>
                                                    <p>Farklı bir teslimat adresi girmek için tıklayın.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {(!selectedAddressId || userAddresses.length === 0) && (
                                    <div className="form-section animate-slide-up">
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Alıcı Adı</label>
                                                <input name="ad" value={formData.ad} onChange={handleInputChange} placeholder="Ad" />
                                            </div>
                                            <div className="form-group">
                                                <label>Alıcı Soyadı</label>
                                                <input name="soyad" value={formData.soyad} onChange={handleInputChange} placeholder="Soyad" />
                                            </div>
                                            <div className="form-group">
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
                                            <div className="form-group">
                                                <label>İlçe *</label>
                                                <SearchableSelect 
                                                    options={selectedCity ? turkeyCities[selectedCity] : []}
                                                    value={selectedDistrict}
                                                    onChange={(district) => setSelectedDistrict(district)}
                                                    placeholder={selectedCity ? "İlçe Seçiniz" : "Önce İl Seçiniz"}
                                                    disabled={!selectedCity}
                                                />
                                            </div>
                                            <div className="form-group full">
                                                <label>Açık Adres (Mahalle, Cadde, Sokak, No, Daire vs.) *</label>
                                                <textarea name="adres" value={formData.adres} onChange={handleInputChange} rows="3" placeholder="Mahalle, cadde, sokak, apartman, daire vb. detayları yazın."></textarea>
                                            </div>
                                            <div className="form-group full">
                                                <label>Telefon Numarası</label>
                                                <input name="telefon" value={formData.telefon} onChange={handleInputChange} placeholder="05XX XXX XX XX" maxLength="14" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {deliveryMethod === 'dekanlik' && (
                            <div className="form-section animate-fade-in" style={{textAlign: 'center', padding: '60px'}}>
                                <div style={{fontSize: '48px', marginBottom: '20px'}}>🏛️</div>
                                <h3>Dekanlık Teslimat Noktası</h3>
                                <p style={{color: '#64748b', maxWidth: '450px', margin: '15px auto', lineHeight: '1.6'}}>
                                    Siparişiniz hazırlandığında size özel üretilecek teslimat kodunuz ve kimliğinizle birlikte teslim alabilirsiniz. Bu teslimat kodu bir sonraki onay ekranında gösterilecek ve e-posta adresinize gönderilecektir.
                                </p>
                            </div>
                        )}
                    </div>
                    {deliveryMethod === 'dekanlik' ? (
                        renderSummary('Siparişi Onayla', handleFinalCheckout)
                    ) : (
                        renderSummary('Ödeme Adımına Geç', () => {
                            if (!selectedAddressId) {
                                if (!formData.ad || !formData.soyad || !formData.adres || !formData.telefon) {
                                    window.showToast('Lütfen tüm alanları doldurun.', true);
                                    return;
                                }
                                if (!selectedCity || !selectedDistrict) {
                                    window.showToast('Lütfen il ve ilçe seçiniz.', true);
                                    return;
                                }
                            }
                            setStep(3);
                        })
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="checkout-layout animate-fade-in">
                    <div className="checkout-main">
                        <button className="btn-back" onClick={() => setStep(2)}>← Bilgilere Dön</button>
                        <h1 style={{marginBottom: '25px', color: '#1e293b'}}>Ödeme Yöntemi (Kredi / Banka Kartı)</h1>
                        <div className="form-section">
                            <div className="form-grid">
                                <div className="form-group full">
                                    <label>Kart Üzerindeki İsim</label>
                                    <input name="kartIsim" value={formData.kartIsim} onChange={handleInputChange} placeholder="AD SOYAD" />
                                </div>
                                <div className="form-group full">
                                    <label>Kart Numarası</label>
                                    <input name="kartNo" value={formData.kartNo} onChange={handleInputChange} placeholder="0000 0000 0000 0000" />
                                </div>
                                <div className="form-group">
                                    <label>Son Kullanma Tarihi</label>
                                    <input name="kartSkt" value={formData.kartSkt} onChange={handleInputChange} placeholder="AA / YY" />
                                </div>
                                <div className="form-group">
                                    <label>CVV</label>
                                    <input name="kartCvv" value={formData.kartCvv} onChange={handleInputChange} placeholder="***" />
                                </div>
                            </div>
                        </div>

                        <div className="secure-payment-notice" style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            padding: '16px 20px',
                            borderRadius: '12px',
                            marginTop: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#16a34a',
                            fontSize: '14px',
                            fontWeight: '500',
                            lineHeight: '1.5',
                            textAlign: 'left'
                        }}>
                            <span style={{ fontSize: '24px' }}>🔒</span>
                            <div>
                                <strong>Güvenli Ödeme Protokolü:</strong> Ödemeniz Ziraat Bankası güvenli ortak ödeme sistemi altyapısı üzerinden 256-bit SSL şifreleme protokolü ile korunarak gerçekleştirilmektedir.
                            </div>
                        </div>
                    </div>
                    {renderSummary('Siparişi Onayla', handleFinalCheckout)}
                </div>
            )}

            {step === 4 && orderResult && (
                <div className="success-container animate-fade-in">
                    <div className="success-icon" style={{ backgroundColor: isAdmin ? '#10b981' : undefined }}>✓</div>
                    <h1>{isAdmin ? 'Elden Satış Başarıyla Tamamlandı!' : 'Siparişiniz Başarıyla Alınmıştır!'}</h1>
                    <p>{isAdmin ? 'Stoklar başarıyla düşürüldü ve satış sisteme kaydedildi.' : 'Teşekkür ederiz! Kitaplarınız hazırlanıyor. Sipariş detaylarını aşağıda bulabilirsiniz.'}</p>
                    
                    {orderResult.pickupCode && (
                        <div className="pickup-code-alert" style={{
                            background: '#eef2ff',
                            border: '2px dashed #3b82f6',
                            padding: '20px',
                            borderRadius: '16px',
                            maxWidth: '500px',
                            margin: '0 auto 30px',
                            animation: 'pulse 2s infinite'
                        }}>
                            <h4 style={{margin: '0 0 10px 0', color: '#3b82f6'}}>🔐 Dekanlık Teslimat Kodunuz</h4>
                            <div style={{fontSize: '32px', fontWeight: '900', letterSpacing: '4px', color: '#1e293b'}}>
                                {orderResult.pickupCode}
                            </div>
                            <p style={{margin: '10px 0 0 0', fontSize: '13px', color: '#64748b'}}>
                                Kitaplarınızı teslim alırken bu kodu yetkiliye göstermeniz gerekmektedir.
                            </p>
                        </div>
                    )}
                    
                    <div className="order-info-card">
                        <div className="info-item">
                            <label>Sipariş Numarası</label>
                            <span>{orderResult.orderNumber}</span>
                        </div>
                        <div className="info-item">
                            <label>Tarih</label>
                            <span>{new Date().toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="info-item">
                            <label>Toplam</label>
                            <span>{orderResult.totalPrice?.toFixed(2) || '0.00'} ₺</span>
                        </div>
                        {isAdmin && (
                            <div className="info-item">
                                <label>Ödeme Yöntemi</label>
                                <span>💵 Nakit</span>
                            </div>
                        )}
                    </div>

                    <div className="btn-group">
                        <button 
                            className="btn-primary-lg" 
                            style={{width: 'auto', marginTop: 0}} 
                            onClick={() => navigate(isAdmin ? '/admin' : '/profil', isAdmin ? undefined : { state: { tab: 'orders' } })}
                        >
                            {isAdmin ? 'Yönetim Paneline Git' : 'Siparişlerime Git'}
                        </button>
                        <button className="btn-secondary" onClick={() => navigate('/')}>Ana Sayfaya Dön</button>
                    </div>
                </div>
            )}

            {showPreInfoModal && (
                <div className="modal-overlay" onClick={() => setShowPreInfoModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Ön Bilgilendirme Formu</h2>
                            <button className="modal-close-btn" onClick={() => setShowPreInfoModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
{`DOKUZ EYLÜL ÜNİVERSİTESİ MÜHENDİSLİK FAKÜLTESİ
KİTAP SATIŞ E-TİCARET SİTESİ ÖN BİLGİLENDİRME FORMU

İşbu Ön Bilgilendirme Formu, Alıcı’nın https://kitapsatis.deu.edu.tr/ internet sitesi üzerinden kitap/yayın satın almadan önce; ürünün temel nitelikleri, fiyatı, ödeme, teslimat, cayma hakkı ve iade koşulları hakkında bilgilendirilmesi amacıyla hazırlanmıştır.

1. Satıcı Bilgileri
Ünvan: Dokuz Eylül Üniversitesi Mühendislik Fakültesi Dekanlığı
Adres: Merkez Yerleşkesi, Buca / İzmir
E-posta: kitapsatis@deu.edu.tr
Web Sitesi: https://kitapsatis.deu.edu.tr/

2. Sözleşme Konusu Ürün / Hizmet Bilgileri
Alıcı tarafından satın alınan kitap/yayın ürününün adı, ISBN numarası, adedi, birim fiyatı, KDV dahil toplam tutarı, kargo bedeli ve genel toplamı sipariş tamamlama ekranında ve sipariş onay e-postasında yer almaktadır.
Güncel fiyatlandırma, KDV oranı ve stok bilgileri Satıcı'nın internet sitesinde ilan edildiği şekilde geçerlidir.

3. Ödeme Bilgileri
Alıcı, sipariş bedelini kredi kartı veya banka kartı ile sanal POS aracılığıyla ödeyebilir.
Ön provizyon siparişin verildiği anda alınır; sipariş onayı sonrasında tahsilat gerçekleştirilir.

4. Teslimat Bilgileri
Teslimat, Alıcı'nın sipariş sırasında bildirdiği adrese anlaşmalı kargo firması aracılığıyla yapılır.
Satıcı, ödemenin kendisine ulaşmasından itibaren en fazla 30 (otuz) gün içinde teslimatı gerçekleştirmekle yükümlüdür. Yurt içi teslimatlar, kargoya teslim edildiği günden itibaren genellikle 2-5 iş günü içinde tamamlanır; bu süre kargo firmasının hizmet koşullarına göre değişebilir.
Alıcı, teslimat adresine ilişkin bilgilerin eksiksiz ve doğru olduğunu kabul eder. Hatalı veya eksik adres bilgisi nedeniyle doğabilecek ek kargo masrafları Alıcı'ya aittir.

5. Cayma Hakkı
Alıcı, sözleşmenin kurulduğu tarihten itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkını kullanabilir.
Cayma hakkının kullanılabilmesi için ürünün ambalajı açılmamış, kullanılmamış, deforme edilmemiş ve yeniden satılabilir durumda olması gerekir.
Cayma hakkını kullanmak isteyen Alıcı, Satıcı'ya kitapsatis@deu.edu.tr adresi üzerinden e-posta yoluyla veya yazılı olarak bildirimde bulunur.
Alıcı, cayma bildiriminin ardından ürünü 10 (on) gün içinde, kargo masrafları kendisine ait olmak üzere Satıcı'ya iade eder. Satıcı, iade edilen ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde ödemeyi Alıcı'ya iade eder.

6. Cayma Hakkının Kullanılamayacağı Durumlar
Alıcı tarafından ambalajı açılan, okunmaya başlanan veya üzerinde işaretleme/notlama yapılan kitap ve yayınlarda cayma hakkı kullanılamaz.
Sipariş üzerine özel baskı/cilt yaptırılan veya kişiye özel hazırlanan yayınlarda cayma hakkı kullanılamaz.
Dijital içerik ve e-kitap ürünlerinde, indirme veya aktivasyon işlemi gerçekleştirilmişse cayma hakkı kullanılemamaktadır.

7. Hasarlı, Eksik veya Yanlış Ürün Teslimi
Teslimat sırasında hasarlı ya da eksik ürün alınması halinde Alıcı, durumu teslim tarihinden itibaren 3 (üç) iş günü içinde fotoğraf ile belgeleyerek Satıcı'ya e-posta yoluyla bildirmelidir.
Satıcı, inceleme sonucuna göre ürünü değiştirir veya bedelini iade eder. Yanlış ürün gönderilmesi durumunda iade kargo masrafları Satıcı tarafından karşılanır.

8. Kişisel Verilerin Korunması
Alıcı'nın kişisel verileri, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işlenmektedir. Satıcı'nın KVKK Aydınlatma Metni internet sitesinde kamuoyuyla paylaşılmıştır.

9. Uyuşmazlıkların Çözümü
Bu form ve mesafeli satış sözleşmesinden doğabilecek uyuşmazlıklarda İzmir Mahkemeleri, İcra Daireleri ve Tüketici Hakem Heyetleri yetkilidir.

10. Onay
Alıcı; ürünün temel nitelikleri, satış fiyatı, ödeme şekli, teslimat koşulları, cayma hakkı ve iade şartları hakkında önceden bilgilendirildiğini, işbu Ön Bilgilendirme Formu'nu okuyup anladığını ve elektronik ortamda onayladığını kabul, beyan ve taahhüt eder.`}
                        </div>
                        <div className="modal-footer">
                            <button className="modal-accept-btn" onClick={() => { setPreInfoAccepted(true); setShowPreInfoModal(false); }}>Okudum, Kabul Ediyorum</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cart;
