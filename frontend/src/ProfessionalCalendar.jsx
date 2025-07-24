import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import api from './api';
import TimeGridCalendar from './TimeGridCalendar.jsx';

export default function ProfessionalCalendar() {
  const { user } = useContext(AuthContext);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0,10));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', id: null });
  const [msg, setMsg] = useState('');
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'professional') return;
    api.get('/slots', { params: { professional: user.id } })
      .then(res => setSlots(res.data));
  }, [user, msg]);

  useEffect(() => {
    const handler = async (e) => {
      if (!user) return;
      // Simple .ics calendar export
      const cal = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        ...slots.filter(s => s.date && s.startTime && s.endTime).map(slot =>
          [
            'BEGIN:VEVENT',
            `SUMMARY:Beauty Slot (${slot.status || (slot.isBooked ? 'Booked' : 'Available')})`,
            `DTSTART:${slot.date.replace(/-/g,'')}T${slot.startTime.replace(':','')}00`,
            `DTEND:${slot.date.replace(/-/g,'')}T${slot.endTime.replace(':','')}00`,
            'END:VEVENT',
          ].join('\n')
        ),
        'END:VCALENDAR',
      ].join('\n');
      const blob = new Blob([cal], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'beauty-calendar.ics';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      setSyncMsg('Calendar exported as .ics!');
      setTimeout(() => setSyncMsg(''), 3000);
    };
    window.addEventListener('sync-calendar', handler);
    return () => window.removeEventListener('sync-calendar', handler);
  }, [slots, user]);

  const slotsForDay = slots.filter(s => s.date && s.date.slice(0,10) === selectedDate);

  // Slot CRUD
  const openForm = (slot = null) => {
    setShowForm(true);
    if (slot) setForm({ date: slot.date.slice(0,10), startTime: slot.startTime, endTime: slot.endTime, id: slot._id });
    else setForm({ date: selectedDate, startTime: '', endTime: '', id: null });
  };
  const closeForm = () => { setShowForm(false); setForm({ date: '', startTime: '', endTime: '', id: null }); };
  const saveSlot = async e => {
    e.preventDefault();
    if (form.id) {
      await api.put(`/slots/${form.id}`, { date: form.date, startTime: form.startTime, endTime: form.endTime });
      setMsg('Slot updated!');
    } else {
      await api.post('/slots', { date: form.date, startTime: form.startTime, endTime: form.endTime });
      setMsg('Slot created!');
    }
    closeForm();
  };
  // Drag-to-move
  const handleSlotDrop = async (slotId, newStart) => {
    const slot = slots.find(s => s._id === slotId);
    if (!slot) return;
    const [h, m] = newStart.split(':');
    const duration = (parseInt(slot.endTime.slice(0,2))*60+parseInt(slot.endTime.slice(3)))-(parseInt(slot.startTime.slice(0,2))*60+parseInt(slot.startTime.slice(3)));
    const newEnd = `${(parseInt(h)+Math.floor((parseInt(m)+duration)/60)).toString().padStart(2,'0')}:${((parseInt(m)+duration)%60).toString().padStart(2,'0')}`;
    await api.put(`/slots/${slotId}`, { date: selectedDate, startTime: newStart, endTime: newEnd });
    setMsg('Slot moved!');
  };
  // Drag-to-resize
  const handleSlotResize = async (slotId, type, newTime) => {
    const slot = slots.find(s => s._id === slotId);
    if (!slot) return;
    if (type === 'start') {
      await api.put(`/slots/${slotId}`, { startTime: newTime });
      setMsg('Slot resized!');
    } else {
      await api.put(`/slots/${slotId}`, { endTime: newTime });
      setMsg('Slot resized!');
    }
  };
  // Edit
  const handleSlotEdit = slot => openForm(slot);
  // Add
  const handleAddSlot = () => openForm();

  if (!user || user.role !== 'professional') {
    return <div className="p-8">You must be logged in as a professional to view your calendar.</div>;
  }
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">My Calendar</h2>
      {syncMsg && <div className="mb-2 text-blue-700">{syncMsg}</div>}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input type="date" className="border rounded px-2 py-1" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        <button className="px-3 py-1 rounded border border-green-600 text-green-700" onClick={handleAddSlot}>+ Add Slot</button>
      </div>
      <TimeGridCalendar
        slots={slotsForDay}
        onSlotEdit={handleSlotEdit}
        onSlotResize={handleSlotResize}
        onSlotDrop={handleSlotDrop}
        onAddSlot={handleAddSlot}
        date={selectedDate}
      />
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <form className="bg-white p-6 rounded shadow max-w-md w-full flex flex-col gap-2" onSubmit={saveSlot}>
            <h3 className="font-bold mb-2">{form.id ? 'Edit Slot' : 'Add Slot'}</h3>
            <input className="border rounded px-2 py-1" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            <input className="border rounded px-2 py-1" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
            <input className="border rounded px-2 py-1" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
            <div className="flex gap-2 mt-2">
              <button className="bg-pink-600 text-white px-4 py-1 rounded" type="submit">Save</button>
              <button className="bg-gray-400 text-white px-4 py-1 rounded" type="button" onClick={closeForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
