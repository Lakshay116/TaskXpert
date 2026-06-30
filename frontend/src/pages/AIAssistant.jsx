import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Trash2, Brain, AlertCircle, RefreshCw, ClipboardList, Briefcase, FileText, Bot, User, CheckCircle2, Plus, MessageSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAIStore } from '../store/aiStore';
import { useTicketStore } from '../store/ticketStore';
import toast from 'react-hot-toast';

// Custom, robust Markdown renderer for chat messages
const MarkdownText = ({ text }) => {
  if (!text) return null;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1.5 text-xs leading-relaxed whitespace-pre-line select-text">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const lines = part.split('\n');
          const language = lines[0].replace('```', '').trim() || 'code';
          const code = lines.slice(1, -1).join('\n');
          return (
            <div key={index} className="my-2 rounded-xl overflow-hidden border border-slate-700/40 bg-slate-950 shadow-2xl font-mono text-[11px] max-w-full">
              <div className="bg-slate-900/60 px-4 py-2 flex justify-between items-center border-b border-slate-800/80 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                <span>{language}</span>
              </div>
              <pre className="p-4 overflow-x-auto text-slate-350 scrollbar-hide">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split('\n');
        let inList = false;
        const processedElements = [];
        let listBuffer = [];

        const renderListBuffer = (key) => {
          if (listBuffer.length > 0) {
            const el = (
              <ul key={`list-${key}`} className="list-disc pl-5 space-y-1 my-1.5 text-slate-700 dark:text-slate-300 text-xs animate-in fade-in-50">
                {listBuffer.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
              </ul>
            );
            listBuffer = [];
            return el;
          }
          return null;
        };

        const parseInline = (str) => {
          const boldParts = str.split(/(\*\*.*?\*\*)/g);
          return boldParts.map((bp, i) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">{bp.slice(2, -2)}</strong>;
            }
            const codeParts = bp.split(/(`.*?`)/g);
            return codeParts.map((cp, j) => {
              if (cp.startsWith('`') && cp.endsWith('`')) {
                return <code key={j} className="bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-[11px] text-slate-800 dark:text-slate-200 font-mono border border-slate-300 dark:border-slate-700/30">{cp.slice(1, -1)}</code>;
              }
              return cp;
            });
          });
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            inList = true;
            listBuffer.push(line.trim().slice(2));
            continue;
          }

          if (inList && !line.trim().startsWith('- ') && !line.trim().startsWith('* ')) {
            processedElements.push(renderListBuffer(i));
            inList = false;
          }

          if (line.startsWith('### ')) {
            processedElements.push(<h3 key={i} className="text-xs font-bold text-slate-800 dark:text-white mt-3 mb-1">{parseInline(line.slice(4))}</h3>);
          } else if (line.startsWith('## ')) {
            processedElements.push(<h2 key={i} className="text-sm font-bold text-slate-800 dark:text-white mt-4 mb-2 border-b border-slate-200 dark:border-slate-800/60 pb-0.5">{parseInline(line.slice(3))}</h2>);
          } else if (line.startsWith('# ')) {
            processedElements.push(<h1 key={i} className="text-base font-bold text-slate-800 dark:text-white mt-5 mb-2.5">{parseInline(line.slice(2))}</h1>);
          } else if (line.startsWith('> ')) {
            processedElements.push(
              <blockquote key={i} className="border-l-4 border-slate-500 bg-slate-200/30 dark:bg-slate-800/40 pl-3 pr-3 py-1.5 my-2.5 rounded-r-lg italic text-slate-700 dark:text-slate-300">
                {parseInline(line.slice(2))}
              </blockquote>
            );
          } else if (line.trim() !== '') {
            processedElements.push(<p key={i} className="my-1 text-slate-700 dark:text-slate-300">{parseInline(line)}</p>);
          }
        }

        if (inList) {
          processedElements.push(renderListBuffer(lines.length));
        }

        return <React.Fragment key={index}>{processedElements}</React.Fragment>;
      })}
    </div>
  );
};

const AIAssistant = () => {
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearHistory,
    sessions,
    activeSessionId,
    startNewChat,
    switchSession,
    deleteSession
  } = useAIStore();
  const { tickets, fetchTickets } = useTicketStore();
  const [inputText, setInputText] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const chatEndRef = useRef(null);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const getFriendlyDateLabel = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const handleQuickAction = async (actionType) => {
    if (isLoading) return;
    if (actionType === 'draft_ticket_reply') {
      if (!selectedTicketId) {
        toast.error('Please select a support ticket from the dropdown first.');
        return;
      }
      await sendMessage(null, 'draft_ticket_reply', selectedTicketId);
    } else {
      await sendMessage(null, actionType);
    }
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleChipClick = async (prompt) => {
    if (isLoading) return;
    await sendMessage(prompt);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your AI chat history?')) {
      clearHistory();
      toast.success('Chat history cleared.');
    }
  };

  const chips = [
    'What are my high priority tasks?',
    'Analyze current project workload',
    'How do I update a ticket status?',
    'Draft a project update'
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-background relative">
      {/* Backdrop for mobile layout */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        h-full bg-slate-50 dark:bg-[#1A1D24] border-slate-200 dark:border-border
        overflow-y-auto custom-scrollbar flex flex-col gap-5
        transition-all duration-300 ease-in-out
        ${isSidebarOpen 
          ? 'w-72 lg:w-80 p-5 border-r translate-x-0 opacity-100' 
          : '-translate-x-full lg:translate-x-0 w-72 lg:w-0 p-5 lg:p-0 border-r-0 lg:opacity-0 overflow-hidden'
        }
      `}>
        {/* Header combined with Status */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary animate-pulse">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xs font-bold tracking-tight text-slate-800 dark:text-white leading-none mb-0.5">TaskXpertAI</h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] text-emerald-400 font-semibold tracking-wider">TaskXpert LLM v2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Conversations (Chat History) */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Saved Chats</h2>
          {sessions.length > 0 ? (
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
              {sessions.map((s) => {
                const isActive = activeSessionId === s.id;
                return (
                  <div
                    key={s.id}
                    className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-slate-200 dark:bg-[#242A35] text-slate-800 dark:text-primary border-l-2 border-primary border-t-transparent border-r-transparent border-b-transparent pl-2.5 shadow-inner' 
                        : 'text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-200/50 dark:hover:bg-[#242A35]/30 hover:text-slate-800 dark:hover:text-slate-200 border-l-2 border-transparent pl-2.5 border-t-transparent border-r-transparent border-b-transparent'
                    }`}
                    onClick={() => {
                      switchSession(s.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 group-hover:text-slate-350" />
                      <span className="truncate">{s.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.id);
                        toast.success('Chat deleted.');
                      }}
                      className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-0.5 hover:text-rose-400 rounded transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[9px] text-slate-500 italic pl-1.5">No saved chats.</p>
          )}
        </div>

        {/* Quick Actions Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            {/* Action 1: Workload Summary */}
            <button
              onClick={() => handleQuickAction('summarize_tasks')}
              disabled={isLoading}
              className="flex items-center gap-3 p-2 rounded-xl bg-slate-100/70 hover:bg-slate-200/50 dark:bg-[#242A35]/30 dark:hover:bg-[#2A313E]/50 border border-slate-200 dark:border-slate-700/30 hover:border-primary/20 transition-all duration-300 group disabled:opacity-50 text-left"
            >
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black transition-colors shrink-0">
                <ClipboardList className="w-3.5 h-3.5" />
              </div>
              <div className="truncate pr-1">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Summarize Workload</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-450 truncate">Fetch active tasks, deadlines & status.</p>
              </div>
            </button>

            {/* Action 2: Project Health Check */}
            <button
              onClick={() => handleQuickAction('analyze_projects')}
              disabled={isLoading}
              className="flex items-center gap-3 p-2 rounded-xl bg-slate-100/70 hover:bg-slate-200/50 dark:bg-[#242A35]/30 dark:hover:bg-[#2A313E]/50 border border-slate-200 dark:border-slate-700/30 hover:border-primary/20 transition-all duration-300 group disabled:opacity-50 text-left"
            >
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black transition-colors shrink-0">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div className="truncate pr-1">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Project Health Check</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-450 truncate">Inspect project progression & blockages.</p>
              </div>
            </button>

            {/* Action 3: Ticket Draft Reply */}
            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-[#242A35]/30 border border-slate-200 dark:border-slate-700/30 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="truncate pr-1">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Draft Support Reply</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-450 truncate">Generate professional agent replies.</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <select
                  value={selectedTicketId}
                  onChange={(e) => setSelectedTicketId(e.target.value)}
                  className="flex-1 bg-white dark:bg-[#1A1D24] text-[10px] text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/50 rounded-lg px-2 py-1 focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Select ticket...</option>
                  {tickets && tickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} - {t.subject}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleQuickAction('draft_ticket_reply')}
                  disabled={isLoading || !selectedTicketId}
                  className="py-1 px-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1 shadow-md shadow-primary/5"
                >
                  <Sparkles className="w-3 h-3" />
                  Draft
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Chat */}
        <div className="mt-auto pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-center">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 text-[10px] font-bold text-rose-450/70 hover:text-rose-455 transition-colors py-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear Chat History
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
        {/* Chat Window Header */}
        <div className="border-b border-slate-200 dark:border-border bg-slate-50 dark:bg-[#181B21] px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all duration-205"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeftOpen className="w-4.5 h-4.5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">TaskXpertAI Chat</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                startNewChat();
                toast.success('Started a new conversation.');
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:border-primary/30 bg-slate-100 hover:bg-slate-200 dark:bg-[#242A35]/30 dark:hover:bg-[#242A35]/80 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 disabled:opacity-50 shadow-sm"
              title="New Chat"
            >
              <Plus className="w-3 h-3" />
              <span>New Chat</span>
            </button>
            <span className="text-[10px] font-bold text-primary/70 hidden sm:inline">TaskXpert LLM v2</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              const prevMsg = index > 0 ? messages[index - 1] : null;
              
              const currentDateString = msg.timestamp ? new Date(msg.timestamp).toDateString() : '';
              const prevDateString = prevMsg?.timestamp ? new Date(prevMsg.timestamp).toDateString() : '';
              const showDateSeparator = msg.timestamp && (currentDateString !== prevDateString);

              return (
                <React.Fragment key={index}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-3 select-none">
                      <span className="text-[9px] bg-slate-200/80 dark:bg-[#242A35]/60 text-slate-600 dark:text-slate-400 font-bold px-3 py-1 rounded-full border border-slate-300 dark:border-slate-750/30 uppercase tracking-wider">
                        {getFriendlyDateLabel(msg.timestamp)}
                      </span>
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-2 max-w-[92%] ${isAssistant ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${isAssistant ? 'bg-primary text-primary-foreground' : 'bg-slate-700 text-white'}`}>
                      {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`px-3 py-2 rounded-xl border flex flex-col ${
                      isAssistant 
                      ? 'bg-slate-100 dark:bg-[#20252E] border-slate-200 dark:border-slate-700/40 text-slate-800 dark:text-slate-100 rounded-tl-none' 
                      : 'bg-primary/10 border-primary/20 text-slate-800 dark:text-slate-100 rounded-tr-none'
                    } shadow-sm`}>
                      <MarkdownText text={msg.content} />
                      
                      {/* Timestamp (WhatsApp Style) */}
                      {msg.timestamp && (
                        <span className="text-[8px] text-slate-500 font-semibold mt-1 self-end leading-none select-none">
                          {formatTime(msg.timestamp)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2 max-w-[92%] mr-auto text-left items-center">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-3 py-2 rounded-xl border bg-slate-100 dark:bg-[#20252E] border-slate-200 dark:border-slate-700/40 rounded-tl-none text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Bottom Panel (Chips & Input) */}
        <div className="p-4 border-t border-slate-200 dark:border-border bg-slate-50 dark:bg-[#181B21] flex flex-col gap-3">
          {/* Action Chips */}
          <div className="hidden lg:flex flex-wrap gap-2">
            {chips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                disabled={isLoading}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-200/60 hover:bg-slate-300/80 dark:bg-[#242A35]/60 dark:hover:bg-[#2E3543] border border-slate-300/70 dark:border-slate-700/50 rounded-full px-3.5 py-1.5 transition-all duration-300 disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="flex gap-3 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask TaskXpertAI..."
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-[#1A1D24] text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-4 pr-10 py-2.5 focus:border-primary focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-30 flex items-center justify-center shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
