import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { LogOut, Copy, Send, Bot, Check, LayoutDashboard, Brain, Globe, Code, FileText, Trash2, Search, Pin, Star, Edit2, MoreVertical, X, Clock } from 'lucide-react';
import ThinkingLoader from './ThinkingLoader';
import StreamingMarkdown from './StreamingMarkdown';
const API_URL = (import.meta.env.VITE_API_URL || "https://agentic-ai-1-f6cz.onrender.com/").replace(/\/$/, "");
const Dashboard = ({ user, onLogout }) => {
  const [task, setTask] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [popupAgent, setPopupAgent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // States for delete animation
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [slidingOutIds, setSlidingOutIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  // States for advanced conversation management
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [softDeletedChats, setSoftDeletedChats] = useState({});
  const [undoToast, setUndoToast] = useState(null);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const mainContentRef = useRef(null);

  React.useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.username) return;
      try {
        const res = await fetch(`${API_URL}/api/history/${user.username}`);
        if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : { history: [] };
          // The API returns it sorted newest first (timestamp DESC). We want oldest first for display flow.
          setChatHistory((data.history || []).reverse());
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;

    setIsProcessing(true);
    setResult(null);
    setError('');
    setExpandedSection(false);
    setSelectedHistoryItem(null);
    setPopupAgent(null);

    try {
      const response = await fetch(`${API_URL}/api/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, username: user.username })
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("Raw response (not JSON):", text);
        throw new Error(`Invalid response format from server (Status ${response.status})`);
      }

      if (response.ok) {
        setResult(data);
        setIsStreaming(true);
        
        // Append to chat history
        const newHistoryItem = {
          _id: data.chat_id || Date.now().toString(), // Use actual DB ID
          prompt: task,
          title: task.length > 30 ? task.substring(0, 30) + '...' : task,
          response: data.final_answer,
          agent: (data.agents || []).join(", "),
          timestamp: new Date().toISOString(),
          is_pinned: false,
          is_favorite: false
        };
        setChatHistory(prev => [...prev, newHistoryItem]);
        
      } else {
        setError(data.detail || 'An error occurred while processing the task.');
      }
    } catch (err) {
      setError('Could not connect to the backend server. Is it running?');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateChat = async (chatId, updates) => {
    setChatHistory(prev => prev.map(chat => chat._id === chatId ? { ...chat, ...updates } : chat));
    try {
      await fetch(`${API_URL}/api/history/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error("Failed to update chat metadata", err);
    }
  };

  const handleRenameSubmit = (chatId) => {
    if (editTitle.trim()) {
      handleUpdateChat(chatId, { title: editTitle });
    }
    setEditingChatId(null);
  };

  const handleDeleteChat = (e, chatId, chatTitle) => {
    e.stopPropagation();

    // Start sliding out
    setSlidingOutIds(prev => new Set(prev).add(chatId));

    setTimeout(() => {
      // Soft delete visually
      setSoftDeletedChats(prev => ({ ...prev, [chatId]: true }));
      setSlidingOutIds(prev => {
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });

      if (selectedHistoryItem?._id === chatId) {
        setSelectedHistoryItem(null);
      }

      // Set undo toast with 5s timer
      const timerId = setTimeout(async () => {
        try {
          await fetch(`${API_URL}/api/history/${chatId}`, { method: 'DELETE' });
          setChatHistory(prev => prev.filter(c => c._id !== chatId));
          setUndoToast(null);
        } catch (err) {
          console.error("Deletion failed", err);
        }
      }, 5000);

      setUndoToast({ chatId, title: chatTitle || "Conversation", timerId });
    }, 400);
  };

  const handleUndoDelete = () => {
    if (undoToast) {
      clearTimeout(undoToast.timerId);
      setSoftDeletedChats(prev => {
        const next = { ...prev };
        delete next[undoToast.chatId];
        return next;
      });
      setUndoToast(null);
      setToast("✅ Undo successful");
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Grouping
  const groupConversations = (history) => {
    const groups = { pinned: [], today: [], yesterday: [], last7days: [], older: [] };
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    history.forEach(chat => {
      if (softDeletedChats[chat._id]) return;
      if (searchQuery && !(chat.title || chat.prompt).toLowerCase().includes(searchQuery.toLowerCase())) return;

      if (chat.is_pinned) {
        groups.pinned.push(chat);
        return;
      }

      const chatDate = new Date(chat.timestamp);
      const chatDateStr = chatDate.toDateString();

      if (chatDateStr === todayStr) {
        groups.today.push(chat);
      } else if (chatDateStr === yesterdayStr) {
        groups.yesterday.push(chat);
      } else if (chatDate >= sevenDaysAgo) {
        groups.last7days.push(chat);
      } else {
        groups.older.push(chat);
      }
    });
    return groups;
  };
  const groupedHistory = groupConversations(chatHistory);
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderAgentIcon = (agent) => {
    switch (agent) {
      case 'planner': return <Brain className="agent-icon planner-icon" size={18} />;
      case 'research': return <Globe className="agent-icon research-icon" size={18} />;
      case 'coder': return <Code className="agent-icon coder-icon" size={18} />;
      case 'critic': return <FileText className="agent-icon critic-icon" size={18} />;
      default: return <Bot className="agent-icon" size={18} />;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      
      {/* Sidebar Area */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="app-branding">
            <span className="logo-emoji">🤖</span>
            <h2>Agentic AI</h2>
            <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${!selectedHistoryItem ? 'active' : ''}`}
            onClick={() => { setSelectedHistoryItem(null); setIsSidebarOpen(false); }}
          >
            <LayoutDashboard size={20} />
            <span>New Task</span>
          </div>
        </nav>

        {/* Sidebar History List */}
        <div className="sidebar-history">
          <div className="search-container">
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && <X size={14} className="clear-search" onClick={() => setSearchQuery('')} />}
          </div>

          {isLoadingHistory ? (
            <div className="history-loader-small">Loading...</div>
          ) : chatHistory.length > 0 ? (
            <div className="history-scroll-area">
              {Object.entries(groupedHistory).map(([groupName, chats]) => {
                if (chats.length === 0) return null;
                
                const formatLabel = {
                  pinned: "📌 Pinned",
                  today: "Today",
                  yesterday: "Yesterday",
                  last7days: "Previous 7 Days",
                  older: "Older"
                };

                return (
                  <div key={groupName} className="history-group">
                    <h3 className="history-title">{formatLabel[groupName]}</h3>
                    <div className="history-list">
                      {chats.map((chat) => {
                        const isDeleting = deletingIds.has(chat._id);
                        const isSlidingOut = slidingOutIds.has(chat._id);
                        const isEditing = editingChatId === chat._id;
                        
                        return (
                        <div 
                          key={chat._id} 
                          className={`history-list-item ${selectedHistoryItem?._id === chat._id ? 'active' : ''} ${isDeleting ? 'deleting' : ''} ${isSlidingOut ? 'slide-out' : ''}`}
                          onClick={() => { if (!isDeleting && !isEditing) { setSelectedHistoryItem(chat); setIsSidebarOpen(false); } }}
                          style={isDeleting ? { pointerEvents: 'none' } : {}}
                        >
                          {chat.is_favorite ? <Star size={14} className="history-icon favorite-color" fill="#f59e0b" /> : <Bot size={14} className="history-icon" />}
                          
                          {isEditing ? (
                            <input
                              type="text"
                              className="inline-edit-input"
                              value={editTitle}
                              autoFocus
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={() => handleRenameSubmit(chat._id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit(chat._id);
                                if (e.key === 'Escape') setEditingChatId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="history-truncate">
                              {isDeleting ? "Deleting..." : (chat.title || chat.prompt)}
                            </span>
                          )}

                          {!isDeleting && !isEditing && (
                            <div className="history-actions" onClick={e => e.stopPropagation()}>
                              <button className="action-btn" onClick={() => handleUpdateChat(chat._id, { is_pinned: !chat.is_pinned })} title={chat.is_pinned ? "Unpin" : "Pin"}>
                                <Pin size={12} className={chat.is_pinned ? 'pinned-active' : ''} />
                              </button>
                              <button className="action-btn" onClick={() => handleUpdateChat(chat._id, { is_favorite: !chat.is_favorite })} title={chat.is_favorite ? "Unfavorite" : "Favorite"}>
                                <Star size={12} className={chat.is_favorite ? 'favorite-active' : ''} />
                              </button>
                              <button className="action-btn" onClick={() => { setEditingChatId(chat._id); setEditTitle(chat.title || chat.prompt); }} title="Rename">
                                <Edit2 size={12} />
                              </button>
                              <button className="delete-chat-btn" onClick={(e) => handleDeleteChat(e, chat._id, chat.title || chat.prompt)} title="Delete Chat">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="history-empty">No past chats</div>
          )}
        </div>

        <div className="user-profile">
          <div className="avatar">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <span className="username">{user?.username || 'User'}</span>
            <span className="status">Online</span>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="content-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="header-greeting">
              <h1>Welcome back, {user?.username}! 👋</h1>
            </div>
          </div>
          <p className="greeting-subtitle">What would you like me to work on today?</p>
        </header>

        <div className="task-container" ref={mainContentRef}>
          
          {selectedHistoryItem ? (
            <div className="historical-view animate-fade-in">
              <button 
                className="back-btn glass-panel"
                onClick={() => setSelectedHistoryItem(null)}
              >
                ← Back to New Task
              </button>
              
              <div className="history-item">
                <div className="history-prompt glass-panel">
                  <div className="prompt-header">
                    <div className="avatar user-avatar-small">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="timestamp">
                      {new Date(selectedHistoryItem.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="prompt-text">{selectedHistoryItem.prompt}</div>
                </div>
                
                <div className="history-response glass-panel">
                  <div className="response-header">
                    <div className="avatar bot-avatar-small">🤖</div>
                    <span className="agent-badge">{selectedHistoryItem.agent}</span>
                  </div>
                  <div className="response-content markdown-body">
                    <ReactMarkdown>{selectedHistoryItem.response}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="task-input-form glass-panel">
            <textarea
              className="task-textarea"
              placeholder="Ask anything you want to learn or build..."
              value={task}
              onChange={(e) => {
                setTask(e.target.value);
                // Auto-resize logic
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isProcessing}
            />
            <div className="form-footer">
              <span className="hint">Press <strong>Enter</strong> to run, <strong>Shift + Enter</strong> for new line</span>
              <button 
                type="submit" 
                className={`run-button ${isProcessing ? 'processing' : ''}`}
                disabled={!task.trim() || isProcessing}
              >
                {isProcessing ? 'Thinking...' : 'Run Task'}
                {!isProcessing && <Send size={16} className="send-icon" />}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="error-message animate-fade-in">
              <p>{error}</p>
            </div>
          )}

          {/* Loader */}
          {isProcessing && <ThinkingLoader />}

          {/* Results Area */}
          {result && !isProcessing && (
            <div className="results-container animate-fade-in">
              
              {/* Used Agents Chips */}
              <div className="agents-used">
                <span className="agents-label">Agents engaged:</span>
                <div className="agent-chips">
                  {result.agents && result.agents.map((agent) => (
                    <div key={agent} className={`agent-chip ${agent}`}>
                      {renderAgentIcon(agent)}
                      <span>{agent.charAt(0).toUpperCase() + agent.slice(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Answer Block */}
              <div className="final-answer-box glass-panel">
                <div className="box-header">
                  <h3><Check className="check-icon" size={20} /> Final Answer</h3>
                  {result.is_code && (
                    <button 
                      className={`copy-btn ${copied ? 'copied' : ''}`}
                      onClick={() => handleCopyCode(result.final_answer)}
                    >
                      {copied ? <><Check size={16}/> Copied</> : <><Copy size={16}/> Copy Code</>}
                    </button>
                  )}
                </div>
                
                <div className="answer-content">
                  {result.is_code ? (
                    <pre className="code-block">
                      <code>{result.final_answer}</code>
                    </pre>
                  ) : (
                    <div className="markdown-body">
                      {isStreaming ? (
                        <StreamingMarkdown 
                          content={result.final_answer} 
                          onComplete={() => setIsStreaming(false)}
                          scrollRef={mainContentRef}
                        />
                      ) : (
                        <ReactMarkdown>{result.final_answer}</ReactMarkdown>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Expandable Output Details */}
              {Object.keys(result.outputs || {}).length > 0 && (
                <div className="details-section">
                  <button 
                    className="toggle-details-btn glass-panel"
                    onClick={() => setExpandedSection(!expandedSection)}
                  >
                    <span>{expandedSection ? 'Hide' : 'View'} Internal Agent Details</span>
                    <span className="chevron">{expandedSection ? '▲' : '▼'}</span>
                  </button>

                  {expandedSection && (
                    <div className="details-grid animate-fade-in">
                      {['planner', 'research', 'coder', 'critic'].map((agentName) => {
                        const output = result.outputs[agentName];
                        if (!output) return null;
                        
                        return (
                          <div 
                            key={agentName} 
                            className={`agent-summary-card glass-panel ${agentName}`}
                            onClick={() => setPopupAgent({ name: agentName, output })}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {renderAgentIcon(agentName)}
                              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{agentName.charAt(0).toUpperCase() + agentName.slice(1)} Output</h4>
                            </div>
                            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 500 }}>View Details →</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          </> // End of new task conditional block
          )}
        </div>
      </main>

      {/* Modal Popup for Agent Output */}
      {popupAgent && (
        <div className="modal-overlay" onClick={() => setPopupAgent(null)}>
          <div 
            className={`modal-content agent-detail-card ${popupAgent.name}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`detail-header modal-header ${popupAgent.name}`}>
              <div className="modal-header-title">
                {renderAgentIcon(popupAgent.name)}
                <span>{popupAgent.name.charAt(0).toUpperCase() + popupAgent.name.slice(1)} Output</span>
              </div>
              <button 
                className="close-modal-btn" 
                onClick={() => setPopupAgent(null)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body detail-body markdown-body">
              <ReactMarkdown>{popupAgent.output}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
      {/* Undo Delete Toast Notification */}
      {undoToast && (
        <div className="toast-notification undo-toast animate-fade-in">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trash2 size={16} /> 
            Deleted "{undoToast.title.length > 20 ? undoToast.title.substring(0,20)+'...' : undoToast.title}"
          </span>
          <button className="undo-btn" onClick={handleUndoDelete}>
            <Clock size={14} /> Undo
          </button>
        </div>
      )}

      {/* Normal Toast */}
      {toast && (
        <div className="toast-notification">
          {toast}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
