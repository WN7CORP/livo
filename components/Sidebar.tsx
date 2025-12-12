import React from 'react';
import { ExtractionJob, JobStatus } from '../types';
import { Plus, FileText, CheckCircle, AlertCircle, Loader2, Trash2, Database } from 'lucide-react';

interface SidebarProps {
  jobs: ExtractionJob[];
  selectedJobId: string | null;
  onSelectJob: (id: string) => void;
  onNewJob: () => void;
  onDeleteJob: (id: string, e: React.MouseEvent) => void;
  onClearHistory: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  jobs, 
  selectedJobId, 
  onSelectJob, 
  onNewJob,
  onDeleteJob,
  onClearHistory
}) => {
  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-64px)] sticky top-16">
      <div className="p-4 border-b border-slate-100">
        <button
          onClick={onNewJob}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-sm active:scale-95"
        >
          <Plus size={20} />
          <span>Nova Extração</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {jobs.length === 0 && (
          <div className="text-center py-10 px-4 text-slate-400">
            <Database size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Seu histórico aparecerá aqui.</p>
          </div>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => onSelectJob(job.id)}
            className={`group relative flex flex-col p-3 rounded-lg cursor-pointer transition-all border ${
              selectedJobId === job.id
                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
            }`}
          >
            <div className="flex items-start">
                <div className="mt-1 mr-3 shrink-0">
                {job.status === JobStatus.QUEUED && <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin" />}
                {job.status === JobStatus.PROCESSING && <Loader2 size={20} className="text-blue-500 animate-spin" />}
                {job.status === JobStatus.COMPLETED && <CheckCircle size={20} className="text-emerald-500" />}
                {job.status === JobStatus.ERROR && <AlertCircle size={20} className="text-red-500" />}
                </div>
                
                <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium truncate ${selectedJobId === job.id ? 'text-blue-800' : 'text-slate-700'}`}>
                    {job.name}
                </h4>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-400">
                    {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • V{job.rubricVersion}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                    job.status === JobStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                    job.status === JobStatus.ERROR ? 'bg-red-100 text-red-700' :
                    job.status === JobStatus.PROCESSING ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                    }`}>
                    {job.status === JobStatus.QUEUED ? 'Fila' : 
                    job.status === JobStatus.PROCESSING ? `${job.progress || 0}%` : 
                    job.status === JobStatus.COMPLETED ? 'Pronto' : 'Erro'}
                    </span>
                </div>
                </div>

                <button
                onClick={(e) => onDeleteJob(job.id, e)}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                title="Remover"
                >
                <Trash2 size={14} />
                </button>
            </div>
            {/* Mini Progress Bar inside Item */}
            {job.status === JobStatus.PROCESSING && (
                <div className="w-full bg-slate-200 rounded-full h-1 mt-2 overflow-hidden">
                    <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                    />
                </div>
            )}
          </div>
        ))}
      </div>

      {jobs.length > 0 && (
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClearHistory}
            className="w-full flex items-center justify-center space-x-2 text-slate-500 hover:text-red-600 text-xs font-medium py-2 rounded hover:bg-white transition-colors"
          >
            <Trash2 size={14} />
            <span>Limpar Histórico</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;