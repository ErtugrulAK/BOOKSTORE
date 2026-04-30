import { Link } from 'react-router-dom'; // Link komponentini çağırıyoruz
import './BookCard.css';

// Dışarıdan 'book' adında bir değişken (prop) alır
function BookCard({ book, onAddToCart }) {
  return (
    <div className="book-card relative-container">
      {book.isFeatured && <div className="featured-badge">⭐ Öne Çıkan</div>}
      
      <Link to={`/kitap/${book.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

        {/* Kitap Bilgileri */}
        <div className="book-category">{book.kategori}</div>
        <h2 className="book-title">{book.isim}</h2>
      </Link>

      <div className="book-price">{book.fiyat} ₺</div>

      {/* Sepete Ekle Butonu */}
      <button className="add-to-cart-btn" style={{ width: '100%', marginTop: 'auto' }} onClick={() => onAddToCart(book)}>
        Sepete Ekle
      </button>
    </div>
  );
}

export default BookCard;
