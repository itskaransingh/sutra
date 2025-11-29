'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Mic, 
  Send, 
  FileText, 
  Activity, 
  UserPlus, 
  Stethoscope, 
  Pill, 
  AlertTriangle,
  ChevronRight,
  Globe,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';

// --- Types ---

type MessageType = 'text' | 'voice-log' | 'ai-summary' | 'referral' | 'system';

interface Message {
  id: string;
  type: MessageType;
  sender: string;
  senderRole: 'GP' | 'Specialist' | 'AI' | 'System';
  content: string;
  timestamp: string;
  metaData?: {
    transcription?: string;
    structuredData?: {
      diagnosis?: string;
      plan?: string;
      medications?: string[];
    };
    referralCode?: string;
  };
}

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  currentMeds: string[];
  recentVitals: {
    bp: string;
    temp: string;
    hr: string;
  };
}

// --- Mock Data ---

const MOCK_PATIENT: PatientData = {
  id: "SUTRA-8821",
  name: "Rahul Sharma",
  age: 34,
  gender: "Male",
  bloodGroup: "O+",
  allergies: ["Penicillin", "Dust Mites"],
  chronicConditions: ["Mild Asthma"],
  currentMeds: ["Levocetirizine 5mg (SOS)"],
  recentVitals: {
    bp: "120/80",
    temp: "99.2°F",
    hr: "78 bpm"
  }
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    type: 'system',
    sender: 'Sutra System',
    senderRole: 'System',
    content: 'Patient scan successful. Accessing historical context...',
    timestamp: '10:00 AM'
  },
  {
    id: '2',
    type: 'ai-summary',
    sender: 'Sutra AI',
    senderRole: 'AI',
    content: 'Context Loaded',
    timestamp: '10:01 AM',
    metaData: {
      structuredData: {
        diagnosis: "Previous visit (3 months ago): Acute Bronchitis",
        plan: "Recovered fully. No lingering symptoms reported in follow-up.",
        medications: []
      }
    }
  }
];

// --- Components ---

const ScanScreen = ({ onScan }: { onScan: () => void }) => {
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      onScan();
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-slate-900 text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="z-10 text-center space-y-8 w-full max-w-md">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Sutra
          </h1>
          <p className="text-slate-400">Agentic AI Health Context</p>
        </div>

        <div className="flex justify-center">
          <div className="relative group cursor-pointer" onClick={handleScan}>
            <div className={`w-[70vw] h-[70vw] max-w-[280px] max-h-[280px] border-2 rounded-3xl flex items-center justify-center relative transition-all duration-500 ${scanning ? 'border-teal-400 bg-teal-400/10' : 'border-slate-600 hover:border-blue-400'}`}>
              {scanning && (
                <div className="absolute inset-0 bg-gradient-to-b from-teal-500/20 to-transparent animate-scan"></div>
              )}
              <QrCode className={`w-1/3 h-1/3 ${scanning ? 'text-teal-400' : 'text-slate-500'}`} />
              
              {/* Scan Corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-current text-white"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-current text-white"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-current text-white"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-current text-white"></div>
            </div>
            <p className="mt-4 text-sm font-medium animate-pulse">
              {scanning ? 'Identified: Rahul Sharma...' : 'Tap to simulate Patient Scan'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const HealthStateCard = ({ patient }: { patient: PatientData }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`bg-white border-b border-slate-200 transition-all duration-300 shadow-sm ${isOpen ? 'h-auto' : 'h-14 overflow-hidden'}`}>
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:bg-slate-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
            {patient.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-800 leading-tight truncate">{patient.name}</h2>
            <p className="text-xs text-slate-500 truncate">{patient.age}y • {patient.gender} • {patient.bloodGroup}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden xs:flex text-[10px] sm:text-xs font-medium px-2 py-1 bg-teal-100 text-teal-700 rounded-full items-center gap-1">
            <BrainCircuit size={12} />
            Context Active
          </span>
          <ChevronRight className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} size={20} />
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 max-h-[40vh] overflow-y-auto">
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2 mb-1 text-red-600">
              <AlertTriangle size={14} />
              <span className="text-xs font-bold uppercase">Allergies</span>
            </div>
            <div className="text-sm font-medium text-slate-700 break-words">
              {patient.allergies.join(", ")}
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-1 text-blue-600">
              <Pill size={14} />
              <span className="text-xs font-bold uppercase">Active Meds</span>
            </div>
            <div className="text-sm font-medium text-slate-700 break-words">
              {patient.currentMeds.join(", ")}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-1 text-slate-600">
              <Activity size={14} />
              <span className="text-xs font-bold uppercase">History</span>
            </div>
            <div className="text-sm font-medium text-slate-700 break-words">
              {patient.chronicConditions.join(", ")}
            </div>
          </div>

           <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 mb-1 text-purple-600">
              <Stethoscope size={14} />
              <span className="text-xs font-bold uppercase">Last Vitals</span>
            </div>
            <div className="text-sm font-medium text-slate-700">
              BP: {patient.recentVitals.bp} <br/>
              Temp: {patient.recentVitals.temp}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MessageBubble = ({ msg }: { msg: Message }) => {
  const isMe = msg.senderRole === 'GP';
  
  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <span className="text-[10px] sm:text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full text-center mx-4">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.type === 'ai-summary') {
    return (
      <div className="flex gap-2 sm:gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200 mt-1">
          <BrainCircuit size={16} className="text-white" />
        </div>
        <div className="max-w-[88%] md:max-w-[70%]">
          <div className="bg-white border border-indigo-100 rounded-2xl rounded-tl-none shadow-sm overflow-hidden">
            <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Sutra Intelligence</span>
              <span className="text-[10px] text-indigo-400">Contextualized from Audio</span>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              {msg.metaData?.structuredData?.diagnosis && (
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">Observations</label>
                  <p className="text-slate-800 font-medium text-sm sm:text-base">{msg.metaData.structuredData.diagnosis}</p>
                </div>
              )}
              {msg.metaData?.structuredData?.plan && (
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">Plan</label>
                  <p className="text-slate-800 text-sm sm:text-base">{msg.metaData.structuredData.plan}</p>
                </div>
              )}
              {msg.metaData?.structuredData?.medications && msg.metaData.structuredData.medications.length > 0 && (
                <div className="bg-slate-50 p-2 rounded-lg">
                  <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">Prescribed</label>
                  <div className="flex flex-wrap gap-2">
                    {msg.metaData.structuredData.medications.map((med, i) => (
                      <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-700 shadow-sm flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-green-500" />
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 ml-1 block">{msg.timestamp}</span>
        </div>
      </div>
    );
  }

  if (msg.type === 'referral') {
     return (
      <div className={`flex gap-3 mb-4 ${isMe ? 'flex-row-reverse' : ''}`}>
        <div className={`max-w-[85%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
          <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -mr-8 -mt-8"></div>
             
             <div className="flex items-center gap-3 mb-3">
                <div className="bg-white p-1 rounded-lg shrink-0">
                    <QrCode size={40} className="text-slate-900" />
                </div>
                <div>
                    <h4 className="font-bold text-lg leading-tight">Referral Ticket</h4>
                    <p className="text-xs text-slate-300">Scan to join session</p>
                </div>
             </div>
             <div className="border-t border-white/10 pt-2 mt-2">
                <p className="text-sm font-medium text-slate-200">{msg.content}</p>
             </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block text-right">{msg.timestamp}</span>
        </div>
      </div>
     )
  }

  return (
    <div className={`flex gap-2 sm:gap-3 mb-4 ${isMe ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
        {isMe ? <Stethoscope size={16} /> : msg.sender.charAt(0)}
      </div>
      <div className={`max-w-[85%] md:max-w-[60%]`}>
        <div className={`p-3 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed ${
          isMe 
            ? 'bg-teal-600 text-white rounded-tr-none' 
            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
        }`}>
          {msg.type === 'voice-log' && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
              <Mic size={14} className="animate-pulse" />
              <span className="text-xs font-medium opacity-90">Voice Note Transcribed</span>
            </div>
          )}
          <p>{msg.content}</p>
        </div>
        <span className={`text-[10px] text-slate-400 mt-1 block ${isMe ? 'text-right' : 'text-left'}`}>
          {msg.timestamp}
        </span>
      </div>
    </div>
  );
};

// --- Main App Component (Page) ---

export default function DoctorPage() {
  const [view, setView] = useState<'scan' | 'dashboard'>('scan');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRecording]); // Added isRecording so it scrolls when "Listening" appears

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      type: 'text',
      sender: 'Dr. Me',
      senderRole: 'GP',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
  };

  const handleVoiceNote = () => {
    // Simulating Voice Recording and AI Processing
    setIsRecording(true);
    
    // Simulate recording duration
    setTimeout(() => {
      setIsRecording(false);
      
      // 1. Add the raw transcription log
      const transcriptionMsg: Message = {
        id: Date.now().toString(),
        type: 'voice-log',
        sender: 'Dr. Me',
        senderRole: 'GP',
        content: "Patient has high fever for 3 days and stomach pain on the right side. I've prescribed Pan D and Taxim. Referring to Radiology/Surgery for potential appendicitis.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, transcriptionMsg]);

      // 2. Simulate AI Processing Delay then add Summary
      setTimeout(() => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai-summary',
          sender: 'Sutra AI',
          senderRole: 'AI',
          content: 'Analysis Complete',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metaData: {
            structuredData: {
              diagnosis: "Suspected Appendicitis with associated fever (3 days). Right-side abdominal pain reported.",
              plan: "Referral to Surgery/Radiology initiated. Immediate observation recommended.",
              medications: ["Pan D", "Taxim"]
            }
          }
        };
        setMessages(prev => [...prev, aiMsg]);
      }, 1500);

    }, 2000);
  };

  const handleReferral = () => {
    const refMsg: Message = {
      id: Date.now().toString(),
      type: 'referral',
      sender: 'Dr. Me',
      senderRole: 'GP',
      content: "Referral to Surgery Dept (Room 32)",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, refMsg]);
  };

  if (view === 'scan') {
    return <ScanScreen onScan={() => setView('dashboard')} />;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-100 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 shrink-0 flex items-center justify-between px-4 lg:px-6 shadow-sm z-20">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-lg flex items-center justify-center text-white font-bold text-lg">
             S
           </div>
           <span className="font-bold text-xl tracking-tight text-slate-800 hidden md:block">Sutra</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full active:bg-slate-200 transition-colors" title="Language">
            <Globe size={20} />
          </button>
          <div className="h-8 w-[1px] bg-slate-200"></div>
          <button 
            onClick={handleReferral}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 active:scale-95 transition-all"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Referral</span>
          </button>
        </div>
      </header>

      {/* Patient Context Sidebar/Top Panel */}
      <div className="shrink-0 z-10 shadow-sm relative">
        <HealthStateCard patient={MOCK_PATIENT} />
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-100/50 scroll-smooth">
        <div className="max-w-3xl mx-auto pb-4">
          <div className="text-center py-6">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Session Started • {MOCK_PATIENT.id}</p>
          </div>
          
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          
          {isRecording && (
             <div className="flex justify-center my-4">
                <div className="bg-red-50 text-red-500 px-4 py-2 rounded-full flex items-center gap-3 shadow-sm border border-red-100 animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-bold uppercase">Listening & Analyzing...</span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-2 sm:p-4 shrink-0 pb-safe">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0 hidden sm:block">
            <FileText size={20} />
          </button>
          
          <div className="flex-1 bg-slate-100 rounded-2xl flex items-center gap-2 px-3 sm:px-4 py-2 border border-transparent focus-within:border-teal-400 focus-within:bg-white transition-all">
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none outline-none text-sm min-h-[24px] max-h-32 resize-none py-2"
              placeholder="Type observations..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
          </div>

          <button 
            onClick={handleVoiceNote}
            className={`p-3 rounded-full transition-all duration-300 shrink-0 shadow-sm active:scale-95 ${
                isRecording 
                ? 'bg-red-500 text-white scale-110 shadow-red-200' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Mic size={20} />
          </button>

          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-md shadow-teal-100 active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-center mt-2 hidden sm:block">
             <p className="text-[10px] text-slate-400">Sutra AI creates clinical summaries automatically from voice notes.</p>
        </div>
      </div>
    </div>
  );
}