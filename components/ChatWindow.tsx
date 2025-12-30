import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import ChatMessageDisplay from './ChatMessageDisplay';
import LoadingSpinner from './LoadingSpinner';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
      {messages.map((message) => (
        <ChatMessageDisplay key={message.id} message={message} />
      ))}
      {isLoading && <LoadingSpinner />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;