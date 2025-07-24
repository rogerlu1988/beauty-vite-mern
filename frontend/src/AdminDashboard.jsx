import { useEffect, useState, useRef } from 'react';
import api from './api';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 5;
const ROLES = ['all', 'client', 'professional', 'admin'];

function sortByMulti(arr, sorts) {
  return [...arr].sort((a, b) => {
    for (let i = 0; i < sorts.length; i++) {
      const { key, asc } = sorts[i];
      if (a[key] < b[key]) return asc ? -1 : 1;
      if (a[key] > b[key]) return asc ? 1 : -1;
    }
    return 0;
  });
}

function exportToExcel(rows, columns, filename, sheetTitle) {
  const ws = XLSX.utils.json_to_sheet(rows.map(r => {
    const obj = {};
    columns.forEach(c => { obj[c] = r[c]; });
    return obj;
  }), { header: columns });
  // Advanced formatting: bold header, autofit columns, sheet title
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell && !cell.s) cell.s = {};
    if (cell) cell.s.font = { bold: true };
    // Autofit column width
    const maxLen = Math.max(...rows.map(r => (r[columns[C]]+''||'').length), columns[C].length);
    ws['!cols'] = ws['!cols'] || [];
    ws['!cols'][C] = { wch: Math.max(10, maxLen+2) };
  }
  // Add sheet title
  ws['A1'].v = sheetTitle || filename.replace(/\.xlsx$/, '');
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [tab, setTab] = useState('users');
  const [editUser, setEditUser] = useState(null);
  const [editService, setEditService] = useState(null);
  const [msg, setMsg] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSorts, setUserSorts] = useState([{ key: 'firstName', asc: true }]);
  const [serviceSorts, setServiceSorts] = useState([{ key: 'name', asc: true }]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [showBulkEditUser, setShowBulkEditUser] = useState(false);
  const [bulkUserFields, setBulkUserFields] = useState({ firstName: '', lastName: '', email: '', role: '', password: '' });
  const [showBulkEditService, setShowBulkEditService] = useState(false);
  const [bulkServiceFields, setBulkServiceFields] = useState({ name: '', price: '', durationMinutes: '', description: '' });
  const undoStack = useRef([]);

  useEffect(() => {
    fetchUsers();
    fetchServices();
  }, []);

  const fetchUsers = () => api.get('/admin/users').then(res => setUsers(res.data));
  const fetchServices = () => api.get('/services').then(res => setServices(res.data));

  // User CRUD
  const handleDeleteUser = id => {
    if (!window.confirm('Delete user?')) return;
    api.delete(`/admin/users/${id}`).then(() => { setMsg('User deleted'); fetchUsers(); setSelectedUsers([]); });
  };
  const handleEditUser = user => setEditUser({ ...user });
  const handleSaveUser = () => {
    api.put(`/admin/users/${editUser._id}`, editUser).then(() => { setMsg('User updated'); setEditUser(null); fetchUsers(); });
  };
  const handleCreateUser = () => {
    api.post('/admin/users', editUser).then(() => { setMsg('User created'); setEditUser(null); fetchUsers(); });
  };
  const handleBulkDelete = () => {
    if (!window.confirm(`Delete ${selectedUsers.length} selected users?`)) return;
    Promise.all(selectedUsers.map(id => api.delete(`/admin/users/${id}`))).then(() => { setMsg('Users deleted'); fetchUsers(); setSelectedUsers([]); });
  };
  const handleBulkEditRole = () => {
    const prev = users.filter(u => selectedUsers.includes(u._id)).map(u => ({ ...u }));
    undoStack.current.push({ type: 'user', action: 'bulkEditRole', data: prev });
    if (!window.confirm(`Change role of ${selectedUsers.length} users to ${bulkUserFields.role}?`)) return;
    Promise.all(selectedUsers.map(id => api.put(`/admin/users/${id}`, { role: bulkUserFields.role }))).then(() => { setMsg('Roles updated'); fetchUsers(); setSelectedUsers([]); });
  };

  // Service CRUD
  const handleDeleteService = id => {
    const prev = services.find(s => s._id === id);
    undoStack.current.push({ type: 'service', action: 'delete', data: prev });
    if (!window.confirm('Delete service?')) return;
    api.delete(`/admin/services/${id}`).then(() => { setMsg('Service deleted'); fetchServices(); });
  };
  const handleEditService = svc => setEditService({ ...svc });
  const handleSaveService = () => {
    api.put(`/admin/services/${editService._id}`, editService).then(() => { setMsg('Service updated'); setEditService(null); fetchServices(); });
  };
  const handleCreateService = () => {
    api.post('/services', editService).then(() => { setMsg('Service created'); setEditService(null); fetchServices(); });
  };

  const handleBulkDeleteServices = () => {
    const prev = services.filter(s => selectedServices.includes(s._id));
    undoStack.current.push({ type: 'service', action: 'bulkDelete', data: prev });
    if (!window.confirm(`Delete ${selectedServices.length} selected services?`)) return;
    Promise.all(selectedServices.map(id => api.delete(`/admin/services/${id}`))).then(() => { setMsg('Services deleted'); fetchServices(); setSelectedServices([]); });
  };
  const handleBulkEditServices = () => {
    const prev = services.filter(s => selectedServices.includes(s._id)).map(s => ({ ...s }));
    undoStack.current.push({ type: 'service', action: 'bulkEdit', data: prev });
    if (!bulkServiceFields.name && !bulkServiceFields.price && !bulkServiceFields.durationMinutes && !bulkServiceFields.description) return;
    Promise.all(selectedServices.map(id => api.put(`/admin/services/${id}`, {
      ...(bulkServiceFields.name && { name: bulkServiceFields.name }),
      ...(bulkServiceFields.price && { price: bulkServiceFields.price }),
      ...(bulkServiceFields.durationMinutes && { durationMinutes: bulkServiceFields.durationMinutes }),
      ...(bulkServiceFields.description && { description: bulkServiceFields.description })
    }))).then(() => { setMsg('Services updated'); fetchServices(); setSelectedServices([]); setBulkServiceFields({ name: '', price: '', durationMinutes: '', description: '' }); });
  };

  const handleUndo = () => {
    const last = undoStack.current.pop();
    if (!last) return;
    if (last.type === 'user') {
      if (last.action === 'delete') api.post('/admin/users', last.data).then(fetchUsers);
      if (last.action === 'bulkDelete') Promise.all(last.data.map(u => api.post('/admin/users', u))).then(fetchUsers);
      if (last.action === 'bulkEditRole' || last.action === 'bulkEdit') Promise.all(last.data.map(u => api.put(`/admin/users/${u._id}`, u))).then(fetchUsers);
    }
    if (last.type === 'service') {
      if (last.action === 'delete') api.post('/services', last.data).then(fetchServices);
      if (last.action === 'bulkDelete') Promise.all(last.data.map(s => api.post('/services', s))).then(fetchServices);
      if (last.action === 'bulkEdit') Promise.all(last.data.map(s => api.put(`/admin/services/${s._id}`, s))).then(fetchServices);
    }
    setMsg('Undo performed');
  };

  const handleBulkEditUsers = () => {
    const prev = users.filter(u => selectedUsers.includes(u._id)).map(u => ({ ...u }));
    undoStack.current.push({ type: 'user', action: 'bulkEdit', data: prev });
    const update = {};
    Object.entries(bulkUserFields).forEach(([k, v]) => { if (v) update[k] = v; });
    if (Object.keys(update).length === 0) return;
    Promise.all(selectedUsers.map(id => api.put(`/admin/users/${id}`, update)))
      .then(() => { setMsg('Users updated'); fetchUsers(); setSelectedUsers([]); setBulkUserFields({ firstName: '', lastName: '', email: '', role: '', password: '' }); setShowBulkEditUser(false); });
  };

  // Filtered, sorted, paginated users
  let filteredUsers = users.filter(u =>
    (u.firstName + ' ' + u.lastName + ' ' + u.email + ' ' + u.role)
      .toLowerCase().includes(userSearch.toLowerCase()) &&
    (userRoleFilter === 'all' || u.role === userRoleFilter)
  );
  filteredUsers = sortByMulti(filteredUsers, userSorts);
  const userPageCount = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice((userPage-1)*PAGE_SIZE, userPage*PAGE_SIZE);

  // Filtered, sorted, paginated services
  let filteredServices = services.filter(s =>
    (s.name + ' ' + s.description)
      .toLowerCase().includes(serviceSearch.toLowerCase())
  );
  filteredServices = sortByMulti(filteredServices, serviceSorts);
  const servicePageCount = Math.ceil(filteredServices.length / PAGE_SIZE);
  const pagedServices = filteredServices.slice((servicePage-1)*PAGE_SIZE, servicePage*PAGE_SIZE);

  // Get current admin id (for role restriction)
  const currentUserId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : '';
  const allPageUserIds = pagedUsers.map(u => u._id);
  const allChecked = allPageUserIds.length > 0 && allPageUserIds.every(id => selectedUsers.includes(id));
  const toggleAll = () => {
    if (allChecked) setSelectedUsers(selectedUsers.filter(id => !allPageUserIds.includes(id)));
    else setSelectedUsers([...selectedUsers, ...allPageUserIds.filter(id => !selectedUsers.includes(id))]);
  };
  const toggleUser = id => {
    setSelectedUsers(selectedUsers.includes(id) ? selectedUsers.filter(uid => uid !== id) : [...selectedUsers, id]);
  };

  // Excel export
  const handleExportUsersExcel = () => {
    const exportRows = selectedUsers.length ? users.filter(u => selectedUsers.includes(u._id)) : filteredUsers;
    exportToExcel(exportRows, ['firstName','lastName','email','role'], 'users.xlsx');
  };
  const handleExportServicesExcel = () => {
    const exportRows = selectedServices.length ? services.filter(s => selectedServices.includes(s._id)) : filteredServices;
    exportToExcel(exportRows, ['name','price','durationMinutes','description'], 'services.xlsx');
  };

  // Multi-column sort UI
  const toggleUserSort = key => {
    setUserSorts(prev => {
      const idx = prev.findIndex(s => s.key === key);
      if (idx === -1) return [...prev, { key, asc: true }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], asc: !copy[idx].asc };
      return copy;
    });
  };
  const toggleServiceSort = key => {
    setServiceSorts(prev => {
      const idx = prev.findIndex(s => s.key === key);
      if (idx === -1) return [...prev, { key, asc: true }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], asc: !copy[idx].asc };
      return copy;
    });
  };
  const sortIcon = (key, sorts) => {
    const idx = sorts.findIndex(s => s.key === key);
    if (idx === -1) return '';
    return (sorts[idx].asc ? '▲' : '▼') + (sorts.length > 1 ? ` (${idx+1})` : '');
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <div className="mb-6 flex gap-4">
        <button onClick={() => setTab('users')} className={`px-4 py-2 rounded ${tab === 'users' ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}>Users</button>
        <button onClick={() => setTab('services')} className={`px-4 py-2 rounded ${tab === 'services' ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}>Services</button>
      </div>
      {msg && <div className="mb-4 text-green-700">{msg}</div>}
      {tab === 'users' && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
            <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => setEditUser({ firstName:'', lastName:'', email:'', password:'', role:'client' })}>Add User</button>
            <input className="border rounded px-2 py-1 md:ml-4" placeholder="Search users..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} />
            <select className="border rounded px-2 py-1 md:ml-2" value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}>
              {ROLES.map(r => <option key={r} value={r}>{r[0].toUpperCase()+r.slice(1)}</option>)}
            </select>
            <button className="bg-blue-600 text-white px-3 py-1 rounded md:ml-2" onClick={handleExportUsersExcel}>Export Excel</button>
            <button className="bg-red-600 text-white px-3 py-1 rounded md:ml-2" disabled={!selectedUsers.length} onClick={handleBulkDelete}>Delete Selected</button>
            <button className="bg-yellow-600 text-white px-3 py-1 rounded md:ml-2" disabled={!selectedUsers.length} onClick={() => setShowBulkEditUser(true)}>Bulk Edit</button>
          </div>
          <table className="w-full border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                <th className="p-2 cursor-pointer" onClick={() => toggleUserSort('firstName')}>Name {sortIcon('firstName', userSorts)}</th>
                <th className="cursor-pointer" onClick={() => toggleUserSort('email')}>Email {sortIcon('email', userSorts)}</th>
                <th className="cursor-pointer" onClick={() => toggleUserSort('role')}>Role {sortIcon('role', userSorts)}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map(u => (
                <tr key={u._id}>
                  <td><input type="checkbox" checked={selectedUsers.includes(u._id)} onChange={() => toggleUser(u._id)} /></td>
                  <td className="p-2">{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <button className="text-blue-700 mr-2" onClick={() => handleEditUser(u)}>Edit</button>
                    <button className="text-red-700" onClick={() => handleDeleteUser(u._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2 mb-4">
            <button disabled={userPage===1} onClick={() => setUserPage(userPage-1)} className="px-3 py-1 rounded border">Prev</button>
            <span>Page {userPage} of {userPageCount||1}</span>
            <button disabled={userPage===userPageCount||userPageCount===0} onClick={() => setUserPage(userPage+1)} className="px-3 py-1 rounded border">Next</button>
          </div>
          {editUser && (
            <div className="border p-4 mb-4 rounded bg-gray-50">
              <h3 className="font-semibold mb-2">{editUser._id ? 'Edit User' : 'Add User'}</h3>
              <div className="flex flex-col gap-2">
                <input className="border rounded px-2 py-1" placeholder="First Name" value={editUser.firstName} onChange={e => setEditUser({ ...editUser, firstName: e.target.value })} />
                <input className="border rounded px-2 py-1" placeholder="Last Name" value={editUser.lastName} onChange={e => setEditUser({ ...editUser, lastName: e.target.value })} />
                <input className="border rounded px-2 py-1" placeholder="Email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
                <input className="border rounded px-2 py-1" placeholder="Password" type="password" value={editUser.password} onChange={e => setEditUser({ ...editUser, password: e.target.value })} />
                <select className="border rounded px-2 py-1" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                  <option value="client">Client</option>
                  <option value="professional">Professional</option>
                  {/* Only allow admin if not editing own account */}
                  {(!editUser._id || editUser._id !== currentUserId) && <option value="admin">Admin</option>}
                </select>
                <div className="flex gap-2 mt-2">
                  <button className="bg-pink-600 text-white px-3 py-1 rounded" onClick={e => { e.preventDefault(); editUser._id ? handleSaveUser() : handleCreateUser(); }}>{editUser._id ? 'Save' : 'Create'}</button>
                  <button className="bg-gray-400 text-white px-3 py-1 rounded" onClick={() => setEditUser(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 'services' && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
            <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => setEditService({ name:'', price:'', durationMinutes:'', description:'' })}>Add Service</button>
            <input className="border rounded px-2 py-1 md:ml-4" placeholder="Search services..." value={serviceSearch} onChange={e => { setServiceSearch(e.target.value); setServicePage(1); }} />
            <button className="bg-blue-600 text-white px-3 py-1 rounded md:ml-2" onClick={handleExportServicesExcel}>Export Excel</button>
          </div>
          <table className="w-full border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th><input type="checkbox" checked={allCheckedServices} onChange={toggleAllServices} /></th>
                <th className="cursor-pointer" onClick={() => toggleServiceSort('price')}>Price {sortIcon('price', serviceSorts)}</th>
                <th className="cursor-pointer" onClick={() => toggleServiceSort('durationMinutes')}>Duration {sortIcon('durationMinutes', serviceSorts)}</th>
                <th className="cursor-pointer" onClick={() => toggleServiceSort('description')}>Description {sortIcon('description', serviceSorts)}</th>
                <th className="cursor-pointer" onClick={() => setServiceSort({ key: 'price', asc: serviceSort.key==='price' ? !serviceSort.asc : true })}>Price {sortIcon('price', serviceSort)}</th>
                <th className="cursor-pointer" onClick={() => setServiceSort({ key: 'durationMinutes', asc: serviceSort.key==='durationMinutes' ? !serviceSort.asc : true })}>Duration {sortIcon('durationMinutes', serviceSort)}</th>
                <th className="cursor-pointer" onClick={() => setServiceSort({ key: 'description', asc: serviceSort.key==='description' ? !serviceSort.asc : true })}>Description {sortIcon('description', serviceSort)}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedServices.map(s => (
                <tr key={s._id}>
                  <td><input type="checkbox" checked={selectedServices.includes(s._id)} onChange={() => toggleService(s._id)} /></td>
                  <td>{s.price}</td>
                  <td>{s.durationMinutes} min</td>
                  <td>{s.description}</td>
                  <td>
                    <button className="text-blue-700 mr-2" onClick={() => handleEditService(s)}>Edit</button>
                    <button className="text-red-700" onClick={() => handleDeleteService(s._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2 mb-4">
            <button disabled={servicePage===1} onClick={() => setServicePage(servicePage-1)} className="px-3 py-1 rounded border">Prev</button>
            <span>Page {servicePage} of {servicePageCount||1}</span>
            <button disabled={servicePage===servicePageCount||servicePageCount===0} onClick={() => setServicePage(servicePage+1)} className="px-3 py-1 rounded border">Next</button>
          </div>
          {editService && (
            <div className="border p-4 mb-4 rounded bg-gray-50">
              <h3 className="font-semibold mb-2">{editService._id ? 'Edit Service' : 'Add Service'}</h3>
              <div className="flex flex-col gap-2">
                <input className="border rounded px-2 py-1" placeholder="Name" value={editService.name} onChange={e => setEditService({ ...editService, name: e.target.value })} />
                <input className="border rounded px-2 py-1" placeholder="Price" type="number" value={editService.price} onChange={e => setEditService({ ...editService, price: e.target.value })} />
                <input className="border rounded px-2 py-1" placeholder="Duration (min)" type="number" value={editService.durationMinutes} onChange={e => setEditService({ ...editService, durationMinutes: e.target.value })} />
                <textarea className="border rounded px-2 py-1" placeholder="Description" value={editService.description} onChange={e => setEditService({ ...editService, description: e.target.value })} />
                <div className="flex gap-2 mt-2">
                  <button className="bg-pink-600 text-white px-3 py-1 rounded" onClick={e => { e.preventDefault(); editService._id ? handleSaveService() : handleCreateService(); }}>{editService._id ? 'Save' : 'Create'}</button>
                  <button className="bg-gray-400 text-white px-3 py-1 rounded" onClick={() => setEditService(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
