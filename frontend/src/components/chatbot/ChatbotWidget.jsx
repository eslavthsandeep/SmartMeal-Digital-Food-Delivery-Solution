import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatbotAPI } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { MessageSquareCode, X, Send, ShieldAlert, Sparkles } from 'lucide-react';

const FAQ_PROMPTS = [
  { label: 'Where is my order?', text: 'Where is my order?' },
  { label: 'Cancellation Policy', text: 'Can I cancel my order?' },
  { label: 'Refund Duration', text: 'How long do refunds take?' },
  { label: 'Talk to human', text: 'Connect me to a human support agent' }
];

export const ChatbotWidget = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [escalated, setEscalated] = useState(false);

  const chatEndRef = useRef(null);

  // 1. Fetch chat history
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['chat-history'],
    queryFn: chatbotAPI.getHistory,
    enabled: isOpen && isAuthenticated
  });

  useEffect(() => {
    if (historyData?.success) {
      setMessages(historyData.messages || []);
      // Check if any message or session state indicates escalation
      const isEsc = historyData.messages?.some(m => m.content.includes('escalating') || m.content.includes('human support'));
      if (isEsc) setEscalated(true);
    }
  }, [historyData]);

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (msg) => chatbotAPI.sendMessage(msg),
    onMutate: async (msg) => {
      // Append user message immediately (optimistic UI)
      setMessages((prev) => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);
      setInputText('');
    },
    onSuccess: (res) => {
      if (res.success) {
        setMessages(res.data.messages);
        setEscalated(res.data.escalated);
      }
    }
  });

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sendMessageMutation.mutate(inputText.trim());
  };

  const handleFaqClick = (text) => {
    sendMessageMutation.mutate(text);
  };

  // Guard: Only show if authenticated customer
  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* 1. FLOATING ACTION TRIGGER */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all animate-pulse-soft"
        >
          <MessageSquareCode className="w-6 h-6" />
        </button>
      )}

      {/* 2. CHAT PORTAL BOX */}
      {isOpen && (
        <div className="w-80 md:w-96 h-[500px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1">
                  Food Express Bot <Sparkles className="w-3.5 h-3.5 text-brand-400 fill-brand-400" />
                </h3>
                <p className="text-[10px] text-slate-400">AI Customer Support</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-900 scroll-smooth">
            <div className="text-[10px] text-center text-slate-400 font-bold bg-white dark:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-100 dark:border-slate-700 max-w-xs mx-auto leading-relaxed">
              👋 Hi! Ask me about order status, refunds, or cancellations. I can also escalate you to a support agent.
            </div>

            {messages.map((m, idx) => {
              const isModel = m.role === 'model' || m.role === 'system';
              return (
                <div key={idx} className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isModel
                        ? 'bg-white border border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-tl-none'
                        : 'bg-brand-600 text-white rounded-tr-none shadow-sm shadow-brand-500/10'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick FAQ Suggestion Chips */}
          {messages.length < 3 && !sendMessageMutation.isPending && (
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {FAQ_PROMPTS.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFaqClick(faq.text)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950 text-[10px] font-semibold text-slate-600 dark:text-slate-400 rounded-full transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {faq.label}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input */}
          {escalated ? (
            <div className="p-3 bg-amber-50 text-amber-850 dark:bg-amber-950/20 dark:text-amber-400 text-center font-bold text-[10px] border-t border-amber-100 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" /> Support Session Escalated to Human Agent
            </div>
          ) : (
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs"
              />
              <button
                type="submit"
                className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center justify-center hover:shadow-md transition-shadow active:scale-95"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
};

export default ChatbotWidget;
