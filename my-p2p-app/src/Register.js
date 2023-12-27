import React, { useState } from 'react';
import axios from 'axios';

const Register = ({ onRegister, onShowLogin,setUser }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post('https://debt-a-way.onrender.com/api/users/register', { username, email, password });
      const loginResponse = await axios.post('https://debt-a-way.onrender.com/api/users/login', { email, password });
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
    <form onSubmit={handleSubmit}>
      <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Register</button>
      <button type="button" onClick={onShowLogin}>Back to Login</button>
    </form>
  );
};

export default Register;
