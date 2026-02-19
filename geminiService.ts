
import { GoogleGenAI } from "@google/genai";
import { VehicleState } from "./types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async getVehicleAdvice(prompt: string, state: VehicleState) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          You are a helpful Tesla Vehicle Assistant. 
          Current Vehicle Status:
          - Model: ${state.model}
          - Battery: ${state.batteryLevel}% (${state.rangeRemaining} mi)
          - Software: ${state.softwareVersion}
          - Inside Temp: ${state.insideTemp}°F
          - Odometer: ${state.odometer} miles
          - Location: ${state.location}

          User question: ${prompt}
          
          Respond in a concise, helpful, and professional tone, similar to an official vehicle interface.
        `,
      });
      return response.text || "I'm sorry, I couldn't process that request right now.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Unable to connect to the vehicle brain. Please check your network.";
    }
  }
}

export const gemini = new GeminiService();
