import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { 
  MessageSquare, 
  Send, 
  X, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  CheckCircle,
  Car
} from 'lucide-react';

interface ConciergeChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConciergeChat: React.FC<ConciergeChatProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Good day! I am your Apex Fleet Concierge. How may I assist you with vehicle selection, daily PKR rates, or our strict model-matching policy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userMessage: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch concierge guidance');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'I am ready to help you with our rental fleet.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Concierge chat error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: 'I apologize, but our concierge line is momentarily busy. Please feel free to tap "Book on WhatsApp" for immediate support from our fleet manager.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Which car is best for family travel?',
    'Compare Civic vs Grande rates',
    'Explain strict vehicle image matching',
    'Do you have 7-seater SUVs available?'
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md sm:bottom-6 sm:right-6">
      <div 
        id="concierge-chat-window"
        className="flex h-[560px] flex-col overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-4 py-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span>Apex Fleet Concierge</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </h4>
              <p className="text-[11px] text-neutral-400">
                Gemini 3.5 Flash Assistant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Message Thread */}
        <div 
          id="chat-messages-thread"
          className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-neutral-800"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                    isUser
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-800 text-amber-400 border border-neutral-700'
                  }`}
                >
                  {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-neutral-950 font-medium rounded-tr-none'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`mt-1 block text-[10px] ${
                      isUser ? 'text-neutral-900/70' : 'text-neutral-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-neutral-400 bg-neutral-900/70 border border-neutral-800 rounded-2xl px-3 py-2 w-fit">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
              <span>Concierge is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="border-t border-neutral-800/80 bg-neutral-950 px-3 py-2 overflow-x-auto scrollbar-none flex space-x-1.5">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="flex-shrink-0 rounded-lg border border-neutral-800 bg-neutral-900/70 px-2.5 py-1 text-[11px] text-neutral-300 hover:border-amber-500/40 hover:text-white transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="border-t border-neutral-800 bg-neutral-900/90 p-3 flex items-center space-x-2"
        >
          <input
            id="chat-user-input"
            type="text"
            placeholder="Ask about rates, availability, specs..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            id="btn-send-chat-msg"
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
