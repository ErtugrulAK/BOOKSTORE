import './DistanceSales.css';

function DistanceSales() {
    return (
        <div className="distance-sales-page animate-fade-in">
            <div className="distance-sales-header">
                <h1>Mesafeli Satış Sözleşmesi</h1>
                <p>Dokuz Eylül Üniversitesi Kitap Satış Sistemi mesafeli satış esasları.</p>
            </div>

            <div className="distance-sales-container">
                <div className="distance-sales-card">
                    <div className="distance-sales-icon">📄</div>
                    <h2>Sözleşme Metni Güncelleniyor</h2>
                    <p className="distance-sales-placeholder-text">
                        Mesafeli Satış Sözleşmesi metni güncellenmektedir. En kısa sürede burada yayınlanacaktır.
                    </p>
                    <div className="distance-sales-notice">
                        Dokuz Eylül Üniversitesi Rektörlüğü tarafından resmi satış sözleşmesi metni sağlandığında bu sayfa otomatik olarak güncellenecektir. Alışveriş yapmaya devam etmek için ana sayfaya dönebilirsiniz.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DistanceSales;
