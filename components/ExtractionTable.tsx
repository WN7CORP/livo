import React from 'react';
import { ExtractionJob, JobStatus } from '../types';
import { Download, CheckCircle, AlertCircle, Loader2, BookOpen } from 'lucide-react';

interface ExtractionTableProps {
  jobs: ExtractionJob[];
  onExport: () => void;
  onRead: (job: ExtractionJob) => void;
}

const ExtractionTable: React.FC<ExtractionTableProps> = ({ jobs, onExport, onRead }) => {
  const completedJobs = jobs.filter(j => j.status === JobStatus.COMPLETED && j.bookData);

  if (jobs.length === 0) return null;

  return (
    <div className="w-full animate-fade-in space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 gap-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Livros Processados ({completedJobs.length}/{jobs.length})
        </h2>
        <button
          onClick={onExport}
          disabled={completedJobs.length === 0}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} />
          <span>Exportar Planilha Completa</span>
        </button>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-slate-200 bg-white">
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-3 whitespace-nowrap w-10">Status</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Título do Livro</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Páginas</th>
                <th scope="col" className="px-6 py-3 min-w-[200px]">Capítulos</th>
                <th scope="col" className="px-6 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-center">
                    {job.status === JobStatus.COMPLETED ? <CheckCircle className="text-emerald-500" size={20} /> :
                     job.status === JobStatus.PROCESSING ? <Loader2 className="text-blue-500 animate-spin" size={20} /> :
                     job.status === JobStatus.ERROR ? <AlertCircle className="text-red-500" size={20} /> :
                     <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {job.bookData?.title || job.name}
                  </td>
                  <td className="px-6 py-4">
                    {job.bookData?.pageCount || '-'}
                  </td>
                  <td className="px-6 py-4 text-xs">
                     {job.bookData?.chapters ? (
                        <div className="line-clamp-2" title={job.bookData.chapters}>
                            {job.bookData.chapters}
                        </div>
                     ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {job.status === JobStatus.COMPLETED ? (
                        <button 
                            onClick={() => onRead(job)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors border border-indigo-200"
                        >
                            <BookOpen size={16} />
                            <span>Ler</span>
                        </button>
                    ) : (
                        <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExtractionTable;