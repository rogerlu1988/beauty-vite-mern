import { useEffect, useState } from 'react';
import api from './api';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Professionals() {
  const [pros, setPros] = useState([]);
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/professionals', { params: { service: serviceId } }).then(res => setPros(res.data));
  }, [serviceId]);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Choose a Professional</h2>
      <ul className="space-y-4">
        {pros.map(pro => (
          <li key={pro._id} className="p-4 border rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{pro.firstName} {pro.lastName}</div>
              <div className="text-gray-600">{pro.email}</div>
            </div>
            <button className="bg-pink-600 text-white px-4 py-2 rounded" onClick={() => navigate(`/slots?service=${serviceId}&pro=${pro._id}`)}>
              Select
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
