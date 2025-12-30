import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, SystemTrace, AgentName, IntentType } from './types';
import ChatWindow from './components/ChatWindow';
import UserInput from './components/UserInput';
import { GeminiService } from './services/geminiService';

const geminiService = new GeminiService();

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async (text: string) => {
    setIsLoading(true);
    const userMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'user',
      text: text,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // Step 1: CoordinatorAgent determines intent and routing
      const { intent, agent } = await geminiService.getCoordinatorDecision(text);

      const systemTrace: SystemTrace = {
        timestamp: new Date().toISOString(),
        intent_detected: intent,
        memory_context: "Simulating retrieval of student's weak topics (not implemented yet).",
        routing_decision: `Routing to ${agent}`,
      };

      const traceMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'system',
        text: systemTrace,
        isTrace: true,
      };
      setMessages((prevMessages) => [...prevMessages, traceMessage]);

      // Step 2: Routed agent generates response
      let agentResponseText: string;
      if (agent === 'CoordinatorAgent' && intent === 'Unknown') {
        agentResponseText = "I couldn't clearly understand your request. Could you please rephrase or specify if you need a concept explanation, motivational advice, or a study plan?";
      } else {
        agentResponseText = await geminiService.getAgentResponse(agent, text);
      }

      const agentMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'agent',
        text: agentResponseText,
      };
      setMessages((prevMessages) => [...prevMessages, agentMessage]);

    } catch (error) {
      console.error('Error in multi-agent system:', error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'agent',
        text: 'An unexpected error occurred. Please try again.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array as geminiService is stable and other states are handled.

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md text-center text-xl font-bold">
        GATE Prep Help
      </header>
      <ChatWindow messages={messages} isLoading={isLoading} />
      <UserInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;