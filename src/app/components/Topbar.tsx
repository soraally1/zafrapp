import { useState, useEffect } from 'react';
import Image from 'next/image';
import { IoMdPerson, IoMdLogOut } from 'react-icons/io';
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";

interface TopbarProps {
  userName: string;
  userRole?: string;
  userPhoto?: string;
  loading?: boolean;
}

// Add Islamic quotes/Quranic excerpts (Indonesian)
const ISLAMIC_QUOTES = [
  {
    text: 'Berikan takaran dan timbangan dengan adil.',
    source: 'QS. Al-An’am: 152',
  },
  {
    text: 'Sesungguhnya Allah menyuruh kamu menyampaikan amanat kepada yang berhak menerimanya...',
    source: 'QS. An-Nisa: 58',
  },
  {
    text: 'Dan dirikanlah shalat, tunaikanlah zakat...',
    source: 'QS. Al-Baqarah: 43',
  },
  {
    text: 'Wahai orang-orang yang beriman! Janganlah kamu saling memakan harta sesamamu dengan jalan yang batil...',
    source: 'QS. An-Nisa: 29',
  },
  {
    text: 'Dan tolong-menolonglah kamu dalam (mengerjakan) kebajikan dan takwa...',
    source: 'QS. Al-Ma’idah: 2',
  },
];

export default function Topbar({ userName, userRole, userPhoto, loading = false }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  // Pick a random quote only on the client to avoid hydration mismatch
  const [quote, setQuote] = useState(ISLAMIC_QUOTES[0]);
  useEffect(() => {
    setQuote(ISLAMIC_QUOTES[Math.floor(Math.random() * ISLAMIC_QUOTES.length)]);
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-white/60 backdrop-blur-lg border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 py-4 md:py-5">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-gray-500">Assalamu'alaikum,</span>
        {loading ? (
          <span className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-1" />
        ) : (
          <span className="font-extrabold text-2xl md:text-3xl text-gray-900 tracking-tight font-jakarta">{userName}</span>
        )}
        <span className="text-xs text-gray-400 font-medium">{userRole && `Role: ${userRole}`}</span>
        <span className="text-xs text-gray-400 font-medium">Selamat datang di ZAFRA Payroll & Keuangan Syariah</span>
        {/* Islamic Quote */}
        <div className="mt-2 bg-[#E6FFF4]/60 border-l-4 border-[#00C570] pl-3 pr-2 py-1 rounded text-xs italic text-gray-700 max-w-xs shadow-sm">
          “{quote.text}”
          <span className="block text-[10px] text-gray-400 text-right mt-0.5">{quote.source}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 relative">
        {/* User Avatar Dropdown */}
        <button
          className="relative group w-10 h-10 rounded-xl bg-white shadow overflow-hidden flex items-center justify-center text-[#00C570] font-bold text-lg border border-gray-100 select-none transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#00C570]"
          title="Lihat Profil"
          onClick={() => setDropdownOpen((v) => !v)}
          tabIndex={0}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
        >
          {userPhoto && !imageError ? (
            <div className="relative w-full h-full">
              <Image
                src={userPhoto}
                alt={`${userName}'s avatar`}
                fill
                sizes="40px"
                className="object-cover"
                onError={handleImageError}
                priority
              />
            </div>
          ) : (
            <div className="w-full h-full bg-[#00C570]/10 flex items-center justify-center">
              <span className="text-[#00C570] text-xl font-semibold">
                {userName?.charAt(0) || "Z"}
              </span>
            </div>
          )}
          <div className="absolute -top-1 -right-1">
            <div className="bg-[#E6FFF4] rounded-full p-1">
              <Image 
                src="/zafra.svg" 
                alt="ZAFRA" 
                width={16} 
                height={16}
                priority
              />
            </div>
          </div>
        </button>
        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-12 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeIn">
            <button
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-[#E6FFF4] hover:text-[#00C570] font-medium rounded-t-xl transition-colors flex items-center gap-2"
              onClick={() => { setDropdownOpen(false); router.push("/Profile"); }}
            >
              <IoMdPerson size={18} />
              Profil Saya
            </button>
            <button
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium rounded-b-xl transition-colors flex items-center gap-2"
              onClick={handleLogout}
            >
              <IoMdLogOut size={18} />
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
} 