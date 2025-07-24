import { useState, useContext } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50">
      <form className="bg-white p-8 rounded shadow-md w-80" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold text-pink-700 mb-6">Login</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="mb-4 w-full p-2 border rounded" required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="mb-4 w-full p-2 border rounded" required />
        <button type="submit" className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700">Login</button>
      </form>
    </div>
  );
}
