export type AgentName = 'CoordinatorAgent' | 'TeacherAgent' | 'MentorAgent' | 'PlannerTool';
export type IntentType = 'Concept Explanation' | 'Motivation' | 'Planning' | 'Unknown';

export interface SystemTrace {
  timestamp: string;
  intent_detected: IntentType;
  memory_context: string;
  routing_decision: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string | SystemTrace;
  isTrace?: boolean;
}
