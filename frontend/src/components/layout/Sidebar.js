import React from 'react';
import {
    Plus,
    MessageSquare,
    Menu,
    Bone,
    Thermometer,
    Activity,
    ChevronLeft,
    Trash2,
    Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

const Sidebar = ({ isCollapsed, toggleSidebar, onNewChat, chatHistory, onLoadChat, onDeleteChat, onOpenSettings }) => {
    // Dynamic Icon Logic
    const getChatIcon = (label) => {
        const lower = label.toLowerCase();
        if (lower.includes('x-ray') || lower.includes('bone')) return <Bone size={18} />;
        if (lower.includes('fever') || lower.includes('temp')) return <Thermometer size={18} />;
        if (lower.includes('blood') || lower.includes('report')) return <Activity size={18} />;
        return <MessageSquare size={18} />;
    };

    return (
        <div
            className={cn(
                "relative flex h-screen flex-col border-r border-border/50 bg-sidebar/50 backdrop-blur-xl transition-all duration-300 ease-in-out shrink-0 z-20",
                isCollapsed ? "w-[70px]" : "w-72"
            )}
        >
            {/* Header */}
            <div className={cn(
                "flex items-center h-16 px-4 mb-2",
                isCollapsed ? "justify-center" : "justify-between"
            )}>
                {!isCollapsed && (
                    <h2 className="font-heading text-lg font-bold tracking-tight text-foreground transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                        CuraLytica
                    </h2>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
                        !isCollapsed && "ml-auto"
                    )}
                    onClick={toggleSidebar}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
                </Button>
            </div>

            {/* Primary Action */}
            <div className="px-3 mb-6">
                <Button
                    onClick={onNewChat}
                    variant={isCollapsed ? "ghost" : "default"}
                    className={cn(
                        "w-full transition-all duration-300",
                        isCollapsed
                            ? "h-10 w-10 p-0 rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
                            : "justify-start gap-3 shadow-sm hover:shadow-md"
                    )}
                    title="New Chat"
                >
                    <Plus size={isCollapsed ? 20 : 18} />
                    {!isCollapsed && <span>New Chat</span>}
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2 px-3 scrollbar-none pb-4">
                {!isCollapsed && (
                    <span className="text-[10px] font-bold text-muted-foreground/70 px-2 uppercase tracking-wider mb-1">
                        Recent Chats
                    </span>
                )}

                <div className="flex flex-col gap-1">
                    {chatHistory && chatHistory.length > 0 ? (
                        chatHistory.map(item => (
                            <div key={item.id} className="group relative flex items-center">
                                <button
                                    className={cn(
                                        "flex items-center gap-3 w-full py-2.5 text-sm font-medium transition-all duration-200 rounded-lg group-hover:bg-accent/50",
                                        isCollapsed ? "justify-center px-0" : "px-3 text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => onLoadChat(item.id)}
                                    type="button"
                                    title={item.label}
                                >
                                    <span className={cn(
                                        "shrink-0 transition-colors",
                                        isCollapsed ? "text-foreground" : "text-muted-foreground group-hover:text-primary"
                                    )}>
                                        {getChatIcon(item.label)}
                                    </span>

                                    {!isCollapsed && (
                                        <span className="truncate flex-1 text-left">
                                            {item.label}
                                        </span>
                                    )}
                                </button>

                                {!isCollapsed && (
                                    <button
                                        className="absolute right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive translate-x-1 group-hover:translate-x-0"
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteChat(item.id);
                                        }}
                                        aria-label="Delete chat"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        !isCollapsed && (
                            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2">
                                    <MessageSquare size={14} className="text-muted-foreground" />
                                </div>
                                <span className="text-xs text-muted-foreground">No saved chats yet</span>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Settings */}
            <div className="p-3 mt-auto border-t border-border/40">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full transition-all duration-200 text-muted-foreground hover:text-foreground",
                        isCollapsed ? "justify-center px-0 h-10 w-10" : "justify-start gap-3 px-3"
                    )}
                    onClick={onOpenSettings}
                    title="Settings"
                >
                    <Settings size={20} />
                    {!isCollapsed && <span>Settings</span>}
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;
