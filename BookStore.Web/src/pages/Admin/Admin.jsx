import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

// Yeni Modüler Bileşenler
import Dashboard from './components/Dashboard';
import BookManagement from './components/BookManagement';
import OrderManagement from './components/OrderManagement';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import DetailedReport from './components/DetailedReport';
import ContactMessages from './components/ContactMessages';
import CustomModal from './components/CustomModal';

function Admin({ token, user }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Veri Durumları
    const CATEGORIES = [
        "Çevre Mühendisliği", "Elektrik Elektronik Mühendisliği", "Endüstri Mühendisliği",
        "İnşaat Mühendisliği", "Jeofizik Mühendisliği", "Jeoloji Mühendisliği",
        "Maden Mühendisliği", "Makina Mühendisliği", "Tekstil Mühendisliği",
        "Temel Bilimler", "Dış Yayınlar"
    ];

    const [books, setBooks] = useState([]);
    const [booksTotal, setBooksTotal] = useState(0);
    const [booksPage, setBooksPage] = useState(1);
    const [showOnlyCriticalBooks, setShowOnlyCriticalBooks] = useState(false);
    const [criticalStockCount, setCriticalStockCount] = useState(0);
    const [showOnlyInactiveBooks, setShowOnlyInactiveBooks] = useState(false);
    const [inactiveBooksCount, setInactiveBooksCount] = useState(0);
    const [bulkPriceIncrease, setBulkPriceIncrease] = useState('');

    useEffect(() => {
        setBooksPage(1);
    }, [showOnlyInactiveBooks, showOnlyCriticalBooks]);

    const [orders, setOrders] = useState([]);
    const [ordersTotal, setOrdersTotal] = useState(0);
    const [ordersPage, setOrdersPage] = useState(1);

    const [users, setUsers] = useState([]);
    const [usersTotal, setUsersTotal] = useState(0);
    const [usersPage, setUsersPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);

    const [messages, setMessages] = useState([]);
    const [messagesTotal, setMessagesTotal] = useState(0);
    const [messagesPage, setMessagesPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [tempOrderStatus, setTempOrderStatus] = useState(null);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // Modal Durumu
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'confirm' });

    // Rapor Filtreleri
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportStatus, setReportStatus] = useState('');
    const [reportSearch, setReportSearch] = useState('');

    // Form Durumları
    const [bookForm, setBookForm] = useState({
        name: '', author: '', publisher: '', isbn: '', language: '',
        publicationYear: '', pageCount: '', description: '',
        price: '', stockQuantity: '', minStockLevel: 25,
        category: '', isActive: true, isFeatured: false,
        edition: ''
    });

    // Site Ayarları
    const [settingsForm, setSettingsForm] = useState(() => {
        const saved = localStorage.getItem('site_settings');
        return saved ? JSON.parse(saved) : { siteName: 'DEÜ Kitap Satışı', phone: '+90 232 412 00 00', email: 'iletisim@bookstore.com', address: 'Buca / İZMİR' };
    });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    useEffect(() => {
        if (!token || !user || user.role !== 'Admin') {
            navigate('/');
            return;
        }
        fetchData();
    }, [token, user, booksPage, ordersPage, usersPage, messagesPage, showOnlyInactiveBooks, showOnlyCriticalBooks]);

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Books
            let booksUrl = `http://localhost:5229/api/Books?includeInactive=true&page=${booksPage}&pageSize=10`;
            if (showOnlyInactiveBooks) booksUrl += '&isActive=false';
            if (showOnlyCriticalBooks) booksUrl += '&isCritical=true';

            const booksRes = await axios.get(booksUrl);
            setBooks(booksRes.data.items);
            setBooksTotal(booksRes.data.totalCount);

            // Critical Stock Count (for badge)
            const critRes = await axios.get(`http://localhost:5229/api/Books?isCritical=true&pageSize=1`);
            setCriticalStockCount(critRes.data.totalCount);

            // Inactive Books Count (for badge)
            const inactiveRes = await axios.get(`http://localhost:5229/api/Books?isActive=false&includeInactive=true&pageSize=1`);
            setInactiveBooksCount(inactiveRes.data.totalCount);

            // Orders
            const ordersRes = await axios.get(`http://localhost:5229/api/Orders/all?page=${ordersPage}&pageSize=10`, config).catch(() => ({ data: { items: [], totalCount: 0 } }));
            setOrders(ordersRes.data.items || []);
            setOrdersTotal(ordersRes.data.totalCount || 0);

            // Users
            const usersRes = await axios.get(`http://localhost:5229/api/Users?page=${usersPage}&pageSize=10`, config).catch(() => ({ data: { items: [], totalCount: 0 } }));
            setUsers(usersRes.data.items || []);
            setUsersTotal(usersRes.data.totalCount || 0);

            // Messages
            const messagesRes = await axios.get(`http://localhost:5229/api/Contact?page=${messagesPage}&pageSize=10`, config).catch(() => ({ data: { items: [], totalCount: 0 } }));
            setMessages(messagesRes.data.items || []);
            setMessagesTotal(messagesRes.data.totalCount || 0);

            // Dashboard Stats
            const statsRes = await axios.get(`http://localhost:5229/api/Dashboard/stats`, config).catch(() => null);
            if (statsRes) setDashboardStats(statsRes.data);

            // Unread Messages Count
            const unreadRes = await axios.get(`http://localhost:5229/api/Contact?pageSize=1&isRead=false`, config).catch(() => ({ data: { totalCount: 0 } }));
            setUnreadMessagesCount(unreadRes.data.totalCount || 0);

        } catch (error) {
            console.error("Admin veri hatası:", error);
        }
    };

    const showModal = (title, message, onConfirm, type = 'confirm') => {
        setModal({ isOpen: true, title, message, onConfirm: () => { onConfirm(); closeModal(); }, type });
    };

    const closeModal = () => setModal({ ...modal, isOpen: false });

    const handleViewUser = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`http://localhost:5229/api/Users/${id}`, config);
            setSelectedUser(res.data);
        } catch (err) {
            console.error(err);
            window.showToast('Kullanıcı bilgileri alınamadı.', true);
        }
    };

    const handleDeleteUser = (id) => {
        setModal({
            isOpen: true,
            title: 'Kullanıcıyı Sil',
            message: 'Bu kullanıcıyı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            onConfirm: async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await axios.delete(`http://localhost:5229/api/Users/${id}`, config);
                    window.showToast('Kullanıcı başarıyla silindi.');
                    fetchData();
                    closeModal();
                } catch (err) {
                    console.error(err);
                    window.showToast(err.response?.data || 'Kullanıcı silinemedi.', true);
                    closeModal();
                }
            },
            type: 'danger'
        });
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('tr-TR');
    
    const getStatusText = (status) => {
        switch (status) {
            case 2: return "Hazırlanıyor";
            case 3: 
            case 4: return "Kargoya Verildi";
            case 5: return "İptal / İade";
            default: return "Hazırlanıyor";
        }
    };

    const formatISBN = (val) => {
        const raw = val.replace(/\D/g, '').substring(0, 13);
        let formatted = '';
        if (raw.length > 0) formatted += raw.substring(0, 3);
        if (raw.length > 3) formatted += '-' + raw.substring(3, 6);
        if (raw.length > 6) formatted += '-' + raw.substring(6, 8);
        if (raw.length > 8) formatted += '-' + raw.substring(8, 12);
        if (raw.length > 12) formatted += '-' + raw.substring(12, 13);
        return formatted;
    };

    // --- İşlemler ---
    const handleSaveBook = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = {
                ...bookForm,
                price: parseFloat(bookForm.price),
                stockQuantity: parseInt(bookForm.stockQuantity),
                minStockLevel: parseInt(bookForm.minStockLevel)
            };
            if (bookForm.id) {
                await axios.put(`http://localhost:5229/api/Books/${bookForm.id}`, payload, config);
            } else {
                await axios.post('http://localhost:5229/api/Books', payload, config);
            }
            window.showToast("Kitap kaydedildi!");
            setActiveTab('books');
            fetchData();
        } catch (err) { window.showToast("Hata oluştu.", true); }
    };

    const handleDeleteBook = (id) => {
        showModal("Kitabı Sil/Pasifleştir", "Bu kitabı pasifleştirmek istediğinize emin misiniz?", async () => {
            try {
                await axios.delete(`http://localhost:5229/api/Books/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                window.showToast("Kitap durumu güncellendi.");
                fetchData();
            } catch (err) { window.showToast("Silinirken hata oluştu.", true); }
        });
    };

    const handleBulkAction = (action, val = null) => {
        let title = "", msg = "";
        if (action === 'open_all') {
            title = "Tümünü Satışa Aç";
            msg = "Tüm kitapları satışa açmak istediğinize emin misiniz?";
        } else if (action === 'close_all') {
            title = "Tümünü Satışa Kapat";
            msg = "Tüm kitapları satışa kapatmak istediğinize emin misiniz?";
        } else if (action === 'price_increase') {
            const amount = parseFloat(val);
            if (isNaN(amount) || amount <= 0) {
                window.showToast("Geçerli bir yüzdelik girin!", true);
                return;
            }
            title = "Toplu Fiyat Arttır";
            msg = `Tüm kitapların fiyatını %${amount} oranında arttırmak istediğinize emin misiniz?`;
        }

        showModal(title, msg, async () => {
            window.showToast("İşlem yapılıyor...", false);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                if (action === 'price_increase') {
                    const amount = parseFloat(val);
                    await axios.post(`http://localhost:5229/api/Books/bulk-price?percentage=${amount}`, {}, config);
                    setBulkPriceIncrease('');
                } else {
                    const targetState = action === 'open_all';
                    await axios.post(`http://localhost:5229/api/Books/bulk-status?active=${targetState}`, {}, config);
                }
                window.showToast("İşlem başarıyla tamamlandı!");
                fetchData();
            } catch (err) { window.showToast("Toplu işlem hatası.", true); }
        });
    };

    const openBookForm = (book = null) => {
        if (book) {
            setBookForm({ ...book });
        } else {
            setBookForm({
                name: '', author: '', publisher: '', isbn: '', language: '',
                publicationYear: '', pageCount: '', description: '',
                price: '', stockQuantity: '', minStockLevel: 25,
                category: '', isActive: true, isFeatured: false,
                edition: ''
            });
        }
        setActiveTab('book_form');
    };

    if (!user || user.role !== 'Admin') return null;

    return (
        <div className="admin-layout">
            <CustomModal {...modal} onCancel={closeModal} />
            
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header" onClick={() => navigate('/')}>
                    <span style={{ fontSize: '24px', color: '#3b82f6', marginRight: '6px' }}>📚</span>
                    <span className="sidebar-title">{settingsForm.siteName}</span>
                </div>
                <div className="admin-sidebar-menu">
                    <button className={`admin-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSelectedUser(null); setSelectedOrder(null); }}><i>🎛️</i> Panel</button>
                    <button className={`admin-menu-item ${activeTab === 'books' || activeTab === 'book_form' ? 'active' : ''}`} onClick={() => { setActiveTab('books'); setBooksPage(1); setSelectedUser(null); setSelectedOrder(null); }}><i>📚</i> Kitaplar</button>
                    <button className={`admin-menu-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => { setActiveTab('orders'); setOrdersPage(1); setSelectedOrder(null); setSelectedUser(null); }}><i>🛒</i> Siparişler</button>
                    <button className={`admin-menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setUsersPage(1); setSelectedUser(null); setSelectedOrder(null); }}><i>👥</i> Kullanıcılar</button>
                    <button className={`admin-menu-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => { setActiveTab('contacts'); setMessagesPage(1); setSelectedUser(null); setSelectedOrder(null); }}>
                        <i>✉️</i> İletişim Mesajları
                        {unreadMessagesCount > 0 && <span className="admin-menu-badge danger" style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: '700' }}>{unreadMessagesCount}</span>}
                    </button>
                    <button className={`admin-menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setSelectedUser(null); setSelectedOrder(null); }}><i>⚙️</i> Ayarlar</button>
                </div>
                <div className="admin-sidebar-footer">
                    <button className="admin-menu-item logout" onClick={() => navigate('/')}>Siteye Dön</button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-topbar">
                    <div className="admin-topbar-right">
                        <div className="admin-profile">
                            <div className="admin-profile-info">
                                <span className="admin-profile-name">{user.firstName} {user.lastName}</span>
                                <span className="admin-profile-role">Yönetici</span>
                            </div>
                            <div className="admin-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</div>
                        </div>
                    </div>
                </header>

                <div className="admin-content-scroll">
                    {activeTab === 'dashboard' && <Dashboard orders={orders} books={books} users={users} CATEGORIES={CATEGORIES} setActiveTab={setActiveTab} formatDate={formatDate} stats={dashboardStats} />}
                    {(activeTab === 'books' || activeTab === 'book_form') && <BookManagement activeTab={activeTab} books={books} booksTotal={booksTotal} booksPage={booksPage} setBooksPage={setBooksPage} bookForm={bookForm} setBookForm={setBookForm} handleSaveBook={handleSaveBook} handleDeleteBook={handleDeleteBook} handleBulkAction={handleBulkAction} setActiveTab={setActiveTab} CATEGORIES={CATEGORIES} token={token} fetchData={fetchData} showOnlyInactiveBooks={showOnlyInactiveBooks} setShowOnlyInactiveBooks={setShowOnlyInactiveBooks} showOnlyCriticalBooks={showOnlyCriticalBooks} setShowOnlyCriticalBooks={setShowOnlyCriticalBooks} criticalStockCount={criticalStockCount} inactiveBooksCount={inactiveBooksCount} bulkPriceIncrease={bulkPriceIncrease} setBulkPriceIncrease={setBulkPriceIncrease} openBookForm={openBookForm} formatISBN={formatISBN} />}
                    {activeTab === 'orders' && <OrderManagement selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} orders={orders} ordersTotal={ordersTotal} ordersPage={ordersPage} setOrdersPage={setOrdersPage} formatDate={formatDate} getStatusText={getStatusText} tempOrderStatus={tempOrderStatus} setTempOrderStatus={setTempOrderStatus} token={token} fetchData={fetchData} handleViewOrder={(o) => { setSelectedOrder(o); setTempOrderStatus(o.status); }} />}
                    {activeTab === 'users' && <UserManagement users={users} usersTotal={usersTotal} usersPage={usersPage} setUsersPage={setUsersPage} formatDate={formatDate} handleViewUser={handleViewUser} handleDeleteUser={handleDeleteUser} selectedUser={selectedUser} setSelectedUser={setSelectedUser} />}
                    {activeTab === 'contacts' && <ContactMessages messages={messages} messagesTotal={messagesTotal} messagesPage={messagesPage} setMessagesPage={setMessagesPage} token={token} fetchData={fetchData} />}
                    {activeTab === 'settings' && <Settings settingsForm={settingsForm} setSettingsForm={setSettingsForm} passwordForm={passwordForm} setPasswordForm={setPasswordForm} token={token} />}
                    {activeTab === 'detailed_report' && <DetailedReport orders={orders} reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} reportStatus={reportStatus} setReportStatus={setReportStatus} reportSearch={reportSearch} setReportSearch={setReportSearch} setActiveTab={setActiveTab} handleViewOrder={(o) => { setSelectedOrder(o); setTempOrderStatus(o.status); setActiveTab('orders'); }} />}
                </div>
            </main>
        </div>
    );
}

export default Admin;
