import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login({ setToken, setUser, localCart, setLocalCart }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5229/api/auth/login', {
                Username: email,
                Password: password
            });
            const { token, user } = res.data;
            
            // Eğer ziyaretçi sepetinde ürün varsa, giriş yaparken veritabanına aktarıyoruz (Senkronizasyon)
            if (localCart && localCart.length > 0) {
                for (let item of localCart) {
                    try {
                        await axios.post('http://localhost:5229/api/Cart/items', 
                            { BookId: item.book.id, Quantity: item.quantity },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                    } catch (syncErr) {
                        console.error("Sepet senkronizasyon hatası:", syncErr);
                    }
                }
                localStorage.removeItem('guest_cart'); // Aktarıldığı için yerel sepeti temizle
                setLocalCart([]); // Hafızadan (state) de temizle ki çıkış yapınca tekrar yazılmasın
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setToken(token);
            setUser(user);
            
            navigate('/'); // Giriş yaptıktan sonra ana sayfaya yönlendir
        } catch (err) {
            setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Giriş Yap</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder="E-posta veya Kullanıcı Adı" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="submit">Giriş Yap</button>
                </form>
                <p>Hesabın yok mu? <Link to="/register">Kayıt Ol</Link></p>
            </div>
        </div>
    );
}

export default Login;
