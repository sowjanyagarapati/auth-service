import React, { useState, useEffect } from "react";
import axios from "axios";
import { SignIn1 } from "./components/ui/modern-stunning-sign-in";
import './App.css';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [wikiSummary, setIsWikiSummary] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async ({ email, password }) => {
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const response = await axios.post('http://localhost:5000/login', {
                email: email,
                password: password
            }, { withCredentials: true });
            
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                setIsLoggedIn(true);
            } else {
                setErrorMessage(response.data.message || "Invalid credentials.");
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Invalid credentials or server error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignup = async ({ name, email, password }) => {
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const response = await axios.post('http://localhost:5000/users/create', {
                name: name,
                email: email,
                password: password
            });

            if (response.data.message === "User created successfully") {
                setSuccessMessage("Account created successfully! Please sign in.");
                return true;
            } else {
                setErrorMessage(response.data.message || "Failed to create account.");
                return false;
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "An error occurred creating your account.");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setIsWikiSummary('');
        setErrorMessage('');
        setSuccessMessage('Signed out successfully.');
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
    }, [isLoggedIn]);

    if (!isLoggedIn) {
        return (
            <SignIn1 
                onSignIn={handleLogin}
                onSignUp={handleSignup}
                onGoogleSignIn={() => window.location.href = "http://localhost:5000/auth/google/login"}
                serverError={errorMessage}
                serverSuccess={successMessage}
                isSubmitting={isSubmitting}
            />
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
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
        </div>
    );
}

export default App;