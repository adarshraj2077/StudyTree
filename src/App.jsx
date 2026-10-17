import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  BookOpen,
  MessageSquare,
  FileText,
  Search,
  Bell,
  User,
  FileEdit,
  HelpCircle,
  FilePlus,
  UploadCloud,
  ChevronRight,
  TrendingUp,
  Clock,
  Send,
  Play,
  Pause,
  RotateCcw,
  CheckSquare,
  Square,
  Folder,
  Trash2,
  X,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUp,
  Paperclip
} from 'lucide-react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

// Focus Timer Component
const FocusTimer = React.memo(({ onSessionComplete }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            if (onSessionComplete) onSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, onSessionComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="focus-timer-container">
      <button className="icon-btn timer-toggle" onClick={() => setShowTimer(!showTimer)} title="Pomodoro Focus Timer">
        <Clock size={20} color={isActive ? "var(--primary)" : "var(--text-muted)"} />
        {isActive && <span className="timer-badge">{`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}</span>}
      </button>

      {showTimer && (
        <div className="timer-dropdown animate-fade-in glass-panel">
          <div className="timer-header">
            <h4>Focus Timer</h4>
            <button className="close-btn" onClick={() => setShowTimer(false)}><X size={16} /></button>
          </div>
          <div className="timer-display">
            {`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}
          </div>
          <div className="timer-controls">
            <button className="btn-icon-primary" onClick={toggleTimer} title={isActive ? "Pause" : "Start"}>
              {isActive ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
            </button>
            <button className="btn-icon-secondary" onClick={resetTimer} title="Reset">
              <RotateCcw size={18} />
            </button>
          </div>
          <div className="timer-presets">
            <button onClick={() => { setTimeLeft(25 * 60); setIsActive(false); }}>25m</button>
            <button onClick={() => { setTimeLeft(15 * 60); setIsActive(false); }}>15m</button>
            <button onClick={() => { setTimeLeft(5 * 60); setIsActive(false); }}>5m</button>
          </div>
        </div>
      )}
    </div>
  );
});

// Sidebar Navigation Component
const Sidebar = React.memo(({ activeTab, setActiveTab, navItems }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">ST</div>
        <div>
          <div className="logo-text">StudyTree</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0, marginTop: '2px' }}>
            AI Study Workspace
          </p>
        </div>
      </div>

      <nav className="nav-menu">
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', paddingLeft: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          MAIN MENU
        </p>
        {navItems.map(item => (
          <button
            key={item.name}
            className={`nav-item ${activeTab === item.name ? 'active' : ''}`}
            onClick={() => setActiveTab(item.name)}
          >
            <div className="nav-icon">{item.icon}</div>
            {item.name}
          </button>
        ))}
      </nav>

      <div className="upgrade-card" style={{ marginTop: 'auto' }}>
        <h4>AI Study Assistant</h4>
        <p>Ask questions, review summaries, and prepare for your exams.</p>
        <button className="btn-upgrade" onClick={() => setActiveTab('Document Summarizer')}>
          + Upload PDF
        </button>
      </div>
    </aside>
  );
});

// Global Header with Live Search, Notifications & Guide Modal
const Header = React.memo(({ notes, tasks = [], studyMinutes = 0, onSelectDocument, onFocusComplete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const pendingTasks = useMemo(() => tasks.filter(t => !t.done), [tasks]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return notes.filter(n => 
      n.name.toLowerCase().includes(q) || 
      (n.summary && n.summary.toLowerCase().includes(q))
    );
  }, [searchQuery, notes]);

  return (
    <>
      <header className="header">
        <div className="search-bar" style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search documents, summaries, or notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}

          {showSearchDropdown && searchQuery.trim() && (
            <div className="search-results-dropdown animate-fade-in">
              <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                Matching Documents ({filteredDocs.length})
              </div>
              {filteredDocs.length === 0 ? (
                <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No documents found matching "{searchQuery}".
                </div>
              ) : (
                filteredDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="search-result-item"
                    onClick={() => {
                      onSelectDocument(doc);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        {doc.summary || 'PDF Document'}
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--primary)" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="header-right">
          <FocusTimer onSessionComplete={onFocusComplete} />
          <button
            className="icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Study Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={20} />
            {pendingTasks.length > 0 && (
              <span style={{
                position: 'absolute',
                top: 7,
                right: 7,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                border: '2px solid var(--bg-card)'
              }} />
            )}
          </button>
          <button className="icon-btn" onClick={() => setShowGuideModal(true)} title="StudyTree Guide & Tips">
            <HelpCircle size={20} />
          </button>
          <div className="user-profile">
            <div className="avatar bg-blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <User size={20} />
            </div>
            <div className="user-info">
              <h4>Adarsh Raj</h4>
              <p>Full-Stack / AI Engineer</p>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Dropdown Modal */}
      {showNotifications && (
        <div className="header-modal-overlay" onClick={() => setShowNotifications(false)}>
          <div className="header-modal animate-fade-in" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div className="flex items-center gap-2">
                <Bell size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem' }}>Study Notifications</h3>
              </div>
              <button onClick={() => setShowNotifications(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: '#c2410c' }}>
                  <TrendingUp size={16} />
                  <span>5-Day Study Streak Active</span>
                </div>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                  You are keeping a steady study habit! Log a focus session today to maintain your streak.
                </p>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  <CheckSquare size={16} color="var(--primary)" />
                  <span>Study Tasks</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {pendingTasks.length > 0
                    ? `You have ${pendingTasks.length} pending study task${pendingTasks.length === 1 ? '' : 's'} scheduled for today.`
                    : 'All daily study tasks completed! Great job staying ahead.'}
                </p>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  <BookOpen size={16} color="var(--accent)" />
                  <span>Document Library</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {notes.length > 0
                    ? `${notes.length} study document${notes.length === 1 ? '' : 's'} ready for AI summaries, chat, and practice quizzes.`
                    : 'No documents uploaded yet. Upload your first PDF to generate summaries and chat.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Guide & Tips Modal */}
      {showGuideModal && (
        <div className="header-modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="header-modal animate-fade-in" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div className="flex items-center gap-2">
                <Info size={22} color="var(--primary)" />
                <h3 style={{ fontSize: '1.25rem' }}>StudyTree Quick Guide & Tips</h3>
              </div>
              <button onClick={() => setShowGuideModal(false)}><X size={18} /></button>
            </div>

            <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>1. Document Summarizer</h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  Upload your study PDFs to extract instant overviews, high-yield takeaways, and structured topic outlines for rapid review.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>2. Interactive AI Tutor</h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  Ask questions directly about your uploaded documents. The AI searches your material and cites exact sections to ensure accurate answers.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>3. Exam Ready Practice</h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  Test your comprehension with practice questions tailored to your notes. Get immediate feedback to pinpoint areas that need more review.
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>4. Study Tasks & Focus Timer</h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  Plan your study sessions with the task checklist and use the built-in Pomodoro Focus Timer to stay focused.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});


// Formats AI responses: handles bold, bullets, numbered lists, code, and citations cleanly
const renderFormattedText = (text) => {
  if (!text) return null;

  const parseInline = (str) => {
    if (!str) return str;
    const regex = /(\*\*[^*]+\*\*|\x60[^\x60]+\x60|\[[^\]]+(?:Chunk|Source|pdf)[^\]]*\])/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--primary)',
              padding: '0.15rem 0.35rem',
              borderRadius: '4px',
              fontSize: '0.88em',
              fontFamily: 'monospace'
            }}
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.includes('Chunk') || token.includes('Source') || token.includes('.pdf')) {
        const cleanCitation = token.replace(/^\[/, '').replace(/\]$/, '').trim();
        parts.push(
          <span
            key={match.index}
            style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-muted)',
              padding: '0.1rem 0.45rem',
              borderRadius: '6px',
              marginLeft: '0.35rem',
              border: '1px solid var(--border)'
            }}
          >
            {cleanCitation}
          </span>
        );
      } else {
        parts.push(token);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  };

  const lines = text.split(/\r?\n/);
  const elements = [];

  lines.forEach((line, idx) => {
    let trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={'sp-' + idx} style={{ height: '0.45rem' }} />);
      return;
    }

    trimmed = trimmed.replace(/\\mu/g, 'μ').replace(/\$([^$]+)\$/g, '$1');

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={idx} style={{ fontSize: '1.02rem', fontWeight: 600, margin: '0.6rem 0 0.25rem 0', color: 'var(--text-main)' }}>
          {parseInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      elements.push(
        <h3 key={idx} style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0.75rem 0 0.35rem 0', color: 'var(--text-main)' }}>
          {parseInline(trimmed.replace(/^#{1,2}\s+/, ''))}
        </h3>
      );
      return;
    }

    if (/^[*•-]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[*•-]\s+/, '');
      elements.push(
        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: '0.2rem 0 0.2rem 0.5rem', lineHeight: '1.5' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: '1.2' }}>•</span>
          <span style={{ flex: 1 }}>{parseInline(content)}</span>
        </div>
      );
      return;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', margin: '0.35rem 0 0.2rem 0.5rem', lineHeight: '1.5' }}>
          <span style={{ fontWeight: 600, color: 'var(--primary)', minWidth: '1.2rem' }}>{numMatch[1]}.</span>
          <span style={{ flex: 1 }}>{parseInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    elements.push(
      <p key={idx} style={{ margin: '0.25rem 0', lineHeight: '1.55', color: 'var(--text-main)' }}>
        {parseInline(trimmed)}
      </p>
    );
  });

  return elements;
};

// Chatbot UI Component with Real RAG Backend Communication & Per-Document History
const ChatbotUI = ({ notes, activeNoteId, setActiveNoteId, onUploadSuccess }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const messagesContainerRef = useRef(null);
  const chatFileInputRef = useRef(null);

  const activeNote = notes.find(n => (n.id === activeNoteId || n.docId === activeNoteId));
  const currentDocKey = activeNote ? (activeNote.id || activeNote.docId) : 'general';

  const getWelcomeMessage = useCallback((note) => {
    return [
      {
        role: 'bot',
        text: note
          ? `Ready to answer questions grounded in "${note.name}". Ask about key concepts, summaries, or specific questions from this document.`
          : "Welcome to StudyTree! Select an uploaded document from the left sidebar, or click \"+ Upload PDF\" to chat directly with any document."
      }
    ];
  }, []);

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`studytree_chat_${currentDocKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return getWelcomeMessage(activeNote);
  });

  // When active document switches, load that document's chat thread
  useEffect(() => {
    let isCurrent = true;
    try {
      const saved = localStorage.getItem(`studytree_chat_${currentDocKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        } else {
          setMessages(getWelcomeMessage(activeNote));
        }
      } else {
        setMessages(getWelcomeMessage(activeNote));
      }
    } catch {
      setMessages(getWelcomeMessage(activeNote));
    }

    // Sync from backend if online
    async function syncDocChat() {
      try {
        const url = `${API_BASE}/api/chat/history?mode=general&docId=${currentDocKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const backendHistory = await res.json();
          if (isCurrent && Array.isArray(backendHistory) && backendHistory.length > 0) {
            setMessages(backendHistory);
            try {
              localStorage.setItem(`studytree_chat_${currentDocKey}`, JSON.stringify(backendHistory));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // Backend offline, local storage already active
      }
    }

    syncDocChat();

    return () => {
      isCurrent = false;
    };
  }, [currentDocKey, activeNote, getWelcomeMessage]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [messages]);

  // Direct PDF Upload from Chat Area
  const handleChatDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    setIsUploading(true);
    setUploadFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch(`${API_BASE}/api/ingest`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload document.');
      }

      const newDoc = {
        id: data.docId,
        docId: data.docId,
        name: data.name || file.name,
        filename: data.filename || file.name,
        summary: data.summary,
        keyPoints: data.keyPoints || [],
        chunksCount: data.chunksAdded || 0,
        fileSize: data.fileSize || file.size,
        date: data.date || 'Just now'
      };

      if (onUploadSuccess) {
        onUploadSuccess(newDoc);
      }
      setActiveNoteId(newDoc.id);

      const initialDocChat = [
        {
          role: 'bot',
          text: `📄 **${newDoc.name}** has been uploaded and indexed (${newDoc.chunksCount} topics ready).\n\nYou can now ask any question directly about this document!`,
          sources: [newDoc.name]
        }
      ];
      setMessages(initialDocChat);
      try {
        localStorage.setItem(`studytree_chat_${newDoc.id}`, JSON.stringify(initialDocChat));
      } catch {
        // ignore
      }
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadFileName('');
      if (chatFileInputRef.current) {
        chatFileInputRef.current.value = '';
      }
    }
  };

  const handleSend = async (customText = null) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    const updatedWithUser = [...messages, { role: 'user', text: userMessage }];
    setMessages(updatedWithUser);
    try {
      localStorage.setItem(`studytree_chat_${currentDocKey}`, JSON.stringify(updatedWithUser));
    } catch {
      // ignore
    }

    if (!customText) setInputValue('');
    setIsLoading(true);

    try {
      const docIdToSend = currentDocKey === 'general' ? null : currentDocKey;
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          documentName: activeNote ? activeNote.name : null,
          docId: docIdToSend,
          mode: 'general'
        })
      });

      const data = await response.json();

      let finalMessages;
      if (response.ok && data.answer) {
        finalMessages = [
          ...updatedWithUser,
          {
            role: 'bot',
            text: data.answer,
            sources: data.sources || [],
            score: data.score
          }
        ];
      } else {
        finalMessages = [
          ...updatedWithUser,
          {
            role: 'bot',
            text: data.error || 'Server returned an error generating response.',
            sources: []
          }
        ];
      }

      setMessages(finalMessages);
      try {
        localStorage.setItem(`studytree_chat_${currentDocKey}`, JSON.stringify(finalMessages));
      } catch {
        // ignore
      }
    } catch {
      const errorMessages = [
        ...updatedWithUser,
        {
          role: 'bot',
          text: 'Error connecting to StudyTree RAG backend (http://localhost:3001). Please make sure the backend is running with `node server/index.js`.',
          sources: []
        }
      ];
      setMessages(errorMessages);
      try {
        localStorage.setItem(`studytree_chat_${currentDocKey}`, JSON.stringify(errorMessages));
      } catch {
        // ignore
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch(`${API_BASE}/api/chat/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'general',
          docId: currentDocKey === 'general' ? null : currentDocKey
        })
      });
    } catch {
      // ignore
    }
    const initialMsg = getWelcomeMessage(activeNote);
    setMessages(initialMsg);
    try {
      localStorage.setItem(`studytree_chat_${currentDocKey}`, JSON.stringify(initialMsg));
    } catch {
      // ignore
    }
  };

  return (
    <div className="feature-view chat-feature-view animate-fade-in">
      <input
        type="file"
        ref={chatFileInputRef}
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handleChatDirectUpload}
      />

      <div className="feature-header">
        <div className="tool-icon-wrapper bg-blue"><MessageSquare /></div>
        <div style={{ flex: 1 }}>
          <h3 className="page-title" style={{ fontSize: '1.25rem', marginBottom: 0 }}>Study Assistant</h3>
          <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>Ask anything about your uploaded study documents.</p>
        </div>
        {activeNote ? (
          <div className="active-note-indicator">
            <FileText size={14} />
            <span>Active: {activeNote.name}</span>
          </div>
        ) : (
          <div className="active-note-indicator" style={{ backgroundColor: '#f1f5f9', color: 'var(--text-muted)' }}>
            <span>Searching Across All Documents</span>
          </div>
        )}
        <button
          className="btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          onClick={() => chatFileInputRef.current?.click()}
          disabled={isUploading}
          title="Upload a PDF directly to chat with it"
        >
          <FilePlus size={14} />
          <span>Upload PDF</span>
        </button>
        <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={handleClearChat}>
          Clear Chat
        </button>
      </div>

      <div className="chat-container">
        <aside className="chat-sidebar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>
              Documents ({notes.length})
            </p>
            <button
              className="btn-primary"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: 'var(--radius-sm)' }}
              onClick={() => chatFileInputRef.current?.click()}
              disabled={isUploading}
              title="Upload and chat with PDF directly"
            >
              <Plus size={13} />
              <span>Upload</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
            <div
              className={`note-selector-item ${activeNoteId === null ? 'active' : ''}`}
              onClick={() => setActiveNoteId(null)}
            >
              <MessageSquare size={16} />
              <span style={{ fontSize: '0.85rem' }}>General Chat (All Docs)</span>
            </div>
            {notes.map(note => (
              <div
                key={note.id || note.docId}
                className={`note-selector-item ${activeNoteId === (note.id || note.docId) ? 'active' : ''}`}
                onClick={() => setActiveNoteId(note.id || note.docId)}
              >
                <FileText size={16} />
                <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {note.name}
                </span>
              </div>
            ))}
          </div>

          {notes.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
              <FilePlus size={24} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                No PDFs uploaded yet.
              </p>
              <button
                className="btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', width: '100%' }}
                onClick={() => chatFileInputRef.current?.click()}
                disabled={isUploading}
              >
                + Upload PDF Directly
              </button>
            </div>
          )}
        </aside>

        <div className="chat-main">
          {isUploading && (
            <div style={{ padding: '0.75rem 1.25rem', margin: '1rem 1.5rem 0 1.5rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#1d4ed8' }}>
              <RotateCcw size={16} className="spin-animation" />
              <span>Uploading and indexing <strong>{uploadFileName}</strong>... Getting ready for chat.</span>
            </div>
          )}

          <div ref={messagesContainerRef} className="chat-messages" style={{ padding: '1.5rem' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.role}`}>
                <div className="chat-bubble-content">
                  {renderFormattedText(msg.text)}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    {msg.sources.map((src, i) => (
                      <span key={i} className="source-tag">
                        <FileText size={12} />
                        <span>{src}</span>
                        {msg.score ? <span className="score-badge">{(msg.score * 100).toFixed(0)}%</span> : null}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble bot">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RotateCcw size={16} className="spin-animation" color="var(--primary)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Finding relevant study context & preparing answer...</span>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Prompt Chips */}
          <div className="prompt-chips-row">
            <button className="prompt-chip" onClick={() => handleSend("Quiz me: Ask me 2 tough interview questions based on this document.")}>Generate Quiz Questions</button>
            <button className="prompt-chip" onClick={() => handleSend("What are the most likely technical exam questions on this topic?")}>
              <CheckSquare size={14} style={{ marginRight: '5px' }} />
              Likely Exam Questions
            </button>
            <button className="prompt-chip" onClick={() => handleSend("Give me a rapid true/false knowledge check from this text.")}>True / False Check</button>
          </div>

          <div className="chat-input-area" style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="icon-btn"
              style={{ color: 'var(--primary)', flexShrink: 0 }}
              onClick={() => chatFileInputRef.current?.click()}
              disabled={isUploading || isLoading}
              title="Upload and chat with a PDF document directly"
            >
              <Paperclip size={18} />
            </button>
            <input
              type="text"
              placeholder={
                isUploading
                  ? `Uploading & indexing ${uploadFileName}...`
                  : activeNote
                  ? `Ask anything grounded in ${activeNote.name}...`
                  : "Ask anything across all indexed study notes..."
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading || isUploading}
            />
            <button className="chat-send-btn" onClick={() => handleSend()} disabled={isLoading || isUploading}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Document Upload & Summarizer Component
const UploadUI = ({ title, subtitle, icon, colorClass, onUploadSuccess, onSwitchToChat }) => {
  const [fileSelected, setFileSelected] = useState(false);
  const [fileObj, setFileObj] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [processedResult, setProcessedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const steps = [
    "Extracting text content with pdf-parse...",
    "Segmenting text into coherent semantic chunks...",
    "Generating 384-d dense embeddings (all-MiniLM-L6-v2)...",
    "Synthesizing key points and indexing vectors in store..."
  ];

  const handleFile = (file) => {
    if (!file) return;
    setErrorMessage('');
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a valid PDF document. Other formats are currently not supported.');
      return;
    }
    setFileObj(file);
    setFileName(file.name);
    setFileSelected(true);
    setProcessedResult(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!fileObj || isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorMessage('');
    setAnalysisStep(0);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

    // Genuine stage transitions
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => (prev < steps.length - 2 ? prev + 1 : prev));
    }, 1100);

    try {
      const formData = new FormData();
      formData.append('document', fileObj);

      const response = await fetch(`${API_BASE}/api/ingest`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearInterval(stepInterval);

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server returned an unparseable response.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server failed to ingest PDF.');
      }

      setAnalysisStep(steps.length - 1);

      // Verify indexing before updating library
      try {
        const verifyRes = await fetch(`${API_BASE}/api/documents`);
        if (verifyRes.ok) {
          const docList = await verifyRes.json();
          const found = docList.some(d => (d.id || d.docId) === data.docId || d.filename === (data.filename || fileName));
          if (!found) {
            console.warn('[UploadUI] Document indexing delayed, proceeding with response payload.');
          }
        }
      } catch {
        // network verification fallback
      }

      const newDoc = {
        id: data.docId,
        docId: data.docId,
        name: data.name || fileName,
        filename: data.filename || fileName,
        summary: data.summary,
        keyPoints: data.keyPoints || [],
        chunksCount: data.chunksAdded || 0,
        fileSize: data.fileSize || fileObj.size,
        date: data.date || 'Just now'
      };

      setIsAnalyzing(false);
      setProcessedResult(newDoc);
      onUploadSuccess(newDoc);
    } catch (err) {
      clearTimeout(timeoutId);
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      const msg = err.name === 'AbortError'
        ? 'Upload timed out after 3 minutes. Please check your network or try with a smaller document.'
          : (err.message || "Error uploading document to AI study engine.");
      setErrorMessage(msg);
    }
  };

  return (
    <div className="feature-view animate-fade-in" style={{ position: 'relative', flex: 1 }}>
      {isAnalyzing && (
        <div className="analyzing-overlay animate-fade-in">
          <div className="upload-icon spin-animation"><RotateCcw size={48} /></div>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Analyzing & Indexing Document</h2>
            <p className="page-subtitle">Processing and preparing study notes for {fileName}</p>
          </div>
          <div className="analyzing-steps">
            {steps.map((step, idx) => (
              <div key={idx} className={`step-item ${idx <= analysisStep ? 'active' : ''}`}>
                <div className="step-dot"></div>
                <span>{step}</span>
                {idx === analysisStep && <CheckSquare size={14} style={{ marginLeft: 'auto' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="feature-header">
        <div className={`tool-icon-wrapper ${colorClass}`}>{icon}</div>
        <div>
          <h3 className="page-title" style={{ fontSize: '1.25rem', marginBottom: 0 }}>{title}</h3>
          <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>{subtitle}</p>
        </div>
      </div>

      <div className="feature-body" style={{ justifyContent: 'center' }}>
        {errorMessage && (
          <div className="error-banner animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              {fileObj && !isAnalyzing && (
                <button
                  className="btn-secondary"
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', backgroundColor: '#fff', borderColor: '#fca5a5', color: '#b91c1c' }}
                  onClick={handleProcess}
                >
                  Retry Upload
                </button>
              )}
              <button onClick={() => setErrorMessage('')}><X size={16} /></button>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".pdf"
        />

        {!fileSelected ? (
          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ borderColor: isDragging ? 'var(--primary)' : undefined }}
          >
            <div className="upload-icon">
              <UploadCloud size={32} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                Drag & Drop your technical PDF here
              </h4>
              <p style={{ textAlign: 'center' }}>
                or click to browse from your computer (e.g. OS, Networks, DBMS, System Design PDFs)
              </p>
            </div>
            <button
              className="btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current.click();
              }}
            >
              Select PDF File
            </button>
          </div>
        ) : processedResult ? (
          <div className="upload-success animate-fade-in" style={{ textAlign: 'left', maxWidth: '750px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="success-icon" style={{ padding: '0.75rem', margin: 0 }}>
                <CheckCircle2 size={28} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: 0 }}>Document Processed & Ready</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {processedResult.name} • {processedResult.chunksCount} study sections ready
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Generated Document Summary</h4>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                {processedResult.summary}
              </p>
            </div>

            {processedResult.keyPoints && processedResult.keyPoints.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Key Takeaways</h4>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  {processedResult.keyPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="action-buttons-row">
              <button className="btn-primary" onClick={() => onSwitchToChat(processedResult)}>
                Chat with this Document
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setFileSelected(false);
                  setProcessedResult(null);
                  setFileObj(null);
                }}
              >
                + Upload Another
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-success animate-fade-in">
            <div className="success-icon"><CheckSquare size={48} color="var(--primary)" /></div>
            <h2>PDF Ready for Ingestion</h2>
            <p className="file-name-display">{fileName}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Size: {(fileObj.size / 1024).toFixed(1)} KB
            </p>
            <div className="action-buttons-row">
              <button className="btn-primary" onClick={handleProcess} disabled={isAnalyzing}>
                {isAnalyzing ? 'Processing...' : 'Process & Index with AI'}
              </button>
              <button className="btn-secondary" onClick={() => setFileSelected(false)} disabled={isAnalyzing}>Change File</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Document Library UI Component with Deletion & Filter
const LibraryUI = React.memo(({ notes, onSelectDocument, onDeleteDocument, onUploadClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');

  const folders = useMemo(() => [
    { name: 'All', count: notes.length, color: 'bg-green' },
    { name: 'Distributed Systems', count: notes.filter(n => n.name.toLowerCase().includes('raft') || n.name.toLowerCase().includes('paxos') || n.name.toLowerCase().includes('dist')).length, color: 'bg-blue' },
    { name: 'Machine Learning', count: notes.filter(n => n.name.toLowerCase().includes('neural') || n.name.toLowerCase().includes('ml') || n.name.toLowerCase().includes('learning')).length, color: 'bg-teal' },
    { name: 'Architecture & OS', count: notes.filter(n => n.name.toLowerCase().includes('kernel') || n.name.toLowerCase().includes('os') || n.name.toLowerCase().includes('arch')).length, color: 'bg-orange' }
  ], [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (file.summary && file.summary.toLowerCase().includes(searchTerm.toLowerCase()));
      if (selectedFolder === 'All') return matchesSearch;
      if (selectedFolder === 'Distributed Systems') return matchesSearch && (file.name.toLowerCase().includes('raft') || file.name.toLowerCase().includes('dist') || file.name.toLowerCase().includes('paxos'));
      if (selectedFolder === 'Machine Learning') return matchesSearch && (file.name.toLowerCase().includes('neural') || file.name.toLowerCase().includes('ml') || file.name.toLowerCase().includes('learning'));
      if (selectedFolder === 'Architecture & OS') return matchesSearch && (file.name.toLowerCase().includes('kernel') || file.name.toLowerCase().includes('os') || file.name.toLowerCase().includes('arch'));
      return matchesSearch;
    });
  }, [notes, searchTerm, selectedFolder]);

  return (
    <div className="library-container animate-fade-in" style={{ flex: 1 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem' }}>Study Knowledge Base</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Browse your study files, summaries, and notes</p>
        </div>
        <button className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }} onClick={onUploadClick}>
          + Upload Document
        </button>
      </div>

      <div className="folders-grid" style={{ marginBottom: '2rem' }}>
        {folders.map(f => (
          <div
            key={f.name}
            className={`folder-card ${selectedFolder === f.name ? 'active' : ''}`}
            onClick={() => setSelectedFolder(f.name)}
            style={{ borderColor: selectedFolder === f.name ? 'var(--primary)' : undefined }}
          >
            <div className={`folder-icon ${f.color}`}><Folder size={24} /></div>
            <div className="folder-info">
              <h4>{f.name}</h4>
              <p>{f.count} documents</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.25rem' }}>
          {selectedFolder === 'All' ? 'All Ingested Documents' : `${selectedFolder} Documents`} ({filteredNotes.length})
        </h3>
        <input
          type="text"
          placeholder="Filter documents..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }}
        />
      </div>

      <div className="files-list">
        {filteredNotes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3.5rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)' }}>
            <FilePlus size={40} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ marginBottom: '0.25rem' }}>No documents found</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Upload your technical course notes or papers to enable AI-powered study.
            </p>
            <button className="btn-primary" onClick={onUploadClick}>Upload PDF</button>
          </div>
        )}

        {filteredNotes.map(file => (
          <div key={file.id || file.docId} className="file-item">
            <div className="file-icon bg-main"><FileText size={18} /></div>
            <div className="file-details">
              <h4>{file.name}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {file.chunksCount || 0} Topics • {file.date || 'Recent'} • {file.summary ? file.summary.slice(0, 90) + '...' : 'PDF Document'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                onClick={() => onSelectDocument(file, 'Chat Assistant')}
              >
                Chat
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#9333ea', borderColor: '#d8b4fe' }}
                onClick={() => onSelectDocument(file, 'Exam Ready')}
              >
                Exam Mode
              </button>
              <button
                className="icon-btn-small"
                style={{ color: '#ef4444' }}
                title="Delete document"
                onClick={() => onDeleteDocument(file.id || file.docId, file.name)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Exam Ready UI Component - Real Document-Grounded Knowledge Evaluator
const ExamReadyUI = React.memo(({ notes, activeNoteId, setActiveNoteId }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef(null);

  const activeNote = notes.find(n => n.id === activeNoteId || n.docId === activeNoteId);
  const currentDocKey = activeNote ? (activeNote.id || activeNote.docId) : null;

  const getWelcomeMessage = useCallback((note) => {
    return [
      {
        role: 'bot',
        text: note
          ? `Welcome to Exam Ready mode for "${note.name}"! I will act as your strict technical oral examiner, testing and evaluating your answers using ONLY this document.`
          : "Welcome to Exam Ready mode! Select a document from your library to begin strict technical examination."
      }
    ];
  }, []);

  const [messages, setMessages] = useState(() => {
    if (!currentDocKey) return getWelcomeMessage(null);
    try {
      const saved = localStorage.getItem(`studytree_exam_${currentDocKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return getWelcomeMessage(activeNote);
  });

  // Switch exam messages when active document changes
  useEffect(() => {
    if (!currentDocKey) {
      setMessages(getWelcomeMessage(null));
      return;
    }
    let isCurrent = true;
    try {
      const saved = localStorage.getItem(`studytree_exam_${currentDocKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        } else {
          setMessages(getWelcomeMessage(activeNote));
        }
      } else {
        setMessages(getWelcomeMessage(activeNote));
      }
    } catch {
      setMessages(getWelcomeMessage(activeNote));
    }

    async function syncExamChat() {
      try {
        const res = await fetch(`${API_BASE}/api/chat/history?mode=exam&docId=${currentDocKey}`);
        if (res.ok) {
          const backendHistory = await res.json();
          if (isCurrent && Array.isArray(backendHistory) && backendHistory.length > 0) {
            setMessages(backendHistory);
            try {
              localStorage.setItem(`studytree_exam_${currentDocKey}`, JSON.stringify(backendHistory));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // Backend offline, local storage active
      }
    }

    syncExamChat();

    return () => {
      isCurrent = false;
    };
  }, [currentDocKey, activeNote, getWelcomeMessage]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (overridePrompt = null) => {
    const textToSend = overridePrompt || inputValue;
    if (!textToSend.trim() || !activeNote || isLoading) return;

    const userMessage = textToSend.trim();
    const updatedWithUser = [...messages, { role: 'user', text: userMessage }];
    setMessages(updatedWithUser);
    try {
      localStorage.setItem(`studytree_exam_${currentDocKey}`, JSON.stringify(updatedWithUser));
    } catch {
      // ignore
    }

    if (!overridePrompt) setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          documentName: activeNote.name,
          docId: currentDocKey,
          mode: 'exam'
        })
      });

      const data = await response.json();

      let finalMessages;
      if (response.ok && data.answer) {
        finalMessages = [
          ...updatedWithUser,
          {
            role: 'bot',
            text: data.answer,
            sources: data.sources || [activeNote.name],
            score: data.score
          }
        ];
      } else {
        finalMessages = [
          ...updatedWithUser,
          {
            role: 'bot',
            text: data.error || 'Failed to generate exam evaluation.',
            sources: []
          }
        ];
      }

      setMessages(finalMessages);
      try {
        localStorage.setItem(`studytree_exam_${currentDocKey}`, JSON.stringify(finalMessages));
      } catch {
        // ignore
      }
    } catch {
      const errorMessages = [
        ...updatedWithUser,
        {
          role: 'bot',
          text: 'Error connecting to StudyTree backend on port 3001. Please make sure server is running with `node server/index.js`.',
          sources: []
        }
      ];
      setMessages(errorMessages);
      try {
        localStorage.setItem(`studytree_exam_${currentDocKey}`, JSON.stringify(errorMessages));
      } catch {
        // ignore
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearExamChat = async () => {
    try {
      await fetch(`${API_BASE}/api/chat/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'exam',
          docId: currentDocKey
        })
      });
    } catch {
      // ignore
    }
    const initialMsg = getWelcomeMessage(activeNote);
    setMessages(initialMsg);
    try {
      localStorage.setItem(`studytree_exam_${currentDocKey}`, JSON.stringify(initialMsg));
    } catch {
      // ignore
    }
  };

  if (!activeNote) {
    return (
      <div className="feature-view animate-fade-in" style={{ flex: 1 }}>
        <div className="feature-header">
          <div className="tool-icon-wrapper bg-purple" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}><CheckSquare /></div>
          <div>
            <h3 className="page-title" style={{ fontSize: '1.25rem', marginBottom: 0 }}>Exam Ready Mode</h3>
            <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>Select an indexed document to begin your technical oral exam.</p>
          </div>
        </div>

        <div className="exam-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem', padding: '0 1.5rem' }}>
          {notes.map(note => (
            <div
              key={note.id || note.docId}
              className="folder-card animate-fade-in"
              onClick={() => setActiveNoteId(note.id || note.docId)}
              style={{ cursor: 'pointer', border: '1px solid #e9d5ff' }}
            >
              <div className="folder-icon" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}><FileText size={24} /></div>
              <div className="folder-info">
                <h4>{note.name}</h4>
                <p>{note.chunksCount || 0} topics • Start Practice</p>
              </div>
              <ChevronRight size={20} color="#9333ea" />
            </div>
          ))}
          {notes.length === 0 && (
            <div className="col-span-full" style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)' }}>
              <FilePlus size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3>No study documents found</h3>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                Upload your study materials in the "Document Summarizer" tab first to start preparing for exams.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="feature-view chat-feature-view animate-fade-in">
      <div className="feature-header glass-panel" style={{ padding: '1rem 1.5rem' }}>
        <div className="tool-icon-wrapper" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}><CheckSquare /></div>
        <div style={{ flex: 1 }}>
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Exam Mode: {activeNote.name}</h3>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Strict document-grounded evaluation. No outside hallucinations.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-secondary"
            onClick={handleClearExamChat}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
            title="Clear exam session"
          >
            Clear Session
          </button>
          <button
            className="btn-secondary"
            onClick={() => setActiveNoteId(null)}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
          >
            Switch Document
          </button>
        </div>
      </div>

      <div className="chat-main">
        <div ref={messagesContainerRef} className="chat-messages" style={{ padding: '1.5rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`} style={{ borderLeft: msg.role === 'bot' ? '3px solid #9333ea' : undefined }}>
              <div className="chat-bubble-content">
                {renderFormattedText(msg.text)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble bot">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={16} className="spin-animation" color="#9333ea" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Evaluating against document context...</span>
              </div>
            </div>
          )}
        </div>

        {/* Exam Quick Chips */}
        <div className="prompt-chips-row">
          <button className="prompt-chip" onClick={() => handleSend("Quiz me: Ask me 2 tough interview questions based on this document.")}>
            Generate Quiz Questions
          </button>
          <button className="prompt-chip" onClick={() => handleSend("What are the most likely Accenture technical interview questions on this topic?")}>
            Likely Interview Questions
          </button>
          <button className="prompt-chip" onClick={() => handleSend("Give me a rapid true/false knowledge check from this text.")}>
            True / False Check
          </button>
        </div>

        <div className="chat-input-area" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <input
            type="text"
            placeholder={`Verify your technical understanding against ${activeNote.name}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button
            className="chat-send-btn"
            onClick={() => handleSend()}
            disabled={isLoading}
            style={{ backgroundColor: '#9333ea' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});

// Main App Root Component
export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const pageContainerRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Automatically reset page scroll to top whenever activeTab changes
  useEffect(() => {
    if (pageContainerRef.current) {
      pageContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  const handlePageScroll = (e) => {
    setShowScrollTop(e.target.scrollTop > 220);
  };

  const scrollToTop = () => {
    if (pageContainerRef.current) {
      pageContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // User tasks with persistence
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('studytree_tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [
      { id: 1, title: 'Understand Raft Leader Election & Heartbeats', due: 'Today', done: true },
      { id: 2, title: 'Review Cosine Similarity & Dense Embeddings', due: 'Tomorrow', done: false },
      { id: 3, title: 'Prepare StudyTree Accenture Demo Walkthrough', due: 'This Week', done: false }
    ];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

  // Analytics stats
  const [studyMinutes, setStudyMinutes] = useState(() => {
    return parseInt(localStorage.getItem('studytree_minutes') || '75', 10);
  });



  // Persist tasks
  useEffect(() => {
    localStorage.setItem('studytree_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Sync documents and health from backend
  const refreshDocuments = useCallback(async () => {
    try {
      const docsRes = await fetch(`${API_BASE}/api/documents`);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setNotes(docsData);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const healthRes = await fetch(`${API_BASE}/api/health`);
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          if (isMounted) {
            setBackendConnected(true);
            setSystemHealth(healthData);
          }
        } else if (isMounted) {
          setBackendConnected(false);
        }

        const docsRes = await fetch(`${API_BASE}/api/documents`);
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          if (isMounted) {
            setNotes(docsData);
            setActiveNoteId(prev => (prev === null && docsData.length > 0 ? (docsData[0].id || docsData[0].docId) : prev));
          }
        }


      } catch {
        if (isMounted) {
          setBackendConnected(false);
        }
      }
    }

    loadData();
    const interval = setInterval(loadData, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleUploadSuccess = useCallback((newNote) => {
    setNotes(prev => {
      const existing = prev.filter(n => (n.id || n.docId) !== (newNote.id || newNote.docId));
      return [newNote, ...existing];
    });
    setActiveNoteId(newNote.id || newNote.docId);
  }, []);

  const handleSwitchToChat = useCallback((doc) => {
    setActiveNoteId(doc.id || doc.docId);
    setActiveTab('Chat Assistant');
  }, []);

  const handleDeleteDocument = useCallback(async (docId, docName) => {
    if (!window.confirm(`Are you sure you want to delete "${docName}" from your library?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/documents/${docId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setNotes(prev => prev.filter(n => (n.id || n.docId) !== docId));
        if (activeNoteId === docId) {
          setActiveNoteId(null);
        }
        refreshDocuments();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  }, [activeNoteId, refreshDocuments]);

  const handleToggleTask = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      due: 'Today',
      done: false
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setShowTaskInput(false);
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleFocusSessionComplete = useCallback(() => {
    setStudyMinutes(prev => {
      const updated = prev + 25;
      localStorage.setItem('studytree_minutes', updated.toString());
      return updated;
    });
  }, []);

  const navItems = useMemo(() => [
    { name: 'Overview', icon: <BookOpen size={20} /> },
    { name: 'My Library', icon: <Folder size={20} /> },
    { name: 'Chat Assistant', icon: <MessageSquare size={20} /> },
    { name: 'Document Summarizer', icon: <FileEdit size={20} /> },
    { name: 'Exam Ready', icon: <CheckSquare size={20} /> },
  ], []);

  const tools = useMemo(() => [
    { name: 'Chat Assistant', desc: 'Ask questions & solve problems with AI', icon: <MessageSquare size={24} />, bg: 'bg-blue' },
    { name: 'Document Summarizer', desc: 'Ingest PDFs & get instant key points', icon: <FileEdit size={24} />, bg: 'bg-teal' },
    { name: 'Exam Ready', desc: 'Strict document-grounded mock exam', icon: <CheckSquare size={24} />, bg: 'bg-purple' },
  ], []);

  const renderContent = () => {
    switch (activeTab) {
      case 'My Library':
        return (
          <LibraryUI
            notes={notes}
            onSelectDocument={(doc, targetTab = 'Chat Assistant') => {
              setActiveNoteId(doc.id || doc.docId);
              setActiveTab(targetTab);
            }}
            onDeleteDocument={handleDeleteDocument}
            onUploadClick={() => setActiveTab('Document Summarizer')}
          />
        );
      case 'Exam Ready':
        return (
          <ExamReadyUI
            notes={notes}
            activeNoteId={activeNoteId}
            setActiveNoteId={setActiveNoteId}
          />
        );
      case 'Chat Assistant':
        return (
          <ChatbotUI
            notes={notes}
            activeNoteId={activeNoteId}
            setActiveNoteId={setActiveNoteId}
            onUploadSuccess={handleUploadSuccess}
          />
        );
      case 'Document Summarizer':
        return (
          <UploadUI
            title="Document Summarizer & Indexer"
            subtitle="Extract text, generate dense embeddings, and query technical documents."
            icon={<FileEdit />}
            colorClass="bg-teal"
            onUploadSuccess={handleUploadSuccess}
            onSwitchToChat={handleSwitchToChat}
          />
        );
      default:
        return (
          <div className="dashboard-grid animate-fade-in" style={{ flex: 1 }}>
            {/* Welcome Hero */}
            <div className="card col-span-12 welcome-hero">
              <div className="welcome-content">
                <h2 className="welcome-title">Welcome back, Adarsh!</h2>
                <p className="welcome-text" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  You have <strong>{notes.length}</strong> study document{notes.length === 1 ? "" : "s"} ready in your library.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                  <button className="btn-primary" onClick={() => setActiveTab('Chat Assistant')}>
                    Start Studying
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ color: 'white', borderColor: 'white' }}
                    onClick={() => setActiveTab('Document Summarizer')}
                  >
                    + Upload New PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Tasks Widget */}
            <div className="card col-span-4 flex-col">
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Study Tasks</h3>
                <button
                  className="icon-btn-small"
                  onClick={() => setShowTaskInput(!showTaskInput)}
                  title="Add new study task"
                >
                  <Plus size={16} />
                </button>
              </div>

              {showTaskInput && (
                <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Enter study task..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    style={{ flex: 1, padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    autoFocus
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Add</button>
                </form>
              )}

              <div className="tasks-list">
                {tasks.map(task => (
                  <div key={task.id} className={`task-item ${task.done ? 'completed' : ''}`}>
                    <button
                      className="task-checkbox"
                      onClick={() => handleToggleTask(task.id)}
                    >
                      {task.done ? <CheckSquare size={16} color="var(--primary)" /> : <Square size={16} color="var(--text-muted)" />}
                    </button>
                    <div className="task-details" style={{ flex: 1 }}>
                      <h4>{task.title}</h4>
                      <p>{task.due}</p>
                    </div>
                    <button
                      className="icon-btn-small"
                      onClick={() => handleDeleteTask(task.id)}
                      style={{ opacity: 0.6 }}
                      title="Delete task"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Tools Grid */}
            <div className="card col-span-8">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Study Tools</h3>
              <div className="tools-grid">
                {tools.map(tool => (
                  <div key={tool.name} className="tool-card" onClick={() => setActiveTab(tool.name)}>
                    <div className={`tool-icon-wrapper ${tool.bg}`}>{tool.icon}</div>
                    <div>
                      <h4>{tool.name}</h4>
                      <p>{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics & Progress */}
            <div className="card col-span-6 flex-col">
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Analytics & Progress</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Weekly Overview</span>
              </div>
              <div className="analytics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-icon bg-green"><Clock size={20} /></div>
                  <div className="stat-info">
                    <p>Focus Time</p>
                    <h4>{(studyMinutes / 60).toFixed(1)}h</h4>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon bg-orange"><TrendingUp size={20} /></div>
                  <div className="stat-info">
                    <p>Streak</p>
                    <h4>5 Days</h4>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon bg-blue"><BookOpen size={20} /></div>
                  <div className="stat-info">
                    <p>Study Docs</p>
                    <h4>{notes.length}</h4>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon bg-purple"><CheckSquare size={20} /></div>
                  <div className="stat-info">
                    <p>Tasks Done</p>
                    <h4>{tasks.filter(t => t.done).length}/{tasks.length}</h4>
                  </div>
                </div>
              </div>
              {tasks.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <span>Task Completion Rate</span>
                    <span style={{ fontWeight: 600 }}>{Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)}%`,
                        backgroundColor: 'var(--primary)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="card col-span-6 flex-col">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Activity</h3>
              <div className="activity-list">
                {notes.slice(0, 4).map(note => (
                  <div
                    key={note.id || note.docId}
                    className="activity-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setActiveNoteId(note.id || note.docId);
                      setActiveTab('Chat Assistant');
                    }}
                  >
                    <div className="activity-icon"><FileText size={18} /></div>
                    <div className="activity-details">
                      <h5>{note.name}</h5>
                      <p>{note.chunksCount || 0} topics ready for review</p>
                    </div>
                    <div className="activity-time">{note.date || 'Recent'}</div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No recent activity. Upload your first PDF to begin studying!
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
      />

      <main className="main-content">
        <Header
          notes={notes}
          tasks={tasks}
          studyMinutes={studyMinutes}
          onSelectDocument={(doc) => {
            setActiveNoteId(doc.id || doc.docId);
            setActiveTab('Chat Assistant');
          }}
          onFocusComplete={handleFocusSessionComplete}
        />
        <div
          ref={pageContainerRef}
          className="page-container"
          onScroll={handlePageScroll}
        >
          {activeTab === 'Overview' && (
            <div className="page-header">
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Track your documents, study progress, and exam readiness.</p>
            </div>
          )}
          {renderContent()}

          {showScrollTop && (
            <button
              className="return-to-top-btn animate-fade-in"
              onClick={scrollToTop}
              title="Return to top"
              aria-label="Scroll back to top"
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}


