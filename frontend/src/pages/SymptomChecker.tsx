import React, { useState } from 'react';

const CITIES = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Jaipur", "Lucknow", "Bhopal"];
const AGE_GROUPS = ["0-17", "18-25", "26-45", "46-65", "65+"];

const SYMPTOMS = [
  { id: 'fever', label: 'Fever', icon: '🌡️' },
  { id: 'joint pain', label: 'Joint Pain', icon: '🦴' },
  { id: 'rash', label: 'Skin Rash', icon: '🔴' },
  { id: 'chills', label: 'Chills', icon: '🥶' },
  { id: 'sweating', label: 'Sweating', icon: '💦' },
  { id: 'diarrhea', label: 'Diarrhea', icon: '🤢' },
  { id: 'vomiting', label: 'Vomiting', icon: '🤮' },
  { id: 'abdominal cramps', label: 'Stomach Cramps', icon: '😣' },
  { id: 'cough', label: 'Dry/Wet Cough', icon: '😷' },
  { id: 'sore throat', label: 'Sore Throat', icon: '🗣️' },
  { id: 'runny nose', label: 'Runny Nose', icon: '👃' },
  { id: 'headache', label: 'Severe Headache', icon: '💆' },
  { id: 'fatigue', label: 'Extreme Fatigue', icon: '🥱' },
  { id: 'nausea', label: 'Nausea', icon: '🤢' },
  { id: 'muscle ache', label: 'Muscle Aches', icon: '💪' },
  { id: 'shortness of breath', label: 'Breathing Difficulty', icon: '🫁' },
  { id: 'loss of taste', label: 'Loss of Taste', icon: '👅' },
  { id: 'loss of smell', label: 'Loss of Smell', icon: '👃' },
  { id: 'shivering', label: 'Shivering', icon: '🥶' },
  { id: 'dehydration', label: 'Dehydration', icon: '🥤' }
];

const SymptomChecker: React.FC = () => {
  const [step, setStep] = useState(1);
  const [region, setRegion] = useState(CITIES[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(3);
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[2]);
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch('http://localhost:8000/api/symptoms/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region,
          symptoms: selectedSymptoms,
          severity,
          age_group: ageGroup
        })
      });

      if (!resp.ok) throw new Error('Submission failed');
      const data = await resp.json();
      setResult(data);
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSymptoms([]);
    setSeverity(3);
    setAgeGroup(AGE_GROUPS[2]);
    setResult(null);
    setStep(1);
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-red-950/40 text-red-400 border border-red-700';
      case 'high': return 'bg-orange-950/40 text-orange-400 border border-orange-700';
      case 'medium': return 'bg-yellow-950/40 text-yellow-400 border border-yellow-700';
      default: return 'bg-emerald-950/40 text-emerald-400 border border-emerald-700';
    }
  };

  return (
    <div className="max-w-3xl mx-auto glass-panel p-8 rounded-2xl text-white mt-6 shadow-2xl relative overflow-hidden">
      {/* Dynamic ambient orb behind */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00D4FF]/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="mb-8 flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            🩺 AI-Assisted Symptom Checker
          </h1>
          <p className="text-xs text-white/40 mt-1">Autonomous disease mapping and cluster tracking.</p>
        </div>
        <span className="text-xs font-bold tracking-widest text-[#00D4FF] uppercase bg-[#00D4FF]/10 px-2.5 py-1 rounded-xl">
          Step {step} of 4
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-800 text-red-400 rounded-xl text-xs mb-6 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* STEP 1: REGION SELECTOR */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white tracking-wide">Select Your Current Location</h2>
          <p className="text-xs text-white/50 leading-relaxed">
            Anonymized region logs help our clustering algorithm map outbreak trends locally. No personal identifiers are saved.
          </p>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-gray-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition"
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 bg-gradient-to-r from-[#00D4FF] to-blue-500 hover:opacity-90 text-black font-bold rounded-xl transition shadow-[0_0_15px_rgba(0,212,255,0.3)] transform active:scale-95"
            >
              Next: Select Symptoms
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SYMPTOM SELECTOR */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white tracking-wide">Select Any Experienced Symptoms</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-1">
            {SYMPTOMS.map(s => {
              const isSelected = selectedSymptoms.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSymptom(s.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 ${
                    isSelected 
                      ? 'bg-gradient-to-tr from-[#00D4FF]/25 to-blue-500/5 border-[#00D4FF] text-white shadow-[0_0_15px_rgba(0,212,255,0.15)] font-semibold' 
                      : 'bg-gray-900/50 border-white/5 hover:border-white/20 text-white/60 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs font-medium tracking-wide">{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-8 pt-4 border-t border-white/5">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedSymptoms.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-[#00D4FF] to-blue-500 hover:opacity-90 text-black font-bold rounded-xl transition disabled:opacity-50 shadow-[0_0_15px_rgba(0,212,255,0.2)]"
            >
              Next: Severity & Age
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SEVERITY SLIDER & AGE GROUP */}
      {step === 3 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-white mb-2 tracking-wide">Rate Symptom Severity</h2>
            <div className="flex justify-between text-[10px] text-white/40 mb-2 font-semibold tracking-wider">
              <span>1 - MILD</span>
              <span>3 - MODERATE</span>
              <span>5 - SEVERE</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-950 rounded-xl appearance-none cursor-pointer accent-[#00D4FF]"
            />
            <div className="text-center font-bold text-2xl mt-4 text-[#00D4FF] tech-num neon-glow-cyan">{severity}</div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-4 tracking-wide">Select Age Group</h2>
            <div className="flex flex-wrap gap-3">
              {AGE_GROUPS.map(ag => (
                <button
                  key={ag}
                  onClick={() => setAgeGroup(ag)}
                  className={`px-5 py-2.5 rounded-xl border text-xs font-semibold tracking-wider transition duration-300 transform active:scale-95 ${
                    ageGroup === ag 
                      ? 'bg-[#00D4FF] border-[#00D4FF] text-black shadow-[0_0_15px_rgba(0,212,255,0.25)]' 
                      : 'bg-gray-900/50 border-white/5 text-white/50 hover:border-white/20'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-white/5">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 bg-gradient-to-r from-[#00D4FF] to-blue-500 hover:opacity-90 text-black font-black rounded-xl transition shadow-[0_0_20px_rgba(0,212,255,0.3)] transform active:scale-95"
            >
              {submitting ? 'Analyzing & Reporting...' : 'Analyze Symptoms'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RESULTS DISPLAY */}
      {step === 4 && result && (
        <div className="space-y-6">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Likely Prognosis</h2>
                <p className="text-2xl font-black text-white mt-1">{result.estimated_disease}</p>
              </div>
              <div className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${getRiskBadgeColor(result.risk_level)}`}>
                Risk: {result.risk_level}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <p className="text-xs text-white/40 mb-2 font-semibold">CLASSIFIER CONFIDENCE</p>
              <div className="w-full bg-gray-950 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#00D4FF] to-blue-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
              <p className="text-right text-xs text-[#00D4FF] font-bold mt-1.5 tech-num">{(result.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-blue-950/20 to-blue-950/0 border border-blue-800/20 rounded-2xl">
            <h3 className="font-bold text-[#00D4FF] mb-2 text-sm uppercase tracking-wide">🏥 Health Action Recommendation</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Based on severity rating ({severity}/5) and estimated symptoms, we recommend consulting a local clinician for definitive diagnosis.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-white/5">
            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl transition"
            >
              Check Again
            </button>
            <a
              href="https://www.who.int"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 bg-gradient-to-r from-[#00D4FF] to-blue-500 hover:opacity-90 text-black font-bold rounded-xl text-center transition"
            >
              View Public Health Advisory
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
