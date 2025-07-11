import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getAllUserProfiles } from "@/app/api/service/userProfileService";
import { getAllPayrolls } from "@/app/api/service/payrollService";
import { getAllTransactions } from "@/app/api/service/firebaseTransactionService";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// This helper function remains the same.
async function getRequiredContext(question: string): Promise<any> {
    const questionLower = question.toLowerCase();
    const context: { [key:string]: any } = {};

    // For payroll, fetch only a summary or the 5 most recent entries
    if (questionLower.includes('gaji') || questionLower.includes('payroll') || questionLower.includes('bayar') || questionLower.includes('salary')) {
        const payrollResult = await getAllPayrolls(5); // Limit to 5
        if (payrollResult.success) {
            context.payrolls = payrollResult.data;
        }
    }
    
    // For user profiles, fetch only a summary (e.g., names and roles)
    if (questionLower.includes('karyawan') || questionLower.includes('pegawai') || questionLower.includes('siapa') || questionLower.includes('profil')) {
        const userProfiles = await getAllUserProfiles(true); // Get summary
        context.users = userProfiles;
    }

    // For transactions, fetch only the 5 most recent entries
    if (questionLower.includes('transaksi') || questionLower.includes('laporan') || questionLower.includes('keuangan')) {
        const transactions = await getAllTransactions(5); // Limit to 5
        context.transactions = transactions;
    }
    return context;
}

export async function POST(request: Request) {
  try {
    const { history } = await request.json();

    if (!history || history.length === 0) {
      return NextResponse.json({ error: "Missing conversation history." }, { status: 400 });
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `
    You are an expert HR and payroll assistant for an Indonesian company named "ZAFRA".
    Use the provided JSON data context to answer questions accurately and concisely in Indonesian.
    If the context doesn't contain the answer, state that you don't have the required information. Do not make up information.
    The context data is provided with each user prompt.
    `,
    });

    // Sanitize history: remove latest message for context, and ensure it starts with a user message.
    let historyForChat = history.slice(0, -1).map((msg: {role: string, text: string}) => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));
    
    while (historyForChat.length > 0 && historyForChat[0].role !== 'user') {
      historyForChat.shift();
    }
    
    const chat = model.startChat({
      history: historyForChat,
    });
    
    const lastMessage = history[history.length - 1];
    const question = lastMessage.text;
    const relevantContext = await getRequiredContext(question);

    const prompt = `Data Konteks (Gunakan data ini untuk menjawab):
${Object.keys(relevantContext).length > 0 ? JSON.stringify(relevantContext) : "Tidak ada data relevan yang ditemukan untuk pertanyaan ini."}

Pertanyaan Pengguna: ${question}`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ answer: text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message && error.message.includes('429')) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Anda telah melebihi kuota API Anda. Silakan periksa paket dan detail tagihan Anda." }, { status: 429 });
    }
    return NextResponse.json({ error: "Error during Gemini API call." }, { status: 500 });
  }
} 