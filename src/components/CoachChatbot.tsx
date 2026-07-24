import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Dumbbell, ArrowDown } from 'lucide-react';
import { Exercise } from '../types';
import { buildTrainingSummary } from '../lib/coachSummary';
import { getMockCoachReply } from '../lib/mockCoachReplies';

interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  time: string;
  isError?: boolean;
  isMock?: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface CoachChatbotProps {
  exercises: Exercise[];
}

const SUGGESTED_QUESTIONS = [
  '¿Cómo va mi progreso este mes?',
  '¿Cuál fue mi último récord?',
  '¿Qué grupo muscular debería priorizar esta semana?',
  'Compará mi volumen de este mes vs. el anterior',
  '¿Algún ejercicio está estancado?',
  'Dame una recomendación para esta semana',
];

export function CoachChatbot({ exercises }: CoachChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: '¡Hola! Soy tu Coach de Fuerza Inteligente. Preguntame sobre tus entrenamientos, tus récords o tus proyecciones de 1RM.',
      time: 'Ahora'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat list
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Handle outside click to close chat window (without blocking other interactions)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest('#coach-chat-container') && !target.closest('#coach-chat-bubble')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      time: nowTime()
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessageText('');
    setIsTyping(true);

    try {
      const summary = buildTrainingSummary(exercises);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, summary })
      });

      const data = await response.json().catch(() => ({} as any));

      if (!response.ok) {
        if (data.error === 'api_key_missing') {
          // Todavía no hay GEMINI_API_KEY configurada: respondemos en modo simulado
          // con datos reales/mock del usuario en vez de dejar el chat sin respuesta.
          await sleep(500);
          const mockMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'coach',
            text: getMockCoachReply(trimmed, exercises),
            time: nowTime(),
            isMock: true
          };
          setMessages((prev) => [...prev, mockMsg]);
          return;
        }

        const coachError: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'coach',
          text: data.message || 'No pude conectarme con el coach IA. Intenta de nuevo.',
          time: nowTime(),
          isError: true
        };
        setMessages((prev) => [...prev, coachError]);
        return;
      }

      const coachMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'coach',
        text: data.reply || 'No obtuve una respuesta del coach IA. Intenta de nuevo.',
        time: nowTime()
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (err) {
      console.error('Coach chat error:', err);
      const coachError: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'coach',
        text: 'Error de conexión con el coach IA. Revisa tu conexión e intenta de nuevo.',
        time: nowTime(),
        isError: true
      };
      setMessages((prev) => [...prev, coachError]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(messageText);
  };

  const handleChipClick = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans" id="coach-chat-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="absolute bottom-16 right-0 w-80 sm:w-[420px] h-[70vh] max-h-[680px] min-h-[520px] bg-white border border-cohere-hairline rounded-xl shadow-2xl overflow-hidden flex flex-col z-50"
          >
            {/* Chat Header */}
            <div className="bg-cohere-primary p-4 text-white flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white relative">
                  <Dumbbell className="w-4 h-4" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cohere-green border border-cohere-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide flex items-center gap-1">
                    Coach IA
                    <Sparkles className="w-3.5 h-3.5 text-cohere-coral-soft animate-pulse" />
                  </h3>
                  <span className="text-[10px] text-white/80 font-mono">Modo de Aprendizaje Activo</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-cohere-stone/20 space-y-3.5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cohere-primary text-white rounded-tr-none'
                        : msg.isError
                          ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                          : 'bg-white text-cohere-ink border border-cohere-hairline rounded-tl-none shadow-xs'
                    }`}
                  >
                    {msg.isMock && (
                      <span className="block text-[8px] font-mono font-bold uppercase tracking-wider text-cohere-coral mb-1">
                        Modo simulado · sin conexión a Gemini
                      </span>
                    )}
                    <p>{msg.text}</p>
                    <span
                      className={`text-[9px] block text-right mt-1 font-mono ${
                        msg.sender === 'user'
                          ? 'text-white/70'
                          : msg.isError
                            ? 'text-red-500'
                            : 'text-cohere-slate'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing Bubble Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-cohere-ink border border-cohere-hairline rounded-xl rounded-tl-none p-3 shadow-xs">
                    <div className="flex items-center gap-1.5 py-0.5 px-1">
                      <span className="w-1.5 h-1.5 bg-cohere-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-cohere-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-cohere-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Question Chips */}
            <div className="px-3 pt-3 border-t border-cohere-hairline bg-white flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleChipClick(question)}
                  disabled={isTyping}
                  className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-cohere-stone border border-cohere-hairline text-cohere-slate hover:text-cohere-primary hover:border-cohere-primary/30 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {question}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white flex gap-2 items-center">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escribe tu pregunta sobre tus entrenamientos..."
                className="flex-1 bg-cohere-stone/35 hover:bg-cohere-stone/50 focus:bg-white text-xs border border-cohere-hairline focus:border-cohere-primary focus:ring-1 focus:ring-cohere-primary rounded-lg px-3 py-2.5 transition-all outline-none"
              />
              <button
                type="submit"
                disabled={!messageText.trim() || isTyping}
                className="p-2.5 rounded-lg bg-cohere-primary hover:bg-cohere-black disabled:opacity-40 disabled:hover:bg-cohere-primary text-white transition-all cursor-pointer shadow-xs shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Bubble Button */}
      <motion.button
        id="coach-chat-bubble"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer relative ${
          isOpen ? 'bg-cohere-black' : 'bg-cohere-primary'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6" />
              {/* Pulse notification light */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cohere-coral border-2 border-white rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
