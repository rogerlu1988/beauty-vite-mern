import { useState, useRef } from 'react';

// Status color map
const STATUS_COLORS = {
  available: 'bg-green-200 border-green-500',
  booked: 'bg-red-200 border-red-500',
  pending: 'bg-yellow-200 border-yellow-500',
  confirmed: 'bg-blue-200 border-blue-500',
  cancelled: 'bg-gray-200 border-gray-400',
};

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8:00 to 20:00

function getStatus(slot) {
  if (slot.status) return slot.status;
  return slot.isBooked ? 'booked' : 'available';
}

function getWeekDates(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(diff + i);
    week.push(d.toISOString().slice(0, 10));
  }
  return week;
}

function getMonthDates(dateStr) {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = date.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const dates = [];
  for (let d = first; d <= last; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d).toISOString().slice(0, 10));
  }
  return dates;
}

export default function TimeGridCalendar({ slots, onSlotEdit, onSlotResize, onSlotDrop, onAddSlot, date }) {
  const [view, setView] = useState('day'); // day, week, month
  const [dragId, setDragId] = useState(null);
  const [resizeInfo, setResizeInfo] = useState(null);
  const gridRef = useRef();

  // Helper: convert time ("14:30") to Y offset in px
  const timeToY = t => {
    const [h, m] = t.split(':').map(Number);
    return ((h - 8) * 60 + m) * 2; // 2px per min, 120px per hour
  };
  // Helper: convert Y offset to time string
  const yToTime = y => {
    const total = Math.round(y / 2);
    const h = Math.floor(total / 60) + 8;
    const m = total % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Drag-to-resize handlers
  const onMouseDownResize = (e, slot, type) => {
    e.stopPropagation();
    setResizeInfo({ id: slot._id, type, startY: e.clientY, origTime: type === 'start' ? slot.startTime : slot.endTime });
  };
  const onMouseMove = e => {
    if (!resizeInfo) return;
    const dy = e.clientY - resizeInfo.startY;
    const newTime = yToTime(timeToY(resizeInfo.origTime) + dy);
    onSlotResize(resizeInfo.id, resizeInfo.type, newTime);
  };
  const onMouseUp = () => setResizeInfo(null);

  // Drag-and-drop slot move
  const onDragStart = id => setDragId(id);
  const onDropSlot = (hour, day) => {
    if (dragId) onSlotDrop(dragId, `${hour.toString().padStart(2, '0')}:00`, day);
    setDragId(null);
  };

  // Responsive grid logic
  let days = [date];
  if (view === 'week') days = getWeekDates(date);
  if (view === 'month') days = getMonthDates(date);
  const slotsByDay = days.reduce((acc, d) => (acc[d] = slots.filter(s => s.date && s.date.slice(0, 10) === d), acc), {});

  // Render
  return (
    <div className="relative border rounded-lg bg-white overflow-x-auto max-w-full" style={{ minHeight: 780 }}
      ref={gridRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* View switcher */}
      <div className="flex gap-2 p-2 sticky top-0 bg-white z-20">
        <button className={`px-3 py-1 rounded ${view === 'day' ? 'bg-pink-600 text-white' : 'bg-gray-200'}`} onClick={() => setView('day')}>Day</button>
        <button className={`px-3 py-1 rounded ${view === 'week' ? 'bg-pink-600 text-white' : 'bg-gray-200'}`} onClick={() => setView('week')}>Week</button>
        <button className={`px-3 py-1 rounded ${view === 'month' ? 'bg-pink-600 text-white' : 'bg-gray-200'}`} onClick={() => setView('month')}>Month</button>
      </div>
      {/* Grid for day/week/month */}
      <div className={`flex ${view === 'month' ? 'flex-wrap' : ''} w-full`} style={{ minWidth: view === 'month' ? 900 : 400 }}>
        {days.map((day, idx) => (
          <div key={day} className={view === 'month' ? 'w-1/7 border' : 'flex-1 border'} style={{ minWidth: 130, position: 'relative', height: view === 'month' ? 220 : 780 }}>
            <div className="text-xs font-semibold p-2 border-b bg-gray-50 sticky top-0 z-10">{new Date(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            {view === 'month' ? (
              <>
                {(slotsByDay[day] || []).map(slot => (
                  <div key={slot._id} className={`m-1 px-2 py-1 rounded text-xs border shadow ${STATUS_COLORS[getStatus(slot)] || 'bg-gray-100 border-gray-300'}`}
                    onDoubleClick={() => onSlotEdit(slot)}
                  >
                    {slot.startTime}-{slot.endTime} <span className="capitalize">{getStatus(slot)}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="relative" style={{ height: 780 }}>
                {/* Hour grid */}
                <div className="absolute left-0 top-0 w-14 flex flex-col h-full z-10">
                  {HOURS.map(h => (
                    <div key={h} className="h-24 border-b text-xs flex items-start justify-end pr-2 pt-1 text-gray-600">
                      {h}:00
                    </div>
                  ))}
                </div>
                <div className="ml-14 relative" style={{ width: 120 }}>
                  {(slotsByDay[day] || []).map(slot => {
                    const top = timeToY(slot.startTime);
                    const height = timeToY(slot.endTime) - top;
                    const status = getStatus(slot);
                    return (
                      <div
                        key={slot._id}
                        className={`absolute left-2 w-24 border rounded shadow cursor-move flex flex-col p-2 ${STATUS_COLORS[status] || 'bg-gray-100 border-gray-300'}`}
                        style={{ top, height: Math.max(32, height), zIndex: dragId === slot._id ? 20 : 1 }}
                        draggable={!slot.isBooked && !slot.cancelled}
                        onDragStart={() => onDragStart(slot._id)}
                        onDoubleClick={() => onSlotEdit(slot)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs">{slot.startTime}-{slot.endTime}</span>
                          <span className="text-xs font-bold capitalize">{status}</span>
                        </div>
                        <div className="flex-1 text-xs truncate">{slot.serviceName || ''}</div>
                        {!slot.isBooked && !slot.cancelled && (
                          <>
                            <div className="absolute left-0 right-0 h-2 cursor-ns-resize" style={{ top: 0 }}
                              onMouseDown={e => onMouseDownResize(e, slot, 'start')} />
                            <div className="absolute left-0 right-0 h-2 cursor-ns-resize" style={{ bottom: 0 }}
                              onMouseDown={e => onMouseDownResize(e, slot, 'end')} />
                          </>
                        )}
                      </div>
                    );
                  })}
                  {/* Drop targets for slot move */}
                  {HOURS.map(h => (
                    <div key={h} className="absolute left-0 right-0 h-24" style={{ top: (h-8)*120, zIndex:0 }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => onDropSlot(h, day)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Add slot button */}
      <button className="fixed right-4 bottom-24 px-3 py-1 bg-pink-600 text-white rounded shadow-lg md:static md:mt-4" onClick={onAddSlot}>+ Add Slot</button>
      {/* Sync button */}
      <button className="fixed right-4 bottom-4 px-3 py-1 bg-blue-600 text-white rounded shadow-lg md:static md:mt-4" onClick={() => window.dispatchEvent(new CustomEvent('sync-calendar', { detail: { date } }))}>Sync Calendar</button>
    </div>
  );
}
