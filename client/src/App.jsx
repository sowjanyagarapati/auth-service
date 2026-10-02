import React, { useState, useEffect } from "react";
import axios from "axios";
import './App.css';

function App() {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [wikiSummary, setIsWikiSummary] = useState('');
    
    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    
    // Server feedback message
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault(); 
        try {
            const response = await axios.post('http://localhost:5000/login', {
                email: email,
                password: password
            }, { withCredentials: true });
            
            localStorage.setItem('token', response.data.access_token);
            setIsLoggedIn(true);
            setMessage(response.data.message);
        } catch (error) {
            setMessage(error.response?.data?.detail || "Invalid credentials or server error.");
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/users/create', {
                name: name,
                email: email,
                password: password
            });
            setMessage(response.data.message);
            setIsLogin(true);
        } catch (error) {
            setMessage(error.response?.data?.detail || "An error occurred creating your account.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setIsWikiSummary('');
        setMessage('Signed out successfully.');
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
    
        if (tokenFromUrl) {
            localStorage.setItem('token', tokenFromUrl);
            setIsLoggedIn(true);
            window.history.replaceState({}, document.title, "/");
        }
        
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);
    
    useEffect(() => {
        if (isLoggedIn) {
            const fetchWiki = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`http://localhost:5000/random`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setIsWikiSummary(response.data.summary);
                } catch (error) {
                    if (error.response?.status === 401) {
                        try {
                            const refreshRes = await axios.post('http://localhost:5000/refresh', {}, {
                                withCredentials: true 
                            });
                            
                            const newToken = refreshRes.data.access_token;
                            localStorage.setItem('token', newToken);
                            
                            const retryRes = await axios.get('http://localhost:5000/random', {
                                headers: { Authorization: `Bearer ${newToken}` }
                            });
                            setIsWikiSummary(retryRes.data.summary);
                            return;
                        } catch (refreshError) {
                            localStorage.removeItem('token');
                            setIsLoggedIn(false);
                        }
                    } else {
                        console.error("Failed to fetch data", error);
                    }
                }
            };
            fetchWiki();
        }
    }, [isLoggedIn, name]);

    return (
        <div className="auth-viewport">
            
            {/* Main Auth / Dashboard View */}
            {isLoggedIn ? (
                <div className="dashboard-card">
                    <div className="dashboard-avatar">
                        <i className="fas fa-user-check"></i>
                    </div>
                    <h2>Welcome Back</h2>
                    <p className="subtitle">Secure session active</p>

                    <div className="summary-pill">
                        <i className="fas fa-bolt"></i>
                        <span>{wikiSummary ? wikiSummary : "Loading live session telemetry..."}</span>
                    </div>

                    <button className="btn-signout" onClick={handleLogout}>
                        <i className="fas fa-arrow-right-from-bracket"></i>
                        <span>Sign Out</span>
                    </button>
                </div>
            ) : (
                <div className="auth-container">
                    <div className="auth-card">
                        
                        {/* Header */}
                        <div className="auth-card-header">
                            <div className="brand-icon">
                                <i className="fas fa-shield-halved"></i>
                            </div>
                            <h2>{isLogin ? "Welcome back" : "Create account"}</h2>
                            <p>{isLogin ? "Enter your details to sign in" : "Get started with your free account"}</p>
                        </div>

                        {/* Segmented Switcher */}
                        <div className="auth-tabs">
                            <button 
                                type="button"
                                className={`auth-tab ${isLogin ? 'active' : ''}`}
                                onClick={() => { setIsLogin(true); setMessage(''); }}
                            >
                                Sign In
                            </button>
                            <button 
                                type="button"
                                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                                onClick={() => { setIsLogin(false); setMessage(''); }}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Form */}
                        {isLogin ? (
                            <form onSubmit={handleLogin} className="auth-form">
                                <div className="input-group">
                                    <label>Email</label>
                                    <div className="input-wrapper">
                                        <i className="fas fa-envelope"></i>
                                        <input 
                                            type="email" 
                                            className="form-input"
                                            placeholder="name@company.com" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Password</label>
                                    <div className="input-wrapper">
                                        <i className="fas fa-lock"></i>
                                        <input 
                                            type="password" 
                                            className="form-input"
                                            placeholder="••••••••" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn-submit">
                                    <span>Sign In</span>
                                    <i className="fas fa-arrow-right"></i>
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSignup} className="auth-form">
                                <div className="input-group">
                                    <label>Full Name</label>
                                    <div className="input-wrapper">
                                        <i className="fas fa-user"></i>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            placeholder="Lakshmi Sowjanya" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Email</label>
                                    <div className="input-wrapper">
                                        <i className="fas fa-envelope"></i>
                                        <input 
                                            type="email" 
                                            className="form-input"
                                            placeholder="name@company.com" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Password</label>
                                    <div className="input-wrapper">
                                        <i className="fas fa-lock"></i>
                                        <input 
                                            type="password" 
                                            className="form-input"
                                            placeholder="••••••••" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn-submit">
                                    <span>Create Account</span>
                                    <i className="fas fa-user-plus"></i>
                                </button>
                            </form>
                        )}

                        {message && <div className="auth-feedback">{message}</div>}

                        {/* Divider */}
                        <div className="auth-divider">
                            <span>or continue with</span>
                        </div>

                        {/* Google OAuth */}
                        <button 
                            type="button" 
                            className="btn-google" 
                            onClick={() => window.location.href = "http://localhost:5000/auth/google/login"}
                        >
                            <i className="fab fa-google"></i>
                            <span>Continue with Google</span>
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;