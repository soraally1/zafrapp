import { useState, useEffect, useMemo } from 'react';
import { IoMdClose } from 'react-icons/io';

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => Promise<void>; // Accepts any data, parent handles API
  payrollData?: Partial<any>;
  employeeData?: {
    id: string;
    name: string;
    position: string;
  };
  mode?: 'payroll' | 'default';
  defaultData?: any;
}

export default function PayrollModal({ isOpen, onClose, onSave, payrollData, employeeData, mode = 'payroll', defaultData }: PayrollModalProps) {
  const isDefault = mode === 'default';
  const [formData, setFormData] = useState<any>(
    isDefault
      ? defaultData || {
          defaultBasicSalary: 0,
          defaultAllowances: { transport: 0, meals: 0, housing: 0, other: 0 },
          defaultDeductions: { bpjs: 0, tax: 0, loans: 0, other: 0 },
        }
      : {
          basicSalary: 0,
          allowances: { transport: 0, meals: 0, housing: 0, other: 0 },
          deductions: { bpjs: 0, tax: 0, loans: 0, other: 0 },
        }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDefault) {
      setFormData(
        defaultData || {
          defaultBasicSalary: 0,
          defaultAllowances: { transport: 0, meals: 0, housing: 0, other: 0 },
          defaultDeductions: { bpjs: 0, tax: 0, loans: 0, other: 0 },
        }
      );
    } else if (payrollData) {
      setFormData({
        ...payrollData,
        allowances: {
          transport: payrollData.allowances?.transport || 0,
          meals: payrollData.allowances?.meals || 0,
          housing: payrollData.allowances?.housing || 0,
          other: payrollData.allowances?.other || 0,
        },
        deductions: {
          bpjs: payrollData.deductions?.bpjs || 0,
          tax: payrollData.deductions?.tax || 0,
          loans: payrollData.deductions?.loans || 0,
          other: payrollData.deductions?.other || 0,
        },
      });
    } else if (employeeData) {
      setFormData((prev: any) => ({
        ...prev,
        userId: employeeData.id,
        employeeName: employeeData.name,
        position: employeeData.position,
      }));
    }
  }, [payrollData, employeeData, isDefault, defaultData]);

  // Live summary calculation
  const totalAllowances = useMemo(() => {
    const a = isDefault ? formData.defaultAllowances : formData.allowances;
    if (!a) return 0;
    const { transport = 0, meals = 0, housing = 0, other = 0 } = a;
    return transport + meals + housing + other;
  }, [formData, isDefault]);
  const totalDeductions = useMemo(() => {
    const d = isDefault ? formData.defaultDeductions : formData.deductions;
    if (!d) return 0;
    const { bpjs = 0, tax = 0, loans = 0, other = 0 } = d;
    return bpjs + tax + loans + other;
  }, [formData, isDefault]);
  const totalIncome = (isDefault ? formData.defaultBasicSalary : formData.basicSalary) || 0 + totalAllowances;
  const zakat = totalIncome >= 5000000 ? totalIncome * 0.025 : 0;
  const netSalary = totalIncome - totalDeductions - zakat;

  // Validation
  const isValid = isDefault
    ? (formData.defaultBasicSalary || 0) > 0 &&
      Object.values(formData.defaultAllowances || {}).every((v) => Number(v) >= 0) &&
      Object.values(formData.defaultDeductions || {}).every((v) => Number(v) >= 0)
    : (formData.basicSalary || 0) > 0 &&
      Object.values(formData.allowances || {}).every((v) => Number(v) >= 0) &&
      Object.values(formData.deductions || {}).every((v) => Number(v) >= 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      if (isDefault) {
        if (!employeeData?.id) {
          setError("ID karyawan tidak ditemukan");
          setLoading(false);
          return;
        }
        // Save to user profile via parent onSave
        await onSave?.(formData);
        onClose();
      } else {
        await onSave?.(formData);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data gaji');
    } finally {
      setLoading(false);
    }
  };

  const updateAllowance = (field: string, value: number) => {
    if (!field) return;
    if (isDefault) {
      setFormData((prev: any) => ({
        ...prev,
        defaultAllowances: {
          ...prev.defaultAllowances,
          [field]: value < 0 ? 0 : value,
        },
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        allowances: {
          ...prev.allowances,
          [field]: value < 0 ? 0 : value,
        },
      }));
    }
  };

  const updateDeduction = (field: string, value: number) => {
    if (!field) return;
    if (isDefault) {
      setFormData((prev: any) => ({
        ...prev,
        defaultDeductions: {
          ...prev.defaultDeductions,
          [field]: value < 0 ? 0 : value,
        },
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        deductions: {
          ...prev.deductions,
          [field]: value < 0 ? 0 : value,
        },
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <IoMdClose size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-2">
          {isDefault
            ? 'Kelola Default Gaji'
            : payrollData
            ? 'Edit Data Gaji'
            : 'Tambah Data Gaji'}
        </h2>
        {(employeeData || payrollData) && (
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{employeeData?.name || payrollData?.employeeName}</span>
            {' '}- {employeeData?.position || payrollData?.position}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gaji Pokok */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isDefault ? 'Default Gaji Pokok' : 'Gaji Pokok'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all"
              value={isDefault ? formData.defaultBasicSalary : formData.basicSalary || ''}
              onChange={(e) =>
                isDefault
                  ? setFormData((prev: any) => ({ ...prev, defaultBasicSalary: Math.max(0, Number(e.target.value)) }))
                  : setFormData((prev: any) => ({ ...prev, basicSalary: Math.max(0, Number(e.target.value)) }))
              }
            />
          </div>

          {/* Tunjangan */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Tunjangan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all"
                  value={isDefault ? formData.defaultAllowances?.transport || '' : formData.allowances?.transport || ''}
                  onChange={(e) => updateAllowance('transport', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Makan
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all"
                  value={isDefault ? formData.defaultAllowances?.meals || '' : formData.allowances?.meals || ''}
                  onChange={(e) => updateAllowance('meals', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempat Tinggal
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all"
                  value={isDefault ? formData.defaultAllowances?.housing || '' : formData.allowances?.housing || ''}
                  onChange={(e) => updateAllowance('housing', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lainnya
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all"
                  value={isDefault ? formData.defaultAllowances?.other || '' : formData.allowances?.other || ''}
                  onChange={(e) => updateAllowance('other', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Potongan */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Potongan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BPJS
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all"
                  value={isDefault ? formData.defaultDeductions?.bpjs || '' : formData.deductions?.bpjs || ''}
                  onChange={(e) => updateDeduction('bpjs', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pajak
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all"
                  value={isDefault ? formData.defaultDeductions?.tax || '' : formData.deductions?.tax || ''}
                  onChange={(e) => updateDeduction('tax', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pinjaman
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all"
                  value={isDefault ? formData.defaultDeductions?.loans || '' : formData.deductions?.loans || ''}
                  onChange={(e) => updateDeduction('loans', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lainnya
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all"
                  value={isDefault ? formData.defaultDeductions?.other || '' : formData.deductions?.other || ''}
                  onChange={(e) => updateDeduction('other', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Live Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mt-2 flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><span>Total Tunjangan</span><span className="font-semibold">{totalAllowances.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span></div>
            <div className="flex justify-between"><span>Total Potongan</span><span className="font-semibold">{totalDeductions.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span></div>
            <div className="flex justify-between"><span>Zakat (2.5%)</span><span className="font-semibold">{zakat > 0 ? zakat.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }) : '-'}</span></div>
            <div className="flex justify-between text-base font-bold text-[#00C570]"><span>Estimasi Gaji Bersih</span><span>{netSalary.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span></div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="bg-[#00C570] hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                isDefault ? 'Simpan Default' : 'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 