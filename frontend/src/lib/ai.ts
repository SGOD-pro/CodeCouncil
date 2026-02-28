// src/openai.ts
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.NIM_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function chatWithAI({systemMessage,userMessage}: {systemMessage:string,userMessage:string}) {
    const response = await openai.chat.completions.create({
        model: "meta/llama-3.3-70b-instruct",// lightweight, cheap, fast
        messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
        ],
        temperature: 0.3,
    });

    return response.choices[0].message.content;
}