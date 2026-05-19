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

            <div className="contact-container-centered">
                {/* Form */}
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
            </div>
        </div>
    );
}

export default Contact;
