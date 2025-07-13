"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import Topbar from "../../../components/Topbar";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseApi"; // Import the initialized auth instance
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function AIHRPage() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Assalamu'alaikum! Saya asisten AI HR Anda. Silakan ajukan pertanyaan terkait data HR & Keuangan." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();

  // Example questions
  const exampleQuestions = [
    "Siapa karyawan yang belum digaji bulan ini?",
    "Berapa total gaji yang sudah dibayarkan bulan ini?",
    "Tampilkan tugas HR untuk hari ini.",
    "Siapa saja karyawan yang menerima tunjangan?",
  ];

  // Auth and fetch real user profile (like dashboard)
  useEffect(() => {
    // const auth = getAuth(); // No longer need to call this
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoadingUser(true);
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch profile');
          }

          const profile = await response.json();
          if (!profile || profile.role !== "hr-keuangan") {
            await signOut(auth);
            router.push("/login");
            return;
          }
          setUserData({ ...profile, uid: user.uid });
        } catch (error) {
          console.error("Auth error, signing out: ", error);
          await signOut(auth);
          router.push("/login");
        } finally {
          setLoadingUser(false);
        }
      } else {
        setLoadingUser(false);
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // This function is no longer needed.
  // async function fetchContextData() {
  //   const res = await fetch('/api/hr-data');
  //   if (!res.ok) throw new Error('Gagal mengambil data HR');
  //   return await res.json();
  // }

  async function handleAsk(question: string) {
    // 1. Construct the new history that will be sent to the API.
    const userMessage = { role: "user", text: question };
    const newHistory = [...messages, userMessage];

    // 2. Optimistically update the UI so the user sees their message immediately.
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      // 3. Call the API with the new, complete history.
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newHistory }),
      });

      const data = await res.json();
      const answer = (res.ok && data.answer) 
        ? data.answer 
        : (data.error || "Maaf, AI tidak dapat menjawab saat ini.");
      
      // 4. Update the UI with the AI's response.
      setMessages(prev => [...prev, { role: "ai", text: answer }]);

    } catch (error: any) {
        const errorMessage = { role: 'ai', text: error.message || "Terjadi kesalahan." };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      {/* Sidebar: desktop & mobile */}
      <Sidebar active="ZafraAI" />
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar
          userName={userData?.name || "Bapak/Ibu HR"}
          userRole={userData?.role || "HR"}
          userPhoto={userData?.photo}
          loading={loadingUser}
        />
        <section className="px-2 pb-24 sm:px-4 md:px-8 py-6 flex flex-col gap-8 w-full max-w-[800px] mx-auto">
          <div className="w-full bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-[#e0e0e0] mt-4">
            <h1 className="text-2xl font-bold mb-2 text-[#00C570]">AI HR Assistant</h1>
            <div className="flex flex-wrap gap-2 mb-2">
              {exampleQuestions.map((q, i) => (
                <button key={i} className="bg-[#E6FFF4] text-[#00C570] px-3 py-1 rounded-full text-xs hover:bg-[#00C570] hover:text-white transition" onClick={() => { setInput(q); }}>
                  {q}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-[200px] max-h-96 overflow-y-auto flex flex-col gap-2 bg-gray-50 rounded p-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                  <div className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${msg.role === "ai" ? "bg-[#E6FFF4] text-gray-800" : "bg-[#00C570] text-white"}`}>
                    {msg.role === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                  </div>
                </div>
              ))}
              {loading && <div className="text-xs text-gray-400">AI sedang memproses...</div>}
            </div>
            <form className="flex gap-2 mt-2" onSubmit={e => { e.preventDefault(); if (input.trim()) { handleAsk(input.trim()); } }}>
              <input
                className="flex-1 text-slate-900 border rounded-xl px-3 py-2 text-sm focus:outline-[#00C570]"
                placeholder="Tulis pertanyaan Anda..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="bg-[#00C570] text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-60" disabled={loading || !input.trim()}>
                Kirim
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
