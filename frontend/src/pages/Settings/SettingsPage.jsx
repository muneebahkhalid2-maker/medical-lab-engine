import { useState } from 'react';
import { Settings, Save, Shield, Database, Bell, Cpu, Check } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('AI');
  const [mockAi, setMockAi] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-7 w-7 text-brand-600" />
            System Settings
          </h1>
          <p className="text-slate-500 mt-1">Configure extraction parameters, determinism bounds, and user preferences</p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-semibold border border-emerald-200 animate-in fade-in">
            <Check className="h-4 w-4" /> Settings Saved!
          </div>
        )}
      </div>

      <div className="flex border-b border-slate-200 gap-4">
        {['AI & Processing', 'Deterministic Ranges', 'Notifications', 'Account Profile'].map((tab, idx) => {
          const tabKey = ['AI', 'Ranges', 'Notifications', 'Profile'][idx];
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
                isActive 
                  ? 'border-brand-600 text-brand-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === 'AI' && (
          <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-brand-600" />
              Module A Extraction Configuration
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                <div>
                  <label className="text-sm font-bold text-slate-900 block">Enable Mock OCR / AI Engine</label>
                  <p className="text-xs text-slate-500 mt-0.5">Use local deterministic mock extraction provider when offline</p>
                </div>
                <input 
                  type="checkbox"
                  checked={mockAi}
                  onChange={(e) => setMockAi(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-900">Minimum AI Confidence Threshold</label>
                  <span className="text-sm font-extrabold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                    {confidenceThreshold}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="99" 
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <p className="text-xs text-slate-500">Fields extracted below this threshold will automatically flag for verification queue.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Ranges' && (
          <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-brand-600" />
              Module B Reference Ranges Database
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Numerical reference boundaries used by deterministic comparison rules to evaluate parameter status (NORMAL, LOW, HIGH).
            </p>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="p-3 bg-slate-50 font-medium text-xs text-slate-500 uppercase flex justify-between">
                <span>Parameter Name</span>
                <span>Male Standard Range</span>
                <span>Female Standard Range</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs p-3 space-y-2">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Hemoglobin (HGB)</span>
                  <span>13.5 - 17.5 g/dL</span>
                  <span>12.0 - 15.5 g/dL</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>WBC Count</span>
                  <span>4.5 - 11.0 x10^3 / µL</span>
                  <span>4.5 - 11.0 x10^3 / µL</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Fasting Glucose</span>
                  <span>70 - 99 mg/dL</span>
                  <span>70 - 99 mg/dL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Notifications' && (
          <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-600" />
              Notification Settings
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-brand-600" />
                Notify on pending verification queue items
              </label>
              <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-brand-600" />
                Notify when high laboratory risk flags occur
              </label>
            </div>
          </div>
        )}

        {activeTab === 'Profile' && (
          <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-600" />
              User Profile
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Full Name</label>
                <input type="text" defaultValue="Dr. Smith" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Role</label>
                <input type="text" defaultValue="Doctor" readOnly className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-slate-100 text-slate-500" />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-md">
            <Save className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
