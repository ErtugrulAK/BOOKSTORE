import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../Login/Login.css'; // Aynı stilleri kullanıyoruz

function Register() {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5229/api/auth/register', formData);
            window.showToast("Kayıt başarılı! Lütfen giriş yapın.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.');
        }
    };

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Kayıt Ol</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleRegister}>
                    <input type="text" name="firstName" placeholder="Ad" onChange={handleChange} required />
                    <input type="text" name="lastName" placeholder="Soyad" onChange={handleChange} required />
                    <input type="email" name="email" placeholder="E-posta" onChange={handleChange} required />
                    <input type="password" name="password" placeholder="Şifre" onChange={handleChange} required />
                    <button type="submit">Kayıt Ol</button>
                </form>
                <p>Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link></p>
            </div>
        </div>
    );
}

export default Register;
