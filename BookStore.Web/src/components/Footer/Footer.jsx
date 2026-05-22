import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-content">
                <div className="footer-brand">
                    <h2>📚 DEÜ Kitap Satış</h2>
                    <p>En sevdiğiniz kitapları güvenle satın alın. Uygun fiyatlarımızla her zaman yanınızdayız.</p>
                </div>
                
                <div className="footer-links-group">
                    <h3>Hızlı Linkler</h3>
                    <ul>
                        <li><Link to="/">Ana Sayfa</Link></li>
                        <li><Link to="/iletisim">İletişim</Link></li>
                    </ul>
                </div>

                <div className="footer-links-group">
                    <h3>Kurumsal</h3>
                    <ul>
                        <li><Link to="/mesafeli-satis">Mesafeli Satış Sözleşmesi</Link></li>
                    </ul>
                </div>

                <div className="footer-contact">
                    <h3>İletişim</h3>
                    <div className="contact-item">
                        <span className="icon">📍</span>
                        <p>Dokuz Eylül Üniversitesi Mühendislik Fakültesi Merkez Yerleşkesi 35160 Buca / İzmir</p>
                    </div>
                    <div className="contact-item">
                        <span className="icon">📞</span>
                        <p><strong>Tel:</strong> <a href="tel:+902323017597">0232 301 75 97</a></p>
                    </div>
                    <div className="contact-item">
                        <span className="icon">📠</span>
                        <p><strong>Fax:</strong> <a href="tel:+902323017210">0232 301 72 10</a></p>
                    </div>
                    <div className="contact-item">
                        <span className="icon">✉️</span>
                        <p><strong>E-posta:</strong> <a href="mailto:kitapsatis@deu.edu.tr">kitapsatis@deu.edu.tr</a></p>
                    </div>
                    <div className="contact-item">
                        <span className="icon">🕐</span>
                        <p>Pazartesi – Cuma: 09:00 – 17:00</p>
                    </div>
                    <div className="footer-map" style={{ marginTop: '15px' }}>
                        <iframe
                            title="DEÜ Mühendislik Fakültesi Harita"
                            src="https://maps.google.com/maps?q=Dokuz%20Eyl%C3%BCl%20%C3%9Cniversitesi%20M%C3%BChendislik%20Fak%C3%BCltesi%20Dekanl%C4%B1%C4%9F%C4%B1&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            width="100%"
                            height="130"
                            style={{ border: 0, borderRadius: '8px', display: 'block' }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} DEÜ Kitap Satış. Tüm hakları saklıdır.</p>
            </div>
        </footer>
    );
};

export default Footer;
