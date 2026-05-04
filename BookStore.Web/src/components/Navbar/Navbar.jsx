import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

// Dışarıdan Arama Terimini, auth durumunu ve cartCount'u alıyoruz
function Navbar({ searchTerm, setSearchTerm, user, handleLogout, cartCount }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const hideSearch = !isHomePage;

  return (
    <nav className="navbar">
      {/* Sol Kısım: Logo / Marka */}
      <div className="navbar-logo">
        <Link to="/" style={{ textDecoration: 'none', color: '#1e293b' }}>
          <span style={{color: '#3b82f6', marginRight: '6px'}}>📚</span> {JSON.parse(localStorage.getItem('site_settings') || '{}').siteName || "DEÜ Kitap Satışı"}
        </Link>
      </div>

      {/* Orta Kısım: Arama Çubuğu (Input) */}
      {!hideSearch && (
          <div className="navbar-search">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Kitap veya Yazar Ara..." 
              className="search-input"
              value={searchTerm} // Kutunun içindeki yazı = Bizim State'imiz
              onChange={(e) => setSearchTerm(e.target.value)} // Klavyeye her basıldığında State'i güncelle
            />
          </div>
      )}

      {/* Sağ Kısım: Menü Linkleri */}
      <div className="navbar-links">
        <Link to="/" className="nav-link">Ana Sayfa</Link>
        {(!user || user.role !== 'Admin') && <Link to="/iletisim" className="nav-link">İletişim</Link>}
        
        {user ? (
            <>
                {user.role !== 'Admin' && (
                    <>
                        <Link to="/profil" className="nav-profile-link">
                            <div className="nav-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</div>
                            <span>{user.firstName}</span>
                        </Link>
                    </>
                )}
                {user.role === 'Admin' && (
                    <Link to="/admin" className="nav-link admin-btn">Yönetim Paneli</Link>
                )}
            </>
        ) : (
            <div className="auth-links">
                <Link to="/login" className="nav-link">Giriş Yap</Link>
                <Link to="/register" className="nav-link signup-btn">Kayıt Ol</Link>
            </div>
        )}

        {/* Sepet Butonu ve Sayaç */}
        {(!user || user.role !== 'Admin') && (
            <Link to="/sepet" className="nav-cart-icon-btn" title="Sepetim">
              <i>🛒</i>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
        )}
        
        {user && (
            <button className="nav-logout-btn" onClick={handleLogout} title="Güvenli Çıkış">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
            </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
