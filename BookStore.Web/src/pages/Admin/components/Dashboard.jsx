import React from 'react';

const Dashboard = ({ orders, books, users, CATEGORIES, setActiveTab, formatDate, stats }) => {
    // --- DASHBOARD BİLGİLERİ (Hesaplamalar) ---
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // Gelir ve Kitap Satışı için: Sadece kargolanan veya teslim edilenler
    const salesOrders = orders.filter(o => o.status === 3 || o.status === 4);
    
    // Toplam Sipariş için: Hepsi
    const allOrdersCount = orders.length;
    const cancelledOrdersCount = orders.filter(o => o.status === 5).length;
    const activeOrders = orders.filter(o => o.status !== 5);

    const totalRevenue = salesOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalSoldBooks = salesOrders.reduce((sum, o) => {
        return sum + (o.orderItems?.reduce((s, item) => s + item.quantity, 0) || 0);
    }, 0);
    
    // Sadece bu ayki aktif siparişler (Alttaki tablolar için)
    const currentMonthOrdersList = activeOrders.filter(o => {
        const d = new Date(o.createdAtUtc);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    
    const totalBooks = books.length;

    const monthlyData = {};
    activeOrders.forEach(o => {
        const date = new Date(o.createdAtUtc);
        const monthLabel = date.toLocaleString('tr-TR', { month: 'short', year: 'numeric' });
        if (!monthlyData[monthLabel]) monthlyData[monthLabel] = 0;
        monthlyData[monthLabel] += o.totalPrice;
    });

    const chartBars = Object.keys(monthlyData).reverse().map(monthLabel => ({
        label: monthLabel,
        revenue: monthlyData[monthLabel]
    }));
    const maxRevenue = Math.max(...chartBars.map(b => b.revenue), 1);

    const bookSales = {};
    const categoryRevenue = {};

    // Alttaki tablolar için bu ayki siparişleri kullanıyoruz
    currentMonthOrdersList.forEach(o => {
        o.orderItems?.forEach(item => {
            if (item.book) {
                if (!bookSales[item.book.id]) bookSales[item.book.id] = { book: item.book, count: 0 };
                bookSales[item.book.id].count += item.quantity;

                const catName = item.book.category || 'Belirtilmemiş';
                if (!categoryRevenue[catName]) categoryRevenue[catName] = 0;
                categoryRevenue[catName] += (item.unitPrice || item.book.price) * item.quantity;
            }
        });
    });

    let topBooks = Object.values(bookSales).sort((a, b) => b.count - a.count).slice(0, 4);
    let topCategories = Object.keys(categoryRevenue).map(catName => {
        return { name: catName, revenue: categoryRevenue[catName] };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 4);

    // Eğer bu ay veri yoksa boşluk kalmaması için genel aktiflerden çek (opsiyonel ama boş kalsa daha doğru olabilir)
    if (topBooks.length === 0) topBooks = []; 
    if (topCategories.length === 0) topCategories = [];

    let thisMonthRevenue = 0, lastMonthRevenue = 0;
    let thisMonthOrdersCount = 0, lastMonthOrdersCount = 0;
    let thisMonthBooksCount = 0, lastMonthBooksCount = 0;

    activeOrders.forEach(o => {
        const d = new Date(o.createdAtUtc);
        const m = d.getMonth();
        const y = d.getFullYear();

        if (m === thisMonth && y === thisYear) {
            thisMonthRevenue += o.totalPrice;
            thisMonthOrdersCount++;
            thisMonthBooksCount += o.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        } else if (m === lastMonth && y === lastMonthYear) {
            lastMonthRevenue += o.totalPrice;
            lastMonthOrdersCount++;
            lastMonthBooksCount += o.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        }
    });


    let thisMonthUsers = 0, lastMonthUsers = 0;
    users.forEach(u => {
        const created = u.createdAtUtc || u.createdAt;
        if (created) {
            const d = new Date(created);
            const m = d.getMonth();
            const y = d.getFullYear();
            if (m === thisMonth && y === thisYear) thisMonthUsers++;
            else if (m === lastMonth && y === lastMonthYear) lastMonthUsers++;
        }
    });

    const calcPercent = (curr, prev) => {
        if (prev === 0 && curr === 0) return { text: '0%', isPositive: true, sign: '📈' };
        if (prev === 0) return { text: '+100%', isPositive: true, sign: '📈' };
        const diff = curr - prev;
        const percent = (diff / prev) * 100;
        return {
            text: `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`,
            isPositive: percent >= 0,
            sign: percent >= 0 ? '📈' : '📉'
        };
    };

    const revChange = calcPercent(stats?.thisMonthRevenue || thisMonthRevenue, stats?.lastMonthRevenue || lastMonthRevenue);
    const orderChange = calcPercent(stats?.thisMonthOrders || thisMonthOrdersCount, stats?.lastMonthOrders || lastMonthOrdersCount);
    const bookChange = calcPercent(stats?.thisMonthSoldBooks || thisMonthBooksCount, stats?.lastMonthSoldBooks || lastMonthBooksCount);
    const userChange = calcPercent(stats?.thisMonthUsers || thisMonthUsers, stats?.lastMonthUsers || lastMonthUsers);

    return (
        <>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Genel Bakış</h2>
                    <p className="admin-page-subtitle">Satış performansınızı ve mağaza istatistiklerini buradan takip edebilirsiniz.</p>
                </div>
                <div>
                    <button className="admin-primary-btn" onClick={() => setActiveTab('detailed_report')}>
                        📊 Detaylı Rapor
                    </button>
                </div>
            </div>

            <div className="stat-cards">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon blue">💰</div>
                        <div className={`stat-badge ${revChange.isPositive ? 'positive' : 'negative'}`}>{revChange.sign} {revChange.text}</div>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Toplam Gelir</span>
                        <span className="stat-value">₺{(stats?.totalRevenue || totalRevenue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon green">🛒</div>
                        <div className={`stat-badge ${orderChange.isPositive ? 'positive' : 'negative'}`}>{orderChange.sign} {orderChange.text}</div>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Toplam Sipariş</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span className="stat-value">{stats?.totalOrders || allOrdersCount}</span>
                            {(stats?.cancelledOrdersCount > 0 || cancelledOrdersCount > 0) && (
                                <span style={{ fontSize: '12px', color: '#ee5d50', fontWeight: '500' }}>
                                    ({stats?.cancelledOrdersCount || cancelledOrdersCount} İptal)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon purple">📚</div>
                        <div className={`stat-badge ${bookChange.isPositive ? 'positive' : 'negative'}`}>{bookChange.sign} {bookChange.text}</div>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Satılan Kitap</span>
                        <span className="stat-value">{stats?.totalSoldBooks || totalSoldBooks}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon orange">👥</div>
                        <div className={`stat-badge ${userChange.isPositive ? 'positive' : 'negative'}`}>{userChange.sign} {userChange.text}</div>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Yeni Üye</span>
                        <span className="stat-value">{stats?.thisMonthUsers ?? thisMonthUsers}</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="admin-card chart-card">
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">Aylık Satış Analizi</h3>
                    </div>
                    <div className="dashboard-chart-area">
                        {chartBars.length === 0 ? (
                            <div style={{ color: '#a3aed1', padding: '20px', fontSize: '14px' }}>Henüz kargolanmış sipariş yok.</div>
                        ) : (
                            chartBars.map((bar, index) => (
                                <div className="chart-bar-container" key={index}>
                                    <div className="chart-bar" style={{ height: `${Math.max((bar.revenue / maxRevenue) * 100, 10)}%` }}></div>
                                    <div className="chart-tooltip">
                                        {bar.label} Geliri<br />
                                        <b>₺{bar.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</b>
                                    </div>
                                    <span className="chart-label">{bar.label.split(' ')[0]}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">Son Gelen Siparişler</h3>
                    </div>
                    <div className="admin-table-wrapper">
                        <table className="admin-modern-table">
                            <thead>
                                <tr>
                                    <th>Sipariş No</th>
                                    <th>Tarih</th>
                                    <th>Tutar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeOrders.slice(0, 5).map(o => (
                                    <tr key={o.id}>
                                        <td>{o.orderNumber}</td>
                                        <td>{new Date(o.createdAtUtc).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: '700' }}>₺{o.totalPrice.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {orders.length === 0 && <tr><td colSpan="3">Henüz sipariş yok.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid-bottom" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">En Çok Satan Kitaplar</h3>
                    </div>
                    <div className="admin-table-wrapper">
                        <table className="admin-modern-table">
                            <thead>
                                <tr>
                                    <th>KİTAP</th>
                                    <th>FİYAT</th>
                                    <th>SATIŞ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topBooks.map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                📘
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#2b3674' }}>{item.book.name}</div>
                                                <div style={{ fontSize: '12px', color: '#a3aed1', lineHeight: '1.2' }}>
                                                    {item.book.author?.split(',').map((a, i) => (
                                                        <div key={i}>{a.trim()}</div>
                                                    )).filter(a => a) || "-"}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#64748b' }}>₺{item.book.price}</td>
                                        <td style={{ fontWeight: '700', color: '#2b3674' }}>{item.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">Kategori Gelirleri</h3>
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {topCategories.map((item, i) => {
                            const percent = Math.max((item.revenue / (topCategories[0]?.revenue || 1)) * 100, 5);
                            const colors = ['#4318ff', '#05cd99', '#ffb547', '#ee5d50'];
                            return (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: '600', color: '#2b3674', fontSize: '14px' }}>{item.name}</span>
                                        <span style={{ fontWeight: '700', color: '#2b3674', fontSize: '14px' }}>₺{item.revenue.toLocaleString('tr-TR')}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percent}%`, height: '100%', backgroundColor: colors[i % colors.length], borderRadius: '4px' }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
