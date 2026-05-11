import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-content">
                <div className="footer-brand">
                    <h2>📚 DEU Kitap Satış</h2>
                    <p>En sevdiğiniz kitapları güvenle satın alın. Geniş kitap yelpazemiz ve uygun fiyatlarımızla her zaman yanınızdayız.</p>
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
                        <p>Örnek Mah. Kitap Sok. No: 123 Kadıköy / İstanbul</p>
                    </div>
                    <div className="contact-item">
                        <span className="icon">📞</span>
                        <p>+90 (212) 123 45 67</p>
                    </div>
                    <div className="contact-item">
                        <span className="icon">✉️</span>
                        <p>destek@bookstore.com</p>
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} DEU Kitap Satış. Tüm hakları saklıdır.</p>
            </div>
        </footer>
    );
};

export default Footer;
