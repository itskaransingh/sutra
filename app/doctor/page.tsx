'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Mic, 
  Send, 
  Activity, 
  UserPlus, 
  Stethoscope, 
  Pill, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Play,
  FileText,
  X,
  ClipboardList,
  Trash2
} from 'lucide-react';

// --- Types ---

type MessageType = 'text' | 'voice-note' | 'referral' | 'system';

interface Message {
  id: string;
  type: MessageType;
  sender: string;
  isMe: boolean;
  content?: string;
  timestamp: string;
  aiAnalysis?: {
    isAnalyzed: boolean;
    isLoading?: boolean;
    diagnosis?: string;
    plan?: string;
    medications?: string[];
  };
}

// --- Mock Data ---

const MOCK_PATIENT = {
  id: "SUTRA-8821",
  name: "Rahul Sharma",
  details: "34y • Male • O+",
  tags: ["Penicillin Allergy", "Mild Asthma"],
  vitals: { bp: "120/80", temp: "99.2°F" }
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    type: 'system',
    sender: 'System',
    isMe: false,
    content: 'Patient context loaded from Sutra Health Network.',
    timestamp: '10:00 AM'
  }
];

const MOCK_SUMMARY = {
  chiefComplaint: "Sore throat and persistent mild fever for 2 days.",
  riskFactors: ["History of seasonal allergies.", "Smoker (socially)."],
  priorityAlert: "HIGH: Penicillin Allergy"
};

// --- Shadcn-like UI Primitives ---

const Button = ({ 
  children, variant = 'default', size = 'default', className = '', ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive', size?: 'default' | 'sm' | 'icon' | 'lg' }) => {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90",
    outline: "border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
    secondary: "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-100/80",
    destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600"
  };
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9"
  };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
};

const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'default' | 'outline' | 'destructive' | 'secondary', className?: string }) => {
  const styles = {
    default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80",
    outline: "text-slate-950 border-slate-200 bg-white",
    destructive: "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80",
  };
  return <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none ${styles[variant]} ${className}`}>{children}</div>;
};

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}>{children}</div>
);

// --- UPDATED COMPONENT: Voice Wave Visualizer (WhatsApp Style) ---

const VoiceWave = () => {
  // Generate a static set of "bars" but animate them randomly
  // This simulates the "chatter" of a voice recording more accurately than a sine wave
  return (
    <div className="flex items-center gap-[2px] h-8 px-4">
      {[...Array(25)].map((_, i) => (
        <div
          key={i}
          className="w-[3px] bg-red-500 rounded-full"
          style={{
            animation: `pulse-height ${0.4 + Math.random() * 0.5}s ease-in-out infinite alternate`,
            // Random delay to ensure they don't sync up
            animationDelay: `${Math.random() * 0.5}s`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes pulse-height {
          0% { height: 15%; opacity: 0.5; }
          100% { height: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// --- NEW COMPONENT: Recording Indicator (Container) ---

const RecordingIndicator = ({ onCancel, duration }: { onCancel: () => void, duration: number }) => {
  // Format seconds into MM:SS
  const formatTime = (totalSeconds: number) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex justify-center my-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-white pl-2 pr-4 py-2 rounded-full shadow-xl border border-slate-100 flex items-center gap-3">
        
        {/* Cancel Button */}
        <button 
          onClick={onCancel} 
          className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <Trash2 size={18} />
        </button>

        {/* Timer - Made slightly larger/red to match WhatsApp recording state */}
        <span className="text-sm font-mono font-semibold text-red-500 w-[50px] text-center">
          {formatTime(duration)}
        </span>

        {/* The Visual Wave Component */}
        <VoiceWave />

        {/* Live Indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
             <Mic size={18} className="text-red-500 animate-pulse" fill="currentColor" />
        </div>
      </div>
    </div>
  );
};

// --- Existing Sub-Components ---

const ScanView = ({ onScan }: { onScan: () => void }) => {
  const [scanning, setScanning] = useState(false);
  
  const triggerScan = () => {
    setScanning(true);
    setTimeout(onScan, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-white text-slate-950 p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Sutra.</h1>
          <p className="text-slate-500">Scan patient QR to begin session</p>
        </div>
        
        <div 
          onClick={triggerScan}
          className={`mx-auto w-64 h-64 border rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden ${scanning ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'}`}
        >
          {scanning && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/5 to-transparent animate-scan" />}
          <QrCode className={`w-12 h-12 mb-4 transition-colors ${scanning ? 'text-slate-900' : 'text-slate-400'}`} />
          <span className="text-xs font-medium text-slate-500">
            {scanning ? 'Identified: Rahul Sharma' : 'Tap to Scan'}
          </span>
        </div>
      </div>
    </div>
  );
};

const PatientHeader = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">
            RS
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 leading-none mb-1">{MOCK_PATIENT.name}</h2>
            <p className="text-xs text-slate-500">{MOCK_PATIENT.details}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </Button>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Medical Alerts</span>
              <div className="flex flex-wrap gap-2">
                {MOCK_PATIENT.tags.map(tag => (
                  <Badge key={tag} variant={tag.includes('Allergy') ? 'destructive' : 'outline'} >
                    {tag.includes('Allergy') && <AlertCircle size={10} className="mr-1" />}
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Latest Vitals</span>
              <div className="flex gap-4 text-sm font-medium text-slate-700">
                <span className="flex items-center gap-1.5"><Activity size={12} className="text-slate-400" /> BP: {MOCK_PATIENT.vitals.bp}</span>
                <span className="flex items-center gap-1.5"><Stethoscope size={12} className="text-slate-400" /> Temp: {MOCK_PATIENT.vitals.temp}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PatientSummaryCard = () => (
  <Card className="max-w-md mx-auto my-8 p-6 shadow-lg border-slate-300">
    <div className="flex items-center mb-4 pb-2 border-b border-slate-100">
      <ClipboardList size={20} className="text-slate-900 mr-2" />
      <h3 className="text-lg font-bold">AI Patient Summary</h3>
    </div>
    
    <div className="space-y-4 text-sm">
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
        <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
          <Sparkles size={14} className="text-blue-500" /> Chief Complaint
        </p>
        <p className="text-slate-600">{MOCK_SUMMARY.chiefComplaint}</p>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
        <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500" /> Priority Alert
        </p>
        <Badge variant="destructive" className="mt-1">
          {MOCK_SUMMARY.priorityAlert}
        </Badge>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
        <p className="font-semibold text-slate-700 mb-1">Relevant History</p>
        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
          {MOCK_SUMMARY.riskFactors.map((factor, i) => (
            <li key={i}>{factor}</li>
          ))}
        </ul>
      </div>
    </div>
    <div className="text-center mt-5">
      <p className="text-xs text-slate-400">Review before starting consultation.</p>
    </div>
  </Card>
);

const MessageItem = ({ msg, onTranscribe }: { msg: Message, onTranscribe: (id: string) => void }) => {
  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-6">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{msg.content}</span>
      </div>
    );
  }

  if (msg.type === 'referral') {
    return (
      <div className={`flex mb-6 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
        <Card className="max-w-[85%] sm:max-w-[320px] overflow-hidden bg-slate-900 text-white border-slate-800">
          <div className="p-4 flex flex-col items-center text-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <QrCode className="h-16 w-16 text-slate-900" />
            </div>
            <div>
              <h3 className="font-semibold">Referral Ticket Issued</h3>
              <p className="text-xs text-slate-400 mt-1">{msg.content}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-6 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
      <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[70%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm border ${
          msg.isMe 
            ? 'bg-slate-900 border-slate-900 text-slate-50 rounded-tr-none' 
            : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
        }`}>
          {msg.type === 'voice-note' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${msg.isMe ? 'bg-slate-50 text-slate-900' : 'bg-slate-100 text-slate-900'}`}>
                    <Play size={14} fill="currentColor" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-1 bg-slate-200 rounded-full w-full overflow-hidden">
                      <div className="h-full bg-slate-900 w-1/3 rounded-full"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0:05</span>
                      <span>0:15</span>
                    </div>
                  </div>
              </div>

              {msg.aiAnalysis?.isAnalyzed ? (
                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3 animate-in fade-in duration-500">
                  <div className="flex items-center gap-2 text-xs font-semibold text-yellow-300">
                    <FileText size={12} className="text-yellow-300" />
                    <span>AI Clinical Summary</span>
                  </div>
                  
                  <div className="space-y-2 text-xs text-slate-300">
                    <p className="leading-relaxed">
                       <span className="font-medium text-slate-100">Diagnosis:</span> {msg.aiAnalysis?.diagnosis}
                    </p>
                    <p className="leading-relaxed">
                       <span className="font-medium text-slate-100">Plan:</span> {msg.aiAnalysis?.plan}
                    </p>
                  </div>

                  {msg.aiAnalysis?.medications && msg.aiAnalysis.medications.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.aiAnalysis.medications.map((med, i) => (
                          <Badge key={i} variant="secondary" className="bg-slate-700 text-slate-100 hover:bg-slate-600">
                            <Pill size={10} className="mr-1 text-blue-300" />
                            {med}
                          </Badge>
                        ))}
                      </div>
                  )}
                </div>
              ) : (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full gap-2 h-8 text-xs bg-slate-700 text-slate-50 hover:bg-slate-700/90 border-none"
                  onClick={() => onTranscribe(msg.id)}
                  disabled={msg.aiAnalysis?.isLoading}
                >
                  {msg.aiAnalysis?.isLoading ? (
                    <>
                      <Activity size={12} className="animate-spin text-blue-300" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-yellow-300" /> Transcribe & Analyze
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <p className={`${msg.isMe ? 'text-slate-50' : 'text-slate-800'}`}>{msg.content}</p>
          )}
        </div>
        <span className="text-[10px] text-slate-400">
            {msg.timestamp}
        </span>
      </div>
    </div>
  );
};

// --- Main Page ---

export default function DoctorPage() {
  const [view, setView] = useState<'scan' | 'dashboard'>('scan');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  const showSummaryCard = messages.length === 1 && messages[0].type === 'system';

  useEffect(() => {
    if (!isRecording) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    return () => {
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [messages, isRecording]);

  const handleSend = () => {
    if(!inputText.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'text',
      sender: 'Me',
      isMe: true,
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInputText('');
  };

  const stopRecording = (canceled: boolean = false) => {
    setIsRecording(false);
    
    // Cleanup timers
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    recordingTimeoutRef.current = null;
    durationIntervalRef.current = null;
    setRecordDuration(0);

    if (canceled) return;
    
    const newId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: newId,
      type: 'voice-note',
      sender: 'Me',
      isMe: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      aiAnalysis: {
        isAnalyzed: false,
        diagnosis: "Acute tonsillitis with mild dehydration.",
        plan: "Prescribed Azithromycin (allergy note checked), increased fluid intake. Follow up in 3 days if fever persists.",
        medications: ["Azithromycin 500mg", "Paracetamol", "ORS"]
      }
    }]);
  }

  const startRecording = () => {
    if (isRecording) {
        stopRecording(false);
        return;
    }
    
    setInputText(''); 
    setIsRecording(true);
    setRecordDuration(0);

    // Start Timer
    durationIntervalRef.current = setInterval(() => {
      setRecordDuration(prev => prev + 1);
    }, 1000) as unknown as number;
    
    // Auto-Stop after 5 seconds (simulated)
    recordingTimeoutRef.current = setTimeout(() => {
        stopRecording(false);
    }, 5000) as unknown as number; 
  };
  
  const handleTranscribe = (msgId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === msgId && m.aiAnalysis 
        ? { ...m, aiAnalysis: { ...m.aiAnalysis, isLoading: true } } 
        : m
    ));

    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === msgId && m.aiAnalysis 
          ? { ...m, aiAnalysis: { ...m.aiAnalysis, isLoading: false, isAnalyzed: true } } 
          : m
      ));
    }, 1500);
  };

  const handleReferral = () => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'referral',
      sender: 'Me',
      isMe: true,
      content: "Referral: ENT Department • Sutra General Hospital • Room 402",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  if (view === 'scan') return <ScanView onScan={() => setView('dashboard')} />;

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 font-sans text-slate-950">
      <PatientHeader />

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
          <div className="max-w-2xl mx-auto pb-4">
            {showSummaryCard && <PatientSummaryCard />}

            {messages.map(msg => (
               <MessageItem key={msg.id} msg={msg} onTranscribe={handleTranscribe} />
            ))}
            
            {/* NEW: Recording Indicator Component with separate VoiceWave */}
            {isRecording && (
              <RecordingIndicator 
                onCancel={() => stopRecording(true)} 
                duration={recordDuration}
              />
            )}
            
            <div ref={bottomRef} />
          </div>
      </main>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 shrink-0 pb-safe">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleReferral} 
            className="shrink-0 rounded-full h-10 w-10 text-slate-500"
            disabled={isRecording}
          >
            <UserPlus size={18} />
          </Button>

          <div className="flex-1 bg-slate-100 rounded-3xl flex items-center gap-2 px-4 py-2 border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all">
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400 min-h-[24px]"
              placeholder="Type message or tap Mic to record..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isRecording}
            />
          </div>

          <Button 
              variant={inputText.trim() ? "default" : isRecording ? "destructive" : "secondary"}
              size="icon" 
              onClick={inputText.trim() ? handleSend : startRecording}
              className={`rounded-full h-10 w-10 shrink-0 transition-all ${!inputText.trim() && !isRecording ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : ''}`}
          >
            {inputText.trim() 
              ? <Send size={18} /> 
              : isRecording 
                  ? <Mic size={18} className="animate-pulse" /> 
                  : <Mic size={18} />
            }
          </Button>
        </div>
      </div>
    </div>
  );
}