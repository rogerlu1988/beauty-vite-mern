import { useEffect, useState, useContext } from 'react';
import api from './api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';

export default function Slots() {
  const [slots, setSlots] = useState([]);
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');
  const proId = searchParams.get('pro');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/slots', { params: { professional: proId } }).then(res => setSlots(res.data));
  }, [proId]);

  const handleBook = async slotId => {
    try {
      await api.post('/bookings', {
        client: user.id,
        service: serviceId,
        slot: slotId
      });
      setSuccess(true);
      // Optionally, you can refresh slots or navigate after a delay
    } catch (err) {
      setError('Booking failed. Please login or try again.');
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-green-700">Booking Confirmed!</h2>
        <p className="mb-4">Your appointment has been booked successfully.</p>
        <button className="px-6 py-2 bg-pink-600 text-white rounded hover:bg-pink-700" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Choose a Time Slot</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <ul className="space-y-4">
        {slots.map(slot => (
          <li key={slot._id} className="p-4 border rounded flex justify-between items-center">
            <div>
              <div>{new Date(slot.date).toLocaleDateString()} {slot.startTime} - {slot.endTime}</div>
            </div>
            <button className="bg-pink-600 text-white px-4 py-2 rounded" onClick={() => handleBook(slot._id)}>
              Book
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
