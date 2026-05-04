import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../Login/Login.css'; // Aynı stilleri kullanıyoruz

function Register() {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5229/api/auth/register', formData);
            if (res.data.requireVerification) {
                window.showToast("Doğrulama kodu gönderildi!");
                setStep(2);
            } else {
                window.showToast("Kayıt başarılı! Lütfen giriş yapın.");
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('http://localhost:5229/api/auth/verify-email', {
                email: formData.email,
                code: verificationCode
            });
            window.showToast("Hesabınız doğrulandı! Şimdi giriş yapabilirsiniz.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Doğrulama başarısız.');
        }
    }

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{step === 1 ? "Kayıt Ol" : "E-Posta Doğrulama"}</h2>
                {error && <div className="error-message">{error}</div>}
                
                {step === 1 ? (
                    <form onSubmit={handleRegister}>
                        <input type="text" name="firstName" placeholder="Ad" onChange={handleChange} required />
                        <input type="text" name="lastName" placeholder="Soyad" onChange={handleChange} required />
                        <input type="email" name="email" placeholder="E-posta" onChange={handleChange} required />
                        <input type="password" name="password" placeholder="Şifre" onChange={handleChange} required />
                        <button type="submit" disabled={isLoading}>{isLoading ? "Bekleyiniz..." : "Devam Et"}</button>
                        <p>Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link></p>
                    </form>
                ) : (
                    <form onSubmit={handleVerify}>
                        <p style={{marginBottom: '15px', color: '#666', fontSize: '14px', lineHeight: '1.5'}}>
                            <b>{formData.email}</b> adresine 6 haneli bir doğrulama kodu gönderdik. 
                            Lütfen spam klasörünüzü de kontrol edin.
                        </p>
                        <input 
                            type="text" 
                            placeholder="6 Haneli Kod" 
                            value={verificationCode} 
                            onChange={(e) => setVerificationCode(e.target.value)} 
                            required 
                            maxLength="6"
                            style={{textAlign: 'center', fontSize: '20px', letterSpacing: '5px'}}
                        />
                        <button type="submit">Doğrula ve Kaydı Tamamla</button>
                        <p><a href="#" onClick={(e) => { e.preventDefault(); setStep(1); }} style={{color: '#2563eb'}}>Geri Dön</a></p>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Register;
