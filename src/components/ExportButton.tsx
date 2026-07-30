import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileJson, Printer, Check } from 'lucide-react';

interface ExportButtonProps {
  data: Record<string, any>[];
  filename?: string;
  title?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename = 'analytics-export',
  title = 'Export Data',
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            const val = row[fieldName] ?? '';
            const escape = ('' + val).replace(/"/g, '""');
            return `"${escape}"`;
          })
          .join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOpen(false);
  };

  const downloadJSON = () => {
    if (!data || data.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `${filename}-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOpen(false);
  };

  const handlePrintPDF = () => {
    window.print();
    setOpen(false);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="export-dropdown-btn"
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        title="Export dataset"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span>Export</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl z-50 overflow-hidden py-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
            {title} ({data.length} records)
          </div>

          <button
            onClick={downloadCSV}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center space-x-2 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={downloadJSON}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center space-x-2 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5 text-sky-400" />
            <span>Download JSON</span>
          </button>

          <button
            onClick={handleCopyJSON}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center space-x-2 transition-colors border-t border-zinc-800/80"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <FileJson className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Raw JSON'}</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center space-x-2 transition-colors border-t border-zinc-800/80"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Report / Save PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};
