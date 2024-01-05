import React, { useState } from 'react';
import axios from 'axios';
import "./Register.css"

const Register = ({ onRegister, onShowLogin,setUser }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post('https://localhost:5001/api/users/register', { username, email, password });
      const loginResponse = await axios.post('https://localhost:5001/api/users/login', { email, password });
      localStorage.setItem('token', loginResponse.data.token);
      
      // Persist user data in local storage
      const user = loginResponse.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      
      onRegister(loginResponse.data.token);

      setUser(loginResponse.data.user);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <section className="register-section">
      <form className="register-container" onSubmit={handleSubmit}>
      <h1 className='register-header'>Debt-a-Way!</h1>
      <p className="register-subtext" >Register Below.</p>
      <div className='register-flex'>
        <input className="register-username-box" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
        <input className="register-email-box" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input className="register-password-box" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button className="register-register-button" type="submit">Register</button>
        <button className="register-btlogin-button" type="button" onClick={onShowLogin}>Back to Login</button>
        </div>
      </form>
    </section>
  );
};

export default Register;
