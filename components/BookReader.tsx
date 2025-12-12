import React, { useState, useEffect, useRef } from 'react';
import { BookData } from '../types';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Download, Book } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface BookReaderProps {
  book: BookData;
  onClose: () => void;
}

const BookReader: React.FC<BookReaderProps> = ({ book, onClose }) => {
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  
  // TTS Refs
  const synth = useRef<SpeechSynthesis>(window.speechSynthesis);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  // Pagination Logic
  useEffect(() => {
    if (book.content) {
      // Split content into paragraphs first
      const paragraphs = book.content.split(/\n\s*\n/);
      const newPages: string[] = [];
      let currentPageContent = "";
      const CHAR_LIMIT = 1200; // Characters per page approximation

      paragraphs.forEach((para) => {
        // If adding this paragraph exceeds limit, push current page and start new
        if ((currentPageContent + para).length > CHAR_LIMIT) {
          if (currentPageContent) newPages.push(currentPageContent);
          currentPageContent = para + "\n\n";
        } else {
          currentPageContent += para + "\n\n";
        }
      });
      if (currentPageContent) newPages.push(currentPageContent);
      
      setPages(newPages);
    }
  }, [book]);

  // Handle TTS Stop on Unmount or Page Change
  useEffect(() => {
    return () => {
      synth.current.cancel();
    };
  }, []);

  useEffect(() => {
    // If we change pages while playing, stop and restart
    if (isPlaying) {
      synth.current.cancel();
      speakText(pages[currentPage]);
    }
  }, [currentPage]);

  const speakText = (text: string) => {
    // Clean markdown symbols for speech
    const cleanText = text.replace(/[#*`]/g, '');
    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = 'pt-BR';
    u.onend = () => {
      setIsPlaying(false);
    };
    utterance.current = u;
    synth.current.speak(u);
  };

  const toggleAudio = () => {
    if (isPlaying) {
      synth.current.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakText(pages[currentPage]);
    }
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentPage < pages.length - 1) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(false);
      }, 300);
    } else if (direction === 'prev' && currentPage > 0) {
        setFlipDirection('prev');
        setIsFlipping(true);
        setTimeout(() => {
          setCurrentPage(prev => prev - 1);
          setIsFlipping(false);
        }, 300);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    const lineHeight = 7;
    let cursorY = margin;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (margin * 2);

    // Title Page
    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.text(book.title, pageWidth / 2, pageHeight / 3, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`Capítulos: ${book.chapters}`, pageWidth / 2, pageHeight / 2, { align: "center", maxWidth: maxWidth });
    
    doc.addPage();

    // Content
    doc.setFont("times", "normal");
    doc.setFontSize(12);

    const fullLines = doc.splitTextToSize(book.content.replace(/[#*]/g, ''), maxWidth);

    fullLines.forEach((line: string) => {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });

    doc.save(`${book.title.replace(/\s+/g, '_')}.pdf`);
  };

  // Determine current chapter (Naive header check)
  const currentText = pages[currentPage] || "";
  const chapterMatch = currentText.match(/^##\s+(.+)$/m);
  const currentChapter = chapterMatch ? chapterMatch[1] : "Leitura Contínua";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
      {/* Main Container */}
      <div className="bg-transparent w-full max-w-4xl h-[90vh] flex flex-col relative">
        
        {/* Top Controls */}
        <div className="flex justify-between items-center text-white mb-4 px-2">
            <div className="flex items-center space-x-3">
                <Book className="text-emerald-400" />
                <div>
                    <h2 className="font-bold text-lg leading-tight">{book.title}</h2>
                    <p className="text-xs text-slate-400">{currentChapter}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={handleExportPDF}
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors tooltip"
                    title="Exportar PDF"
                >
                    <Download size={20} />
                </button>
                <button 
                    onClick={toggleAudio}
                    className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-emerald-600 text-white' : 'hover:bg-slate-700'}`}
                    title="Ouvir Página"
                >
                    {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors ml-2">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Reader Area (The Kindle Device) */}
        <div className="flex-1 bg-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border-8 border-slate-800 perspective-1000">
            
            {/* The Page */}
            <div className="flex-1 flex overflow-hidden relative bg-[#F5F5DC]">
                {/* Previous Page Shadow/Click area */}
                <div 
                    onClick={() => handlePageChange('prev')}
                    className="absolute left-0 top-0 bottom-0 w-16 z-10 hover:bg-gradient-to-r from-black/5 to-transparent cursor-pointer flex items-center justify-center group"
                >
                    <ChevronLeft size={32} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* The Paper Content */}
                <div className={`flex-1 p-8 sm:p-12 overflow-y-auto custom-scrollbar transition-all duration-300 transform origin-left
                    ${isFlipping 
                        ? (flipDirection === 'next' ? 'opacity-0 -translate-x-10 rotate-y-12 scale-95' : 'opacity-0 translate-x-10 -rotate-y-12 scale-95') 
                        : 'opacity-100 translate-x-0 rotate-y-0 scale-100'}
                `}>
                    <div className="max-w-2xl mx-auto h-full flex flex-col">
                        {/* Page Header */}
                        <div className="text-center text-[10px] text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-300 pb-2">
                            {book.title} • {currentChapter}
                        </div>

                        {/* Page Text */}
                        <div className="font-serif text-slate-800 text-lg leading-relaxed whitespace-pre-wrap flex-1">
                            {pages[currentPage]}
                        </div>

                        {/* Page Footer */}
                        <div className="text-center text-xs text-slate-400 mt-6 pt-2 border-t border-slate-300 flex justify-between">
                             <span>{(currentPage / pages.length * 100).toFixed(0)}%</span>
                             <span>Página {currentPage + 1} de {pages.length}</span>
                        </div>
                    </div>
                </div>

                {/* Next Page Shadow/Click area */}
                <div 
                    onClick={() => handlePageChange('next')}
                    className="absolute right-0 top-0 bottom-0 w-16 z-10 hover:bg-gradient-to-l from-black/5 to-transparent cursor-pointer flex items-center justify-center group"
                >
                     <ChevronRight size={32} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

        </div>

        {/* Progress Bar Bottom */}
        <div className="mt-4 px-2">
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="bg-emerald-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
                />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Início</span>
                <span>Fim</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default BookReader;