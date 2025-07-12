'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiUserPlus, FiUsers, FiUserCheck, FiUser, FiAlertCircle, FiSearch, FiPlus, FiX, FiCheckCircle, FiBriefcase, FiClock } from 'react-icons/fi';
import Sidebar from '../../../components/Sidebar';
import Topbar from '../../../components/Topbar';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  photo?: string;
}

type ModalType = 'create' | 'edit' | null;

const roles = [
  { value: "hr-keuangan", label: "HR & Keuangan" },
  { value: "karyawan", label: "Karyawan Muslim" },
  { value: "umkm-amil", label: "UMKM Syariah & Lembaga Amil Zakat" },
];

// Helper function to get role label
const getRoleLabel = (roleValue: string) => {
  const role = roles.find(r => r.value === roleValue);
  return role ? role.label : roleValue;
};

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: roles[0].value
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        setLoadingUser(true);
        try {
          const token = await user.getIdToken();
          // Fetch user profile from API
          const res = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Unauthorized');
          const profile = await res.json();
        if (!profile || profile.role !== 'hr-keuangan') {
          await signOut(auth);
          router.push('/login');
          return;
        }
          setUserData({ ...profile, uid: user.uid });
        } catch {
          await signOut(auth);
          router.push('/login');
        } finally {
        setLoadingUser(false);
        }
      } else {
      setLoadingUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const token = await user.getIdToken();
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch employees');
      const employeeData = await res.json();
      setEmployees(employeeData);
    } catch (err) {
      setError('Failed to fetch employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    try {
      setDeleteLoading(employeeId);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const token = await user.getIdToken();
      const res = await fetch(`/api/users/${employeeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(`Failed to delete employee: ${err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const token = await user.getIdToken();
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        await fetchEmployees();
        setModalType(null);
        setFormData({ name: '', email: '', password: '', role: roles[0].value });
        setTimeout(() => setFormError(null), 500);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const token = await user.getIdToken();
      const res = await fetch(`/api/users/${selectedEmployee.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: formData.role })
      });
      const result = await res.json();
      if (result.success) {
        await fetchEmployees();
        setModalType(null);
        setSelectedEmployee(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(prev => ({ ...prev, role: employee.role }));
    setModalType('edit');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedEmployee(null);
    setFormData({ name: '', email: '', password: '', role: roles[0].value });
    setFormError(null);
  };

  const filteredEmployees = employees.filter(employee =>
    (employee.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (employee.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (employee.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );



  if (loading || loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F6F8FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C570]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex">
      <Sidebar active="Employees" />
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed top-0 left-0 z-30 w-60 h-full bg-white border-r border-gray-100 py-8 px-6">
          <Sidebar active="Employees" />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar
          userName={userData?.name || "Bapak/Ibu HR"}
          userRole={userData?.role || "HR"}
          userPhoto={userData?.photo}
          loading={loadingUser}
        />

        {/* Page Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Islamic Quote Banner */}
          <div className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <FiUsers className="text-yellow-300 text-xl" />
              <h2 className="text-lg font-semibold">Bismillahirrahmanirrahim</h2>
            </div>
            <div className="mb-2 text-right font-arabic text-2xl leading-relaxed">
              إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ وَإِيتَاءِ ذِي الْقُرْبَى
            </div>
            <div className="text-sm opacity-90 mb-1">
              Sesungguhnya Allah menyuruh (kamu) berlaku adil dan berbuat kebajikan, memberi bantuan kepada kerabat
            </div>
            <div className="text-xs opacity-75 font-medium">
              QS. An-Nahl: 90
            </div>
          </div>

          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <span className="text-emerald-600">👥</span>
                Manajemen Karyawan
              </h1>
              <p className="text-gray-600">Kelola dan pantau karyawan organisasi sesuai prinsip syariah dan keadilan.</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-emerald-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-emerald-200 text-lg">👥</div>
              <div className="text-xs text-gray-500 mb-2 font-medium">Total Karyawan</div>
              <div className="text-xl font-bold text-emerald-700">{employees.length}</div>
              <div className="text-xs text-emerald-600 mt-1">Semua Karyawan</div>
            </div>
            <div className="bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-teal-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-teal-200 text-lg">✅</div>
              <div className="text-xs text-gray-500 mb-2 font-medium">Aktif</div>
              <div className="text-xl font-bold text-teal-700">{employees.filter(e => e.role !== 'inactive').length}</div>
              <div className="text-xs text-teal-600 mt-1">Karyawan Aktif</div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-purple-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-purple-200 text-lg">💼</div>
              <div className="text-xs text-gray-500 mb-2 font-medium">HR Staff</div>
              <div className="text-xl font-bold text-purple-700">{employees.filter(e => e.role === 'hr-keuangan').length}</div>
              <div className="text-xs text-purple-600 mt-1">Staff HR</div>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-amber-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-amber-200 text-lg">🆕</div>
              <div className="text-xs text-gray-500 mb-2 font-medium">Baru Bulan Ini</div>
              <div className="text-xl font-bold text-amber-700">3</div>
              <div className="text-xs text-amber-600 mt-1">Karyawan Baru</div>
            </div>
          </div>

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl animate-fadeIn flex items-center gap-2">
              <FiAlertCircle className="text-xl" />
              {error}
                              <button 
                  className="ml-auto text-lg text-gray-400 hover:text-gray-700"
                  onClick={() => setError(null)}
                >
                  <FiX />
                </button>
            </div>
          )}

          {/* Create/Edit User Modal */}
          {modalType && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 relative animate-fadeIn border border-emerald-100">
                <button
                  onClick={closeModal}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
                
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FiUserPlus className="text-emerald-600" />
                  {modalType === 'create' ? 'Tambah Karyawan Baru' : 'Edit Role Karyawan'}
                </h2>
                <p className="text-sm text-gray-600 mb-4">"Sesungguhnya Allah menyukai orang-orang yang berbuat kebajikan" - QS. Al-Baqarah: 195</p>

                {formError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
                    {formError}
                  </div>
                )}

                <form onSubmit={modalType === 'create' ? handleCreateUser : handleUpdateRole}>
                  {modalType === 'create' && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.659 1.591l-7.09 7.09a2.25 2.25 0 01-3.182 0l-7.09-7.09A2.25 2.25 0 012.25 6.993V6.75" />
                            </svg>
                          </span>
                          <input
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.125a4.125 4.125 0 10-8.25 0V10.5m12.375 0A2.625 2.625 0 0017.25 21h-10.5a2.625 2.625 0 01-2.625-2.625v-7.875A2.625 2.625 0 016.75 7.875h10.5a2.625 2.625 0 012.625 2.625v7.875z" />
                            </svg>
                          </span>
                          <input
                            type="password"
                            required
                            className="w-full pl-10 pr-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    >
                      {roles.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                        {modalType === 'create' ? 'Membuat...' : 'Mengupdate...'}
                      </>
                    ) : (
                      modalType === 'create' ? 'Buat Karyawan' : 'Update Role'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Search and Actions Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 border border-emerald-100">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FiSearch className="text-emerald-500 flex-shrink-0" size={20} />
                  <input
                    type="text"
                    placeholder="Cari karyawan..."
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Add Button */}
              <button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl w-full lg:w-auto justify-center"
                onClick={() => setModalType('create')}
              >
                <FiPlus size={20} />
                Tambah Karyawan
              </button>
            </div>
          </div>

          {/* Employee Table */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden mb-10">
            <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-emerald-600">📋</span>
                Daftar Karyawan
              </h3>
              <p className="text-sm text-gray-600 mt-1">"Sesungguhnya Allah menyukai orang-orang yang berbuat kebajikan" - QS. Al-Baqarah: 195</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-emerald-100">
                <thead className="bg-emerald-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Karyawan
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-emerald-50">
                  {filteredEmployees.map((employee, idx) => (
                    <tr 
                      key={employee.id}
                      className="hover:bg-emerald-50/60 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {employee.photo ? (
                              <Image
                                className="h-10 w-10 rounded-lg object-cover"
                                src={employee.photo}
                                alt={employee.name}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <span className="text-emerald-600 text-lg font-semibold">{employee.name[0]}</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{employee.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.role === 'hr-keuangan' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          employee.role === 'karyawan' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {getRoleLabel(employee.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                            onClick={() => openEditModal(employee)}
                          >
                            Edit Role
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            disabled={deleteLoading === employee.id}
                          >
                            {deleteLoading === employee.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEmployees.length === 0 && (
                <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                  <FiUserPlus className="text-4xl mb-2 text-emerald-200" />
                  <div className="font-semibold">Tidak ada karyawan ditemukan.</div>
                  <div className="text-xs">Coba tambah karyawan baru atau ubah kata kunci pencarian.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
