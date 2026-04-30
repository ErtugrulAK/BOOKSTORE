import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import './Cart.css';

function Cart({ localCart, setLocalCart, token, setApiCartCount }) {
    const navigate = useNavigate();
    const [apiCart, setApiCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Sepet, 2: Bilgiler, 3: Ödeme, 4: Onay

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

    useEffect(() => {
        if (token) {
            // Sepeti çek
            axios.get('http://localhost:5229/api/Cart', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                setApiCart(res.data.orderItems || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

            // Adresleri çek
            axios.get('http://localhost:5229/api/Addresses', { headers: { Authorization: `Bearer ${token}` } })
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
            await axios.delete(`http://localhost:5229/api/Cart/items/${bookId}`, { headers: { Authorization: `Bearer ${token}` } });
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
                    await axios.delete('http://localhost:5229/api/Cart', { headers: { Authorization: `Bearer ${token}` } });
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
                await axios.put(`http://localhost:5229/api/Cart/items/${bookId}`, newQty, { 
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
                axios.get('http://localhost:5229/api/Cart', { headers: { Authorization: `Bearer ${token}` } })
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

        let addressString = "";
        if (deliveryMethod === 'dekanlik') {
            addressString = "Dekanlıktan Gelip Alma";
        } else if (selectedAddressId) {
            const addr = userAddresses.find(a => a.id === selectedAddressId);
            addressString = `${addr.title}: ${addr.addressDetails} - Alıcı: ${addr.receiverName} (${addr.phoneNumber})`;
        } else {
            addressString = `${formData.adres} - Alıcı: ${formData.ad} ${formData.soyad} (${formData.telefon})`;
        }

        try {
            const response = await axios.post('http://localhost:5229/api/Cart/checkout', 
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
            <button className="btn-primary-lg" onClick={onNext}>
                {buttonText} {step < 3 && '→'}
            </button>
            <div style={{marginTop: '20px', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px'}}>
                {/* SSL text removed as per user request */}
            </div>
        </div>
    );

    if (items.length === 0 && step !== 4) {
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
                                    <img src={book?.imageUrl || '/placeholder.jpg'} alt={book?.name} className="cart-card-img" />
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
                    {renderSummary(isLocal ? 'Giriş Yap' : 'Sepeti Onayla', async () => {
                        if (isLocal) {
                            navigate('/login');
                        } else {
                            try {
                                const res = await axios.get('http://localhost:5229/api/Cart/validate', { 
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
                    })}
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
                                    <p>Kitaplarınız adresinize gönderilir.</p>
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
                                            <div className="form-group full">
                                                <label>Telefon Numarası</label>
                                                <input name="telefon" value={formData.telefon} onChange={handleInputChange} placeholder="05XX XXX XX XX" maxLength="14" />
                                            </div>
                                            <div className="form-group full">
                                                <label>Açık Adres</label>
                                                <textarea name="adres" value={formData.adres} onChange={handleInputChange} rows="3" placeholder="Mahalle, Sokak, No, Daire..."></textarea>
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
                                <p style={{color: '#64748b', maxWidth: '400px', margin: '15px auto'}}>
                                    Siparişiniz hazırlandığında fakülte dekanlığından <strong>size özel üretim kodunuz</strong> ve kimliğinizle birlikte teslim alabilirsiniz.
                                </p>
                            </div>
                        )}
                    </div>
                    {renderSummary('Ödeme Adımına Geç', () => {
                        if (deliveryMethod === 'kargo') {
                            if (!selectedAddressId && (!formData.ad || !formData.adres || !formData.telefon)) {
                                window.showToast('Lütfen tüm alanları doldurun.', true);
                                return;
                            }
                        }
                        setStep(3);
                    })}
                </div>
            )}

            {step === 3 && (
                <div className="checkout-layout animate-fade-in">
                    <div className="checkout-main">
                        <button className="btn-back" onClick={() => setStep(2)}>← Bilgilere Dön</button>
                        <h1 style={{marginBottom: '25px', color: '#1e293b'}}>Ödeme Yöntemi</h1>
                        <div className="form-section">
                            <div className="payment-methods">
                                <div className="pay-method active">
                                    <i>💳</i>
                                    <span>Kredi / Banka Kartı</span>
                                </div>
                                <div className="pay-method" onClick={() => window.showToast('Bu yöntem şu an aktif değil.', true)}>
                                    <i>🏦</i>
                                    <span>Havale / EFT</span>
                                </div>
                            </div>
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
                    </div>
                    {renderSummary('Siparişi Onayla', handleFinalCheckout)}
                </div>
            )}

            {step === 4 && orderResult && (
                <div className="success-container animate-fade-in">
                    <div className="success-icon">✓</div>
                    <h1>Siparişiniz Başarıyla Alınmıştır!</h1>
                    <p>Teşekkür ederiz! Kitaplarınız hazırlanıyor. Sipariş detaylarını aşağıda bulabilirsiniz.</p>
                    
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
                    </div>

                    <div className="btn-group">
                        <button className="btn-primary-lg" style={{width: 'auto', marginTop: 0}} onClick={() => navigate('/profil', { state: { tab: 'orders' } })}>Siparişlerime Git</button>
                        <button className="btn-secondary" onClick={() => navigate('/')}>Ana Sayfaya Dön</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cart;
