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
    <header className="sticky top-0 z-20 w-full bg-gradient-to-r from-[#E6FFF4]/80 via-white/80 to-[#F0FFF8]/80 backdrop-blur-lg border-b border-gray-100 flex items-center justify-between gap-4 px-2 xs:px-3 sm:px-8 py-3 sm:py-5 shadow-xl transition-shadow">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-xs text-gray-500">Assalamu'alaikum,</span>
        {loading ? (
          <span className="h-7 w-32 sm:w-40 bg-gray-200 rounded animate-pulse mb-1" />
        ) : (
          <span className="font-extrabold text-lg xs:text-xl sm:text-2xl md:text-3xl text-gray-900 tracking-tight font-jakarta drop-shadow-sm flex flex-wrap items-center gap-2 max-w-full">
            <span className="truncate max-w-[50vw] sm:max-w-xs">{userName}</span>
            {userRole && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[#00C570]/10 text-[#00C570] text-xs font-semibold border border-[#00C570]/30 animate-fadeIn truncate max-w-[30vw] sm:max-w-[120px]">
                {userRole}
              </span>
            )}
          </span>
        )}
        <span className="text-xs text-gray-400 font-medium max-w-full truncate">Selamat datang di ZAFRA Payroll & Keuangan Syariah</span>
        {/* Islamic Quote */}
        <div className="mt-2 bg-white/80 border-l-4 border-[#00C570] pl-3 pr-2 py-2 rounded-lg text-xs xs:text-sm italic text-gray-700 max-w-full sm:max-w-xs shadow-md flex gap-2 items-start relative animate-fadeIn">
          <span className="text-[#00C570] text-lg absolute -left-3 top-1">"</span>
          <span className="flex-1">{quote.text}</span>
          <span className="block text-[10px] text-gray-400 text-right mt-0.5 w-20 shrink-0">{quote.source}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 relative flex-shrink-0">
        {/* User Avatar Dropdown */}
        <button
          className="relative group w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white shadow-lg overflow-hidden flex items-center justify-center text-[#00C570] font-bold text-lg border-2 border-[#00C570]/10 select-none transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#00C570] hover:border-[#00C570]/40"
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
                sizes="36px, (min-width: 640px) 44px"
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                onError={handleImageError}
                priority
              />
            </div>
          ) : (
            <div className="w-full h-full bg-[#00C570]/10 flex items-center justify-center">
              <span className="text-[#00C570] text-lg sm:text-xl font-semibold">
                {userName?.charAt(0) || "Z"}
              </span>
            </div>
          )}
          <div className="absolute -top-1 -right-1">
            <div className="bg-[#E6FFF4] rounded-full p-1 border border-[#00C570]/20 shadow">
              <Image 
                src="/zafra.svg" 
                alt="ZAFRA" 
                width={14} 
                height={14}
                className="sm:w-4 sm:h-4"
                priority
              />
            </div>
          </div>
        </button>
        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-12 sm:top-14 w-44 xs:w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fadeInDropdown origin-top-right">
            <button
              className="w-full text-left px-4 sm:px-5 py-2 text-gray-700 hover:bg-[#E6FFF4] hover:text-[#00C570] font-medium rounded-t-2xl transition-colors flex items-center gap-2 duration-150"
              onClick={() => { setDropdownOpen(false); router.push("/Profile"); }}
            >
              <IoMdPerson size={18} />
              Profil Saya
            </button>
            <button
              className="w-full text-left px-4 sm:px-5 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium rounded-b-2xl transition-colors flex items-center gap-2 duration-150"
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