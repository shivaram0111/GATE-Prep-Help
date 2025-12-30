import React from 'react';
import { ChatMessage, SystemTrace } from '../types';

interface ChatMessageDisplayProps {
  message: ChatMessage;
}

const ChatMessageDisplay: React.FC<ChatMessageDisplayProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isSystemTrace = message.isTrace;

  const getBackgroundColor = () => {
    if (isSystemTrace) return 'bg-gray-100'; // Light background for trace
    if (isUser) return 'bg-blue-500 text-white';
    return 'bg-gray-200 text-gray-800';
  };

  const getAlignment = () => {
    if (isUser) return 'justify-end';
    if (isSystemTrace) return 'justify-center'; // Center trace
    return 'justify-start';
  };

  const getBubbleShape = () => {
    if (isUser) return 'rounded-br-none';
    if (isSystemTrace) return 'rounded-xl';
    return 'rounded-bl-none';
  };

  return (
    <div className={`flex ${getAlignment()} mb-4`}>
      <div
        className={`max-w-[75%] p-3 rounded-lg shadow-md ${getBackgroundColor()} ${getBubbleShape()}`}
      >
        {isSystemTrace ? (
          <div className="font-mono text-xs text-gray-700">
            <h3 className="font-semibold text-sm mb-1 text-center">SYSTEM TRACE</h3>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(message.text as SystemTrace, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.text as string}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessageDisplay;
