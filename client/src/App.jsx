import React, { useState, useEffect } from "react";
import axios from "axios";
import './App.css';

function App() {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [wikiSummary, setIsWikiSummary] = useState('');
    
    // State to hold the user's input
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    
    // State to hold messages from the server (success or error)
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        // Prevent the default form submission behavior (which refreshes the page)
        e.preventDefault(); 
        
        try {
            // Send a POST request to your Python FastAPI backend
            const response = await axios.post('http://localhost:5000/login', {
                email: email,
                password: password
            }, {withCredentials: true});
            // Update the message state with the response from the server
            localStorage.setItem('token', response.data.access_token);
            setIsLoggedIn(true);
            setMessage(response.data.message);
        } catch (error) {
            // If there's an error, display the error detail from FastAPI
            setMessage(error.response?.data?.detail || "An error occurred connecting to the server.");
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
        } catch (error) {
            // If there's an error, display the error detail from FastAPI
            setMessage(error.response?.data?.detail || "An error occurred connecting to the server.");
        }
    };

    useEffect (() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
    
        if (tokenFromUrl) {
            localStorage.setItem('token', tokenFromUrl);
            setIsLoggedIn(true);
        // Clear token from URL bar for clean UI
        window.history.replaceState({}, document.title, "/");
        }
      const token = localStorage.getItem('token');
      if(token) {
        setIsLoggedIn(true);
      }
    }, []);
    
    useEffect(() => {
    // Only run this if they are actually logged in
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
                // Call /refresh with withCredentials to send the HttpOnly Cookie
                const refreshRes = await axios.post('http://localhost:5000/refresh', {}, {
                    withCredentials: true 
                });
                
                // 1. Save new Access Token
                const newToken = refreshRes.data.access_token;
                localStorage.setItem('token', newToken);
                console.log("generated and stored new token")
                
                // 2. Retry original request with NEW token
                const retryRes = await axios.get('http://localhost:5000/random', {
                    headers: { Authorization: `Bearer ${newToken}` }
                });
                setIsWikiSummary(retryRes.data.summary);
                return;
            } catch (refreshError) {
                // Refresh token also expired! Log user out.
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
  }, [isLoggedIn, name]); // This bracket tells React: "Run this effect whenever isLoggedIn or name changes"

  if (isLoggedIn) {
    return (
      <div>
        <h1>Welcome {name}!! </h1>
        <p>{wikiSummary ? wikiSummary : "Loading your summary..."}</p>
      </div>
    )
  }


    return (
        <div className="auth-container">
            {isLogin ? (
                <div className="login-form">
                    <h2>Login</h2>
                    <form onSubmit={handleLogin}>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit">Login</button>
                    </form>
                    {/* Display the server message if one exists */}
                    {message && <p className="message">{message}</p>}
                    <div>
                        don't have an account?
                        <button type="button" onClick={() => { setIsLogin(false); setMessage(''); }}>Signup</button>
                    </div>
                </div>
            ) : (
                <div className="signup-form">
                    <h2>Signup</h2>
                    <form onSubmit={handleSignup}>
                        <input type="text" placeholder="Name" value={name}
                        onChange={(e) => setName(e.target.value)}
                        required/>
                        <input type="email" placeholder="Email"  value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required/>
                        <input type="password" placeholder="Password" value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required/>
                        <button type="submit">Signup</button>
                    </form>
                    {message && <p className="message">{message}</p>}
                    <div>
                        already have an account?
                        <button type="button" onClick={() => { setIsLogin(true); setMessage(''); }}>Login</button>
                    </div>
                </div>
            )}
            <button 
                type="button" 
                className="google-btn" 
                onClick={() => window.location.href = "http://localhost:5000/auth/google/login"}
            >
                <i className="fab fa-google"></i> Sign in with Google
            </button>
        </div>

    );
}

export default App;