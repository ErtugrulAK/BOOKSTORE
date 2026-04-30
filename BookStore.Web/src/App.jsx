import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // Sayfa geçiş kütüphanemiz
import axios from 'axios';
import './App.css';
import Navbar from './components/Navbar/Navbar'; // Üst Menümüzü içeri aktardık
import BookCard from './components/BookCard/BookCard';
import Cart from './pages/Checkout/Cart'; // Yeni sepet sayfamızı içeri aktardık
import Sidebar from './components/Sidebar/Sidebar'; // Yeni Yan Menümüz
import Login from './pages/Login/Login'; // Giriş sayfası
import Register from './pages/Register/Register'; // Kayıt sayfası
import Admin from './pages/Admin/Admin'; // Admin Paneli sayfası
import Profile from './pages/Profile/Profile'; // Profil sayfası
import BookDetail from './pages/BookDetail/BookDetail'; // Kitap detay sayfası

// Vitrin (Ana Sayfa) bileşenimiz dışarıdan paramtere olarak aramayı, fiyatları ve KATEGORİYİ alıyor
function Home({ searchTerm, minPrice, maxPrice, category, handleAddToCart }) {
  const [kitaplar, setKitaplar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    let url = 'http://localhost:5229/api/Books?pageSize=999&';
    if (searchTerm) url += `search=${searchTerm}&`;
    if (minPrice) url += `minPrice=${minPrice}&`;
    if (maxPrice) url += `maxPrice=${maxPrice}&`;
    if (category) url += `category=${category}&`;

    axios.get(url)
      .then(response => {
        setKitaplar(response.data.items || []);
        setLoading(false);
      })
      .catch(error => {
        console.error("API Error:", error);
        setKitaplar([]);
        setLoading(false);
      });
  }, [searchTerm, minPrice, maxPrice, category]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, minPrice, maxPrice, category]);

  const featuredBooks = kitaplar.filter(k => k.isFeatured);
  const regularBooks = kitaplar.filter(k => !k.isFeatured);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRegularBooks = regularBooks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(regularBooks.length / itemsPerPage);

  const renderBook = (kitap) => (
    <BookCard
      key={kitap.id}
      book={{
        id: kitap.id,
        isim: kitap.name,
        kategori: kitap.category || "Genel Kitap",
        fiyat: kitap.price,
        isFeatured: kitap.isFeatured,
        gorsel: kitap.imageUrl
      }}
      onAddToCart={handleAddToCart}
    />
  );

  if (loading) return <div className="loading-state"><h2>Yüklüyor...</h2></div>;

  return (
    <div className="home-container animate-fade-in">
      {featuredBooks.length > 0 && !searchTerm && !category && (
        <section className="featured-section">
          <h2 className="section-title">✨ Öne Çıkan Kitaplar</h2>
          <div className="books-grid">
            {featuredBooks.map(renderBook)}
          </div>
        </section>
      )}

      <section className="all-books-section">
        <h2 className="section-title">📚 {searchTerm || category ? 'Arama Sonuçları' : 'Tüm Kitaplar'}</h2>
        {regularBooks.length > 0 ? (
          <>
            <div className="books-grid">
              {currentRegularBooks.map(renderBook)}
            </div>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn" 
                  disabled={currentPage === 1} 
                  onClick={() => {setCurrentPage(currentPage - 1); window.scrollTo(0,0);}}
                >
                  ←
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i + 1} 
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => {setCurrentPage(i + 1); window.scrollTo(0,0);}}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  className="page-btn" 
                  disabled={currentPage === totalPages} 
                  onClick={() => {setCurrentPage(currentPage + 1); window.scrollTo(0,0);}}
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">
            <p>Aradığınız kriterlere uygun kitap bulunamadı.</p>
          </div>
        )}
      </section>
    </div>
  );
}

// Global Custom Toast Fonksiyonu
window.showToast = (msg, isError = false) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, isError } }));
};

function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handler = (e) => {
            const id = Date.now() + Math.random();
            setToasts(prev => [...prev, { id, ...e.detail }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        };
        window.addEventListener('show-toast', handler);
        return () => window.removeEventListener('show-toast', handler);
    }, []);

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    background: t.isError ? '#ef4444' : '#10b981',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    animation: 'slideIn 0.3s ease-out',
                    fontSize: '15px',
                    fontWeight: '500'
                }}>
                    {t.isError ? '⚠️' : '✅'} {t.msg}
                </div>
            ))}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// Ana App dosyamız artık sayfaları (Rotaları) yöneten bir "Harita" oldu
function App() {
  // ARAMA METNİ HAFIZASI
  const [aramaMetni, setAramaMetni] = useState("");

  // FİYAT HAFIZALARI (Sidebar ve Vitrin kullanacak)
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // KATEGORİ HAFIZASI (Sidebar'dan seçilecek, Vitrin'de kullanılacak)
  const [seciliKategori, setSeciliKategori] = useState(null);

  // AUTH HAFIZASI
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // ZİYARETÇİ SEPETİ HAFIZASI
  const [localCart, setLocalCart] = useState(() => {
    const saved = localStorage.getItem('guest_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [apiCartCount, setApiCartCount] = useState(0);

  const refreshCartCount = async () => {
    if (token) {
        try {
            const res = await axios.get('http://localhost:5229/api/Cart', { headers: { Authorization: `Bearer ${token}` } });
            const count = res.data.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            setApiCartCount(count);
        } catch (err) { console.error('Sepet yenileme hatası:', err); }
    }
  };

  // Giriş yapılıysa sepet sayısını API'den çek
  useEffect(() => {
    if (token) {
        refreshCartCount();
    } else {
        localStorage.setItem('guest_cart', JSON.stringify(localCart));
    }
  }, [token, localCart]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setApiCartCount(0);
  };

  const handleAddToCart = async (book) => {
    if (token) {
        try {
            const response = await axios.post('http://localhost:5229/api/Cart/items', 
                { BookId: book.id, Quantity: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const count = response.data.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            setApiCartCount(count);
            window.showToast('Ürün sepetinize eklendi!');
        } catch(err) {
            console.error(err);
            window.showToast('Sepete eklenirken hata oluştu.', true);
        }
    } else {
        const existing = localCart.find(item => item.book.id === book.id);
        if (existing) {
            setLocalCart(localCart.map(item => item.book.id === book.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setLocalCart([...localCart, { book: book, quantity: 1, unitPrice: book.fiyat }]);
        }
    }
  };

  const currentCartCount = token ? apiCartCount : localCart.reduce((sum, item) => sum + item.quantity, 0);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');

  useEffect(() => {
    if (user && user.role !== 'Admin' && !user.phoneNumber) {
        setShowPhoneModal(true);
    } else {
        setShowPhoneModal(false);
    }
  }, [user]);

  const handlePhoneSubmit = async () => {
    if (phoneValue.replace(/\D/g, '').length < 10) {
        window.showToast("Lütfen geçerli bir telefon numarası giriniz.", true);
        return;
    }
    try {
        const res = await axios.put('http://localhost:5229/api/Users/profile', 
            { firstName: user.firstName, lastName: user.lastName, phoneNumber: phoneValue },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedUser = res.data;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowPhoneModal(false);
        window.showToast("Telefon numaranız kaydedildi!");
    } catch (err) {
        window.showToast("Bir hata oluştu.", true);
    }
  };

  const handlePhoneChange = (e) => {
    let digits = e.target.value.replace(/\D/g, '');
    let formatted = '';
    if (digits.length > 0) {
        formatted = digits.slice(0, 4);
        if (digits.length > 4) formatted += ' ' + digits.slice(4, 7);
        if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
        if (digits.length > 9) formatted += ' ' + digits.slice(9, 11);
    }
    setPhoneValue(formatted);
  };

  // O anki adresi (URL'i) alıyoruz
  const location = useLocation();

  // Sidebar SADECE ana sayfada (Yani yolu sadece "/" olan yerde) görünsün.
  const isHomePage = location.pathname === "/";
  const isAdminPage = location.pathname.startsWith("/admin");
  const isProfilePage = location.pathname.startsWith("/profil");

  // Admin ve Profil panelleri kendi layout'larına (sidebar+topbar) sahip olduğu için global navbar ve padding'den muaf tutulmalı
  const isSpecialPage = isAdminPage || isProfilePage;

  if (isAdminPage) {
    return (
        <>
            <ToastContainer />
            <Routes>
                <Route path="/admin" element={<Admin token={token} user={user} />} />
            </Routes>
        </>
    );
  }

  if (isProfilePage) {
    return (
        <>
            <ToastContainer />
            <Routes>
                <Route path="/profil" element={<Profile user={user} setUser={setUser} token={token} />} />
            </Routes>
        </>
    );
  }

  return (
    <>
      <ToastContainer />
      
      {showPhoneModal && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)'
        }}>
            <div className="animate-slide-up" style={{
                backgroundColor: 'white', padding: '40px', borderRadius: '24px',
                width: '100%', maxWidth: '450px', textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>Son Bir Adım Kaldı!</h2>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
                    Siparişlerinizin takibini yapabilmemiz ve size ulaşabilmemiz için lütfen telefon numaranızı giriniz.
                </p>
                <div style={{ marginBottom: '25px', textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', marginLeft: '4px' }}>Telefon Numarası</label>
                    <input 
                        type="text" 
                        value={phoneValue}
                        onChange={handlePhoneChange}
                        placeholder="05xx xxx xx xx"
                        maxLength="14"
                        style={{
                            width: '100%', padding: '14px 20px', borderRadius: '12px',
                            border: '2px solid #e2e8f0', fontSize: '16px', fontWeight: '600',
                            color: '#1e293b', outline: 'none', transition: 'border-color 0.2s',
                            boxSizing: 'border-box'
                        }}
                        autoFocus
                    />
                </div>
                <button 
                    onClick={handlePhoneSubmit}
                    style={{
                        width: '100%', padding: '16px', borderRadius: '12px',
                        backgroundColor: '#3b82f6', color: 'white', border: 'none',
                        fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                        transition: 'transform 0.2s, background-color 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                    Devam Et
                </button>
            </div>
        </div>
      )}

      <Navbar 
        searchTerm={aramaMetni} 
        setSearchTerm={setAramaMetni} 
        user={user} 
        handleLogout={handleLogout} 
        cartCount={currentCartCount} 
      />

      <div className="main-layout">
        {isHomePage && (
            <Sidebar
                setMinPrice={setMinPrice}
                setMaxPrice={setMaxPrice}
                category={seciliKategori}
                setCategory={setSeciliKategori}
            />
        )}

        <div className="page-content page-transition" key={location.pathname} style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home
                searchTerm={aramaMetni}
                minPrice={minPrice}
                maxPrice={maxPrice}
                category={seciliKategori}
                handleAddToCart={handleAddToCart}
              />} />

              <Route path="/sepet" element={<Cart localCart={localCart} setLocalCart={setLocalCart} token={token} setApiCartCount={setApiCartCount} />} />
              
              <Route path="/login" element={<Login setToken={setToken} setUser={setUser} localCart={localCart} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/kitap/:id" element={<BookDetail handleAddToCart={handleAddToCart} />} />
            </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
