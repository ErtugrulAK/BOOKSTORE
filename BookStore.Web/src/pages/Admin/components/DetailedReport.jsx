import React from 'react';
import XLSX from 'xlsx-js-style';
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

    // Gelir ve Satılan Kitap Adedi için yalnızca tamamlanmış (Kargoya Verildi - 3 veya Elden Teslim Edildi - 6) siparişleri baz alıyoruz
    const completedOrders = filteredOrders.filter(o => o.status === 3 || o.status === 6);
    const filteredRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

    const totalOrdersCount = filteredOrders.length;
    let totalBooksSold = 0;
    const categoryStats = {};

    completedOrders.forEach(o => {
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
                'Durum': o.status === 1 ? 'Beklemede' : o.status === 2 ? 'Hazırlanıyor' : o.status === 3 ? 'Kargoya Verildi' : o.status === 6 ? (o.paymentMethod === 'Nakit' ? 'Nakit' : 'Elden Teslim Edildi') : o.status === 7 ? 'İade Edildi' : 'İptal Edildi'
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

        const applyExcelStyles = (ws, colWidths, bodyHeight = 25) => {
            if (!ws['!ref']) return;
            ws['!cols'] = colWidths.map(w => ({ wpx: w }));
            
            const range = XLSX.utils.decode_range(ws['!ref']);
            ws['!rows'] = [{ hpx: 35 }]; // Header row height

            for (let R = range.s.r; R <= range.e.r; ++R) {
                if (R > 0) {
                    ws['!rows'].push({ hpx: bodyHeight }); // Body row height
                }
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cell_ref]) continue;

                    if (R === 0) {
                        ws[cell_ref].s = {
                            fill: {
                                patternType: "solid",
                                fgColor: { rgb: "FFFF00" } // Yellow
                            },
                            font: {
                                name: "Calibri",
                                sz: 16,
                                bold: true,
                                color: { rgb: "000000" }
                            },
                            alignment: {
                                horizontal: "center",
                                vertical: "center",
                                wrapText: true
                            },
                            border: {
                                top: { style: "thin", color: { rgb: "000000" } },
                                bottom: { style: "medium", color: { rgb: "000000" } },
                                left: { style: "thin", color: { rgb: "000000" } },
                                right: { style: "thin", color: { rgb: "000000" } }
                            }
                        };
                    } else {
                        ws[cell_ref].s = {
                            font: {
                                name: "Calibri",
                                sz: 11,
                                color: { rgb: "000000" }
                            },
                            alignment: {
                                horizontal: "center",
                                vertical: "center",
                                wrapText: true
                            },
                            border: {
                                top: { style: "thin", color: { rgb: "D3D3D3" } },
                                bottom: { style: "thin", color: { rgb: "D3D3D3" } },
                                left: { style: "thin", color: { rgb: "D3D3D3" } },
                                right: { style: "thin", color: { rgb: "D3D3D3" } }
                            }
                        };

                        // main sheet price format (Tutar (TL))
                        if (colWidths.length === 8 && C === 6) {
                            ws[cell_ref].z = '"₺"#,##0.00';
                        }
                    }
                }
            }
        };

        // Sipariş raporu genişlikleri ve 100px satır yüksekliği
        applyExcelStyles(worksheet, [220, 220, 220, 300, 500, 150, 150, 150], 100);

        // Kategori istatistikleri genişlikleri
        applyExcelStyles(statsWorksheet, [300, 200]);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Siparis Raporu");
        XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Kategori Istatistikleri");
        XLSX.writeFile(workbook, "Siparis_Raporu.xlsx");
    };

    const exportToPDF = () => {
        // Turkish character normalization helper for standard PDF fonts
        const clearTurkishChars = (str) => {
            if (!str) return '';
            return str
                .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
                .replace(/Ü/g, 'U').replace(/ü/g, 'u')
                .replace(/Ş/g, 'S').replace(/ş/g, 's')
                .replace(/İ/g, 'I').replace(/ı/g, 'i')
                .replace(/Ö/g, 'O').replace(/ö/g, 'o')
                .replace(/Ç/g, 'C').replace(/ç/g, 'c');
        };

        const doc = new jsPDF('landscape', 'mm', 'a4'); // Landscape A4
        
        // Add a premium brand-colored top header banner
        doc.setFillColor(67, 24, 255); // #4318ff (DEÜ Kitap Satış brand color)
        doc.rect(0, 0, 297, 24, 'F');
        
        // Title text in the header banner
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text(clearTurkishChars("DEU Kitap Satis - Detayli Siparis Raporu"), 15, 16);
        
        // Report Date and Metadata
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(240, 240, 255);
        const reportDate = new Date().toLocaleString('tr-TR');
        doc.text(clearTurkishChars(`Rapor Tarihi: ${reportDate}`), 220, 16);
        
        const tableColumn = ["Siparis No", "Tarih", "Musteri Adi", "E-Posta", "Siparis Icerigi", "Toplam Urun", "Tutar", "Durum"];
        const tableRows = [];

        filteredOrders.forEach(o => {
            const status = o.status === 1 ? 'Beklemede' : o.status === 2 ? 'Hazirlaniyor' : o.status === 3 ? 'Kargoya Verildi' : o.status === 6 ? (o.paymentMethod === 'Nakit' ? 'Nakit' : 'Elden Teslim Edildi') : o.status === 7 ? 'Iade Edildi' : 'Iptal Edildi';
            const bookNames = o.orderItems?.map(i => `${i.quantity}x ${i.book?.name}`).join(', ') || '-';
            const customerName = o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Bilinmeyen Musteri';
            const customerEmail = o.user ? o.user.email : '-';
            const totalQty = o.orderItems?.reduce((sum, i) => sum + i.quantity, 0) || 0;

            tableRows.push([
                clearTurkishChars(o.orderNumber),
                clearTurkishChars(new Date(o.createdAtUtc).toLocaleString('tr-TR')),
                clearTurkishChars(customerName),
                clearTurkishChars(customerEmail),
                clearTurkishChars(bookNames),
                clearTurkishChars(totalQty.toString()),
                clearTurkishChars(`${o.totalPrice.toFixed(2)} TL`),
                clearTurkishChars(status)
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'striped',
            headStyles: {
                fillColor: [30, 41, 59], // #1e293b dark slate gray
                textColor: [255, 255, 255],
                font: 'helvetica',
                fontStyle: 'bold',
                fontSize: 9,
                halign: 'center',
                valign: 'middle'
            },
            bodyStyles: {
                font: 'helvetica',
                fontSize: 8.5,
                textColor: [51, 65, 85], // #334155
                valign: 'middle',
                minCellHeight: 18 // Spacious, elegant row height
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 25 }, // Siparis No
                1: { halign: 'center', cellWidth: 35 }, // Tarih
                2: { halign: 'left', cellWidth: 35 },   // Musteri Adi
                3: { halign: 'left', cellWidth: 45 },   // E-posta
                4: { halign: 'left', cellWidth: 70 },   // Siparis Icerigi
                5: { halign: 'center', cellWidth: 20 }, // Toplam Urun
                6: { halign: 'right', cellWidth: 22 },  // Tutar
                7: { halign: 'center', cellWidth: 25 }  // Durum
            },
            styles: {
                overflow: 'linebreak',
                cellPadding: 4,
                lineColor: [226, 232, 240], // #e2e8f0
                lineWidth: 0.1
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // #f8fafc slate row background
            }
        });


        // Add footer page numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // #94a3b8
            doc.text(`Sayfa ${i} / ${pageCount}`, 265, 200);
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
                            <option value="6">Elden Teslim / Nakit</option>
                            <option value="5">İptal Edildi</option>
                            <option value="7">İade Edildi</option>
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
