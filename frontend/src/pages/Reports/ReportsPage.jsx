import { useState } from 'react';
import { FileBarChart, Download, Calendar, Layers, TrendingUp, Cpu, ShieldCheck } from 'lucide-react';

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('This Month');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileBarChart className="h-7 w-7 text-brand-600" />
            Reports & Insights
          </h1>
          <p className="text-slate-500 mt-1">System throughput, extraction accuracy, and lab audit reports</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm">
            <Calendar className="h-4 w-4 text-slate-400" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent focus:outline-none text-sm font-medium"
            >
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>Last Quarter</option>
            </select>
          </div>
          <button className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2 text-sm shadow-sm">
            <Download className="h-4 w-4" />
            Export Executive PDF
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Extractions Processed</span>
            <Layers className="h-4 w-4 text-brand-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">1,248</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">↑ +14.2% vs previous period</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>OCR Field Accuracy</span>
            <Cpu className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">98.4%</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">High confidence extraction</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Verification Throughput</span>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">99.1%</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Verified by lab staff</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Avg. Processing Speed</span>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">1.8s</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">↓ 0.4s faster per doc</span>
        </div>
      </div>

      {/* Reports Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Document Type Distribution</h3>
              <span className="text-xs font-medium text-slate-500">Total 1,248 Docs</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-slate-700">Complete Blood Counts (CBC)</span>
                  <span className="text-slate-900 font-bold">540 (43%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-brand-500 h-full rounded-full" style={{ width: '43%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-slate-700">Comprehensive Metabolic Panels (CMP)</span>
                  <span className="text-slate-900 font-bold">380 (30%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-slate-700">Lipid Panels</span>
                  <span className="text-slate-900 font-bold">210 (17%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '17%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-slate-700">Thyroid & Endocrinology Reports</span>
                  <span className="text-slate-900 font-bold">118 (10%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Deterministic Range Flags</h3>
              <span className="text-xs font-medium text-slate-500">{timeRange} Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-2xl font-extrabold text-rose-600">14.8%</p>
                <p className="text-xs font-medium text-slate-500 mt-1">High Flag Rate</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-2xl font-extrabold text-amber-600">8.3%</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Low Flag Rate</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-600 leading-relaxed">
              <strong>Module B Compliance Note:</strong> All numerical flags are evaluated deterministically against structured range tables without LLM involvement.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
