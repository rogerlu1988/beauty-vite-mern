import { useContext } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50">
      <h1 className="text-4xl font-bold text-pink-700 mb-4">Beauty Booking Platform</h1>
      <p className="text-lg text-pink-900 mb-8">Book appointments with top beauty professionals near you.</p>
      {user ? (
        <div className="flex flex-col gap-4">
          {user.role === 'professional' ? (
            <>
              <button onClick={() => navigate('/pro-dashboard')} className="px-6 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">Manage Bookings & Slots</button>
              <button onClick={() => navigate('/bookings')} className="px-6 py-2 bg-white border border-pink-600 text-pink-700 rounded hover:bg-pink-100">My Bookings</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/services')} className="px-6 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">Book a Service</button>
              <button onClick={() => navigate('/bookings')} className="px-6 py-2 bg-white border border-pink-600 text-pink-700 rounded hover:bg-pink-100">My Bookings</button>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-4">
          <a href="/login" className="px-6 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">Login</a>
          <a href="/register" className="px-6 py-2 bg-white border border-pink-600 text-pink-700 rounded hover:bg-pink-100">Register</a>
        </div>
      )}
    </div>
  );
}
