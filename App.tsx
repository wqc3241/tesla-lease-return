
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_VEHICLE_STATE, INITIAL_LEASE_STATE, ICONS } from './constants';
import { VehicleState, LeaseState, TabType, ChatMessage } from './types';
import { gemini } from './geminiService';

// --- Global UI Helpers ---

const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }: any) => {
  const base = "w-full py-4 rounded-xl font-semibold transition-all text-sm uppercase tracking-wider flex items-center justify-center";
  const styles = {
    primary: "bg-white text-black active:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600",
    secondary: "bg-zinc-900 text-white active:bg-zinc-800 border border-zinc-800",
    danger: "bg-tesla-red text-white active:bg-red-700 disabled:opacity-50",
    ghost: "bg-transparent text-white active:bg-zinc-900 border border-zinc-900",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant as keyof typeof styles]} ${className}`}>
      {children}
    </button>
  );
};

// --- Sub-components ---

const MenuCard: React.FC<{ 
  icon: React.ReactNode, 
  title: string, 
  subtitle?: string,
  onClick?: () => void 
}> = ({ icon, title, subtitle, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-5 mb-3 bg-zinc-900/50 rounded-xl active:bg-zinc-800/80 transition-all border border-zinc-800/30"
  >
    <div className="flex items-center space-x-4">
      <div className="text-gray-400">{icon}</div>
      <div className="text-left">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-gray-500 font-medium">{subtitle}</div>}
      </div>
    </div>
    <ICONS.ChevronRight className="w-4 h-4 text-gray-600" />
  </button>
);

const TimelineItem: React.FC<{ 
  title: string, 
  status: string, 
  isLast?: boolean, 
  isComplete?: boolean,
  onClick?: () => void 
}> = ({ title, status, isLast, isComplete, onClick }) => (
  <div className={`flex group ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
    <div className="flex flex-col items-center mr-4">
      <div className={`w-3 h-3 rounded-full z-10 transition-colors duration-500 ${isComplete ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`} />
      {!isLast && <div className="w-0.5 h-full bg-zinc-800 -mt-1" />}
    </div>
    <div className="pb-8 flex-1">
      <div className="flex items-center justify-between">
        <p className={`text-sm font-bold transition-colors duration-500 ${isComplete ? 'text-white' : 'text-zinc-500'}`}>{title}</p>
        {onClick && !isComplete && <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest animate-pulse">Available</span>}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mt-1">{status}</p>
    </div>
  </div>
);

const LeaseChatModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    leaseState: LeaseState;
}> = ({ isOpen, onClose, leaseState }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: "Hello, I'm your Tesla Financial Assistant. How can I help with your lease return or billing today?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (customText?: string) => {
        const textToSend = customText || input;
        if (!textToSend.trim()) return;

        const userMsg: ChatMessage = { role: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Contextual prompt for Lease
        const contextualPrompt = `Lease Context: Days left: ${leaseState.daysLeft}, Mileage: ${leaseState.currentMileage}/${leaseState.allowedMileage}. 
        User Query: ${textToSend}. 
        Focus on return process, billing disputes, or loyalty offers.`;

        const response = await gemini.getVehicleAdvice(contextualPrompt, INITIAL_VEHICLE_STATE);
        setMessages(prev => [...prev, { role: 'model', text: response }]);
        setIsTyping(false);
    };

    if (!isOpen) return null;

    if (isCalling) {
        return (
            <div className="absolute inset-0 z-[900] bg-zinc-950 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center mb-12 relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                    <ICONS.Bot className="w-16 h-16 text-blue-500 relative z-10" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">Connecting...</h3>
                <p className="text-zinc-500 text-sm font-medium">AI Voice Support Agent</p>
                <div className="mt-20 flex gap-6">
                    <button onClick={() => setIsCalling(false)} className="w-16 h-16 bg-tesla-red rounded-full flex items-center justify-center shadow-xl shadow-red-900/20 active:scale-95 transition-all">
                        <svg className="w-8 h-8 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" /></svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-[850] bg-black flex flex-col animate-in slide-in-from-bottom duration-500">
            <header className="p-6 flex justify-between items-center border-b border-zinc-900 bg-zinc-900/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700">
                        <ICONS.Bot className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold">Lease Support</h2>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">AI Online</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest p-2">Close</button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-white text-black font-medium' : 'bg-zinc-900 text-zinc-300 border border-zinc-800'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-900 px-5 py-3 rounded-3xl border border-zinc-800 flex gap-1 items-center">
                            <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-900 space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar">
                    <button onClick={() => handleSend("I want to dispute a damage charge.")} className="whitespace-now8 bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full active:bg-zinc-800 flex-shrink-0">Dispute Charge</button>
                    <button onClick={() => handleSend("What are my options after return?")} className="whitespace-nowrap bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full active:bg-zinc-800 flex-shrink-0">Loyalty Options</button>
                    <button onClick={() => setIsCalling(true)} className="whitespace-nowrap bg-blue-600/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full active:bg-blue-600/20 flex-shrink-0 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" /></svg>
                        Call AI Voice Support
                    </button>
                </div>
                <div className="flex gap-3">
                    <input 
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder-zinc-600" 
                        placeholder="Message support..." 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                    />
                    <button 
                        onClick={() => handleSend()} 
                        className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-lg"
                    >
                        <ICONS.ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const LeaseManagement: React.FC<{ 
    state: LeaseState, 
    setState: React.Dispatch<React.SetStateAction<LeaseState>>,
    onBack: () => void 
}> = ({ state, setState, onBack }) => {
    const [subTab, setSubTab] = useState<'Overview' | 'Inspection' | 'Offers' | 'Schedule' | 'Billing' | 'BillBreakdown'>('Overview');
    const [walkthroughStep, setWalkthroughStep] = useState(0); 
    const [localSelectedDate, setLocalSelectedDate] = useState<string | null>(null);
    const [isBillReady, setIsBillReady] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [showSurvey, setShowSurvey] = useState(false);
    const [surveyScore, setSurveyScore] = useState<number | null>(null);
    const [surveyFeedback, setSurveyFeedback] = useState('');
    const [surveySubmitted, setSurveySubmitted] = useState(false);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const isReturnDay = state.daysLeft === 0;
    const isPostReturn = state.isReturned || state.daysLeft < 0;

    useEffect(() => {
        setIsReturning(false);
        setShowSurvey(false);
        setSurveySubmitted(false);
        setSurveyScore(null);
        setSurveyFeedback('');
        setWalkthroughStep(0);
        setLocalSelectedDate(state.scheduledDate);
    }, [state.daysLeft, subTab]);

    const handleLeaseReturn = () => {
        setShowSuccessScreen(true);
        setTimeout(() => {
            setState(s => ({ 
                ...s, 
                isReturned: true, 
                daysLeft: -1,
                isInspectionComplete: true,
                isScheduled: true,
                hasKeys: true,
                hasPersonalItemsRemoved: true
            }));
            setShowSuccessScreen(false);
            setSubTab('Overview');
        }, 4000);
    };

    const handlePayment = () => {
        setIsPaying(true);
        setTimeout(() => {
            setIsPaying(false);
            setPaymentConfirmed(true);
            setTimeout(() => {
                setPaymentConfirmed(false);
                setIsPaid(true);
                setSubTab('Overview');
                setTimeout(() => {
                    setShowSurvey(true);
                }, 800);
            }, 2500);
        }, 1500);
    };

    const renderPaymentConfirmation = () => (
      <div className="absolute inset-0 z-[700] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20">
              <ICONS.Check className="w-12 h-12 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">Payment Successful</h3>
          <p className="text-zinc-500 text-sm">Your final lease statement has been settled. Thank you for choosing Tesla.</p>
          <div className="mt-12 w-16 h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-white animate-[progress_2.5s_linear]" />
          </div>
          <style>{`
              @keyframes progress { from { width: 0%; } to { width: 100%; } }
          `}</style>
      </div>
    );

    const renderSuccessScreen = () => (
        <div className="absolute inset-0 z-[300] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
                <ICONS.Check className="w-12 h-12 text-green-500 relative z-10" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-4">Return Initiated</h3>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-[280px]">
                Thank you for being a Tesla customer. Your vehicle is now being processed.
            </p>
        </div>
    );

    const renderSurveyModal = () => (
      <div className="absolute inset-0 z-[800] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in slide-in-from-bottom duration-500">
        <div className="bg-zinc-900 w-full max-w-[360px] rounded-[40px] p-8 border border-zinc-800 shadow-[0_40px_100px_rgba(0,0,0,1)] relative overflow-hidden">
           <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
           {!surveySubmitted ? (
             <div className="space-y-6 relative z-10">
               <div className="text-center">
                 <div className="w-16 h-16 bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-zinc-700 shadow-xl">
                   <ICONS.Bot className="w-8 h-8 text-blue-500" />
                 </div>
                 <h4 className="text-xl font-bold tracking-tight">Return Experience</h4>
                 <p className="text-sm text-zinc-500 mt-2 leading-relaxed">How would you rate the overall return process today?</p>
               </div>
               <div className="flex justify-between items-center gap-2">
                 {[1, 2, 3, 4, 5].map((score) => (
                   <button
                     key={score}
                     onClick={() => setSurveyScore(score)}
                     className={`w-11 h-11 rounded-full text-sm font-bold transition-all border ${
                       surveyScore === score ? 'bg-white text-black border-white shadow-lg scale-110' : 'bg-zinc-800 text-zinc-500 border-zinc-700 active:scale-95'
                     }`}
                   >
                     {score}
                   </button>
                 ))}
               </div>
               <div className="flex justify-between px-1 text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                 <span>Not Helpful</span>
                 <span>Excellent</span>
               </div>
               
               <div className="space-y-2">
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Detailed Feedback (Optional)</p>
                 <textarea 
                    className="w-full h-24 bg-zinc-800/50 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border border-zinc-700 placeholder-zinc-600 transition-all"
                    placeholder="Tell us more about your experience..."
                    value={surveyFeedback}
                    onChange={(e) => setSurveyFeedback(e.target.value)}
                 />
               </div>

               <div className="flex flex-col gap-2 pt-2">
                 <Button variant="primary" disabled={surveyScore === null} onClick={() => setSurveySubmitted(true)}>Submit Feedback</Button>
                 <button onClick={() => setShowSurvey(false)} className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em] py-3 hover:text-white transition-colors">No Thanks</button>
               </div>
             </div>
           ) : (
             <div className="text-center space-y-6 py-8 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                  <ICONS.Check className="w-10 h-10 text-green-500" />
                </div>
                <h4 className="text-2xl font-bold tracking-tight">Thank You</h4>
                <p className="text-sm text-zinc-500 leading-relaxed px-4">Your feedback helps us refine the ownership experience.</p>
                <Button variant="secondary" onClick={() => setShowSurvey(false)} className="mt-8">Close</Button>
             </div>
           )}
        </div>
      </div>
    );

    const renderOverview = () => {
        if (isPostReturn) {
            return (
                <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="text-center py-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative transition-colors duration-500 ${isPaid ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                            <div className={`absolute inset-0 rounded-full blur-2xl transition-colors duration-500 ${isPaid ? 'bg-blue-500/20' : 'bg-green-500/20'}`}></div>
                            {isPaid ? <ICONS.Bot className="w-10 h-10 text-blue-500 relative z-10" /> : <ICONS.Check className="w-10 h-10 text-green-500 relative z-10" />}
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight">{isPaid ? 'Account Closed' : 'Vehicle Received'}</h3>
                        <p className="text-zinc-500 text-sm mt-2">{isPaid ? 'Thank you for your loyalty' : 'Lease Termination in Progress'}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800/50 space-y-4">
                        <div className="flex justify-between items-center text-xs"><span className="text-zinc-500 font-bold uppercase tracking-widest">Returned Location</span><span className="font-semibold">Tesla Palo Alto</span></div>
                        <div className="flex justify-between items-center text-xs"><span className="text-zinc-500 font-bold uppercase tracking-widest">Return Time</span><span className="font-semibold">{state.scheduledDate || 'June 15, 2024'}, 2:45 PM</span></div>
                        <div className="flex justify-between items-center text-xs"><span className="text-zinc-500 font-bold uppercase tracking-widest">Status</span><span className={`${isPaid ? 'text-blue-500' : 'text-green-500'} font-bold uppercase`}>{isPaid ? 'Paid' : 'Success'}</span></div>
                    </div>
                    <div className="px-2">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-6">Final Inspection & Billing</p>
                        <div className="flex flex-col">
                            <TimelineItem title="Vehicle Received" status={`Completed ${state.scheduledDate || 'June 15'}`} isComplete />
                            <TimelineItem title="Final Inspection" status={isBillReady ? "Completed June 18" : "Pending Technician Review"} isComplete={isBillReady} />
                            <TimelineItem title="Final Bill Generated" status={isBillReady ? "Ready - June 20" : "Available in 3-5 Business Days"} isComplete={isBillReady} onClick={!isBillReady ? () => setIsBillReady(true) : undefined} />
                            <TimelineItem title="Payment Due Date" status={isPaid ? "Paid - Receipt Sent" : (isBillReady ? "Due July 15, 2024" : "TBD")} isComplete={isPaid} isLast />
                        </div>
                    </div>
                    {isBillReady && !isPaid && (
                      <div className="animate-in slide-in-from-bottom duration-500 bg-zinc-900 rounded-3xl p-6 border border-blue-500/20">
                        <div className="flex justify-between items-end mb-6">
                          <div><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Due July 15</p><p className="text-3xl font-black">$450.00</p></div>
                          <ICONS.Dollar className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                        <Button variant="primary" onClick={() => setSubTab('BillBreakdown')}>View Breakdown & Pay</Button>
                      </div>
                    )}
                </div>
            );
        }

        if (isReturnDay && isReturning) {
            const allChecksPassed = state.isInspectionComplete && state.hasKeys && state.hasPersonalItemsRemoved;
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 py-4">
                    <button onClick={() => setIsReturning(false)} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><ICONS.ChevronRight className="w-3 h-3 rotate-180" /> Back to Overview</button>
                    <div className="text-center"><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mb-2">Maturity Reached</p><h3 className="text-3xl font-bold tracking-tight">Return Day</h3><p className="text-xs text-zinc-500 mt-2">Palo Alto Service Center</p></div>
                    <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50">
                         <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Final Checklist</h4>
                         <div className="space-y-5">
                            <div className="flex items-center justify-between"><div className="flex items-center space-x-3"><div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${state.isInspectionComplete ? 'bg-blue-500' : 'bg-zinc-800'}`}>{state.isInspectionComplete && <ICONS.Check className="w-3 h-3 text-white" />}</div><span className="text-sm font-medium">Pre-Inspection Done</span></div>{!state.isInspectionComplete && (<button className="text-[10px] text-blue-500 font-bold uppercase tracking-widest" onClick={() => { setSubTab('Inspection'); }}>Start</button>)}</div>
                            <div className="flex items-center justify-between"><div className="flex items-center space-x-3"><div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${state.hasKeys ? 'bg-blue-500' : 'bg-zinc-800'}`}>{state.hasKeys && <ICONS.Check className="w-3 h-3 text-white" />}</div><span className="text-sm font-medium">Keys in Center Console</span></div><input type="checkbox" checked={state.hasKeys} onChange={(e) => setState(s => ({ ...s, hasKeys: e.target.checked }))} className="w-5 h-5 bg-zinc-800 rounded accent-blue-500 border-none cursor-pointer" /></div>
                             <div className="flex items-center justify-between"><div className="flex items-center space-x-3"><div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${state.hasPersonalItemsRemoved ? 'bg-blue-500' : 'bg-zinc-800'}`}>{state.hasPersonalItemsRemoved && <ICONS.Check className="w-3 h-3 text-white" />}</div><span className="text-sm font-medium">Personal Items Removed</span></div><input type="checkbox" checked={state.hasPersonalItemsRemoved} onChange={(e) => setState(s => ({ ...s, hasPersonalItemsRemoved: e.target.checked }))} className="w-5 h-5 bg-zinc-800 rounded accent-blue-500 border-none cursor-pointer" /></div>
                         </div>
                    </div>
                    <div className="flex flex-col items-center justify-center pt-4 space-y-6">
                        <div className="relative">{allChecksPassed && <div className="absolute inset-0 bg-tesla-red/30 rounded-full blur-3xl animate-pulse scale-150"></div>}<button disabled={!allChecksPassed} onClick={handleLeaseReturn} className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl ${allChecksPassed ? 'bg-tesla-red text-white scale-100 active:scale-95' : 'bg-zinc-900 text-zinc-700 border border-zinc-800 scale-90 opacity-60 cursor-not-allowed'}`}><span className="text-[10px] font-bold uppercase tracking-widest leading-tight">Lease</span><span className="text-2xl font-black uppercase tracking-tighter">Return</span></button></div>
                        {!allChecksPassed && <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest animate-in fade-in duration-1000">Complete checklist to return</p>}
                    </div>
                </div>
            );
        }

        const mileageUsedPercent = Math.min(100, (state.currentMileage / state.allowedMileage) * 100);
        const mileageRemaining = Math.max(0, state.allowedMileage - state.currentMileage);

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
                    <div className="flex justify-between items-start mb-4">
                        <div><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Lease Status</p><h3 className="text-xl font-semibold mt-1">36-Month Lease</h3></div>
                        <div className="text-right"><p className={`text-sm font-bold ${state.daysLeft <= 10 && state.daysLeft >= 0 ? 'tesla-red' : 'text-blue-400'}`}>{isReturnDay ? 'DUE TODAY' : `${state.daysLeft} DAYS LEFT`}</p></div>
                    </div>
                    
                    <div className="space-y-6 pt-4 border-t border-zinc-800/50">
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500 font-bold uppercase tracking-widest">Maturity Date</span>
                            <span className="font-semibold">{state.maturityDate}</span>
                        </div>

                        {/* Mileage Tracking Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Mileage Tracking</span>
                                <span className="text-xs font-semibold">{state.currentMileage.toLocaleString()} / {state.allowedMileage.toLocaleString()} mi</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${mileageUsedPercent > 95 ? 'bg-tesla-red' : 'bg-blue-500'}`} 
                                    style={{ width: `${mileageUsedPercent}%` }} 
                                />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Used: {mileageUsedPercent.toFixed(1)}%</span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${mileageRemaining < 500 ? 'text-tesla-red' : 'text-zinc-500'}`}>
                                    Remaining: {mileageRemaining.toLocaleString()} mi
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Next Steps</h4>
                    {isReturnDay && !isReturning && (<Button variant="primary" onClick={() => setIsReturning(true)} className="mb-4 shadow-[0_4px_20px_rgba(255,255,255,0.1)]">Starting Return</Button>)}
                    <MenuCard icon={<ICONS.Camera className="w-5 h-5" />} title="Pre-Inspection" subtitle={state.isInspectionComplete ? "Completed ✅" : "Prepare for return walkthrough"} onClick={() => setSubTab('Inspection')} />
                    <MenuCard icon={<ICONS.Dollar className="w-5 h-5" />} title="Retention Offers" subtitle={state.selectedOption ? `Selected: ${state.selectedOption}` : "View loyalty incentives"} onClick={() => setSubTab('Offers')} />
                    <MenuCard icon={<ICONS.Calendar className="w-5 h-5" />} title="Schedule Return" subtitle={state.isScheduled ? "Confirmed" : "Select location and time"} onClick={() => setSubTab('Schedule')} />
                    <MenuCard icon={<ICONS.Bot className="w-5 h-5" />} title="Documents & Billing" subtitle="View lease agreement and final statements" onClick={() => setSubTab('Billing')} />
                </div>
            </div>
        );
    };

    const renderBillBreakdown = () => (
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <header className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold">Final Statement</h3><span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ref #TSLA-9281</span></header>
        <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 divide-y divide-zinc-800/50">
          <div className="py-4 flex justify-between text-sm"><span className="text-zinc-500">Disposition Fee</span><span>$350.00</span></div>
          <div className="py-4 flex justify-between text-sm"><span className="text-zinc-500">Exterior (Inspection ID #829)</span><span>$150.00</span></div>
          <div className="py-4 flex justify-between text-sm"><span className="text-zinc-500">Tires (Excess Wear)</span><span>$200.00</span></div>
          <div className="py-4 flex justify-between text-sm"><span className="text-zinc-500">Mileage Overage (0 mi)</span><span>$0.00</span></div>
          <div className="py-4 flex justify-between text-sm"><span className="text-blue-400 font-bold">Loyalty Credit Applied</span><span className="text-blue-400">-$250.00</span></div>
          <div className="pt-6 flex justify-between items-end"><span className="text-lg font-bold">Total Due</span><span className="text-2xl font-black">$450.00</span></div>
        </div>
        <div className="space-y-3">
          <Button variant="primary" onClick={handlePayment} disabled={isPaying}>{isPaying ? (<div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>Authorizing...</div>) : "Pay Now"}</Button>
          <Button variant="ghost" onClick={() => setSubTab('Overview')}>Cancel</Button>
        </div>
      </div>
    );

    const renderInspection = () => (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
            <h3 className="text-xl font-bold">Pre-Inspection Walkthrough</h3>
            {walkthroughStep === 0 && (
                <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                    <div className="w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800"><ICONS.Camera className="w-12 h-12 text-blue-500" /></div>
                    <p className="text-sm text-zinc-400 mb-8 leading-relaxed">We'll guide you through a virtual scan of your vehicle to estimate potential wear and tear before return.</p>
                    <Button onClick={() => setWalkthroughStep(1)}>Start Walkthrough</Button>
                </div>
            )}
            {walkthroughStep === 1 && (
                <div className="flex-1 relative bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800">
                    <img src="https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-40 grayscale" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                        <div className="w-64 h-64 border-2 border-white/10 rounded-full flex items-center justify-center animate-pulse"><div className="w-48 h-48 border-2 border-blue-500/30 rounded-full" /></div>
                        <div className="mt-8 px-6 py-2 bg-blue-600/20 backdrop-blur rounded-full border border-blue-500/30 text-[10px] font-bold tracking-widest uppercase animate-pulse">Scanning Front Fascia... 62%</div>
                    </div>
                    <Button className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%]" onClick={() => { setWalkthroughStep(2); setState(s => ({ ...s, isInspectionComplete: true })); }}>Simulate Scan Complete</Button>
                </div>
            )}
            {walkthroughStep === 2 && (
                <div className="flex-1 space-y-6 animate-in slide-in-from-bottom duration-700">
                    <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                        <div className="flex justify-between items-center mb-6"><span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Initial Estimate</span><span className="text-xl font-bold text-blue-400">$350 - $650</span></div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm"><span className="text-zinc-400">Exterior (Minor Scratches)</span><span>$150.00</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-zinc-400">Tires (Excess Wear)</span><span>$200.00</span></div>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed px-2">Final charges will be determined by a Tesla technician after the physical return of the vehicle.</p>
                    <Button onClick={() => { setState(s => ({ ...s, isEstimateConfirmed: true })); setSubTab('Overview'); }}>Accept Estimate</Button>
                </div>
            )}
        </div>
    );

    const renderOffers = () => {
        const offers = [
            { id: 'New Lease', title: 'Start a New Lease', sub: 'Model Y from $399/mo', tag: 'Loyalty Credit: $500' },
            { id: 'Buy', title: 'Purchase Vehicle', sub: 'Estimated Buyout: $28,450', tag: '0.99% APR Avail' },
            { id: 'Return', title: 'Return Vehicle', sub: 'Terminate at Maturity', tag: null }
        ];
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-xl font-bold">Retention Offers</h3>
                <div className="space-y-3">
                    {offers.map(opt => (
                        <button 
                            key={opt.id} 
                            onClick={() => setState(s => ({ ...s, selectedOption: opt.id as any }))} 
                            className={`w-full p-6 rounded-3xl border text-left transition-all ${state.selectedOption === opt.id ? 'bg-white text-black border-white shadow-lg' : 'bg-zinc-900 border-zinc-800'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold">{opt.title}</h4>
                                    <p className={`text-xs mt-1 ${state.selectedOption === opt.id ? 'text-zinc-600' : 'text-zinc-400'}`}>{opt.sub}</p>
                                </div>
                                {opt.tag && <span className={`text-[8px] font-bold uppercase px-2 py-1 rounded ${state.selectedOption === opt.id ? 'bg-black text-white' : 'bg-blue-600 text-white'}`}>{opt.tag}</span>}
                            </div>
                        </button>
                    ))}
                </div>
                <div className="pt-4">
                    <Button disabled={!state.selectedOption} onClick={() => setSubTab('Overview')}>Accept Selection</Button>
                </div>
            </div>
        );
    };

    const renderSchedule = () => (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
            <h3 className="text-xl font-bold">Return Scheduling</h3>
            {!state.isScheduled ? (
                <div className="flex-1 space-y-6">
                    <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Select Location</p>
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700"><ICONS.Bot className="w-5 h-5 text-blue-500" /></div>
                            <div><p className="text-sm font-bold">Tesla Palo Alto</p><p className="text-xs text-zinc-500">1.2 miles away • Preferred</p></div>
                        </div>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Select Date</p>
                        <div className="grid grid-cols-4 gap-2">
                            {['Jun 14', 'Jun 15', 'Jun 16', 'Jun 17'].map(d => (
                                <button key={d} onClick={() => setLocalSelectedDate(d)} className={`py-4 rounded-xl text-[10px] font-bold transition-all border ${localSelectedDate === d ? 'bg-white text-black border-white' : 'bg-zinc-800 text-gray-400 border-zinc-700 active:bg-zinc-700'}`}>{d}</button>
                            ))}
                        </div>
                    </div>
                    <Button disabled={!localSelectedDate} onClick={() => setState(s => ({ ...s, isScheduled: true, scheduledDate: localSelectedDate }))}>Confirm Appointment</Button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800"><ICONS.Check className="w-12 h-12 text-blue-500" /></div>
                    <h4 className="text-xl font-bold">Return Confirmed</h4>
                    <p className="text-sm text-zinc-500 mt-2">{state.scheduledDate} at 2:00 PM</p>
                    <p className="text-xs text-zinc-600 mt-1 uppercase tracking-widest">Tesla Palo Alto</p>
                    <div className="mt-12 w-full space-y-3">
                        <Button variant="ghost" onClick={() => setState(s => ({ ...s, isScheduled: false }))}>Reschedule</Button>
                        <Button variant="primary" onClick={() => setSubTab('Overview')}>Back to Overview</Button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col overflow-hidden">
            {showSuccessScreen && renderSuccessScreen()}
            {paymentConfirmed && renderPaymentConfirmation()}
            {showSurvey && renderSurveyModal()}
            <LeaseChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} leaseState={state} />
            
            <header className="p-6 flex justify-between items-center border-b border-zinc-900 bg-black/50 backdrop-blur-xl">
                <button onClick={() => { if (subTab === 'Overview') onBack(); else setSubTab('Overview'); }} className="text-gray-400 active:text-white font-bold text-xs uppercase tracking-widest">Back</button>
                <h2 className="text-sm font-bold uppercase tracking-[0.3em]">{subTab === 'Overview' ? 'Lease Management' : subTab === 'BillBreakdown' ? 'Final Bill' : subTab}</h2><div className="w-8"></div>
            </header>
            
            <div className={`flex-1 overflow-y-auto p-6 pb-24 ${isPostReturn ? 'pt-2' : ''}`}>
                {subTab === 'Overview' && renderOverview()}
                {subTab === 'Inspection' && renderInspection()}
                {subTab === 'Offers' && renderOffers()}
                {subTab === 'Schedule' && renderSchedule()}
                {subTab === 'BillBreakdown' && renderBillBreakdown()}
                {subTab === 'Billing' && (
                    <div className="space-y-6"><h3 className="text-xl font-bold">Documents</h3><div className="space-y-2"><MenuCard icon={<ICONS.Bot className="w-4 h-4" />} title="Lease Agreement" subtitle="Signed Jun 2021" /><MenuCard icon={<ICONS.Bot className="w-4 h-4" />} title="Return Statement" subtitle={isBillReady ? (isPaid ? "Paid - Receipt Available" : "Ready - View Summary") : "Pending final return"} onClick={isBillReady ? () => setSubTab('BillBreakdown') : undefined} /></div></div>
                )}
            </div>

            {/* Floating Support Button */}
            <button 
                onClick={() => setIsChatOpen(true)}
                className="absolute bottom-10 right-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-900/40 active:scale-90 transition-all z-40 border border-blue-400/20"
            >
                <div className="relative">
                    <ICONS.Bot className="w-7 h-7 text-white" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-blue-600"></div>
                </div>
            </button>

            <div className="absolute bottom-0 left-0 w-full z-[100] px-4 py-1.5 bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 flex items-center justify-between text-[7px] font-black uppercase text-zinc-600">
                <span className="tracking-tighter">PROTO_CTRL</span>
                <div className="flex space-x-2">
                    <button onClick={() => { setSubTab('Overview'); setIsBillReady(false); setIsPaid(false); setShowSurvey(false); setSurveySubmitted(false); setState(s => ({ ...s, daysLeft: 70, isReturned: false })); }} className={`px-2 py-0.5 rounded ${state.daysLeft > 60 ? 'bg-white/10 text-white' : ''}`}>Pre-60</button>
                    <button onClick={() => { setSubTab('Overview'); setIsBillReady(false); setIsPaid(false); setShowSurvey(false); setSurveySubmitted(false); setState(s => ({ ...s, daysLeft: 58, isReturned: false })); }} className={`px-2 py-0.5 rounded ${state.daysLeft <= 60 && state.daysLeft > 0 ? 'bg-white/10 text-white' : ''}`}>T-60</button>
                    <button onClick={() => { setSubTab('Overview'); setIsBillReady(false); setIsPaid(false); setShowSurvey(false); setSurveySubmitted(false); setState(s => ({ ...s, daysLeft: 0, isReturned: false })); }} className={`px-2 py-0.5 rounded ${state.daysLeft === 0 ? 'bg-tesla-red text-white' : ''}`}>T-0</button>
                    <button onClick={() => { setSubTab('Overview'); setIsBillReady(false); setIsPaid(false); setShowSurvey(false); setSurveySubmitted(false); setState(s => ({ ...s, daysLeft: -1, isReturned: true, isInspectionComplete: true, isScheduled: true, hasKeys: true, hasPersonalItemsRemoved: true })); }} className={`px-2 py-0.5 rounded ${state.daysLeft < 0 ? 'bg-green-600 text-white' : ''}`}>T+1</button>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components for Home ---

const VehicleHeader: React.FC<{ state: VehicleState }> = ({ state }) => (
  <div className="pt-12 pb-4 px-6 text-center">
    <h1 className="text-3xl font-semibold tracking-tight">{state.name}</h1>
    <div className="flex items-center justify-center space-x-2 text-gray-400 mt-1"><ICONS.Charging className="w-4 h-4" /><span className="text-lg font-medium text-white">{state.batteryLevel}%</span><span className="text-sm">{state.rangeRemaining} mi</span></div>
  </div>
);

const VehicleImage: React.FC = () => (
  <div className="relative w-full h-64 my-4 flex items-center justify-center overflow-hidden"><img src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800" alt="Tesla Model 3" className="object-contain w-4/5 drop-shadow-2xl"/></div>
);

const QuickActions: React.FC<{ state: VehicleState, onToggleLock: () => void, onOpenClimate: () => void }> = ({ state, onToggleLock, onOpenClimate }) => (
  <div className="flex justify-between px-8 py-6 mb-4">
    <button onClick={onToggleLock} className="flex flex-col items-center group"><div className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-900 group-active:bg-zinc-800 transition-colors">{state.isLocked ? <ICONS.Lock className="w-6 h-6" /> : <ICONS.Unlock className="w-6 h-6 tesla-red" />}</div><span className="text-[11px] mt-2 text-gray-400 uppercase tracking-widest">{state.isLocked ? 'Unlock' : 'Lock'}</span></button>
    <button onClick={onOpenClimate} className="flex flex-col items-center group"><div className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-900 group-active:bg-zinc-800 transition-colors"><ICONS.Climate className="w-6 h-6" /></div><span className="text-[11px] mt-2 text-gray-400 uppercase tracking-widest">Climate</span></button>
    <button className="flex flex-col items-center group"><div className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-900 group-active:bg-zinc-800 transition-colors"><ICONS.Honk className="w-6 h-6" /></div><span className="text-[11px] mt-2 text-gray-400 uppercase tracking-widest">Summon</span></button>
    <button className="flex flex-col items-center group"><div className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-900 group-active:bg-zinc-800 transition-colors"><ICONS.Charging className="w-6 h-6" /></div><span className="text-[11px] mt-2 text-gray-400 uppercase tracking-widest">Charge</span></button>
  </div>
);

const ClimateModal: React.FC<{ isOpen: boolean, onClose: () => void, state: VehicleState, onTempChange: (val: number) => void }> = ({ isOpen, onClose, state, onTempChange }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[120] flex flex-col bg-black">
      <div className="flex justify-between items-center p-6"><button onClick={onClose} className="text-sm font-medium">Done</button><h2 className="text-lg font-bold">Climate</h2><div className="w-10"></div></div>
      <div className="flex-1 flex flex-col items-center justify-center px-10">
        <div className="relative w-64 h-64 flex items-center justify-center"><div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div><div className="text-7xl font-light">{state.targetTemp}°</div></div>
        <div className="flex space-x-12 mt-12"><button onClick={() => onTempChange(state.targetTemp - 1)} className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-3xl font-light active:bg-zinc-800">-</button><button onClick={() => onTempChange(state.targetTemp + 1)} className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-3xl font-light active:bg-zinc-800">+</button></div>
        <div className="mt-16 w-full space-y-4">
             <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-xl"><span>Interior Temp</span><span className="text-gray-400">{state.insideTemp}°F</span></div>
             <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-xl"><span>Exterior Temp</span><span className="text-gray-400">{state.outsideTemp}°F</span></div>
        </div>
      </div>
    </div>
  );
};

const AssistantModal: React.FC<{ isOpen: boolean; onClose: () => void; state: VehicleState; }> = ({ isOpen, onClose, state }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    const botResponse = await gemini.getVehicleAdvice(input, state);
    setMessages(prev => [...prev, { role: 'model', text: botResponse }]);
    setIsTyping(false);
  };
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[130] flex flex-col bg-zinc-950">
      <div className="flex justify-between items-center p-6 border-b border-zinc-900"><h2 className="text-lg font-bold flex items-center gap-2"><ICONS.Bot className="w-5 h-5 tesla-red" />Tesla Assistant</h2><button onClick={onClose} className="text-gray-400 font-bold uppercase text-xs tracking-widest">Close</button></div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (<div className="text-center text-gray-500 mt-20"><p>Ask me anything about your {state.model}.</p><p className="text-xs mt-2 italic">"How can I maximize my range today?"</p></div>)}
        {messages.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] px-4 py-2 rounded-2xl ${m.role === 'user' ? 'bg-tesla-red text-white' : 'bg-zinc-900 text-gray-200'}`}>{m.text}</div></div>))}
        {isTyping && (<div className="flex justify-start"><div className="bg-zinc-900 px-4 py-2 rounded-2xl animate-pulse text-gray-400">Thinking...</div></div>)}
      </div>
      <div className="p-4 border-t border-zinc-900 bg-black"><div className="flex gap-2"><input className="flex-1 bg-zinc-900 rounded-full px-4 py-2 focus:outline-none text-sm" placeholder="Ask Tesla..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} /><button onClick={handleSend} className="w-10 h-10 bg-tesla-red rounded-full flex items-center justify-center"><ICONS.ChevronRight className="w-5 h-5 text-white" /></button></div></div>
    </div>
  );
};

export default function App() {
  const [vState, setVState] = useState<VehicleState>(INITIAL_VEHICLE_STATE);
  const [lState, setLState] = useState<LeaseState>(INITIAL_LEASE_STATE);
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  const [isClimateOpen, setIsClimateOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const toggleLock = () => setVState(prev => ({ ...prev, isLocked: !prev.isLocked }));
  const handleTempChange = (newTemp: number) => setVState(prev => ({ ...prev, targetTemp: Math.max(60, Math.min(85, newTemp)) }));
  
  return (
    <div className="relative w-full max-w-[430px] h-full max-h-[932px] bg-black text-white overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-zinc-800/50 md:rounded-[40px] flex flex-col">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-zinc-900/30 to-transparent -z-10" />
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'Home' && (
          <><VehicleHeader state={vState} /><VehicleImage /><QuickActions state={vState} onToggleLock={toggleLock} onOpenClimate={() => setIsClimateOpen(true)} /><div className="px-6 space-y-1"><MenuCard icon={<ICONS.Dollar className="w-5 h-5" />} title="Financing" subtitle="Manage lease, track mileage" onClick={() => setActiveTab('Financing')} /><MenuCard icon={<ICONS.Climate className="w-5 h-5" />} title="Climate" subtitle={`Interior ${vState.insideTemp}°F`} onClick={() => setIsClimateOpen(true)} /><MenuCard icon={<ICONS.Charging className="w-5 h-5" />} title="Charging" subtitle={`Nearby: Supercharger Palo Alto`} /><MenuCard icon={<ICONS.Flash className="w-5 h-5" />} title="Security & Drivers" subtitle="Sentry Mode Active" /><MenuCard icon={<ICONS.Bot className="w-5 h-5" />} title="Tesla AI Assistant" subtitle="Ask about vehicle health or tips" onClick={() => setIsAssistantOpen(true)} /><div className="py-8 text-center"><p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mb-1">{vState.model}</p><p className="text-[10px] text-zinc-700 uppercase tracking-[0.1em]">Software v{vState.softwareVersion}</p></div></div></>
        )}
        {activeTab === 'Financing' && (
            <div className="p-6 pt-16 animate-in slide-in-from-right duration-500 h-full overflow-hidden flex flex-col">
                <header className="flex justify-between items-center mb-8"><button onClick={() => setActiveTab('Home')} className="text-sm font-bold uppercase tracking-widest text-zinc-500 active:text-white">Back</button><h2 className="text-xl font-bold">Financing</h2><div className="w-8"></div></header>
                <div className="space-y-4 flex-1 overflow-y-auto">
                    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Active Lease</p>
                        <h3 className="text-lg font-bold">{vState.model}</h3>
                        <p className="text-sm text-zinc-400 mt-2">{lState.daysLeft < 0 ? 'Lease terminated' : `${lState.daysLeft} days remaining in term`}</p>
                        <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-between items-center">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Odometer</span>
                            <span className="text-xs font-bold">{lState.currentMileage.toLocaleString()} mi</span>
                        </div>
                        <Button className="mt-6" onClick={() => setActiveTab('LeaseManagement')}>Lease Management</Button>
                    </div>
                    <MenuCard icon={<ICONS.Check className="w-4 h-4" />} title="Payment History" subtitle="Last payment: May 15" />
                    <MenuCard icon={<ICONS.Dollar className="w-4 h-4" />} title="Billing Statements" />
                </div>
            </div>
        )}
        {activeTab === 'LeaseManagement' && <LeaseManagement state={lState} setState={setLState} onBack={() => setActiveTab('Financing')} />}
        {(['Controls', 'Location', 'Upgrades'] as TabType[]).indexOf(activeTab) !== -1 && <div className="flex items-center justify-center h-full text-zinc-700 uppercase tracking-widest text-[10px]">{activeTab} Module Placeholder</div>}
      </main>
      <nav className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-md border-t border-zinc-800 pb-8 pt-4 px-6 z-40">
        <div className="flex justify-between items-center">
          {(['Home', 'Controls', 'Location', 'Upgrades'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab ? 'text-white' : 'text-zinc-600'}`}><div className="w-6 h-6 flex items-center justify-center">{tab === 'Home' && <ICONS.Honk className="w-5 h-5" />}{tab === 'Controls' && <ICONS.Flash className="w-5 h-5" />}{tab === 'Location' && <ICONS.Calendar className="w-5 h-5" />}{tab === 'Upgrades' && <ICONS.Charging className="w-5 h-5" />}</div><span className="text-[10px] font-bold uppercase tracking-wider">{tab}</span></button>
          ))}
        </div>
      </nav>
      <ClimateModal isOpen={isClimateOpen} onClose={() => setIsClimateOpen(false)} state={vState} onTempChange={handleTempChange} />
      <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} state={vState} />
    </div>
  );
}
