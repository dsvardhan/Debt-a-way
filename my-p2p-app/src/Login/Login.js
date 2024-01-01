import React, { useState } from 'react';
import axios from 'axios';
import './Login.css'

const Login = ({ onLogin, onShowRegister,setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  //const [walletBalance, setWalletBalance] = useState(0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('https://localhost:5001/api/users/login', { email, password });
      localStorage.setItem('token', response.data.token);

      const user = response.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      onLogin(response.data.token);

      //setUser(response.data.user);
      //setWalletBalance(response.data.user.walletBalance);
      
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <section className='login-section'>
      <form className="login-container" onSubmit={handleSubmit}>
        <h1 className='login-header'>Debt-a-Way!</h1>
        <p className="subtext" >Log in or Register.</p>
        <div className='login-flex'>
        <input className="email-box" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input className="password-box" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button className="login-button" type="submit">Login</button>
        <button className="register-button" type="button" onClick={onShowRegister}>Register</button>
        </div>
      </form>
    </section>
  );
};

export default Login;
