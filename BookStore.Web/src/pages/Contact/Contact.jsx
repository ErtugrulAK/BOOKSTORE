import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Contact.css';

function Contact() {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        senderName: '',
        email: '',
        subject: 'Genel Bilgi',
        content: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Kullanıcı bilgisini localStorage'dan çek
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            setFormData(prev => ({
                ...prev,
                senderName: `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim(),
                email: parsed.email || ''
            }));
        }
    }, []);

    const handleChange = (e) => {
        // Ad ve e-posta değiştirilemez
        if (e.target.name === 'senderName' || e.target.name === 'email') return;
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/contact', formData, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setSuccess(true);
            setFormData(prev => ({ ...prev, subject: 'Genel Bilgi', content: '' }));
        } catch (err) {
            setError(err.response?.data?.message || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="contact-page">
            <div className="contact-header">
                <h1>İletişim</h1>
                <p>Sorularınız, görüşleriniz veya önerileriniz için bizimle iletişime geçebilirsiniz.</p>
            </div>

            <div className="contact-grid">
                {/* Sol: Form */}
                <div className="contact-form-card">
                    <h2 className="contact-section-title">
                        <span>✉️</span> İletişim Formu
                    </h2>

                    {/* Giriş Yapılmamışsa Overlay */}
                    {!user && (
                        <div className="form-login-overlay">
                            <div className="overlay-content">
                                <div style={{fontSize: '40px', marginBottom: '10px'}}>🔒</div>
                                <p>Mesaj göndermek için giriş yapmalısınız</p>
                                <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                                    <Link to="/login" className="contact-submit-btn">Giriş Yap</Link>
                                    <Link to="/register" className="contact-btn-outline">Kayıt Ol</Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {success ? (
                        <div className="contact-success">
                            <div className="success-icon">✅</div>
                            <h3>Mesajınız İletildi!</h3>
                            <p>Yanıtınız <strong>{user.email}</strong> adresine e-posta ile gönderilecektir.</p>
                            <button onClick={() => setSuccess(false)} className="contact-btn-outline">
                                Yeni Mesaj Gönder
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="contact-form">
                            {error && <div className="contact-error">{error}</div>}

                            <div className="contact-form-row">
                                <div className="contact-input-group">
                                    <label htmlFor="senderName">
                                        Adınız Soyadınız
                                        <span className="contact-readonly-badge">🔒 Otomatik</span>
                                    </label>
                                    <input
                                        id="senderName"
                                        type="text"
                                        name="senderName"
                                        value={formData.senderName}
                                        readOnly
                                        className="contact-input-readonly"
                                    />
                                </div>
                                <div className="contact-input-group">
                                    <label htmlFor="contact-email">
                                        E-posta Adresiniz
                                        <span className="contact-readonly-badge">🔒 Otomatik</span>
                                    </label>
                                    <input
                                        id="contact-email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        readOnly
                                        className="contact-input-readonly"
                                    />
                                </div>
                            </div>

                            <div className="contact-input-group">
                                <label htmlFor="contact-subject">Konu</label>
                                <select
                                    id="contact-subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                >
                                    <option>Genel Bilgi</option>
                                    <option>Kitap Stok Durumu</option>
                                    <option>Sipariş ve Teslimat</option>
                                    <option>İade ve Değişim</option>
                                    <option>Diğer</option>
                                </select>
                            </div>

                            <div className="contact-input-group">
                                <label htmlFor="contact-content">Mesajınız</label>
                                <textarea
                                    id="contact-content"
                                    name="content"
                                    placeholder="Mesajınızı buraya yazınız..."
                                    rows="6"
                                    value={formData.content}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <button type="submit" className="contact-submit-btn" disabled={isLoading}>
                                {isLoading ? 'Gönderiliyor...' : '📨 Mesajı Gönder'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Sağ: Bilgi + Harita */}
                <div className="contact-info-column">
                    <div className="contact-info-card">
                        <h3 className="contact-section-title">İletişim Bilgileri</h3>
                        <ul className="contact-info-list">
                            <li>
                                <div className="contact-info-icon">📍</div>
                                <div>
                                    <strong>Adres</strong>
                                    <p>Dokuz Eylül Üniversitesi<br />Mühendislik Fakültesi<br />Tınaztepe Yerleşkesi<br />35160 Buca / İzmir</p>
                                </div>
                            </li>
                            <li>
                                <div className="contact-info-icon">📞</div>
                                <div>
                                    <strong>Telefon</strong>
                                    <a href="tel:+902321234567">+90 (232) 123 45 67</a>
                                </div>
                            </li>
                            <li>
                                <div className="contact-info-icon">📧</div>
                                <div>
                                    <strong>E-posta</strong>
                                    <a href="mailto:kitapsatis@deu.edu.tr">kitapsatis@deu.edu.tr</a>
                                </div>
                            </li>
                            <li>
                                <div className="contact-info-icon">🕐</div>
                                <div>
                                    <strong>Çalışma Saatleri</strong>
                                    <p>Pazartesi – Cuma: 09:00 – 17:00</p>
                                </div>
                            </li>
                        </ul>
                    </div>



                    <div className="contact-map-card">
                        <iframe
                            title="DEÜ Mühendislik Fakültesi Harita"
                            src="https://maps.google.com/maps?q=Dokuz%20Eyl%C3%BCl%20%C3%9Cniversitesi%20M%C3%BChendislik%20Fak%C3%BCltesi%20Dekanl%C4%B1%C4%9F%C4%B1&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            width="100%"
                            height="220"
                            style={{ border: 0, borderRadius: '10px', display: 'block' }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Contact;
