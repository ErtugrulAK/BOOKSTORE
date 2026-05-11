import React from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const totalOrdersCount = filteredOrders.length;
    let totalBooksSold = 0;
    const categoryStats = {};

    filteredOrders.forEach(o => {
        o.orderItems?.forEach(item => {
            totalBooksSold += item.quantity;
            const cat = item.book?.category || 'Bilinmeyen Kategori';
            categoryStats[cat] = (categoryStats[cat] || 0) + item.quantity;
        });
    });

    const categoryStatsArray = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);

    const exportToExcel = () => {
        const dataToExport = filteredOrders.map(o => {
            const bookNames = o.orderItems?.map(i => `${i.quantity}x ${i.book?.name}`).join(', ') || '-';
            const customerName = o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Bilinmeyen Müşteri';
            const customerEmail = o.user ? o.user.email : '-';

            return {
                'Sipariş No': o.orderNumber,
                'Tarih': new Date(o.createdAtUtc).toLocaleString('tr-TR'),
                'Müşteri Adı': customerName,
                'E-Posta': customerEmail,
                'Sipariş İçeriği': bookNames,
                'Toplam Ürün': o.orderItems?.reduce((sum, i) => sum + i.quantity, 0) || 0,
                'Tutar (TL)': o.totalPrice,
                'Durum': o.status === 1 ? 'Beklemede' : o.status === 2 ? 'Hazırlanıyor' : o.status === 3 ? 'Kargoya Verildi' : o.status === 4 ? 'Teslim Edildi' : 'İptal / İade'
            };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        
        // Kategori istatistikleri için ayrı bir sayfa oluştur
        const statsToExport = categoryStatsArray.map(([cat, count]) => ({
            'Bölüm / Kategori': cat,
            'Satılan Kitap Adedi': count
        }));
        // Özet satırı ekle
        statsToExport.push({ 'Bölüm / Kategori': 'TOPLAM', 'Satılan Kitap Adedi': totalBooksSold });

        const statsWorksheet = XLSX.utils.json_to_sheet(statsToExport);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Siparis Raporu");
        XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Kategori Istatistikleri");
        XLSX.writeFile(workbook, "Siparis_Raporu.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape'); // Daha fazla sütun sığması için yatay
        
        // Türkçe karakter sorununu en aza indirmek için
        doc.text("Detayli Siparis Raporu", 14, 15);
        
        const tableColumn = ["Siparis No", "Tarih", "Musteri", "Icerik (Kitaplar)", "Tutar", "Durum"];
        const tableRows = [];

        filteredOrders.forEach(o => {
            const status = o.status === 1 ? 'Beklemede' : o.status === 2 ? 'Hazirlaniyor' : o.status === 3 ? 'Kargoya Verildi' : o.status === 4 ? 'Teslim Edildi' : 'Iptal / Iade';
            const bookNames = o.orderItems?.map(i => `${i.quantity}x ${i.book?.name}`).join(', ') || '-';
            const customerName = o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Bilinmiyor';

            tableRows.push([
                o.orderNumber,
                new Date(o.createdAtUtc).toLocaleDateString(),
                customerName,
                bookNames.length > 80 ? bookNames.substring(0, 77) + '...' : bookNames,
                `${o.totalPrice.toFixed(2)} TL`,
                status
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 8 },
            columnStyles: { 3: { cellWidth: 100 } } // İçerik sütunu geniş olsun
        });

        // Kategori tablosu ekle
        if (categoryStatsArray.length > 0) {
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 50;
            doc.text("Bolum / Kategori Satis Istatistikleri", 14, finalY + 15);
            
            autoTable(doc, {
                head: [["Bolum / Kategori", "Kitap Adedi"]],
                body: categoryStatsArray,
                startY: finalY + 20,
            });
        }

        doc.save("Siparis_Raporu.pdf");
    };

    return (
        <>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Detaylı Raporlama</h2>
                    <p className="admin-page-subtitle">Kapsamlı analiz raporu ve dışa aktarma araçları.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="admin-primary-btn" onClick={exportToExcel} style={{ background: '#10b981', borderColor: '#10b981' }}>📊 Excel İndir</button>
                    <button className="admin-primary-btn" onClick={exportToPDF} style={{ background: '#ef4444', borderColor: '#ef4444' }}>📄 PDF İndir</button>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="admin-card" style={{ background: 'linear-gradient(135deg, #4318ff, #3311db)', color: 'white', border: 'none' }}>
                    <div style={{ fontSize: '14px', opacity: '0.8', marginBottom: '8px' }}>Toplam Tutar</div>
                    <div style={{ fontSize: '28px', fontWeight: '800' }}>₺{filteredRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="admin-card" style={{ background: '#10b981', color: 'white', border: 'none' }}>
                    <div style={{ fontSize: '14px', opacity: '0.8', marginBottom: '8px' }}>Sipariş Sayısı</div>
                    <div style={{ fontSize: '28px', fontWeight: '800' }}>{totalOrdersCount}</div>
                </div>
                <div className="admin-card" style={{ background: '#f59e0b', color: 'white', border: 'none' }}>
                    <div style={{ fontSize: '14px', opacity: '0.8', marginBottom: '8px' }}>Satılan Kitap Adedi</div>
                    <div style={{ fontSize: '28px', fontWeight: '800' }}>{totalBooksSold}</div>
                </div>
            </div>

            {categoryStatsArray.length > 0 && (
                <div className="admin-card" style={{ marginBottom: '24px' }}>
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">📚 Bölüm / Kategori Bazlı Satışlar</h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                        {categoryStatsArray.map(([cat, count]) => (
                            <div key={cat} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', flex: '1 1 min-content', minWidth: '180px' }}>
                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>{cat}</div>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{count} <span style={{fontSize:'14px', color:'#94a3b8', fontWeight:'500'}}>Adet</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
