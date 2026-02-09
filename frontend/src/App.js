import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/layout/Sidebar';
import { Button } from './components/ui/Button';
import { SettingsModal } from './components/ui/SettingsModal';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  // Lifted State
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(Date.now());
  const [profile, setProfile] = useState({
    age: '',
    sex: '',
    height: '',
    weight: '',
    location: '',
    conditions: '',
    medications: '',
    allergies: '',
  });

  const loadChat = (historyId) => {
    const chatToLoad = chatHistory.find(c => c.id === historyId);
    if (chatToLoad) {
      setMessages(chatToLoad.savedMessages || []);
      setCurrentChatId(chatToLoad.id);
    }
  };

  const buildFallbackTitle = (messagesToSave) => {
    const firstUser = messagesToSave.find((msg) => msg.sender === 'user');
    if (!firstUser || !firstUser.text) return 'New chat';
    const trimmed = firstUser.text.trim();
    return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
  };

  const generateChatTitle = async (messagesToSave) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat-title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSave.slice(0, 10).map((msg) => ({
            sender: msg.sender,
            text: msg.text || '',
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.title) return buildFallbackTitle(messagesToSave);
      const cleaned = String(data.title).replace(/[".]/g, '').trim();
      if (!cleaned) return buildFallbackTitle(messagesToSave);
      return cleaned.length > 60 ? `${cleaned.slice(0, 60)}…` : cleaned;
    } catch (err) {
      return buildFallbackTitle(messagesToSave);
    }
  };

  const handleNewChat = async () => {
    const messagesToSave = [...messages];
    const chatIdToSave = currentChatId;

    setMessages([]);
    setCurrentChatId(Date.now());

    if (messagesToSave.length > 0) {
      const title = await generateChatTitle(messagesToSave);
      const newHistoryItem = {
        id: chatIdToSave,
        label: title,
        date: new Date().toLocaleDateString(),
        savedMessages: messagesToSave
      };

      setChatHistory(prev => {
        const existingIndex = prev.findIndex((chat) => chat.id === chatIdToSave);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newHistoryItem;
          return updated;
        }
        return [newHistoryItem, ...prev];
      });
    }
  };

  const handleDeleteChat = (chatId) => {
    setChatHistory(prev => prev.filter((chat) => chat.id !== chatId));
    if (chatId === currentChatId) {
      setMessages([]);
      setCurrentChatId(Date.now());
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const ThemeIcon = theme === 'light' ? Sun : Moon;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground relative">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        onLoadChat={loadChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col relative h-full z-10 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-2.5 font-semibold text-heading pt-1">
            <span className="font-heading text-lg font-bold tracking-tight leading-none">CuraLytica</span>
            <span className="text-border text-lg font-light hidden md:inline leading-none">|</span>
            <span className="text-sm text-muted-foreground font-medium hidden md:inline leading-none pt-0.5">Medical Assistant</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="w-9 h-9 rounded-xl border-border hover:border-primary hover:text-primary transition-colors"
          >
            <ThemeIcon size={18} />
          </Button>
        </header>
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
          <ChatInterface
            messages={messages}
            setMessages={setMessages}
            profile={profile}
          />
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        setProfile={setProfile}
      />
    </div>
  );
}

export default App;
