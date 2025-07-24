import { useEffect, useState } from 'react';
import api from './api';

export default function CalendarView({ professionalId }) {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!professionalId) return;
    api.get('/slots', { params: { professional: professionalId } })
      .then(res => setSlots(res.data));
  }, [professionalId]);

  // Get unique dates from slots
  const dates = Array.from(new Set(slots.map(s => s.date && s.date.slice(0,10)))).sort();

  // Filter slots by selected date
  const filteredSlots = selectedDate ? slots.filter(s => s.date && s.date.slice(0,10) === selectedDate) : [];

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-2">Calendar View</h3>
      <div className="flex gap-2 mb-4 flex-wrap">
        {dates.map(date => (
          <button
            key={date}
            className={`px-3 py-1 rounded border ${selectedDate === date ? 'bg-pink-600 text-white' : 'bg-white text-pink-700 border-pink-600'}`}
            onClick={() => setSelectedDate(date)}
          >
            {new Date(date).toLocaleDateString()}
          </button>
        ))}
        {dates.length === 0 && <span>No slots available</span>}
      </div>
      {selectedDate && (
        <div>
          <h4 className="font-semibold mb-2">Slots for {new Date(selectedDate).toLocaleDateString()}</h4>
          <ul className="space-y-2">
            {filteredSlots.length === 0 && <li>No slots on this day.</li>}
            {filteredSlots.map(slot => (
              <li key={slot._id} className="border rounded p-2 flex flex-col gap-1">
                <span>Time: {slot.startTime} - {slot.endTime}</span>
                <span>Status: {slot.isBooked ? 'Booked' : 'Available'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
