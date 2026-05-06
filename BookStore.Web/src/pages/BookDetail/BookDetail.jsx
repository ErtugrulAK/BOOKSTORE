import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BookDetail.css';

import BookCard from '../../components/BookCard/BookCard';

const BookDetail = ({ handleAddToCart }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [similarBooks, setSimilarBooks] = useState([]);

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await axios.get(`http://localhost:5229/api/Books/${id}`);
                setBook(response.data);
                
                // Fetch similar books
                if (response.data.category) {
                    const similarRes = await axios.get(`http://localhost:5229/api/Books?category=${response.data.category}&pageSize=999`);
                    const booksList = similarRes.data.items || [];
                    const filtered = booksList.filter(b => b.id !== response.data.id).slice(0, 5);
                    setSimilarBooks(filtered);
                }
                
                setLoading(false);
            } catch (error) {
                console.error("Kitap yüklenemedi:", error);
                setLoading(false);
            }
        };
        fetchBook();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div className="book-detail-container" style={{ textAlign: 'center', padding: '100px' }}>
                <div className="loader"></div>
                <h2 style={{ color: '#2b3674', marginTop: '20px' }}>Yükleniyor...</h2>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="book-detail-container" style={{ textAlign: 'center', padding: '100px' }}>
                <h2 style={{ color: '#2b3674' }}>Kitap bulunamadı.</h2>
                <button className="admin-primary-btn" onClick={() => navigate('/')}>Ana Sayfaya Dön</button>
            </div>
        );
    }

    const handleQtyChange = (val) => {
        if (val < 1) return;
        if (val > (book.stockQuantity || 1)) return;
        setQuantity(val);
    };

    return (
        <div className="book-detail-container animate-fade-in">
            <div className="detail-top-nav">
                <button className="back-link" onClick={() => navigate(-1)}>
                    ← Geri Dön
                </button>
            </div>

            <div className="book-detail-card">
                <div className="book-detail-image-side">
                    <div className="main-image-wrapper">
                        {book.imageUrl ? (
                            <img 
                                src={book.imageUrl} 
                                alt={book.name} 
                                className="detail-main-image"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/400x600?text=Kitap+Resmi+Yok";
                                }}
                            />
                        ) : (
                            <span style={{ fontSize: '100px' }}>📘</span>
                        )}
                    </div>
                </div>

                <div className="book-detail-info-side">
                    <div className="detail-category-badge">{book.category || "Genel"}</div>
                    <h1 className="detail-title">{book.name}</h1>
                    <p className="detail-author">
                        Yazar: 
                        <span style={{ display: 'block', marginTop: '4px' }}>
                            {book.author?.split(',').map((a, i) => (
                                <div key={i}>{a.trim()}</div>
                            )).filter(a => a) || "Belirtilmemiş"}
                        </span>
                    </p>
                    
                    {book.description && (
                        <div className="book-description-short">
                            {book.description}
                        </div>
                    )}

                    <div className="price-action-card">
                        <div className="detail-price">₺{book.price?.toFixed(2)}</div>
                        <div className={`stock-status ${book.stockQuantity <= 0 ? 'out' : ''}`}>
                            {book.stockQuantity > 0 ? (
                                <><span>●</span> Stokta Var ({book.stockQuantity} Adet)</>
                            ) : (
                                <><span>●</span> Stokta Yok</>
                            )}
                        </div>

                        <div className="action-row">
                            <div className="quantity-picker">
                                <button className="quantity-btn" onClick={() => handleQtyChange(quantity - 1)}>-</button>
                                <input type="text" className="quantity-input" value={quantity} readOnly />
                                <button className="quantity-btn" onClick={() => handleQtyChange(quantity + 1)}>+</button>
                            </div>
                            <button 
                                className="detail-add-btn" 
                                disabled={book.stockQuantity <= 0}
                                onClick={() => {
                                    for(let i=0; i<quantity; i++) handleAddToCart(book);
                                }}
                            >
                                🛒 Sepete Ekle
                            </button>
                        </div>
                    </div>

                    <div className="payment-info-banner">
                        <div className="payment-info-icon">ℹ️</div>
                        <div className="payment-info-content">
                            <h4>Ödeme ve Teslimat Bilgisi</h4>
                            <p>Fiyatlara KDV dahildir. Kargo ücreti alıcıya aittir. Dilerseniz siparişinizi Dekanlık birimimizden şahsen teslim alabilirsiniz.</p>
                        </div>
                    </div>


                    <div className="specs-container">
                        <div className="spec-item">
                            <span className="spec-label">YAYINEVİ</span>
                            <span className="spec-value">{book.publisher || "-"}</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">BASKI SAYISI</span>
                            <span className="spec-value">{book.edition || "-"}</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">BASIM YILI</span>
                            <span className="spec-value">{book.publicationYear || "-"}</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">ISBN</span>
                            <span className="spec-value">{book.isbn || "-"}</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">SAYFA SAYISI</span>
                            <span className="spec-value">{book.pageCount || "0"}</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">DİL</span>
                            <span className="spec-value">{book.language || "Türkçe"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {similarBooks.length > 0 && (
                <div className="similar-books-section">
                    <h2 className="similar-title">Benzer Kitaplar</h2>
                    <div className="similar-grid">
                        {similarBooks.map(b => (
                            <BookCard 
                                key={b.id} 
                                book={{
                                    id: b.id,
                                    isim: b.name,
                                    kategori: b.category,
                                    fiyat: b.price,
                                    isFeatured: b.isFeatured,
                                    imageUrl: b.imageUrl,
                                }}
                                onAddToCart={handleAddToCart}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookDetail;
