import { useEffect, useState } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

export default function Services() {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/services').then(res => setServices(res.data));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Choose a Service</h2>
      <ul className="space-y-4">
        {services.map(service => (
          <li key={service._id} className="p-4 border rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{service.name}</div>
              <div className="text-gray-600">{service.description}</div>
              <div className="text-sm text-gray-500">${service.price} • {service.durationMinutes} min</div>
            </div>
            <button className="bg-pink-600 text-white px-4 py-2 rounded" onClick={() => navigate(`/professionals?service=${service._id}`)}>
              Select
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
