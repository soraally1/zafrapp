import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { question, context } = await request.json();
    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // System instruction for HR/Payroll assistant
    const systemInstruction = `
    You are an expert HR and payroll assistant for an Indonesian company. Use the provided data to answer HR, payroll, and finance questions. Always be accurate, concise, and use Indonesian language. If the question is about payroll, employees, or transactions, use the context data. If you don't know the answer, say so politely.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    // Compose the prompt with context
    const prompt = context
      ? `Data:
${JSON.stringify(context, null, 2)}

Pertanyaan: ${question}`
      : question;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ answer: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Error during Gemini API call." }, { status: 500 });
  }
} 