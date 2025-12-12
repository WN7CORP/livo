import React, { useState, useEffect } from 'react';
import { extractBookFromPdf } from './services/geminiService';
import FileUpload from './components/FileUpload';
import ExtractionTable from './components/ExtractionTable';
import LogViewer from './components/LogViewer';
import Sidebar from './components/Sidebar';
import BookReader from './components/BookReader';
import { ExtractionJob, JobStatus } from './types';
import { BookOpen, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'book_extract_history';

const App: React.FC = () => {
  const [jobs, setJobs] = useState<ExtractionJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [readingJob, setReadingJob] = useState<ExtractionJob | null>(null);
  
  // Load history
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedJobs = JSON.parse(stored);
        const validJobs = parsedJobs.filter((j: ExtractionJob) => 
          j.status === JobStatus.COMPLETED || j.status === JobStatus.ERROR
        );
        setJobs(validJobs);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history
  useEffect(() => {
    const serializableJobs = jobs.map(job => ({
      ...job,
      file: undefined
    })).filter(j => j.status === JobStatus.COMPLETED || j.status === JobStatus.ERROR);

    if (serializableJobs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableJobs));
    }
  }, [jobs]);

  // Queue Processor
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingQueue) return;

      const nextJob = jobs.find(j => j.status === JobStatus.QUEUED);
      if (!nextJob) return;

      setIsProcessingQueue(true);
      setSelectedJobId(nextJob.id);
      updateJobStatus(nextJob.id, JobStatus.PROCESSING);

      if (!nextJob.file) {
        updateJobStatus(nextJob.id, JobStatus.ERROR, undefined, "Arquivo perdido na memória.");
        setIsProcessingQueue(false);
        return;
      }

      try {
        const appendLog = (msg: string) => addLogToJob(nextJob.id, msg);
        const updateProgress = (pct: number) => updateJobProgress(nextJob.id, pct);
        
        const bookData = await extractBookFromPdf(
          nextJob.file, 
          appendLog,
          updateProgress
        );

        updateJobStatus(nextJob.id, JobStatus.COMPLETED, bookData);

      } catch (error: any) {
        console.error(error);
        addLogToJob(nextJob.id, `Erro: ${error.message}`);
        updateJobStatus(nextJob.id, JobStatus.ERROR, undefined, error.message);
      } finally {
        setIsProcessingQueue(false);
      }
    };

    processQueue();
  }, [jobs, isProcessingQueue]);


  // -- Helpers --

  const updateJobStatus = (id: string, status: JobStatus, result?: any, error?: string) => {
    setJobs(prev => prev.map(job => {
      if (job.id === id) {
        return { 
          ...job, 
          status, 
          bookData: result || job.bookData,
          error: error || job.error,
          progress: status === JobStatus.COMPLETED ? 100 : job.progress
        };
      }
      return job;
    }));
  };

  const updateJobProgress = (id: string, progress: number) => {
    setJobs(prev => prev.map(job => {
      if (job.id === id) {
        return { ...job, progress };
      }
      return job;
    }));
  };

  const addLogToJob = (id: string, message: string) => {
    setJobs(prev => prev.map(job => {
      if (job.id === id) {
        return { ...job, logs: [...job.logs, message] };
      }
      return job;
    }));
  };

  const handleAddFiles = (files: File[]) => {
    const newJobs: ExtractionJob[] = files.map(file => ({
      id: crypto.randomUUID(),
      name: file.name.replace('.pdf', ''),
      file,
      status: JobStatus.QUEUED,
      logs: [],
      progress: 0,
      createdAt: Date.now()
    }));

    setJobs(prev => [...prev, ...newJobs]);
  };

  const handleDeleteJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJobs(prev => prev.filter(j => j.id !== id));
    if (selectedJobId === id) setSelectedJobId(null);
  };

  const handleClearHistory = () => {
    if (confirm("Limpar todo o histórico?")) {
      setJobs([]);
      setSelectedJobId(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleExportCSV = () => {
    const completed = jobs.filter(j => j.status === JobStatus.COMPLETED && j.bookData);
    if (completed.length === 0) return;

    const headers = ["Titulo do Livro", "Paginas", "Capitulos", "Conteudo"];
    const rows = completed.map(j => {
      const data = j.bookData!;
      return [
        `"${data.title.replace(/"/g, '""')}"`,
        `"${data.pageCount}"`,
        `"${data.chapters.replace(/"/g, '""')}"`,
        `"${data.content.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `livros_formatados_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenReader = (job: ExtractionJob) => {
    setReadingJob(job);
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 shrink-0">
        <div className="max-w-full px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg text-white shadow-lg">
              <BookOpen size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
              BookExtract AI
            </h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            {isProcessingQueue && <span className="flex items-center text-blue-600 font-medium"><Loader2 size={14} className="animate-spin mr-1"/> Processando Fila...</span>}
            <span className="hidden sm:inline bg-slate-100 px-2 py-1 rounded">{jobs.filter(j => j.status === JobStatus.QUEUED).length} na fila</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          jobs={jobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          onNewJob={() => setSelectedJobId(null)}
          onDeleteJob={handleDeleteJob}
          onClearHistory={handleClearHistory}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 sm:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                <FileUpload onAddFiles={handleAddFiles} />
            </div>

            <div className="mb-8">
               <ExtractionTable 
                 jobs={jobs} 
                 onExport={handleExportCSV} 
                 onRead={handleOpenReader}
               />
            </div>

            {selectedJob && !readingJob && (
                <div className="animate-fade-in-up bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800">Detalhes: {selectedJob.name}</h3>
                        <span className="text-xs text-slate-500 font-mono">{selectedJob.id.slice(0,8)}</span>
                    </div>
                    
                    <div className="p-6">
                        {selectedJob.status === JobStatus.PROCESSING && (
                            <div className="mb-6">
                                <div className="flex justify-between text-xs mb-1 text-slate-600 font-medium">
                                    <span>Progresso da IA</span>
                                    <span>{selectedJob.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${selectedJob.progress}%` }}></div>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                             <LogViewer logs={selectedJob.logs} />
                        </div>
                        
                        {selectedJob.bookData && (
                            <div className="text-center py-8">
                                <p className="text-slate-500 mb-4">O processamento foi concluído. Clique abaixo para ler.</p>
                                <button 
                                    onClick={() => handleOpenReader(selectedJob)}
                                    className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition-all"
                                >
                                    <BookOpen size={20} />
                                    <span>Abrir Modo Leitura (Kindle)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>
        </main>
      </div>

      {/* Reader Overlay */}
      {readingJob && readingJob.bookData && (
        <BookReader 
            book={readingJob.bookData} 
            onClose={() => setReadingJob(null)} 
        />
      )}
    </div>
  );
};

export default App;