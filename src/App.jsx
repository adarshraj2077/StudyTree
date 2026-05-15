import React, { useState } from 'react';
import {
  BookOpen,
  MessageSquare,
  FileText,
  Calculator,
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
  Folder,
  ChevronDown,
  MoreVertical,
  X
} from 'lucide-react';
import './App.css';

// Focus Timer Component
const FocusTimer = React.memo(() => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  React.useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft === 0]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="focus-timer-container">
      <button className="icon-btn timer-toggle" onClick={() => setShowTimer(!showTimer)}>
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
            <button className="btn-icon-primary" onClick={toggleTimer}>
              {isActive ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
            </button>
            <button className="btn-icon-secondary" onClick={resetTimer}>
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

// Memoized Sidebar Component for Performance
const Sidebar = React.memo(({ activeTab, setActiveTab, navItems }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">ST</div>
        <div className="logo-text">StudyTree</div>
      </div>

      <nav className="nav-menu">
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', paddingLeft: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MAIN MENU</p>
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

    </aside>
  );
});

// Memoized Header Component
const Header = React.memo(() => {
  return (
    <header className="header">
      <div className="search-bar">
        <Search size={18} color="var(--text-muted)" />
        <input type="text" placeholder="Search for documents, summaries, or notes..." />
      </div>

      <div className="header-right">
        <FocusTimer />
        <button className="icon-btn"><Bell size={20} /></button>
        <button className="icon-btn"><HelpCircle size={20} /></button>
        <div className="user-profile">
          <div className="avatar bg-blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <User size={20} />
          </div>
          <div className="user-info">
            <h4>Alex Student</h4>
          </div>
        </div>
      </div>
    </header>
  );
});

// Functional Component: Chatbot
const ChatbotUI = ({ notes, activeNoteId, setActiveNoteId, messages, setMessages }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = React.useRef(null);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const scrollToBottom = () => {
    // Instant scroll is better for performance when the site feels "heavy"
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  React.useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    const newMessages = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setInputValue('');

    setMessages(prev => [...prev, { role: 'bot', text: '...' }]); // simple typing indicator

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await response.json();
      
      setMessages(prev => {
        const withoutTyping = prev.slice(0, -1);
        return [...withoutTyping, { role: 'bot', text: data.answer || data.error || 'No response.' }];
      });
    } catch (err) {
      setMessages(prev => {
        const withoutTyping = prev.slice(0, -1);
        return [...withoutTyping, { role: 'bot', text: 'Error connecting to RAG backend.' }];
      });
    }
  };

  return (
    <div className="feature-view animate-fade-in" style={{ flex: 1, maxHeight: 'calc(100vh - 160px)' }}>
      <div className="feature-header">
        <div className="tool-icon-wrapper bg-blue"><MessageSquare /></div>
        <div style={{ flex: 1 }}>
          <h3 className="page-title" style={{ fontSize: '1.25rem', marginBottom: 0 }}>Study Assistant</h3>
          <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>Ask anything about your notes.</p>
        </div>
        {activeNote && (
          <div className="active-note-indicator">
            <FileText size={14} />
            <span>Active: {activeNote.name}</span>
          </div>
        )}
      </div>

      <div className="chat-container">
        <aside className="chat-sidebar">
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select Document</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
            <div
              className={`note-selector-item ${activeNoteId === null ? 'active' : ''}`}
              onClick={() => setActiveNoteId(null)}
            >
              <MessageSquare size={16} />
              <span style={{ fontSize: '0.85rem' }}>General Chat</span>
            </div>
            {notes.map(note => (
              <div
                key={note.id}
                className={`note-selector-item ${activeNoteId === note.id ? 'active' : ''}`}
                onClick={() => setActiveNoteId(note.id)}
              >
                <FileText size={16} />
                <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.name}</span>
              </div>
            ))}
          </div>
          <button className="btn-secondary" style={{ marginTop: 'auto', padding: '0.5rem', fontSize: '0.75rem' }} onClick={() => { setActiveNoteId(null); }}>+ New Context</button>
        </aside>

        <div className="chat-main">
          <div className="chat-messages" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.role}`}>
                {msg.text.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-area" style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
            <input
              type="text"
              placeholder={activeNote ? `Ask anything about ${activeNote.name}...` : "Type your question here..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="chat-send-btn" onClick={handleSend}><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified Upload UI
const UploadUI = ({ title, subtitle, icon, colorClass, onUploadSuccess }) => {
  const [fileSelected, setFileSelected] = useState(false);
  const [fileObj, setFileObj] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const fileInputRef = React.useRef(null);

  const steps = [
    "Extracting text content...",
    "Clustering key topics...",
    "Generating embeddings...",
    "Preparing your assistant..."
  ];

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      setFileName(file.name);
      setFileObj(file);
      setTimeout(() => {
        setFileSelected(true);
        setIsUploading(false);
      }, 500);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleProcess = async () => {
    setIsAnalyzing(true);
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) setAnalysisStep(currentStep);
    }, 800);
    
    try {
      const formData = new FormData();
      formData.append('document', fileObj);
      
      const response = await fetch('http://localhost:3001/api/ingest', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      clearInterval(interval);
      setAnalysisStep(steps.length - 1);
      
      setTimeout(() => {
        onUploadSuccess({
          id: Date.now(),
          name: fileName,
          summary: `Successfully ingested ${data.chunksAdded} chunks.`,
          keyPoints: ["Document processed via custom RAG backend", "Embeddings generated with LLaMA", "Ready for querying"],
          extractedInfo: "Backend processed document correctly.",
          date: 'Just now'
        });
      }, 500);
    } catch (error) {
      clearInterval(interval);
      console.error('Upload failed', error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="feature-view animate-fade-in" style={{ position: 'relative', flex: 1 }}>
      {isAnalyzing && (
        <div className="analyzing-overlay animate-fade-in">
          <div className="upload-icon spin-animation"><RotateCcw size={48} /></div>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Analyzing Document</h2>
            <p className="page-subtitle">Our AI is reading {fileName} to understand it.</p>
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
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt"
        />
        {!fileSelected ? (
          <div className="upload-area" onClick={handleFileClick}>
            <div className="upload-icon">
              {isUploading ? <RotateCcw size={32} className="spin-animation" /> : <UploadCloud size={32} />}
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                {isUploading ? 'Uploading...' : 'Drag & Drop your files here'}
              </h4>
              <p style={{ textAlign: 'center' }}>
                {isUploading ? 'Please wait while we process your document' : 'or click to browse from your computer (PDF, DOCX, TXT)'}
              </p>
            </div>
            {!isUploading && <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={(e) => { e.stopPropagation(); handleFileClick(); }}>Select Files</button>}
          </div>
        ) : (
          <div className="upload-success animate-fade-in">
            <div className="success-icon"><CheckSquare size={48} color="var(--primary)" /></div>
            <h2>File Ready for Processing</h2>
            <p className="file-name-display">{fileName}</p>
            <div className="action-buttons-row">
              <button className="btn-primary" onClick={handleProcess}>Process with AI</button>
              <button className="btn-secondary" onClick={() => setFileSelected(false)}>Upload Another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Functional Component: My Library
const LibraryUI = React.memo(({ notes }) => {
  const folders = [
    { name: 'Machine Learning', count: notes.length + 12, color: 'bg-green' },
    { name: 'Deep Learning', count: 8, color: 'bg-blue' },
    { name: 'OS & Architecture', count: 24, color: 'bg-orange' },
    { name: 'DBMS Systems', count: 5, color: 'bg-purple' }
  ];

  return (
    <div className="library-container animate-fade-in" style={{ flex: 1 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem' }}>Folders</h3>
        <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>+ New Folder</button>
      </div>

      <div className="folders-grid" style={{ marginBottom: '2.5rem' }}>
        {folders.map(f => (
          <div key={f.name} className="folder-card">
            <div className={`folder-icon ${f.color}`}><Folder size={24} /></div>
            <div className="folder-info">
              <h4>{f.name}</h4>
              <p>{f.count} items</p>
            </div>
            <button className="icon-btn-small"><MoreVertical size={16} /></button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.25rem' }}>Recent Documents</h3>
        <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Manage All</button>
      </div>

      <div className="files-list">
        {notes.length === 0 && <p className="text-muted" style={{ textAlign: 'center', padding: '3rem' }}>No documents uploaded yet.</p>}
        {[...notes].reverse().map(file => (
          <div key={file.id} className="file-item">
            <div className="file-icon bg-main"><FileText size={16} /></div>
            <div className="file-details">
              <h4>{file.name}</h4>
              <p>Document • {file.date}</p>
            </div>
            <button className="icon-btn-small"><MoreVertical size={16} /></button>
          </div>
        ))}
        <div className="file-item">
          <div className="file-icon bg-main"><CheckSquare size={16} /></div>
          <div className="file-details">
            <h4>Backprop Algorithms Q&A</h4>
            <p>Flashcards • 2 days ago</p>
          </div>
          <button className="icon-btn-small"><MoreVertical size={16} /></button>
        </div>
      </div>
    </div>
  );
});

// Memoized Exam Ready UI
const ExamReadyUI = React.memo(({ notes, activeNoteId, setActiveNoteId, messages, setMessages }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = React.useRef(null);
  
  const activeNote = notes.find(n => n.id === activeNoteId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  React.useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !activeNote) return;

    const newMessages = [...messages, { role: 'user', text: inputValue }];
    setMessages(newMessages);
    setInputValue('');

    setTimeout(() => {
      let botResponse = "";
      // Strict document-only logic
      if (inputValue.toLowerCase().includes('summary')) {
        botResponse = `[EXAM SUMMARY] From ${activeNote.name}: ${activeNote.summary}`;
      } else if (inputValue.toLowerCase().includes('key') || inputValue.toLowerCase().includes('points')) {
        botResponse = `[EXAM KEY POINTS] Derived from ${activeNote.name}:\n- ${activeNote.keyPoints.join('\n- ')}`;
      } else {
        botResponse = `Exam analysis of "${activeNote.name}" confirms: ${activeNote.extractedInfo}`;
      }

      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    }, 600);
  };

  if (!activeNote) {
    return (
      <div className="feature-view animate-fade-in" style={{ flex: 1 }}>
        <div className="feature-header">
          <div className="tool-icon-wrapper bg-purple"><CheckSquare /></div>
          <div>
            <h3 className="page-title" style={{ fontSize: '1.25rem', marginBottom: 0 }}>Exam Ready</h3>
            <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>Select a document to start your mock exam.</p>
          </div>
        </div>
        
        <div className="exam-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {notes.map(note => (
            <div key={note.id} className="folder-card animate-fade-in" onClick={() => setActiveNoteId(note.id)} style={{ cursor: 'pointer' }}>
              <div className="folder-icon bg-purple"><FileText size={24} /></div>
              <div className="folder-info">
                <h4>{note.name}</h4>
                <p>Start Knowledge Check</p>
              </div>
              <ChevronRight size={20} color="var(--primary)" />
            </div>
          ))}
          {notes.length === 0 && (
            <div className="col-span-full" style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)' }}>
              <FilePlus size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3>No documents found</h3>
              <p>Upload your study materials first to start preparing for exams.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="feature-view animate-fade-in" style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="feature-header glass-panel" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="tool-icon-wrapper bg-purple"><CheckSquare /></div>
        <div style={{ flex: 1 }}>
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Exam Mode: {activeNote.name}</h3>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Ask questions based ONLY on this document.</p>
        </div>
        <button className="btn-secondary" onClick={() => setActiveNoteId(null)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Switch Document</button>
      </div>

      <div className="chat-main glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`}>
              {msg.text.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-area" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <input
            type="text"
            placeholder={`Verify knowledge from ${activeNote.name}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="chat-send-btn" onClick={handleSend} style={{ backgroundColor: 'var(--purple-primary, #a855f7)' }}><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [notes, setNotes] = useState([
    {
      id: 1,
      name: "Neural_Networks_Intro.pdf",
      summary: "Comprehensive introduction to perceptrons, activation functions, and backpropagation.",
      keyPoints: ["Perceptrons are the building blocks of NNs", "ReLU prevents vanishing gradients", "Stochastic Gradient Descent for optimization"],
      extractedInfo: "neural networks learn by adjusting weights based on error gradients calculated during the forward and backward passes.",
      date: 'Yesterday'
    }
  ]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Welcome to StudyTree CS Assistant! Which topic are we building today?" }
  ]);
  const [examMessages, setExamMessages] = useState([
    { role: 'bot', text: "Welcome to Exam Mode. Select a document to start a focused knowledge check. I will only answer using information from your chosen file." }
  ]);

  const handleUploadSuccess = React.useCallback((newNote) => {
    setNotes(prev => [...prev, newNote]);
    setActiveNoteId(newNote.id);
    setActiveTab('Chat Assistant');
  }, []);

  const navItems = React.useMemo(() => [
    { name: 'Overview', icon: <BookOpen size={20} /> },
    { name: 'My Library', icon: <Folder size={20} /> },
    { name: 'Chat Assistant', icon: <MessageSquare size={20} /> },
    { name: 'Document Summarizer', icon: <FileEdit size={20} /> },
    { name: 'Exam Ready', icon: <CheckSquare size={20} /> },
  ], []);

  const tools = React.useMemo(() => [
    { name: 'Chat Assistant', desc: 'Ask questions & solve problems', icon: <MessageSquare size={24} />, bg: 'bg-blue' },
    { name: 'Document Summarizer', desc: 'Get key points instantly', icon: <FileEdit size={24} />, bg: 'bg-teal' },
    { name: 'Exam Ready', desc: 'Test your knowledge', icon: <CheckSquare size={24} />, bg: 'bg-purple' },
  ], []);

  const renderContent = () => {
    switch (activeTab) {
      case 'My Library': return <LibraryUI notes={notes} />;
      case 'Exam Ready': return <ExamReadyUI notes={notes} activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId} messages={examMessages} setMessages={setExamMessages} />;
      case 'Chat Assistant': return <ChatbotUI notes={notes} activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId} messages={messages} setMessages={setMessages} />;
      case 'Document Summarizer': return <UploadUI title="Document Summarizer" subtitle="Summarize technical docs in seconds." icon={<FileEdit />} colorClass="bg-teal" onUploadSuccess={handleUploadSuccess} />;
      default: return (
        <div className="dashboard-grid animate-fade-in" style={{ flex: 1 }}>
          <div className="card col-span-12 welcome-hero">
            <div className="welcome-content">
              <h2 className="welcome-title">Welcome back, Student! 👋</h2>
              <p className="welcome-text" style={{ color: 'rgba(255,255,255,0.9)' }}>You have {notes.length} CS documents ready in your library.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" onClick={() => setActiveTab('Chat Assistant')}>Chat with AI</button>
                <button className="btn-secondary" style={{ color: 'white', borderColor: 'white' }} onClick={() => setActiveTab('Document Summarizer')}>Upload New</button>
              </div>
            </div>
          </div>

          <div className="card col-span-4 flex-col">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Tasks</h3>
            <div className="tasks-list">
              {[
                { id: 1, title: 'Refactor ML Pipeline', due: 'Today', done: false },
                { id: 2, title: 'OS Kernel Scheduler', due: 'Tomorrow', done: false },
                { id: 3, title: 'Review DBMS Indexing', due: 'Friday', done: true }
              ].map(task => (
                <div key={task.id} className={`task-item ${task.done ? 'completed' : ''}`}>
                  <button className="task-checkbox">{task.done && <CheckSquare size={16} color="var(--primary)" />}</button>
                  <div className="task-details"><h4>{task.title}</h4><p>{task.due}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card col-span-8">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Study Tools</h3>
            <div className="tools-grid">
              {tools.map(tool => (
                <div key={tool.name} className="tool-card" onClick={() => setActiveTab(tool.name)}>
                  <div className={`tool-icon-wrapper ${tool.bg}`}>{tool.icon}</div>
                  <div><h4>{tool.name}</h4><p>{tool.desc}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card col-span-4 flex-col">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Analytics</h3>
            <div className="analytics-grid">
              <div className="stat-card">
                <div className="stat-icon bg-green"><Clock size={20} /></div>
                <div className="stat-info"><p>Hours</p><h4>12.5h</h4></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon bg-orange"><TrendingUp size={20} /></div>
                <div className="stat-info"><p>Streak</p><h4>5 Days</h4></div>
              </div>
            </div>
          </div>

          <div className="card col-span-4 flex-col">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Progress</h3>
            <div className="progress-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              {[{ name: 'ML', p: 75, c: 'var(--primary)' }, { name: 'OS', p: 40, c: 'var(--accent)' }, { name: 'DL', p: 90, c: '#f59e0b' }].map(item => (
                <div key={item.name} className="progress-item">
                  <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}><span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.name}</span><span>{item.p}%</span></div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-main)', borderRadius: '4px' }}><div style={{ width: `${item.p}%`, height: '100%', backgroundColor: item.c, borderRadius: '4px' }}></div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card col-span-4 flex-col">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Activity</h3>
            <div className="activity-list">
              <div className="activity-item"><div className="activity-icon"><FileEdit size={18} /></div><div className="activity-details"><h5>Summarized 'Paxos'</h5><p>Dist. Systems</p></div><div className="activity-time">2h ago</div></div>
              {notes.slice(0, 2).map(note => (
                <div key={note.id} className="activity-item"><div className="activity-icon"><MessageSquare size={18} /></div><div className="activity-details"><h5>Chat: {note.name}</h5><p>Chat</p></div><div className="activity-time">{note.date}</div></div>
              ))}
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

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} navItems={navItems} />

      <main className="main-content">
        <Header />
        <div className="page-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'Overview' && (
            <div className="page-header"><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Track your progress.</p></div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
