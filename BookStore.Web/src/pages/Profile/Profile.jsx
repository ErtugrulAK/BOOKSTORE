import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

// Sub-components
import PersonalInfo from './components/PersonalInfo';
import Addresses from './components/Addresses';
import OrderHistory from './components/OrderHistory';

function Profile({ user, setUser, token }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'personal');
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchUserOrders();
    }, [user]);

    const fetchUserOrders = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get('http://localhost:5229/api/Orders/mine', config);
            setOrders(response.data || []);
        } catch (error) {
            console.error("Siparişler getirilemedi:", error);
        }
    };

    if (!user) return null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <div className="user-layout">
            <aside className="user-sidebar">
                <div className="user-sidebar-header" onClick={() => navigate('/')}>
                    <span style={{ fontSize: '24px', color: '#4318ff', marginRight: '6px' }}>📚</span>
                    <span className="sidebar-title">DEÜ Kitap Satış</span>
                </div>

                <div className="user-sidebar-menu">
                    <button 
                        className={`user-menu-item ${activeTab === 'personal' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('personal')}
                    >
                        <i>👤</i> Kişisel Bilgiler
                    </button>
                    <button 
                        className={`user-menu-item ${activeTab === 'addresses' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('addresses')}
                    >
                        <i>📍</i> Adreslerim
                    </button>
                    <button 
                        className={`user-menu-item ${activeTab === 'orders' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('orders')}
                    >
                        <i>⏳</i> Sipariş Geçmişi
                    </button>
                </div>
            </aside>

            <main className="user-main">
                <header className="user-topbar">
                    <div className="user-topbar-right">
                        <div className="user-topbar-profile">
                            <div className="user-avatar">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div className="user-profile-info">
                                <span className="user-profile-name">{user.firstName} {user.lastName}</span>
                                <span className="user-profile-role">Kullanıcı Hesabı</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="user-content-scroll">
                    <div className="user-page-container">
                        {activeTab === 'personal' && <PersonalInfo user={user} token={token} setUser={setUser} />}
                        {activeTab === 'addresses' && <Addresses token={token} />}
                        {activeTab === 'orders' && <OrderHistory orders={orders} token={token} onRefresh={fetchUserOrders} />}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Profile;
