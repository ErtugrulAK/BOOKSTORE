import React from 'react';

const DetailedReport = ({ 
    orders, 
    reportStartDate, setReportStartDate, 
    reportEndDate, setReportEndDate, 
    reportStatus, setReportStatus, 
    reportSearch, setReportSearch,
    setActiveTab,
    handleViewOrder
}) => {
    let filteredOrders = [...orders];

    if (reportStartDate) {
        filteredOrders = filteredOrders.filter(o => new Date(o.createdAtUtc) >= new Date(reportStartDate));
    }
    if (reportEndDate) {
        filteredOrders = filteredOrders.filter(o => new Date(o.createdAtUtc) <= new Date(reportEndDate));
    }
    if (reportStatus !== '') {
        filteredOrders = filteredOrders.filter(o => o.status === parseInt(reportStatus));
    }
    if (reportSearch) {
        const lowerSearch = reportSearch.toLowerCase();
        filteredOrders = filteredOrders.filter(o =>
            o.orderNumber?.toLowerCase().includes(lowerSearch) ||
            o.orderItems?.some(i => i.book?.name?.toLowerCase().includes(lowerSearch))
        );
    }

    const filteredRevenue = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);

    return (
        <>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Detaylı Raporlama</h2>
                    <p className="admin-page-subtitle">Kapsamlı analiz raporu ve gelişmiş filtreler.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="admin-secondary-btn" onClick={() => setActiveTab('dashboard')}>⬅ Geri Dön</button>
                </div>
            </div>

            <div className="admin-card report-filter-card">
                <div className="admin-card-header">
                    <h3 className="admin-card-title">Gelişmiş Filtreler</h3>
                    <span className="link-style" onClick={() => { setReportStartDate(''); setReportEndDate(''); setReportStatus(''); setReportSearch(''); }}>Filtreleri Temizle</span>
                </div>
                <div className="report-filters">
                    <div className="input-group">
                        <label>Başlangıç Tarihi</label>
                        <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label>Bitiş Tarihi</label>
                        <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label>Sipariş Durumu</label>
                        <select value={reportStatus} onChange={e => setReportStatus(e.target.value)}>
                            <option value="">Tümü</option>
                            <option value="2">Hazırlanıyor</option>
                            <option value="3">Kargoya Verildi</option>
                            <option value="5">İptal / İade</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Kitap / Sipariş No Ara</label>
                        <input type="text" placeholder="Arama..." value={reportSearch} onChange={e => setReportSearch(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="blue-summary-card" style={{ marginBottom: '24px' }}>

                <div className="summary-amount">₺{filteredRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="admin-card">
                <div className="admin-table-wrapper">
                    <table className="admin-modern-table">
                        <thead>
                            <tr>
                                <th>Sipariş No</th>
                                <th>Tarih</th>
                                <th>Tutar</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(o => (
                                <tr key={o.id}>
                                    <td style={{ color: '#4318ff', fontWeight: '700' }}>{o.orderNumber}</td>
                                    <td>{new Date(o.createdAtUtc).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: '700' }}>₺{o.totalPrice.toFixed(2)}</td>
                                    <td>
                                        <button className="admin-secondary-btn" onClick={() => handleViewOrder(o)}>Detay</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default DetailedReport;
