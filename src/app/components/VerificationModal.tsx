import { useState, useEffect, useRef } from 'react';
import { FiX, FiSend, FiLoader, FiSave, FiCheckCircle, FiAlertTriangle, FiHelpCircle } from 'react-icons/fi';
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
    return { Icon: FiCheckCircle, color: 'text-green-500' };
  }
  if (lowerStatus.includes('haram')) {
    return { Icon: FiAlertTriangle, color: 'text-red-500' };
  }
  return { Icon: FiHelpCircle, color: 'text-yellow-500' };
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden">
        <header className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Verifikasi AI Syariah</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <FiX size={24} />
          </button>
        </header>

        {finalResult ? (
          // Results View
          <div className="flex-1 p-6 md:p-8 bg-gray-50 flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Hasil Verifikasi</h3>
              <p className="text-gray-500 mb-6">AI telah menyelesaikan analisis berdasarkan percakapan.</p>
              
              <div className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-gray-200">
                <div className="flex flex-col items-center">
                  {(() => {
                    const { Icon, color } = getStatusDetails(finalResult.status);
                    return <Icon className={`w-12 h-12 ${color} mb-3`} />;
                  })()}
                  <p className="text-2xl font-bold text-gray-900">{finalResult.status}</p>
                </div>
                <div className="text-left bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-800 mb-2">Penjelasan:</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{finalResult.explanation}</p>
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <p className="font-semibold text-gray-800">Tingkat Keyakinan:</p>
                  <p className="font-bold text-blue-600">{(finalResult.confidence_score * 100).toFixed(0)}%</p>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <FiSave />
                Simpan Hasil & Tutup
              </button>
            </div>
          </div>
        ) : (
          // Chat View
          <>
            <div ref={chatContainerRef} className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-100/50 space-y-4">
              {history.map((msg, index) => (
                <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">AI</div>}
                  <div className={`prose prose-sm max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.parts[0].text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-end gap-3 justify-start">
                   <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">AI</div>
                  <div className="p-3 rounded-2xl bg-white shadow-sm">
                    <FiLoader className="animate-spin text-blue-600" />
                  </div>
                </div>
              )}
            </div>

            <footer className="p-4 border-t bg-white shrink-0">
              <form onSubmit={handleUserSubmit} className="flex items-center gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Jelaskan transaksi Anda secara rinci..."
                  className="flex-1 w-full p-3 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
                  disabled={isLoading || finalResult !== null}
                />
                <button type="submit" disabled={isLoading || !userInput.trim() || finalResult !== null} className="p-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
                  <FiSend size={20} />
                </button>
              </form>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
