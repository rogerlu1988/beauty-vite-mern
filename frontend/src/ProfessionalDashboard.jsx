import { useContext, useEffect, useState } from 'react';
import api from './api';
import { AuthContext } from './context/AuthContext.jsx';
import CalendarView from './CalendarView.jsx';
import { socket } from './socket.js';

const STATUS_OPTIONS = ["all", "pending", "confirmed", "cancelled"];

export default function ProfessionalDashboard() {
  const { user } = useContext(AuthContext);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notif, setNotif] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get('/slots', { params: { professional: user.id } })
      .then(res => setSlots(res.data))
      .catch(() => setSlots([]));
    api.get('/bookings')
      .then(res => setBookings(res.data))
      .catch(() => setBookings([]));
  }, [user, success]);

  // Real-time notifications for professionals
  useEffect(() => {
    if (!user || user.role !== 'professional') return;
    socket.auth = { userId: user.id, role: user.role };
    socket.connect();
    socket.on('booking:new', payload => {
      if (payload.professionalId === user.id) {
        setNotif(`New booking for slot on ${new Date(payload.date).toLocaleDateString()} at ${payload.startTime}`);
        // Optionally refresh bookings/slots
        api.get('/bookings').then(res => setBookings(res.data));
        api.get('/slots', { params: { professional: user.id } }).then(res => setSlots(res.data));
      }
    });
    return () => {
      socket.off('booking:new');
      socket.disconnect();
    };
  }, [user]);

  const handleAddSlot = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/slots', { date, startTime, endTime });
      setSuccess('Slot added!');
      setDate(''); setStartTime(''); setEndTime('');
    } catch (err) {
      setError('Failed to add slot.');
    }
  };

  const handleEditSlot = slot => {
    setEditId(slot._id);
    setEditDate(slot.date ? slot.date.slice(0,10) : '');
    setEditStart(slot.startTime);
    setEditEnd(slot.endTime);
  };

  const handleSaveEdit = async slotId => {
    setError(''); setSuccess('');
    try {
      await api.put(`/slots/${slotId}`, { date: editDate, startTime: editStart, endTime: editEnd });
      setSuccess('Slot updated!');
      setEditId(null);
    } catch (err) {
      setError('Failed to update slot.');
    }
  };

  const handleDeleteSlot = async slotId => {
    if (!window.confirm('Delete this slot?')) return;
    setError(''); setSuccess('');
    try {
      await api.delete(`/slots/${slotId}`);
      setSuccess('Slot deleted!');
    } catch (err) {
      setError('Failed to delete slot.');
    }
  };

  // Booking filters
  const filteredBookings = bookings.filter(b => {
    let match = true;
    if (filterDate && b.slot && b.slot.date) {
      match = match && (b.slot.date.slice(0,10) === filterDate);
    }
    if (filterStatus !== 'all') {
      match = match && (b.status === filterStatus);
    }
    return match;
  });

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Professional Dashboard</h2>
      {notif && (
        <div className="bg-green-100 text-green-800 border border-green-400 px-4 py-2 rounded mb-4 flex justify-between items-center">
          <span>{notif}</span>
          <button onClick={() => setNotif('')} className="ml-4 text-green-900">Dismiss</button>
        </div>
      )}
      <CalendarView professionalId={user?.id} />
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Add Available Time Slot</h3>
        <form className="flex flex-col gap-2 mb-2" onSubmit={handleAddSlot}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="border rounded px-2 py-1" />
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="border rounded px-2 py-1" />
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="border rounded px-2 py-1" />
          <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded">Add Slot</button>
        </form>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-700">{success}</div>}
      </div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">My Slots</h3>
        <ul className="space-y-2">
          {slots.length === 0 && <li>No slots found.</li>}
          {slots.map(slot => (
            <li key={slot._id} className="border rounded p-2 flex flex-col gap-1">
              {editId === slot._id ? (
                <div className="flex flex-col gap-2 md:flex-row md:gap-4 items-center">
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="border rounded px-2 py-1" />
                  <input type="time" value={editStart} onChange={e => setEditStart(e.target.value)} className="border rounded px-2 py-1" />
                  <input type="time" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="border rounded px-2 py-1" />
                  <button onClick={() => handleSaveEdit(slot._id)} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                  <button onClick={() => setEditId(null)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
                </div>
              ) : (
                <>
                  <span>Date: {slot.date ? new Date(slot.date).toLocaleDateString() : 'N/A'}</span>
                  <span>Time: {slot.startTime} - {slot.endTime}</span>
                  <span>Status: {slot.isBooked ? 'Booked' : 'Available'}</span>
                  {!slot.isBooked && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleEditSlot(slot)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                      <button onClick={() => handleDeleteSlot(slot._id)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">My Bookings</h3>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div>
            <label className="font-medium mr-2">Date:</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div>
            <label className="font-medium mr-2">Status:</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1">
              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <ul className="space-y-2">
          {filteredBookings.length === 0 && <li>No bookings found.</li>}
          {filteredBookings.map(b => (
            <li key={b._id} className="border rounded p-2 flex flex-col gap-1">
              <span>Client: {b.client?.firstName || 'N/A'} {b.client?.lastName || ''}</span>
              <span>Service: {b.service?.name || 'N/A'}</span>
              <span>Date: {b.slot ? new Date(b.slot.date).toLocaleDateString() : 'N/A'}</span>
              <span>Time: {b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : 'N/A'}</span>
              <span>Status: {b.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
