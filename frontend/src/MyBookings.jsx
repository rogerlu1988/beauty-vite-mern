import { useEffect, useState, useContext } from 'react';
import api from './api';
import { AuthContext } from './context/AuthContext.jsx';
import * as XLSX from 'xlsx';

export default function MyBookings() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', from: '', to: '' });
  const [msg, setMsg] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [reschedule, setReschedule] = useState({ id: '', date: '', startTime: '', endTime: '' });

  useEffect(() => {
    if (!user) return;
    let params = {};
    if (filter.status) params.status = filter.status;
    api.get('/bookings', { params })
      .then(res => setBookings(res.data.filter(b => b.user === user.id)))
      .catch(() => setError('Could not fetch bookings'));
  }, [user, filter, msg]);

  if (!user) return <div className="p-8">Please log in to see your bookings.</div>;

  const filtered = bookings.filter(b => {
    let ok = true;
    if (filter.from && b.slot && b.slot.date < filter.from) ok = false;
    if (filter.to && b.slot && b.slot.date > filter.to) ok = false;
    return ok;
  });

  const handleCancel = async id => {
    if (!window.confirm('Cancel this booking?')) return;
    await api.put(`/bookings/${id}`, { status: 'cancelled' });
    setMsg('Booking cancelled!');
  };

  const handleOpenReschedule = b => {
    setShowReschedule(true);
    setReschedule({ id: b._id, date: b.slot.date.slice(0,10), startTime: b.slot.startTime, endTime: b.slot.endTime });
  };
  const handleReschedule = async e => {
    e.preventDefault();
    await api.put(`/bookings/${reschedule.id}`, {
      status: 'pending',
      slot: { date: reschedule.date, startTime: reschedule.startTime, endTime: reschedule.endTime }
    });
    setShowReschedule(false);
    setMsg('Booking rescheduled!');
  };

  const handleExportExcel = () => {
    const rows = filtered.map(b => ({
      Service: b.service?.name,
      Professional: b.slot?.professional?.firstName,
      Date: b.slot ? new Date(b.slot.date).toLocaleDateString() : '',
      Time: b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : '',
      Status: b.status
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    XLSX.writeFile(wb, 'my_bookings.xlsx');
  };

  const handleExportICS = () => {
    const events = filtered.map(b => [
      'BEGIN:VEVENT',
      `SUMMARY:${b.service?.name || 'Service Booking'}`,
      b.slot ? `DTSTART:${b.slot.date.replace(/-/g,'')}T${b.slot.startTime.replace(':','')}00` : '',
      b.slot ? `DTEND:${b.slot.date.replace(/-/g,'')}T${b.slot.endTime.replace(':','')}00` : '',
      `DESCRIPTION:Professional: ${b.slot?.professional?.firstName || ''}`,
      'END:VEVENT'
    ].join('\n')).join('\n');
    const cal = `BEGIN:VCALENDAR\nVERSION:2.0\n${events}\nEND:VCALENDAR`;
    const blob = new Blob([cal], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_bookings.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select className="border rounded px-2 py-1" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" className="border rounded px-2 py-1" value={filter.from} onChange={e => setFilter(f => ({ ...f, from: e.target.value }))} />
        <input type="date" className="border rounded px-2 py-1" value={filter.to} onChange={e => setFilter(f => ({ ...f, to: e.target.value }))} />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleExportExcel}>Export Excel</button>
        <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleExportICS}>Export Calendar</button>
      </div>
      {msg && <div className="text-green-700 mb-2">{msg}</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {filtered.length === 0 ? (
        <div>No bookings found.</div>
      ) : (
        <ul className="space-y-4">
          {filtered.map(b => (
            <li key={b._id} className="p-4 border rounded flex flex-col gap-2">
              <div><span className="font-semibold">Service:</span> {b.service?.name || 'N/A'}</div>
              <div><span className="font-semibold">Professional:</span> {b.slot?.professional?.firstName || 'N/A'}</div>
              <div><span className="font-semibold">Date:</span> {b.slot ? new Date(b.slot.date).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-semibold">Time:</span> {b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : 'N/A'}</div>
              <div><span className="font-semibold">Status:</span> {b.status}</div>
              {(b.status !== 'cancelled' && b.slot && new Date(b.slot.date) >= new Date()) && (
                <div className="flex gap-2 mt-2">
                  <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => handleCancel(b._id)}>Cancel</button>
                  <button className="bg-yellow-600 text-white px-3 py-1 rounded" onClick={() => handleOpenReschedule(b)}>Reschedule</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {showReschedule && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <form className="bg-white p-6 rounded shadow max-w-md w-full flex flex-col gap-2" onSubmit={handleReschedule}>
            <h3 className="font-bold mb-2">Reschedule Booking</h3>
            <input className="border rounded px-2 py-1" type="date" value={reschedule.date} onChange={e => setReschedule(f => ({ ...f, date: e.target.value }))} required />
            <input className="border rounded px-2 py-1" type="time" value={reschedule.startTime} onChange={e => setReschedule(f => ({ ...f, startTime: e.target.value }))} required />
            <input className="border rounded px-2 py-1" type="time" value={reschedule.endTime} onChange={e => setReschedule(f => ({ ...f, endTime: e.target.value }))} required />
            <div className="flex gap-2 mt-2">
              <button className="bg-pink-600 text-white px-4 py-1 rounded" type="submit">Save</button>
              <button className="bg-gray-400 text-white px-4 py-1 rounded" type="button" onClick={() => setShowReschedule(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
