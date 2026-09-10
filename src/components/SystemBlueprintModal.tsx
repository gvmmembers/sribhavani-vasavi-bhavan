import React, { useState } from 'react';
import { usePMS } from '../context/PMSContext';
import {
  SQL_SCHEMA_POSTGRES,
  SQL_SCHEMA_SQLITE,
  BACKEND_API_SPECIFICATION,
} from '../data/schemaAndApiDocs';
import { X, Copy, Check, Database, Server, FileCode, CheckCircle2 } from 'lucide-react';

export const SystemBlueprintModal: React.FC = () => {
  const { isBlueprintOpen, setIsBlueprintOpen } = usePMS();
  const [activeTab, setActiveTab] = useState<'postgres' | 'sqlite' | 'api'>('postgres');
  const [copied, setCopied] = useState(false);

  if (!isBlueprintOpen) return null;

  const currentContent =
    activeTab === 'postgres'
      ? SQL_SCHEMA_POSTGRES
      : activeTab === 'sqlite'
      ? SQL_SCHEMA_SQLITE
      : BACKEND_API_SPECIFICATION;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="modal-blueprint-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={() => setIsBlueprintOpen(false)}
    >
      <div
        id="modal-blueprint-content"
        className="bg-stone-900 rounded-2xl max-w-4xl w-full border border-stone-800 shadow-2xl overflow-hidden my-4 text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-stone-800 bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Technical Architecture Blueprint & Specs
              </h2>
              <p className="text-xs text-stone-400">
                PostgreSQL Schema DDL, SQLite Scripts & Express REST API Endpoints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-blueprint"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Script
                </>
              )}
            </button>

            <button
              onClick={() => setIsBlueprintOpen(false)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-800 px-6 bg-stone-900/90 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('postgres')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'postgres'
                ? 'border-amber-500 text-amber-400 bg-stone-800/60'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database className="w-4 h-4" />
            PostgreSQL DDL (Deliverable 1)
          </button>

          <button
            onClick={() => setActiveTab('sqlite')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sqlite'
                ? 'border-amber-500 text-amber-400 bg-stone-800/60'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            SQLite DDL Script
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'api'
                ? 'border-amber-500 text-amber-400 bg-stone-800/60'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Server className="w-4 h-4" />
            REST API Specification (Deliverable 2)
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto bg-stone-950">
          <pre className="text-xs font-mono text-stone-300 whitespace-pre-wrap leading-relaxed">
            {currentContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>Production-grade primary & foreign key constraints, indexes, and transaction isolation.</span>
          <button
            onClick={() => setIsBlueprintOpen(false)}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
