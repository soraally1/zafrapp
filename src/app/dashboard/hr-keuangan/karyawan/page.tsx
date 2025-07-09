'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, deleteUser, getUser, createUser, updateUserRole } from '@/app/api/service/firebaseUserService';
import Image from 'next/image';
import { IoMdSearch, IoMdAdd, IoMdPerson, IoMdLogOut, IoMdClose, IoMdCheckmarkCircleOutline, IoMdPeople, IoMdBriefcase, IoMdTime } from 'react-icons/io';
import { FiUserPlus, FiUsers, FiUserCheck, FiUser, FiAlertCircle } from 'react-icons/fi';
import Sidebar from '../../../components/Sidebar';
import Topbar from '../../../components/Topbar';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getUserProfile } from '@/app/api/service/userProfileService';

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
        // Fetch real user profile from Firestore
        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== 'hr-keuangan') {
          await signOut(auth);
          router.push('/login');
          return;
        }
        setUserData({ ...profile, uid: user.uid }); // Ensure uid is always present
        setLoadingUser(false);
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
      const employeeData = await getAllUsers();
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
      const result = await deleteUser(employeeId);
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
      const result = await createUser(formData);
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
      const result = await updateUserRole(selectedEmployee.id, formData.role);
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

  const stats = [
    { label: 'Total Employees', value: employees.length, icon: <FiUsers className="text-2xl text-blue-500" />, color: 'bg-blue-500' },
    { label: 'Active', value: employees.filter(e => e.role !== 'inactive').length, icon: <FiUserCheck className="text-2xl text-green-500" />, color: 'bg-green-500' },
    { label: 'HR Staff', value: employees.filter(e => e.role === 'hr-keuangan').length, icon: <IoMdBriefcase className="text-2xl text-purple-500" />, color: 'bg-purple-500' },
    { label: 'New This Month', value: '3', icon: <IoMdTime className="text-2xl text-orange-500" />, color: 'bg-orange-500' }
  ];

  if (loading || loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F6F8FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C570]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
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
        <div className="p-6 md:p-8">
          <div className="max-w-[1600px] mx-auto">
            {/* Rest of the existing content */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Employee Management</h1>
              <p className="text-gray-600">Manage and monitor your organization's employees</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, idx) => (
                <div
                  key={stat.label}
                  className="bg-white/60 backdrop-blur-lg border border-[#e0e0e0] rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl hover:ring-2 hover:ring-[#00C570]/30 group"
                  style={{ animation: `fadeInUp 0.4s ${idx * 0.1}s both` }}
                >
                  <span className="mb-2">{stat.icon}</span>
                  <span className="text-gray-500 text-sm mb-1">{stat.label}</span>
                  <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl animate-fadeIn flex items-center gap-2">
                <FiAlertCircle className="text-xl" />
                {error}
                <button 
                  className="ml-auto text-lg text-gray-400 hover:text-gray-700"
                  onClick={() => setError(null)}
                >
                  <IoMdClose />
                </button>
              </div>
            )}

            {/* Create/Edit User Modal */}
            {modalType && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 relative animate-fadeIn">
                  <button
                    onClick={closeModal}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                  >
                    <IoMdClose size={24} />
                  </button>
                  
                  <h2 className="text-2xl font-bold mb-4">
                    {modalType === 'create' ? 'Add New Employee' : 'Edit Employee Role'}
                  </h2>

                  {formError && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
                      {formError}
                    </div>
                  )}

                  <form onSubmit={modalType === 'create' ? handleCreateUser : handleUpdateRole}>
                    {modalType === 'create' && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all hover:border-[#00C570]"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
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
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all hover:border-[#00C570]"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
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
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all hover:border-[#00C570]"
                              value={formData.password}
                              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all hover:border-[#00C570]"
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
                      className="w-full bg-[#00C570] hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {formLoading ? (
                        <>
                          <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                          {modalType === 'create' ? 'Creating...' : 'Updating...'}
                        </>
                      ) : (
                        modalType === 'create' ? 'Create Employee' : 'Update Role'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Search and Actions Bar */}
            <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg p-4 mb-6 border border-[#e0e0e0] flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <IoMdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className="bg-[#00C570] hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                onClick={() => setModalType('create')}
              >
                <IoMdAdd size={20} />
                Add Employee
              </button>
            </div>

            {/* Employee Table */}
            <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-[#e0e0e0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/40 divide-y divide-gray-200">
                    {filteredEmployees.map((employee, idx) => (
                      <tr 
                        key={employee.id}
                        className="hover:bg-gray-50/50 transition-colors"
                        style={{ animation: `fadeInUp 0.4s ${idx * 0.05}s both` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {employee.photo ? (
                                <Image
                                  className="h-10 w-10 rounded-xl object-cover"
                                  src={employee.photo}
                                  alt={employee.name}
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-[#00C570]/10 flex items-center justify-center">
                                  <span className="text-[#00C570] text-lg font-semibold">{employee.name[0]}</span>
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
                            employee.role === 'hr-keuangan' ? 'bg-purple-100 text-purple-800' :
                            employee.role === 'karyawan' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {getRoleLabel(employee.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            <button
                              className="text-[#00C570] hover:text-green-700 font-medium transition-colors"
                              onClick={() => openEditModal(employee)}
                            >
                              Edit Role
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleDeleteEmployee(employee.id)}
                              disabled={deleteLoading === employee.id}
                            >
                              {deleteLoading === employee.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredEmployees.length === 0 && (
                <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                  <FiUserPlus className="text-4xl mb-2" />
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
