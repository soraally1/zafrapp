import { useState, useEffect, useRef } from 'react';
import { FiX, FiSend, FiLoader, FiSave, FiCheckCircle, FiAlertTriangle, FiHelpCircle, FiMessageCircle, FiShield } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Transaction {
  id: string;
  description: string;
  category: string;
  nominal: number;
  type: 'income' | 'expense';
  date: string;
  shariaStatus?: 'Halal' | 'Haram' | 'Syubhat';
  aiStatus?: string;
  aiExplanation?: string;
}

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface FinalResult {
  status: string;
  explanation: string;
  confidence_score: number;
}

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (status: string, explanation: string) => void;
  transaction: Transaction | null;
}

// Helper to get status icon and color
const getStatusDetails = (status: string) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('halal')) {
    return { 
      Icon: FiCheckCircle, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-100'
    };
  }
  if (lowerStatus.includes('haram')) {
    return { 
      Icon: FiAlertTriangle, 
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-100'
    };
  }
  return { 
    Icon: FiHelpCircle, 
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconBg: 'bg-amber-100'
  };
};

export default function VerificationModal({ isOpen, onClose, onSave, transaction }: VerificationModalProps) {
  const [history, setHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      const welcomeMessage: Message = {
        role: 'model',
        parts: [{
          text: `Assalamualaikum. Saya adalah asisten AI yang akan membantu Anda memverifikasi transaksi berikut:\n\n- **Deskripsi:** ${transaction.description}\n- **Kategori:** ${transaction.category}\n- **Nominal:** Rp ${transaction.nominal.toLocaleString('id-ID')}\n\nSilakan jelaskan lebih rinci mengenai transaksi ini agar saya dapat melakukan analisis syariah yang akurat.`
        }]
      };
      setHistory([welcomeMessage]);
      setUserInput('');
      setIsLoading(false);
      setFinalResult(null);
    }
  }, [isOpen, transaction]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSendMessage = async (currentHistory: Message[]) => {
    if (!transaction) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/syariah-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: currentHistory,
          transactionDetails: {
            description: transaction.description,
            category: transaction.category,
            nominal: transaction.nominal,
          }
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      let aiResponseText = data.text.trim();

      if (aiResponseText.startsWith('```json')) {
        aiResponseText = aiResponseText.replace(/```json\n|```/g, '');
      }

      try {
        const parsedResult: FinalResult = JSON.parse(aiResponseText);
        setFinalResult(parsedResult);
        setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Analisis selesai. Berikut adalah ringkasannya." }] }]);
      } catch (e) {
        setHistory(prev => [...prev, { role: 'model', parts: [{ text: aiResponseText }] }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: 'Maaf, terjadi kesalahan pada sistem. Silakan coba lagi.' }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || finalResult) return;

    const newUserMessage: Message = { role: 'user', parts: [{ text: userInput }] };
    const newHistory = [...history, newUserMessage];

    setHistory(newHistory);
    setUserInput('');
    handleSendMessage(newHistory);
  };

  const handleSave = () => {
    if (finalResult) {
      onSave(finalResult.status, finalResult.explanation);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
        {/* Enhanced Header */}
        <header className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FiShield className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Verifikasi AI Syariah</h2>
              <p className="text-sm text-gray-600">Analisis transaksi berdasarkan prinsip syariah</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
          >
            <FiX size={20} />
          </button>
        </header>

        {finalResult ? (
          // Enhanced Results View
          <div className="flex-1 p-8 bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-lg flex flex-col h-full">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Hasil Verifikasi</h3>
                <p className="text-gray-600">AI telah menyelesaikan analisis berdasarkan percakapan</p>
              </div>
              {/* Card with scrollable content and sticky button */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[60vh] h-full">
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  <div className="flex flex-col items-center">
                    {(() => {
                      const { Icon, color, bgColor, borderColor, iconBg } = getStatusDetails(finalResult.status);
                      return (
                        <div className={`w-20 h-20 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
                          <Icon className={`w-10 h-10 ${color}`} />
                        </div>
                      );
                    })()}
                    <h4 className="text-3xl font-bold text-gray-900 mb-2">{finalResult.status}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FiMessageCircle className="w-4 h-4" />
                      <span>Analisis AI Syariah</span>
                    </div>
                  </div>
                  <div className={`text-left p-6 rounded-xl border ${(() => {
                    const { bgColor, borderColor } = getStatusDetails(finalResult.status);
                    return `${bgColor} ${borderColor}`;
                  })()} max-h-[30vh] overflow-y-auto`}>
                    <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FiHelpCircle className="w-4 h-4" />
                      Penjelasan Detail
                    </p>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{finalResult.explanation}</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <p className="font-semibold text-gray-800">Tingkat Keyakinan:</p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${finalResult.confidence_score * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-blue-600 min-w-[3rem]">
                        {(finalResult.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
                {/* Sticky Save Button */}
                <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10">
                  <button 
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <FiSave className="w-5 h-5" />
                    Simpan Hasil & Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Enhanced Chat View
          <>
            <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-blue-50/30 space-y-6">
              {history.map((msg, index) => (
                <div key={index} className={`flex items-end gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <FiShield className="w-5 h-5" />
                    </div>
                  )}
                  <div className={`max-w-lg p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-md' 
                      : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                  }`}>
                    <div className={`prose prose-sm max-w-none ${
                      msg.role === 'user' 
                        ? 'prose-invert prose-p:text-blue-50' 
                        : 'prose-gray'
                    }`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.parts[0].text}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-white flex items-center justify-center shrink-0 text-sm font-medium">
                      U
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-end gap-4 justify-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <FiShield className="w-5 h-5" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      <FiLoader className="animate-spin text-blue-600 w-4 h-4" />
                      <span className="text-gray-600 text-sm">AI sedang menganalisis...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Footer */}
            <footer className="p-6 border-t border-gray-100 bg-white shrink-0">
              <form onSubmit={handleUserSubmit} className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Jelaskan transaksi Anda secara rinci..."
                    className="w-full p-4 pr-12 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white"
                    disabled={isLoading || finalResult !== null}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiMessageCircle className="w-5 h-5" />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading || !userInput.trim() || finalResult !== null} 
                  className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
                >
                  <FiSend size={20} />
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Tekan Enter untuk mengirim pesan
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
