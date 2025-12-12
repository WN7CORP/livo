import React, { useEffect, useRef } from 'react';
import { Terminal, Activity } from 'lucide-react';

interface LogViewerProps {
  logs: string[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 bg-slate-900 rounded-lg shadow-xl overflow-hidden border border-slate-700 font-mono text-sm">
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Terminal size={14} className="text-slate-400" />
          <span className="text-slate-400 text-xs font-semibold tracking-wider">SYSTEM LOGS</span>
        </div>
        <Activity size={14} className="text-emerald-500 animate-pulse" />
      </div>
      <div className="p-4 h-48 overflow-y-auto custom-scrollbar bg-slate-950/50">
        <div className="space-y-1.5">
          {logs.length === 0 && (
            <div className="text-slate-600 italic text-xs">Aguardando início do processo...</div>
          )}
          {logs.map((log, index) => (
            <div key={index} className="flex space-x-2 animate-fade-in-up">
              <span className="text-emerald-500 font-bold shrink-0">{'>'}</span>
              <span className="text-slate-300 break-words leading-relaxed">{log}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
};

export default LogViewer;