import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  History, 
  PieChart as PieChartIcon, 
  Settings,
  Zap,
  Wallet,
  Database,
  Trash2,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { 
  Transaction, 
  TransactionType, 
  FinanceData, 
  Budget,
  RecurringTransaction
} from './types';
import { setCookie, getCookie, removeCookie } from './utils/cookies';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import Visuals from './components/Visuals';
import BudgetManager from './components/BudgetManager';
import RecurringManager from './components/RecurringManager';
import LandingPage from './components/LandingPage';
import ScrollReveal from './components/ScrollReveal';
import StarBorder from './components/StarBorder';
import CountUp from './components/CountUp';

const APP_COOKIE_KEY = 'financex_vault_v1';

const App: React.FC = () => {
  const [data, setData] = useState<FinanceData>(() => {
    const saved = getCookie(APP_COOKIE_KEY);
    if (saved) return saved;
    return { 
      transactions: [], 
      budgets: [], 
      recurring: [], 
      hasSeenLanding: false 
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'charts' | 'budgets' | 'recurring' | 'settings'>('dashboard');
  const [isLanding, setIsLanding] = useState(!data.hasSeenLanding);
  const [isPurging, setIsPurging] = useState(false);
  const purgingRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#000000';
  }, []);

  // Nuclear Persistence Layer: Block all writes if a purge is initiated
  useEffect(() => {
    if (!purgingRef.current && data.hasSeenLanding !== undefined) {
      setCookie(APP_COOKIE_KEY, data);
    }
  }, [data]);

  const addTransaction = (transaction: Transaction | Omit<Transaction, 'id' | 'date'>) => {
    const newTx = 'id' in transaction ? transaction : {
      ...transaction,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };
    setData(prev => ({
      ...prev,
      transactions: [newTx as Transaction, ...prev.transactions]
    }));
  };

  const deleteTransaction = (id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  const updateBudget = (budget: Budget) => {
    setData(prev => {
      const existing = prev.budgets.findIndex(b => b.category === budget.category);
      const newBudgets = [...prev.budgets];
      if (existing >= 0) newBudgets[existing] = budget;
      else newBudgets.push(budget);
      return { ...prev, budgets: newBudgets };
    });
  };

  const addRecurring = (rec: RecurringTransaction) => {
    setData(prev => ({ ...prev, recurring: [...prev.recurring, rec] }));
  };

  const deleteRecurring = (id: string) => {
    setData(prev => ({ ...prev, recurring: prev.recurring.filter(r => r.id !== id) }));
  };

  const handlePurge = () => {
    if (confirm("Initiate total vault erasure? This cannot be undone.")) {
      purgingRef.current = true; // Hard-lock the state sync
      setIsPurging(true);
      
      setTimeout(() => {
        // Destroy all known local persistence vectors
        removeCookie(APP_COOKIE_KEY);
        localStorage.clear();
        sessionStorage.clear();
        
        // Wipe local session state
        setData({ transactions: [], budgets: [], recurring: [], hasSeenLanding: false });
        
        // Nuclear restart
        window.location.reload(window.location.reload);
      }, 3000);
    }
  };

  const totalBalance = useMemo(() => {
    return data.transactions.reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
  }, [data.transactions]);

  const Logo = () => (
    <div className="flex items-center gap-3 group">
      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,159,252,0.3)] group-hover:scale-110 transition-transform duration-500">
        <Wallet className="text-black w-5 h-5" />
      </div>
      <h1 className="text-xl font-bold tracking-tighter text-white uppercase">FinanceX</h1>
    </div>
  );

  if (isLanding) return <LandingPage onEnter={() => { setData(p => ({...p, hasSeenLanding: true})); setIsLanding(false); }} />;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-black text-white font-sans selection:bg-accent selection:text-black">
      
      {isPurging && <PurgeOverlay />}

      <aside className="hidden md:flex flex-col w-[280px] h-screen bg-black border-r border-white/5 relative z-20">
        <div className="p-8 pb-12">
          <Logo />
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Overview" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History size={20} />} label="Journal" />
          <SidebarItem active={activeTab === 'recurring'} onClick={() => setActiveTab('recurring')} icon={<Zap size={20} />} label="Automations" />
          <SidebarItem active={activeTab === 'charts'} onClick={() => setActiveTab('charts')} icon={<PieChartIcon size={20} />} label="Analytics" />
          <SidebarItem active={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')} icon={<Settings size={20} />} label="Planning" />
          <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Database size={20} />} label="Vault Settings" />
        </nav>

        <div className="p-4 mt-auto space-y-2">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Liquidity</p>
            <div className="truncate">
              <p className="text-2xl font-bold tracking-tighter mono text-accent">
                <CountUp to={totalBalance} prefix="$" />
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsLanding(true)}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <LogOut size={16} /> Disconnect
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto no-scrollbar bg-black">
        <div className="max-w-6xl mx-auto px-6 md:px-16 py-8 md:py-12 pb-32">
          {activeTab === 'dashboard' && (
            <Dashboard 
              data={data} 
              totalBalance={totalBalance} 
              addTransaction={addTransaction} 
              deleteTransaction={deleteTransaction}
              theme="dark" 
            />
          )}
          {activeTab === 'transactions' && <TransactionList transactions={data.transactions} onDelete={deleteTransaction} />}
          {activeTab === 'recurring' && <RecurringManager recurringItems={data.recurring} onAdd={addRecurring} onDelete={deleteRecurring} />}
          {activeTab === 'charts' && <Visuals transactions={data.transactions} />}
          {activeTab === 'budgets' && <BudgetManager budgets={data.budgets} transactions={data.transactions} onUpdate={updateBudget} />}
          
          {activeTab === 'settings' && (
            <div className="space-y-12">
               <header>
                <ScrollReveal>
                  <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4">Vault Config</h2>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Sovereign Lifecycle Management.</p>
                </ScrollReveal>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <SettingsCard 
                    title="Vault Erasure" 
                    desc="Destructively zero-out all local data, including encrypted cookies and cache blocks." 
                    onClick={handlePurge} 
                    icon={<Trash2 className="text-rose-500" />} 
                 />
                 <SettingsCard 
                    title="System Lockdown" 
                    desc="Disconnect from the current session and return to the primary gateway." 
                    onClick={() => setIsLanding(true)} 
                    icon={<LogOut className="text-accent" />} 
                 />
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className="md:hidden flex justify-around items-center h-20 safe-bottom border-t border-white/5 bg-black/80 backdrop-blur-xl fixed bottom-0 left-0 right-0 z-50 px-4">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Status" />
        <MobileNavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="Journal" />
        <MobileNavItem active={activeTab === 'charts'} onClick={() => setActiveTab('charts')} icon={<PieChartIcon />} label="Intel" />
        <MobileNavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Database />} label="Vault" />
      </nav>
    </div>
  );
};

const SidebarItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between w-full px-5 py-3.5 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-accent text-black font-bold shadow-[0_4px_20px_rgba(255,159,252,0.3)]' 
        : 'text-slate-500 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className="flex items-center gap-4">
      {React.cloneElement(icon, { size: 18, className: active ? 'text-black' : 'text-slate-500 group-hover:text-white' })}
      <span className="text-sm tracking-tight">{label}</span>
    </div>
    {active && <ChevronRight size={14} className="text-black" />}
  </button>
);

const MobileNavItem = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all duration-300 ${active ? 'text-accent' : 'text-slate-600'}`}
  >
    <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-accent/10 scale-110' : ''}`}>
      {React.cloneElement(icon, { size: 22 })}
    </div>
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

const SettingsCard = ({ title, desc, onClick, icon }: any) => (
  <StarBorder as="button" className="rounded-3xl w-full text-left" onClick={onClick} color="#94a3b8" speed="8s">
    <div className="flex flex-col p-8 bg-black h-full cursor-pointer hover:bg-neutral-900 transition-colors">
      <div className="mb-6 p-4 rounded-xl bg-white/5 inline-block w-fit">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </StarBorder>
);

const PurgeOverlay = () => (
  <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-12 overflow-hidden">
    <div className="absolute inset-0 opacity-20 pointer-events-none">
       <div className="h-full w-full mono text-[10px] text-accent leading-none overflow-hidden select-none whitespace-pre">
          {Array.from({length: 100}).map((_, i) => (
            <div key={i} className="animate-pulse" style={{animationDelay: `${i * 0.05}s`}}>
              PURGING_DATA_BLOCK_{i}... 0x{Math.random().toString(16).slice(2, 10)} SCRUBBING_SECTOR_{i} DELETE_SUCCESS 
            </div>
          ))}
       </div>
    </div>
    <div className="relative z-10 text-center space-y-6">
      <Trash2 size={80} className="text-rose-500 mx-auto animate-bounce" />
      <h2 className="text-4xl font-black tracking-tighter uppercase italic animate-pulse text-white">Wiping Vault Contents</h2>
      <p className="text-slate-500 font-mono text-sm max-w-md mx-auto">
        Initiating zero-fill protocol. All local encrypted records are being destructively overwritten.
      </p>
      <div className="w-64 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
        <div className="h-full bg-rose-500 animate-[progress_3s_ease-in-out]"></div>
      </div>
    </div>
    <style>{`
      @keyframes progress {
        0% { width: 0%; }
        100% { width: 100%; }
      }
    `}</style>
  </div>
);

export default App;
