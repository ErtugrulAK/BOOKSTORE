import { Link } from 'react-router-dom'; // Link komponentini çağırıyoruz
import BookCover from './BookCover';
import './BookCard.css';

// Dışarıdan 'book' adında bir değişken (prop) alır
function BookCard({ book, onAddToCart }) {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="book-card relative-container">
      {book.isFeatured && <div className="featured-badge">⭐ Öne Çıkan</div>}
      
      <Link to={`/kitap/${book.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

        <div className="book-image-container">
          <BookCover 
            imageUrl={book.imageUrl} 
            title={book.isim} 
            author={book.yazar} 
            className="book-image"
            size="medium"
          />
        </div>

        {/* Kitap Bilgileri */}
        <div className="book-category">{book.kategori}</div>
        <h2 className="book-title">{book.isim}</h2>
      </Link>

      <div className="book-price">{book.fiyat} ₺</div>

      {/* Sepete Ekle Butonu */}
      <button 
        className="add-to-cart-btn" 
        style={{ 
          width: '100%', 
          marginTop: 'auto'
        }} 
        onClick={() => onAddToCart(book)}
      >
        {isAdmin ? 'Elden Satışa Ekle' : 'Sepete Ekle'}
      </button>
    </div>
  );
}

export default BookCard;
