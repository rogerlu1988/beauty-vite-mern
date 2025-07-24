import { useState, useContext } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'client' });
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50">
      <form className="bg-white p-8 rounded shadow-md w-80" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold text-pink-700 mb-6">Register</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} className="mb-4 w-full p-2 border rounded" required />
        <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} className="mb-4 w-full p-2 border rounded" required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="mb-4 w-full p-2 border rounded" required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="mb-4 w-full p-2 border rounded" required />
        <select name="role" value={form.role} onChange={handleChange} className="mb-4 w-full p-2 border rounded">
          <option value="client">Client</option>
          <option value="professional">Professional</option>
        </select>
        <button type="submit" className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700">Register</button>
      </form>
    </div>
  );
}
