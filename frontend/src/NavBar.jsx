import { useContext } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';

export default function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between p-4 bg-pink-600 text-white">
      <Link to="/" className="font-bold text-xl">BeautyBooking</Link>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <span>Hi, {user.firstName || user.role}</span>
            {user && <Link to="/my-bookings" className="hover:underline">My Bookings</Link>}
            {user.role === 'professional' && <Link to="/pro-calendar" className="hover:underline">My Calendar</Link>}
            <button onClick={() => { logout(); navigate('/'); }} className="px-3 py-1 bg-pink-800 rounded">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
