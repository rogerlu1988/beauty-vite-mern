import { useEffect, useState, useContext } from 'react';
import api from './api';
import { AuthContext } from './context/AuthContext.jsx';

export default function Bookings() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get('/bookings')
      .then(res => setBookings(res.data))
      .catch(() => setError('Could not fetch bookings'));
  }, [user]);

  if (!user) return <div className="p-8">Please log in to see your bookings.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {bookings.length === 0 ? (
        <div>No bookings found.</div>
      ) : (
        <ul className="space-y-4">
          {bookings.map(b => (
            <li key={b._id} className="p-4 border rounded flex flex-col gap-2">
              <div><span className="font-semibold">Service:</span> {b.service?.name || 'N/A'}</div>
              <div><span className="font-semibold">Professional:</span> {b.slot?.professional?.firstName || 'N/A'}</div>
              <div><span className="font-semibold">Date:</span> {b.slot ? new Date(b.slot.date).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-semibold">Time:</span> {b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : 'N/A'}</div>
              <div><span className="font-semibold">Status:</span> {b.status}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
