import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin, onShowRegister,setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  //const [walletBalance, setWalletBalance] = useState(0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('https://debt-a-way.onrender.com/api/users/login', { email, password });
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
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Login</button>
      <button type="button" onClick={onShowRegister}>Register</button>
    </form>
  );
};

export default Login;
