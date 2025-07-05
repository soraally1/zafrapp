import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Enable the Google Search tool

export async function POST(request: Request) {
  try {
    const { history, transactionDetails } = await request.json();

    if (!history || history.length === 0) {
      return NextResponse.json({ message: "Conversation history is required." }, { status: 400 });
    }
    if (!transactionDetails) {
      return NextResponse.json({ message: "Transaction details are required." }, { status: 400 });
    }

    const systemInstruction = `
    You are an expert AI assistant specializing in Islamic finance and Sharia law (Fiqh al-Mu'amalat). Your role is to analyze financial transactions to determine if they are Halal, Haram, or Syubhat (doubtful).

    You will engage in a conversation with a user ('mitra') to gather all necessary details about a transaction. Your goal is to be thorough and ask clarifying questions until you are completely confident in your assessment.

    Here is the initial transaction data you must analyze:
    - Description: ${transactionDetails.description}
    - Category: ${transactionDetails.category}
    - Nominal: ${transactionDetails.nominal}

    Here is your workflow:
    1. The user will provide an initial description of the transaction.
    2. Review the description. If it is not detailed enough, ask specific, targeted questions to get the information you need. For example, you might ask about the nature of the goods/services, the payment method, the contract terms, or the parties involved.
    3. Continue the conversation, asking as many questions as necessary. Be polite and professional.
    4. Once you have gathered all the information and are ready to make a final determination, you MUST provide your response ONLY in the following JSON format. Do not include any other text or markdown formatting around the JSON block. If you want to explain it, you can do it in the explanation field.
    5. Once again, once you found an answer, NEVER put any other text, except for the JSON block below. Explain in the explanation field.
    6. Make sure you are really confident in your answer before providing your final answer. Use the google search tool to search for more information if needed.

    {
      "status": "...",
      "explanation": "...",
      "confidence_score": 0.0
    }

    Do not provide a JSON response until you have concluded your analysis. For all conversational turns before the final conclusion, respond with plain text questions.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5flash",
      systemInstruction,
    });

    const chat = model.startChat({
      history: history.slice(0, -1), // Pass all but the last message as history
    });

    const lastMessage = history[history.length - 1].parts[0].text;
    const result = await chat.sendMessage(lastMessage);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error) {
    console.error("AI Verification Error:", error);
    return NextResponse.json({ message: "Error during AI verification." }, { status: 500 });
  }
}
