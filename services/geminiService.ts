import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AgentName, IntentType, SystemTrace } from '../types';

interface AgentConfig {
  systemInstruction: string;
  model: string;
}

// Configuration for each agent
const AGENT_CONFIGS: Record<AgentName, AgentConfig> = {
  CoordinatorAgent: {
    systemInstruction: `You are an intelligent router for the GATE Prep Help system. Your task is to analyze a student's query and determine its primary intent. Classify the intent into one of the following categories:
    - 'Concept Explanation' (for technical questions about OS, DBMS, Algorithms, etc.)
    - 'Motivation' (for requests related to stress management, motivation, or general exam strategy)
    - 'Planning' (for requests to create study schedules or plans)
    - 'Unknown' (if the intent doesn't clearly fit any of the above)

    After identifying the intent, suggest the appropriate agent to handle it:
    - 'TeacherAgent' for 'Concept Explanation'
    - 'MentorAgent' for 'Motivation'
    - 'PlannerTool' for 'Planning'
    - 'CoordinatorAgent' for 'Unknown' or to clarify if the query is ambiguous.

    Your output MUST be a JSON object with two fields: 'intent' and 'agent'.
    Example for Concept Explanation:
    { "intent": "Concept Explanation", "agent": "TeacherAgent" }
    Example for Motivation:
    { "intent": "Motivation", "agent": "MentorAgent" }
    Example for Planning:
    { "intent": "Planning", "agent": "PlannerTool" }
    Example for Unknown:
    { "intent": "Unknown", "agent": "CoordinatorAgent" }
    `,
    model: 'gemini-3-flash-preview',
  },
  TeacherAgent: {
    systemInstruction: `You are the TeacherAgent, specializing in explaining technical concepts related to GATE Computer Science (OS, DBMS, Algorithms). Explain concepts simply, using analogies and examples relevant to Indian students (e.g., relating concurrency to railway platforms, database transactions to banking, etc.). Be clear, concise, and helpful.`,
    model: 'gemini-3-flash-preview',
  },
  MentorAgent: {
    systemInstruction: `You are the MentorAgent. Your role is to provide motivation, stress management tips, and strategic advice for GATE exam preparation. Offer encouraging words, practical study strategies, and mindfulness techniques.`,
    model: 'gemini-3-flash-preview',
  },
  PlannerTool: {
    systemInstruction: `You are the PlannerTool. Your task is to create structured study schedules based on the student's available days. Ask for the number of days if not specified. Provide a balanced schedule covering key GATE CS subjects. Structure the response clearly, perhaps with daily breakdown.`,
    model: 'gemini-3-flash-preview',
  },
};

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  private initializeGemini(): GoogleGenAI {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY is not defined in environment variables.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return this.ai;
  }

  public async getCoordinatorDecision(
    prompt: string
  ): Promise<{ intent: IntentType; agent: AgentName }> {
    try {
      const ai = this.initializeGemini();
      const config = AGENT_CONFIGS.CoordinatorAgent;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          systemInstruction: config.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              intent: { type: 'STRING', description: 'The detected intent: Concept Explanation, Motivation, Planning, or Unknown.' },
              agent: { type: 'STRING', description: 'The recommended agent: TeacherAgent, MentorAgent, PlannerTool, or CoordinatorAgent.' },
            },
            required: ['intent', 'agent'],
          },
        },
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) {
        throw new Error("CoordinatorAgent did not return a valid JSON response.");
      }

      // Sometimes Gemini might wrap JSON in markdown code block, try to parse that.
      const cleanedJsonStr = jsonStr.startsWith('\`\`\`json') && jsonStr.endsWith('\`\`\`')
        ? jsonStr.substring(7, jsonStr.length - 3)
        : jsonStr;

      const decision = JSON.parse(cleanedJsonStr) as {
        intent: IntentType;
        agent: AgentName;
      };
      return decision;
    } catch (error) {
      console.error("Error getting coordinator decision:", error);
      // Fallback to unknown if parsing fails or API errors
      return { intent: 'Unknown', agent: 'CoordinatorAgent' };
    }
  }

  public async getAgentResponse(
    agentName: AgentName,
    prompt: string
  ): Promise<string> {
    try {
      const ai = this.initializeGemini();
      const config = AGENT_CONFIGS[agentName];

      if (!config) {
        return `Error: Agent ${agentName} not found.`;
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          systemInstruction: config.systemInstruction,
        },
      });

      const text = response.text;
      return text || "No response from agent.";
    } catch (error) {
      console.error(`Error getting response from ${agentName}:`, error);
      return `An error occurred while getting a response from ${agentName}. Please try again.`;
    }
  }
}
