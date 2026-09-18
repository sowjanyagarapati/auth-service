import React, { useState } from "react";
import axios from "axios";
import './App.css';

function App() {
    const [isLogin, setIsLogin] = useState(true);
    
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
            });
            // Update the message state with the response from the server
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
        </div>
    );
}

export default App;