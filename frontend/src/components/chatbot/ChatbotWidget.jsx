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
          className="p-4 bg-gold-gradient text-noir-600 rounded-full shadow-glow-gold flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 animate-glow-pulse"
        >
          <MessageSquareCode className="w-6 h-6" />
        </button>
      )}

      {/* 2. CHAT PORTAL BOX */}
      {isOpen && (
        <div className="w-80 md:w-96 h-[500px] glass-card rounded-2xl shadow-glow-gold flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="p-4 bg-noir-600 dark:bg-noir-600 border-b border-royal-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse-soft"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-40"></div>
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-surface-50 flex items-center gap-1.5 tracking-wide">
                  SmartMeal Concierge <Sparkles className="w-3.5 h-3.5 text-royal-400 fill-royal-400" />
                </h3>
                <p className="text-[10px] text-royal-400/70 font-medium tracking-wider uppercase">AI Customer Support</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-royal-500/15 rounded-xl transition-all duration-300 text-surface-300 hover:text-royal-400 hover:rotate-90"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-50/50 dark:bg-noir-600/50 scroll-smooth">
            <div className="text-[10px] text-center text-noir-200 dark:text-surface-300 font-semibold glass-card py-2 px-4 rounded-xl max-w-xs mx-auto leading-relaxed border border-royal-500/15">
              <span className="text-sm">👋</span> Hi! Ask me about order status, refunds, or cancellations. I can also escalate you to a support agent.
            </div>

            {messages.map((m, idx) => {
              const isModel = m.role === 'model' || m.role === 'system';
              return (
                <div key={idx} className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed transition-all duration-200 ${
                      isModel
                        ? 'bg-white/80 dark:bg-noir-500/80 backdrop-blur-sm border border-surface-200 dark:border-noir-300 text-noir-500 dark:text-surface-100 rounded-tl-none shadow-sm'
                        : 'bg-gradient-to-br from-royal-500 to-royal-600 text-white rounded-tr-none shadow-md shadow-royal-500/20'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white/80 dark:bg-noir-500/80 backdrop-blur-sm p-3 rounded-2xl rounded-tl-none border border-surface-200 dark:border-noir-300 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-royal-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-royal-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-royal-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick FAQ Suggestion Chips */}
          {messages.length < 3 && !sendMessageMutation.isPending && (
            <div className="p-3 bg-surface-50/80 dark:bg-noir-600/80 backdrop-blur-sm border-t border-royal-500/10 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {FAQ_PROMPTS.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFaqClick(faq.text)}
                  className="px-3 py-1.5 btn-royal-outline text-[10px] font-semibold rounded-full transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                  {faq.label}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input */}
          {escalated ? (
            <div className="p-3 bg-amber-50/90 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-center font-display font-bold text-[11px] border-t border-royal-500/15 flex items-center justify-center gap-2 tracking-wide">
              <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse-soft" /> Support Session Escalated to Human Agent
            </div>
          ) : (
            <form onSubmit={handleSend} className="p-3 bg-surface-50/80 dark:bg-noir-600/80 backdrop-blur-sm border-t border-royal-500/10 flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="input-royal flex-1 text-xs py-2.5 rounded-xl"
              />
              <button
                type="submit"
                className="btn-royal p-2.5 rounded-xl flex items-center justify-center active:scale-95 transition-all duration-300"
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
