import { useState, useEffect } from 'react';
import axios from 'axios'; // API'ye gitmek için ekledik
import './Sidebar.css';

// App.jsx'ten gelen category (Seçili Kategori) ve setCategory (Seçimi Değiştirme) fonksiyonlarını buraya aldık
function Sidebar({ setMinPrice, setMaxPrice, category, setCategory }) {
  const [localMin, setLocalMin] = useState("");
  const [localMax, setLocalMax] = useState("");

  const kategoriler = [
    { name: "Çevre Mühendisliği", icon: "🌱" },
    { name: "Elektrik Elektronik Mühendisliği", icon: "⚡" },
    { name: "Endüstri Mühendisliği", icon: "⚙️" },
    { name: "İnşaat Mühendisliği", icon: "🏗️" },
    { name: "Jeofizik Mühendisliği", icon: "🌍" },
    { name: "Jeoloji Mühendisliği", icon: "💎" },
    { name: "Maden Mühendisliği", icon: "⛏️" },
    { name: "Makina Mühendisliği", icon: "🔧" },
    { name: "Tekstil Mühendisliği", icon: "🧵" },
    { name: "Temel Bilimler", icon: "🧪" },
    { name: "Dış Yayınlar", icon: "🌐" }
  ];

  const fiyatlariUygula = () => {
    let minVal = localMin !== "" ? parseFloat(localMin) : null;
    let maxVal = localMax !== "" ? parseFloat(localMax) : null;

    if (minVal !== null && minVal < 0) { minVal = 0; setLocalMin("0"); }
    if (maxVal !== null && maxVal < 0) { maxVal = 0; setLocalMax("0"); }

    if (minVal !== null && maxVal !== null && minVal > maxVal) {
      window.showToast("Minimum fiyat, maksimum fiyattan büyük olamaz!", true);
      return;
    }

    setMinPrice(minVal !== null ? minVal.toString() : "");
    setMaxPrice(maxVal !== null ? maxVal.toString() : "");
  };

  return (
    <aside className="sidebar-container">

      {/* Kategoriler Bölümü */}
      <div className="filter-section">
        <h3 className="section-title">BÖLÜMLER</h3>
        <ul className="category-list">
          
          <li 
            className={`category-item ${category === null ? "active" : ""}`} 
            onClick={() => setCategory(null)}
          >
            <span className="cat-icon">📚</span>
            <span className="cat-name">Tüm Kitaplar</span>
          </li>
          
          {kategoriler.map((cat) => {
            return (
              <li
                key={cat.name}
                className={`category-item ${category === cat.name ? "active" : ""}`}
                onClick={() => setCategory(cat.name)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </li>
            );
          })}
          
        </ul>
      </div>

      {/* Fiyat Aralığı Bölümü */}
      <div className="filter-section">
        <h3 className="section-title">FİYAT ARALIĞI</h3>
        <div className="price-range-container">
            <div className="price-inputs">
                <div className="input-with-label">
                    <span>₺</span>
                    <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        className="price-input"
                        value={localMin}
                        onChange={(e) => setLocalMin(e.target.value)}
                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                    />
                </div>
                <div className="price-divider"></div>
                <div className="input-with-label">
                    <span>₺</span>
                    <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        className="price-input"
                        value={localMax}
                        onChange={(e) => setLocalMax(e.target.value)}
                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                    />
                </div>
            </div>

            <button className="apply-btn" onClick={fiyatlariUygula}>
              Uygula
            </button>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;
