import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Send,
    User,
    Bot,
    Paperclip,
    X,
    Stethoscope,
    FileText,
    Activity,
    Utensils,
    MessageSquare,
    SlidersHorizontal
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
const TOOL_MODES = [
    {
        id: 'chat',
        label: 'Chat',
        icon: MessageSquare,
        description: 'General medical guidance and follow-up questions.',
    },
    {
        id: 'symptom',
        label: 'Symptom check',
        icon: Stethoscope,
        description: 'Enter symptoms to run the structured symptom checker (attachments are ignored).',
    },
    {
        id: 'imaging',
        label: 'Image analysis',
        icon: FileText,
        description: 'Attach a medical image before sending for analysis and explanation.',
    },
];

const ChatInterface = ({ messages, setMessages, profile }) => {
    // Messages state is now lifted to App.js

    // Start empty to show the Hero Section
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [activeTool, setActiveTool] = useState('chat');
    const [toolError, setToolError] = useState('');
    const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const toolMenuRef = useRef(null);
    const toolButtonRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = '0px';
        const nextHeight = Math.min(textareaRef.current.scrollHeight, 160);
        textareaRef.current.style.height = `${nextHeight}px`;
    }, [input]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        if (!isToolMenuOpen) return;
        const handleClick = (event) => {
            if (toolMenuRef.current?.contains(event.target)) return;
            if (toolButtonRef.current?.contains(event.target)) return;
            setIsToolMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isToolMenuOpen]);

    const isImageFile = (file) => Boolean(file && file.type && file.type.startsWith('image/'));

    const formatFileSize = (size) => {
        if (size === 0) return '0 B';
        if (!size) return '';
        const units = ['B', 'KB', 'MB', 'GB'];
        const order = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
        const value = size / Math.pow(1024, order);
        return `${value.toFixed(value >= 10 || order === 0 ? 0 : 1)} ${units[order]}`;
    };

    const parseSymptoms = (value) => {
        return value
            .split(/[\n,]+/g)
            .map((item) => item.trim())
            .filter(Boolean);
    };

    const profilePayload = useMemo(() => {
        const entries = Object.entries(profile).filter(([, value]) => value && String(value).trim());
        return Object.fromEntries(entries);
    }, [profile]);

    const profileSummary = useMemo(() => {
        const parts = [];
        if (profile.age) parts.push(`Age ${profile.age}`);
        if (profile.sex) parts.push(profile.sex);
        if (profile.location) parts.push(profile.location);
        if (profile.weight) parts.push(`${profile.weight} kg`);
        if (profile.height) parts.push(`${profile.height} cm`);
        return parts.join(' • ');
    }, [profile]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setSelectedFile(file);
            setPreviewUrl(isImageFile(file) ? URL.createObjectURL(file) : null);
            setToolError('');
        }
    };

    const clearFile = ({ preservePreview = false } = {}) => {
        if (!preservePreview && previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const buildHistory = () => {
        const trimmed = messages.slice(-50);
        return trimmed.map((msg) => {
            const role = msg.sender === 'user' ? 'user' : 'model';
            let text = msg.text || '';
            if (msg.attachment?.name) {
                text += ` (Attachment: ${msg.attachment.name})`;
            }
            return { role, text };
        });
    };

    const postChatMessage = async (message, history, extra = {}) => {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                history,
                profile: profilePayload,
                conversation_started: history.length > 0,
                ...extra,
            }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || "The server couldn't process that request.");
        }
        return data.reply || "I'm having trouble connecting to my medical database.";
    };

    const handleSend = async (e, textOverride = null, toolOverride = null) => {
        if (e) e.preventDefault();
        if (isTyping) return;
        const toolMode = toolOverride || activeTool;
        const currentFile = selectedFile;
        let textToSend = (textOverride ?? input).trim();

        if (!textToSend && !selectedFile) return;

        setToolError('');
        const shouldRefocus = document.activeElement === textareaRef.current;
        const historyPayload = buildHistory();

        if (!textToSend && selectedFile) {
            textToSend = isImageFile(selectedFile)
                ? 'Please analyze the attached image.'
                : `Please review the attached file (${selectedFile.name}).`;
        }

        try {
            if (toolMode === 'symptom') {
                const symptoms = parseSymptoms(textToSend);
                if (symptoms.length === 0) {
                    setToolError('Add at least one symptom to run the checker.');
                    return;
                }

                const userMsg = {
                    id: Date.now(),
                    sender: 'user',
                    text: textToSend,
                };

                setMessages(prev => [...prev, userMsg]);
                setInput('');
                setIsTyping(true);

                const predictRes = await fetch(`${API_BASE_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symptoms, profile: profilePayload }),
                });

                const predictData = await predictRes.json().catch(() => ({}));
                if (!predictRes.ok) {
                    throw new Error(predictData.error || 'Unable to run the symptom checker.');
                }

                const prediction = predictData.prediction || 'No prediction returned.';
                const reasoning = predictData.reasoning || 'No reasoning returned.';

                const followupPrompt = [
                    `Patient symptoms: ${symptoms.join(', ')}.`,
                    `Symptom checker result: ${prediction}.`,
                    `Reasoning: ${reasoning}.`,
                    `Please respond to the patient with a concise summary and 1-3 follow-up questions.`,
                ].join('\n');

                const reply = await postChatMessage(followupPrompt, historyPayload, { tool: 'symptom' });

                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: reply,
                }]);
            } else if (toolMode === 'imaging') {
                if (!currentFile) {
                    setToolError('Attach an image to run analysis.');
                    return;
                }

                const attachment = {
                    name: currentFile.name,
                    type: currentFile.type,
                    size: currentFile.size,
                    previewUrl: isImageFile(currentFile) ? previewUrl : null,
                };

                const userMsg = {
                    id: Date.now(),
                    sender: 'user',
                    text: textToSend,
                    attachment,
                };

                setMessages(prev => [...prev, userMsg]);
                setInput('');
                clearFile({ preservePreview: true });
                setIsTyping(true);

                const formData = new FormData();
                formData.append('file', currentFile);
                const fileLabel = currentFile.name || 'a medical image';

                const analyzeRes = await fetch(`${API_BASE_URL}/analyze-image`, {
                    method: 'POST',
                    body: formData,
                });

                const analyzeData = await analyzeRes.json().catch(() => ({}));
                if (!analyzeRes.ok) {
                    throw new Error(analyzeData.error || 'Image analysis failed.');
                }

                const analysis = analyzeData.analysis || 'No analysis returned.';
                const interpretPrompt = [
                    `The patient uploaded ${fileLabel}.`,
                    `Image analysis result: ${analysis}.`,
                    `Please explain the result in plain language, keep it concise, and ask 1-2 follow-up questions.`,
                ].join('\n');

                const reply = await postChatMessage(interpretPrompt, historyPayload, { tool: 'imaging' });

                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: reply,
                }]);
            } else {
                const attachment = selectedFile
                    ? {
                        name: selectedFile.name,
                        type: selectedFile.type,
                        size: selectedFile.size,
                        previewUrl: isImageFile(selectedFile) ? previewUrl : null,
                    }
                    : null;

                const userMsg = {
                    id: Date.now(),
                    sender: 'user',
                    text: textToSend,
                    attachment,
                };

                setMessages(prev => [...prev, userMsg]);
                setInput('');
                clearFile({ preservePreview: true });
                setIsTyping(true);

                let context = "";

                // If file is attached in chat mode, analyze first for context
                if (currentFile) {
                    const formData = new FormData();
                    formData.append('file', currentFile);
                    const fileLabel = currentFile.name || 'a medical image';

                    try {
                        const analyzeRes = await fetch(`${API_BASE_URL}/analyze-image`, {
                            method: 'POST',
                            body: formData
                        });

                        if (analyzeRes.ok) {
                            const analyzeData = await analyzeRes.json();
                            context = `\n\n[SYSTEM: The user uploaded ${fileLabel}. Analysis: ${analyzeData.analysis}]`;
                        } else {
                            const errorData = await analyzeRes.json().catch(() => ({}));
                            const errorText = errorData.error || 'Image analysis failed.';
                            context = `\n\n[SYSTEM: The user tried to upload ${fileLabel} but analysis failed. ${errorText}]`;
                        }
                    } catch (err) {
                        console.error("Image analysis failed", err);
                        context = `\n\n[SYSTEM: Image upload failed for ${fileLabel}.]`;
                    }
                }

                const reply = await postChatMessage(textToSend + context, historyPayload, { tool: 'chat' });

                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: reply,
                }]);
            }
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: error.message || "Network error. Please ensure the backend is running."
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            if (shouldRefocus) {
                setTimeout(() => {
                    textareaRef.current?.focus();
                }, 0);
            }
        }
    };

    const suggestionChips = [
        { icon: Stethoscope, label: "Analyze Symptoms", prompt: "I'm feeling feverish and have a headache. Can you check my symptoms?" },
        { icon: FileText, label: "Read Medical Report", prompt: "I want to upload a blood test report. What should I look for?" },
        { icon: Activity, label: "Check Vitals", prompt: "What is a normal resting heart rate for a 30 year old?" },
        { icon: Utensils, label: "Dietary Advice", prompt: "Suggest a diet plan for lowering cholesterol." },
    ];

    const renderInline = (text) => {
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
            } else if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={index} className="italic text-foreground">{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    const renderMessage = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        const blocks = [];
        let listItems = [];

        const flushList = () => {
            if (listItems.length === 0) return;
            const items = listItems;
            listItems = [];
            blocks.push(
                <ul key={`list-${blocks.length}`} className="my-2 pl-5 list-disc space-y-1">
                    {items.map((item, idx) => (
                        <li key={`item-${blocks.length}-${idx}`}>{renderInline(item)}</li>
                    ))}
                </ul>
            );
        };

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) {
                flushList();
                return;
            }
            if (/^[-•*]\s+/.test(trimmed)) {
                listItems.push(trimmed.replace(/^[-•*]\s+/, ''));
                return;
            }
            flushList();
            if (/^#{1,3}\s+/.test(trimmed)) {
                blocks.push(
                    <div key={`heading-${index}`} className="mt-4 mb-2 font-heading font-semibold text-heading text-lg uppercase tracking-wide">
                        {trimmed.replace(/^#{1,3}\s+/, '')}
                    </div>
                );
                return;
            }
            if (trimmed.endsWith(':') && trimmed.length <= 60) {
                blocks.push(
                    <div key={`heading-${index}`} className="mt-3 mb-1 font-semibold text-heading">
                        {trimmed.slice(0, -1)}
                    </div>
                );
                return;
            }
            blocks.push(
                <p key={`para-${index}`} className="mb-2 last:mb-0 leading-relaxed">
                    {renderInline(trimmed)}
                </p>
            );
        });

        flushList();
        return blocks;
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleToolSelect = (toolId) => {
        setActiveTool(toolId);
        setToolError('');
        setIsToolMenuOpen(false);
    };



    return (
        <div className="flex flex-col h-full relative bg-background">
            <div className="flex-1 overflow-y-auto pt-8 pb-24 flex flex-col gap-5 w-full max-w-3xl mx-auto scrollbar-none px-4 md:px-0">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-12 px-5">
                        <div className="flex flex-col items-center gap-5">
                            <div className="w-16 h-16 bg-card border border-border rounded-[20px] flex items-center justify-center text-foreground shadow-lg">
                                <Bot size={40} strokeWidth={1.5} />
                            </div>
                            <h1 className="text-3xl font-semibold text-foreground m-0 text-center tracking-tight">How can I help you?</h1>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                            {suggestionChips.map((chip, idx) => (
                                <Card
                                    key={idx}
                                    className="p-4 cursor-pointer transition-all hover:bg-secondary/50 border-transparent hover:border-border/50 bg-secondary/20 flex flex-col gap-2"
                                    onClick={() => handleSend(null, chip.prompt, 'chat')}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-background shadow-sm text-primary">
                                            <chip.icon size={18} />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">
                                            {chip.label}
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-4 px-6 w-full items-start",
                                    msg.sender === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.sender === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-1">
                                        <Bot size={18} />
                                    </div>
                                )}

                                <div className={cn(
                                    "flex flex-col gap-1 max-w-[85%] md:max-w-[80%]",
                                    msg.sender === 'user' ? "items-end" : "items-start"
                                )}>
                                    <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground/70 ml-1 mb-1">
                                        {msg.sender === 'bot' ? 'CuraLytica' : 'You'}
                                    </div>

                                    {(msg.attachment?.previewUrl || msg.image) && (
                                        <div className="mb-2">
                                            <img
                                                src={msg.attachment?.previewUrl || msg.image}
                                                alt="Uploaded medical scan"
                                                className="w-full max-w-[280px] rounded-2xl border border-border/50 shadow-sm"
                                                onLoad={() => {
                                                    const url = msg.attachment?.previewUrl || msg.image;
                                                    if (url && url.startsWith('blob:')) {
                                                        URL.revokeObjectURL(url);
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}

                                    {msg.attachment && !msg.attachment.previewUrl && (
                                        <div className="flex items-center gap-3 bg-secondary/30 border border-border/50 p-3 rounded-xl text-sm mb-2 w-full max-w-sm">
                                            <div className="p-2 bg-background rounded-lg text-primary">
                                                <FileText size={16} />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-medium text-foreground truncate">{msg.attachment.name}</span>
                                                <span className="text-xs text-muted-foreground">{formatFileSize(msg.attachment.size)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={cn(
                                        "text-[0.95rem] leading-7 whitespace-pre-wrap",
                                        msg.sender === 'user'
                                            ? "bg-primary/5 px-5 py-3.5 rounded-[20px] rounded-tr-sm text-foreground"
                                            : "px-1 py-1 text-foreground"
                                    )}>
                                        {renderMessage(msg.text)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-4 px-6 w-full justify-start items-start">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-1">
                                    <Bot size={18} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground/70 ml-1">CuraLytica</div>
                                    <div className="flex items-center gap-1.5 px-4 py-3 bg-secondary/20 rounded-[20px] rounded-tl-sm w-fit">
                                        <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <div className="w-full max-w-3xl mx-auto px-4 pb-6 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-10">
                <div className="mb-2 relative z-20 flex justify-center">
                    {profileSummary && (
                        <div className="inline-flex items-center gap-2 text-[10px] font-medium text-muted-foreground/60 bg-secondary/30 px-3 py-1 rounded-full border border-border/20 backdrop-blur-sm">
                            <User size={10} />
                            {profileSummary}
                        </div>
                    )}
                </div>

                {previewUrl && (
                    <div className="mb-3 mx-2">
                        <div className="relative group inline-block">
                            <img src={previewUrl} alt="Preview" className="h-20 w-auto object-cover rounded-xl border border-border shadow-md" />
                            <button
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={clearFile}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}
                {selectedFile && !previewUrl && (
                    <div className="mb-3 mx-2">
                        <div className="relative group inline-flex items-center gap-3 bg-secondary/30 p-3 rounded-xl border border-border/50 max-w-xs">
                            <div className="p-2 bg-background rounded-lg text-primary">
                                <FileText size={16} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                                <span className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</span>
                            </div>
                            <button
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={clearFile}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}


                <form
                    className="flex flex-col bg-secondary/20 border border-border/50 rounded-[24px] p-2 shadow-sm focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-secondary/30 transition-all backdrop-blur-xl"
                    onSubmit={handleSend}
                >
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        className="w-full bg-transparent border-none text-foreground text-[0.95rem] p-3 focus:outline-none resize-none max-h-[200px] min-h-[44px] leading-relaxed placeholder:text-muted-foreground/50"
                        placeholder={
                            activeTool === 'symptom'
                                ? 'Describe your symptoms...'
                                : activeTool === 'imaging'
                                    ? 'Explain what this image shows...'
                                    : 'Ask CuraLytica anything...'
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <div className="flex items-center justify-between px-2 pb-1">
                        <div className="flex items-center gap-1">
                            <div className="relative">
                                <button
                                    type="button"
                                    className={cn(
                                        "p-2 rounded-full text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors",
                                        isToolMenuOpen && "text-primary bg-primary/10"
                                    )}
                                    ref={toolButtonRef}
                                    onClick={() => setIsToolMenuOpen((prev) => !prev)}
                                    title="Tools"
                                >
                                    <SlidersHorizontal size={18} />
                                </button>
                                {isToolMenuOpen && (
                                    <Card className="absolute bottom-full mb-2 left-0 min-w-[280px] p-2 flex flex-col gap-1 z-50 shadow-2xl border-border/40 backdrop-blur-xl bg-card/80" ref={toolMenuRef}>
                                        {TOOL_MODES.map((tool) => {
                                            const Icon = tool.icon;
                                            const isActive = activeTool === tool.id;
                                            return (
                                                <button
                                                    key={tool.id}
                                                    type="button"
                                                    className={cn(
                                                        "flex gap-3 text-left p-3 rounded-xl transition-all group",
                                                        isActive
                                                            ? "bg-primary/10 text-primary"
                                                            : "hover:bg-secondary/50 text-foreground"
                                                    )}
                                                    onClick={() => handleToolSelect(tool.id)}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-lg transition-colors shrink-0 h-fit",
                                                        isActive
                                                            ? "bg-primary text-primary-foreground shadow-sm"
                                                            : "bg-secondary text-muted-foreground group-hover:bg-secondary/80 group-hover:text-foreground"
                                                    )}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-semibold text-sm tracking-tight">{tool.label}</span>
                                                        <span className="text-[11px] text-muted-foreground leading-tight font-medium opacity-80">{tool.description}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </Card>
                                )}
                            </div>

                            <button
                                type="button"
                                className="p-2 rounded-full text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                title="Attach file"
                                disabled={isTyping}
                            >
                                <Paperclip size={18} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*,.dcm"
                                onChange={handleFileSelect}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {activeTool !== 'chat' && (
                                <div className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-1 rounded-md tracking-wider">
                                    {TOOL_MODES.find(t => t.id === activeTool)?.label} Mode
                                </div>
                            )}
                            <Button
                                type="submit"
                                size="icon"
                                className={cn(
                                    "w-8 h-8 rounded-full transition-all duration-300 shadow-sm",
                                    (input.trim() || selectedFile)
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80 opacity-50 cursor-not-allowed"
                                )}
                                disabled={(!input.trim() && !selectedFile) || isTyping}
                            >
                                <Send size={16} />
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="flex justify-center mt-3 gap-4 text-[10px] text-muted-foreground/50">
                    <span>AI-Generated • Medical Info Only</span>
                </div>
                {toolError && (
                    <div className="mt-2 text-center text-red-500 text-xs bg-red-500/10 py-1 px-3 rounded-full mx-auto w-fit">
                        {toolError}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;
