import React, { useState } from 'react';
import Layout from '../components/Layout';

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
      case 'critical': return 'bg-red-900/30 text-red-400 border border-red-700';
      case 'high': return 'bg-orange-900/30 text-orange-400 border border-orange-700';
      case 'medium': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700';
      default: return 'bg-green-900/30 text-green-400 border border-green-700';
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-gray-900/60 border border-gray-800 rounded-2xl p-8 text-white mt-6 shadow-2xl">
      <div className="mb-6 flex justify-between items-center border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-[#00D4FF] flex items-center gap-2">
          🩺 AI-Assisted Symptom Checker
        </h1>
        <div className="text-sm text-gray-500">
          Step {step} of 4
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 text-red-400 rounded-lg text-sm mb-6">
          ⚠️ {error}
        </div>
      )}

      {/* STEP 1: REGION SELECTOR */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-300">Select Your Current Location</h2>
          <p className="text-sm text-gray-500">
            Anonymized region logs help our clustering algorithm map outbreak trends locally.
          </p>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#00D4FF]"
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 bg-[#00D4FF] hover:bg-cyan-400 text-black font-semibold rounded-lg transition"
            >
              Next: Select Symptoms
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SYMPTOM SELECTOR */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-300">Select Any Experienced Symptoms</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {SYMPTOMS.map(s => {
              const isSelected = selectedSymptoms.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSymptom(s.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition duration-200 ${
                    isSelected 
                      ? 'bg-[#00D4FF]/10 border-[#00D4FF] text-white shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
                      : 'bg-gray-800/40 border-gray-700 hover:border-gray-600 text-gray-400'
                  }`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-800">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-400 rounded-lg transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedSymptoms.length === 0}
              className="px-6 py-2.5 bg-[#00D4FF] hover:bg-cyan-400 text-black font-semibold rounded-lg transition disabled:opacity-50"
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
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Rate Symptom Severity</h2>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>1 - Very Mild</span>
              <span>3 - Moderate</span>
              <span>5 - Severe / Unbearable</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00D4FF]"
            />
            <div className="text-center font-bold text-xl mt-2 text-[#00D4FF]">{severity}</div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Select Age Group</h2>
            <div className="flex flex-wrap gap-3">
              {AGE_GROUPS.map(ag => (
                <button
                  key={ag}
                  onClick={() => setAgeGroup(ag)}
                  className={`px-5 py-2 rounded-lg border text-sm font-medium transition ${
                    ageGroup === ag 
                      ? 'bg-[#00D4FF] border-[#00D4FF] text-black font-semibold' 
                      : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-800">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-400 rounded-lg transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 bg-[#00D4FF] hover:bg-cyan-400 text-black font-bold rounded-lg transition shadow-[0_0_20px_rgba(0,212,255,0.4)]"
            >
              {submitting ? 'Analyzing & Reporting...' : 'Analyze Symptoms'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RESULTS DISPLAY */}
      {step === 4 && result && (
        <div className="space-y-6">
          <div className="p-6 bg-gray-800/40 rounded-xl border border-gray-700 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xs text-gray-500 uppercase tracking-widest">Likely Prognosis</h2>
                <p className="text-2xl font-black text-white">{result.estimated_disease}</p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getRiskBadgeColor(result.risk_level)}`}>
                Risk: {result.risk_level}
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-400 mb-1">Classifier Confidence</p>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#00D4FF] h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
              <p className="text-right text-xs text-gray-500 mt-1">{(result.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>

          <div className="p-5 bg-blue-900/10 border border-blue-800/50 rounded-xl">
            <h3 className="font-semibold text-[#00D4FF] mb-2">🏥 Health Action Recommendation</h3>
            <p className="text-sm text-gray-300">
              Based on severity rating ({severity}/5) and estimated symptoms, we recommend consulting a local clinician for definitive diagnosis.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-800">
            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-400 rounded-lg transition"
            >
              Check Again
            </button>
            <a
              href="https://www.who.int"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 bg-[#00D4FF] hover:bg-cyan-400 text-black font-semibold rounded-lg text-center transition"
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
