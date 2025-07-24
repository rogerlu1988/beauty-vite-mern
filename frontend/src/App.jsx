import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './NavBar.jsx';
import Home from './Home.jsx';
import Login from './Login.jsx';
import Register from './Register.jsx';
import Services from './Services.jsx';
import Professionals from './Professionals.jsx';
import Slots from './Slots.jsx';
import MyBookings from './MyBookings.jsx';
import ProfessionalCalendar from './ProfessionalCalendar.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext.jsx';

export default function App() {
  const { user } = useContext(AuthContext);
  return (
    <Router>
      <NavBar />
      <nav className="flex gap-4 p-4 bg-gray-100">
        {user && user.role === 'admin' && <Link to="/admin-dashboard">Admin Dashboard</Link>}
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/services" element={<Services />} />
        <Route path="/professionals" element={<Professionals />} />
        <Route path="/slots" element={<Slots />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/pro-calendar" element={<ProfessionalCalendar />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
