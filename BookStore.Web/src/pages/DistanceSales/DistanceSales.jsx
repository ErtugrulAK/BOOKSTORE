import './DistanceSales.css';

function DistanceSales() {
    return (
        <div className="distance-sales-page animate-fade-in">
            <div className="distance-sales-header">
                <h1>Mesafeli Satış Sözleşmesi</h1>
                <p>Dokuz Eylül Üniversitesi Kitap Satış Sistemi mesafeli satış esasları.</p>
            </div>

            <div className="distance-sales-container">
                <div className="distance-sales-card text-left">
                    <div className="contract-meta">
                        <strong>DOKUZ EYLÜL ÜNİVERSİTESİ MÜHENDİSLİK FAKÜLTESİ</strong><br />
                        <strong>MESAFELİ SATIŞ SÖZLEŞMESİ</strong>
                    </div>

                    <div className="contract-body">
                        <section className="contract-section">
                            <h3>MADDE 1 – Sözleşmenin Tarafları</h3>
                            <p>(1) Bu sözleşme; Dokuz Eylül Üniversitesi Mühendislik Fakültesi, Merkez Yerleşkesi, Buca/İzmir adresinde faaliyet gösteren Dokuz Eylül Üniversitesi Mühendislik Fakültesi Kitap Satış Birimi (bundan sonra “Satıcı” olarak anılacaktır.) ile aşağıda iletişim bilgileri yer alan kişi (bundan sonra “Alıcı” olarak anılacaktır.) arasında akdedilmiştir.</p>
                            <p>(2) Satıcı ve Alıcı ayrı ayrı anıldığında “Taraf”; birlikte anıldığında “Taraflar” ibaresi kullanılacaktır.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 2 – Sözleşmenin Konusu</h3>
                            <p>(1) İşbu sözleşmenin konusu; Alıcı'nın, Satıcı'ya ait https://kitapsatis.deu.edu.tr/ internet adresi üzerinden satın aldığı, nitelikleri ve bedeli aşağıda belirtilen kitap/yayın ürününün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri çerçevesinde Taraflar'ın hak ve yükümlülüklerinin belirlenmesidir.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 3 – Satıcıya İlişkin Bilgiler</h3>
                            <p>(1) Satıcı bilgileri aşağıdaki gibidir:</p>
                            <ul>
                                <li><strong>Ünvan:</strong> Dokuz Eylül Üniversitesi Mühendislik Fakültesi</li>
                                <li><strong>Adres:</strong> Merkez Yerleşkesi, Buca/İzmir</li>
                                <li><strong>E-posta:</strong> kitapsatis@deu.edu.tr</li>
                                <li><strong>Web sitesi:</strong> https://kitapsatis.deu.edu.tr/</li>
                            </ul>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 4 – Alıcıya İlişkin Bilgiler</h3>
                            <p>(1) Alıcı'ya ilişkin ad-soyad, teslimat adresi, telefon ve e-posta bilgileri; Alıcı tarafından sipariş aşamasında doldurulan üyelik/sipariş formunda beyan edilen bilgilerdir. Alıcı, söz konusu bilgilerin doğru ve eksiksiz olduğunu kabul ve taahhüt eder; hatalı bilgi nedeniyle doğabilecek her türlü sonuçtan bizzat sorumludur.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 5 – Sözleşme Konusu Ürün</h3>
                            <p>(1) Sözleşme konusu ürünün/ürünlerin adı, ISBN numarası, adedi, birim fiyatı (KDV dahil), toplam tutarı ve kargo bedeline ilişkin bilgiler; Alıcı'nın sipariş tamamlama ekranında onayladığı sipariş özetinde ve sipariş onay e-postasında yer almaktadır. Söz konusu sipariş özeti bu sözleşmenin ayrılmaz bir parçasını oluşturur.</p>
                            <p>(2) KDV oranı, güncel fiyatlandırma ve stok bilgileri Satıcı'nın internet sitesinde ilan edildiği şekilde geçerlidir.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 6 – Ödeme ve Sipariş</h3>
                            <p>(1) Alıcı, sipariş bedelini; kredi/banka kartı ile sanal POS aracılığıyla ödeyebilir.</p>
                            <p>(2) Ön provizyon siparişin verildiği anda alınır; sipariş onayı sonrasında tahsilat gerçekleştirilir.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 7 – Teslimat</h3>
                            <p>(1) Teslimat, Alıcı'nın sipariş sırasında bildirdiği adrese anlaşmalı kargo firması aracılığıyla yapılır. Satıcı, ödemenin kendisine ulaşmasından itibaren en fazla 30 (otuz) gün içinde teslimatı gerçekleştirmekle yükümlüdür.</p>
                            <p>(2) Yurt içi teslimatlar kargoya teslim edildiği günden itibaren genellikle 2–5 iş günü içinde tamamlanır; bu süre kargo firmasının hizmet koşullarına göre değişebilir.</p>
                            <p>(3) Alıcı, teslimat adresine ilişkin bilgilerin eksiksiz ve doğru olduğunu taahhüt eder. Hatalı adres bilgisi nedeniyle doğan ek kargo masrafları Alıcı'ya aittir.</p>
                            <p>(4) Kargo firmasından kaynaklanan gecikmeler Satıcı'nın sorumluluğunda değildir; Satıcı bu durumlarda Alıcı'yı derhal bilgilendirmekle yükümlüdür.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 8 – Cayma Hakkı</h3>
                            <p>(1) Alıcı, sözleşmenin kurulduğu tarihten itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkını kullanabilir.</p>
                            <p>(2) Cayma hakkının kullanılabilmesi için ürünün aynı durum ve koşullarda (ambalajı açılmamış, kullanılmamış, deforme edilmemiş biçimde) iade edilmesi şarttır.</p>
                            <p>(3) Aşağıdaki durumlarda cayma hakkı kullanılamaz:</p>
                            <ul>
                                <li>a) Alıcı tarafından ambalajı açılan, okunmaya başlanan veya üzerinde işaretleme/notlama yapılan kitap ve yayınlar.</li>
                                <li>b) Sipariş üzerine özel baskı/cilt yaptırılan veya kişiye özel hazırlanan yayınlar.</li>
                                <li>c) Dijital içerik ve e-kitap ürünler (indirme/aktivasyon işlemi gerçekleştirilmişse).</li>
                            </ul>
                            <p>(4) Cayma hakkını kullanmak isteyen Alıcı, Satıcı'ya e-posta veya yazılı bildirimde bulunur. Bildirim tarihinden itibaren 10 (on) gün içinde ürünü, kargo masrafları kendisine ait olmak üzere Satıcı'ya iade eder. Satıcı, iade edilen ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde ödemeyi Alıcı'ya iade eder.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 9 – Hasarlı, Eksik veya Yanlış Ürün</h3>
                            <p>(1) Teslimat sırasında hasarlı ya da eksik ürün alınması halinde Alıcı, durumu teslim tarihinden itibaren 3 (üç) iş günü içinde fotoğraf ile belgeleyerek Satıcı'ya e-posta yoluyla bildirmelidir. Satıcı, inceleme sonucuna göre ürünü değiştirir veya bedelini iade eder.</p>
                            <p>(2) Yanlış ürün gönderilmesi durumunda iade kargo masrafları Satıcı tarafından karşılanır.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 10 – Genel Hükümler</h3>
                            <p>(1) Alıcı, sipariş aşamasında ürüne ait temel nitelikler, fiyat ve teslimat koşullarına ilişkin ön bilgileri okuduğunu ve onayladığını kabul, beyan ve taahhüt eder.</p>
                            <p>(2) Satıcı, stok tükenmesi veya temin edilemeyen ürün söz konusu olduğunda Alıcı'yı derhal bilgilendirerek tahsil edilen bedeli en geç 14 (on dört) gün içinde iade eder.</p>
                            <p>(3) Alıcı, işbu sözleşmeden doğan haklarını ve yükümlülüklerini Satıcı'nın yazılı onayı olmaksızın üçüncü kişilere devredemez ve temlik edemez.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 11 – Gizlilik ve Kişisel Veriler</h3>
                            <p>(1) Tarafların her biri, diğer taraftan edindiği kişisel ve ticari bilgileri yalnızca bu sözleşmenin amacı doğrultusunda kullanacak; üçüncü kişilere açıklamayacak ve gizli tutacaktır. Bu yükümlülük sözleşmenin sona ermesinden sonra da geçerliliğini korur.</p>
                            <p>(2) Alıcı'nın kişisel verileri, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında işlenmekte olup Satıcı'nın KVKK Aydınlatma Metni internet sitesinde kamuoyuyla paylaşılmıştır.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 12 – Mücbir Sebepler</h3>
                            <p>(1) Doğal afet, savaş, terör, salgın hastalık, hükümet kısıtlamaları, yangın, sel veya benzeri tarafların kontrolü dışındaki olaylar nedeniyle yükümlülüklerin yerine getirilememesi halinde taraflar birbirine karşı sorumlu tutulamaz. Mücbir sebebin ortaya çıkması halinde etkilenen taraf, diğer tarafı 3 (üç) gün içinde yazılı olarak bilgilendirir.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 13 – Feragat ve Kısmi Geçersizlik</h3>
                            <p>(1) Herhangi bir tarafın sözleşme hükümlerinden birini uygulamaması, söz konusu haktan feragat olarak yorumlanamaz.</p>
                            <p>(2) Bu sözleşmenin herhangi bir hükmünün geçersiz ya da uygulanamaz olması, diğer hükümlerin geçerliliğini etkilemez.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 14 – Yetkili Yargı Yeri</h3>
                            <p>(1) Taraflar arasında işbu sözleşmeden doğabilecek ihtilafların çözümünde İzmir Mahkemeleri, İcra Daireleri ve Tüketici Hakem Heyetleri yetkilidir.</p>
                        </section>

                        <section className="contract-section">
                            <h3>MADDE 15 – Sözleşmenin Yürürlüğü</h3>
                            <p>(1) İşbu sözleşme 15 (on beş) madde ve gerekli eklerinden ibaret olup Alıcı'nın internet sitesi üzerinden siparişini onaylamasından itibaren yürürlüğe girer ve taraflar için bağlayıcı hale gelir.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DistanceSales;
