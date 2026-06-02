import React, { useState } from 'react';
import WhyThisPrediction from '../components/WhyThisPrediction';

const RiskGauge: React.FC<{ label: string; risk: number; riskCategory: string; factors: string[] }> = ({ label, risk, riskCategory, factors }) => {
  const percentage = Math.round(risk * 100);
  
  let color = 'text-green-400';
  let bg = 'bg-green-400';
  let stroke = '#4ade80';
  
  if (riskCategory === 'Moderate') {
    color = 'text-yellow-400';
    bg = 'bg-yellow-400';
    stroke = '#facc15';
  } else if (riskCategory === 'High') {
    color = 'text-red-400';
    bg = 'bg-red-400';
    stroke = '#f87171';
  }

  const radius = 50;
  const circumference = radius * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center">
      <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-4">{label}</h3>
      
      {/* Semicircle Gauge */}
      <div className="relative w-32 h-16 overflow-hidden mb-2">
        <svg className="w-32 h-32 transform -rotate-180" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r={radius}
            fill="none" stroke="#1f2937" strokeWidth="12"
            strokeDasharray={circumference * 2}
            strokeDashoffset={circumference}
          />
          <circle
            cx="60" cy="60" r={radius}
            fill="none" stroke={stroke} strokeWidth="12"
            strokeDasharray={circumference * 2}
            strokeDashoffset={circumference + strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute bottom-0 left-0 w-full text-center">
          <span className={`text-3xl font-black ${color}`}>{percentage}%</span>
        </div>
      </div>
      
      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold bg-opacity-20 ${bg} ${color}`}>
        {riskCategory.toUpperCase()} RISK
      </div>

      {factors.length > 0 && (
        <div className="mt-5 w-full">
          <p className="text-xs text-gray-500 mb-2 font-medium">TOP RISK FACTORS</p>
          <ul className="text-sm text-gray-300 space-y-1">
            {factors.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${bg}`}></span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="w-full mt-4">
        <WhyThisPrediction endpoint="personal-risk" payload={{ condition: label, prediction: percentage, user_data: {} }} />
      </div>
    </div>
  );
};

const PersonalRisk: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    age: 40,
    sex: 'male',
    weight: 75,
    height: 175,
    systolic_bp: 120,
    glucose_level: 95,
    cholesterol: 180,
    smoking: false,
    physical_activity: 1, // 1 is active, 0 is inactive
    family_diabetes: false,
    family_heart: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const calculateRisk = async () => {
    setLoading(true);
    try {
      const formattedData = {
        ...formData,
        age: Number(formData.age),
        weight: Number(formData.weight),
        height: Number(formData.height),
        systolic_bp: Number(formData.systolic_bp),
        glucose_level: Number(formData.glucose_level),
        cholesterol: Number(formData.cholesterol),
      };
      
      const res = await fetch('http://localhost:8000/api/personal/risk-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData)
      });
      
      if (!res.ok) throw new Error("Failed to fetch risk assessment");
      const data = await res.json();
      
      // Save to localStorage for the summary widget to use
      localStorage.setItem('helix_personal_risk', JSON.stringify(data));
      
      setResults(data);
      setStep(5);
    } catch (err) {
      console.error(err);
      alert("Failed to calculate risk.");
    } finally {
      setLoading(false);
    }
  };

  const bmi = (formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">🧬 Personal Risk Prediction</h1>
        <p className="text-gray-400 mt-2">
          AI-driven individualized health forecasting for chronic conditions.
        </p>
      </div>

      {step < 5 && (
        <div className="bg-[#0D1421] border border-gray-800 rounded-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-[#00D4FF]">
              {step === 1 && "Step 1: Basic Information"}
              {step === 2 && "Step 2: Vitals & Lab Results"}
              {step === 3 && "Step 3: Lifestyle Factors"}
              {step === 4 && "Step 4: Family History"}
            </h2>
            <div className="text-sm text-gray-500 font-medium">Step {step} of 4</div>
          </div>
          
          <div className="h-2 w-full bg-gray-800 rounded-full mb-8">
            <div 
              className="h-2 bg-[#00D4FF] rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-6 min-h-[300px]">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00D4FF] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Biological Sex</label>
                  <select name="sex" value={formData.sex} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00D4FF] outline-none">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Weight (kg)</label>
                  <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00D4FF] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Height (cm)</label>
                  <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00D4FF] outline-none" />
                </div>
                <div className="md:col-span-2 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">Calculated BMI: <span className="text-white font-bold text-lg">{bmi}</span></p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Systolic Blood Pressure (mmHg)</label>
                  <input type="number" name="systolic_bp" value={formData.systolic_bp} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00D4FF] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Fasting Glucose (mg/dL)</label>
                  <input type="number" name="glucose_level" value={formData.glucose_level} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00D4FF] outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Total Cholesterol (mg/dL)</label>
                  <input type="number" name="cholesterol" value={formData.cholesterol} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00D4FF] outline-none" />
                </div>
                <p className="text-xs text-gray-500 md:col-span-2 italic">Leave as default if unknown (uses age-adjusted averages).</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="smoking" checked={formData.smoking} onChange={handleChange} className="w-5 h-5 accent-[#00D4FF] bg-gray-900 border-gray-700 rounded" />
                    <span className="text-gray-300">Current or Former Smoker</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Physical Activity Level</label>
                  <select name="physical_activity" value={formData.physical_activity} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00D4FF] outline-none">
                    <option value={1}>Active (Exercise 3+ times a week)</option>
                    <option value={0}>Sedentary (Little to no exercise)</option>
                  </select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <p className="text-gray-400 text-sm mb-4">Check any conditions that immediate family members (parents, siblings) have been diagnosed with:</p>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition">
                    <input type="checkbox" name="family_diabetes" checked={formData.family_diabetes} onChange={handleChange} className="w-5 h-5 accent-[#00D4FF] rounded" />
                    <span className="text-gray-300 font-medium">Type 2 Diabetes</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition">
                    <input type="checkbox" name="family_heart" checked={formData.family_heart} onChange={handleChange} className="w-5 h-5 accent-[#00D4FF] rounded" />
                    <span className="text-gray-300 font-medium">Heart Disease or Stroke</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between pt-6 border-t border-gray-800">
            <button 
              onClick={() => setStep(s => Math.max(1, s - 1))} 
              className={`px-6 py-2 rounded-lg text-sm font-medium ${step === 1 ? 'opacity-0 cursor-default' : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition'}`}
              disabled={step === 1}
            >
              Back
            </button>
            
            {step < 4 ? (
              <button 
                onClick={() => setStep(s => s + 1)} 
                className="px-6 py-2 bg-[#00D4FF] text-black rounded-lg text-sm font-bold hover:bg-cyan-400 transition"
              >
                Next Step
              </button>
            ) : (
              <button 
                onClick={calculateRisk} 
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-[#00D4FF] to-blue-500 text-black rounded-lg text-sm font-bold hover:opacity-90 transition flex items-center gap-2"
              >
                {loading ? 'Analyzing...' : 'Generate Prediction'}
              </button>
            )}
          </div>
        </div>
      )}

      {step === 5 && results && (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="bg-green-900/20 border border-green-800 p-6 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-2">Analysis Complete</h2>
            <p className="text-gray-300">Your personalized health risk profile has been generated based on current predictive models.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RiskGauge 
              label="Type 2 Diabetes" 
              risk={results.diabetes?.risk_probability || 0} 
              riskCategory={results.diabetes?.risk_category || 'Low'}
              factors={results.diabetes?.risk_category !== 'Low' && formData.family_diabetes ? ['Family History', 'BMI'] : []}
            />
            <RiskGauge 
              label="Heart Disease" 
              risk={results.heart_disease?.risk_probability || 0} 
              riskCategory={results.heart_disease?.risk_category || 'Low'}
              factors={results.heart_disease?.top_3_risk_factors || []}
            />
            <RiskGauge 
              label="Stroke" 
              risk={results.stroke?.risk_probability || 0} 
              riskCategory={results.stroke?.risk_category || 'Low'}
              factors={results.stroke?.risk_category !== 'Low' && formData.systolic_bp > 130 ? ['Blood Pressure'] : []}
            />
          </div>

          <div className="bg-[#0D1421] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Actionable Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                <h4 className="text-[#00D4FF] font-semibold mb-2">Diet & Nutrition</h4>
                <p className="text-sm text-gray-400">Maintain a balanced diet rich in vegetables, lean proteins, and whole grains to help manage BMI and glucose levels.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                <h4 className="text-[#00D4FF] font-semibold mb-2">Physical Activity</h4>
                <p className="text-sm text-gray-400">{formData.physical_activity ? "Great job staying active! Continue your current exercise regimen to maintain cardiovascular health." : "Consider adding 30 minutes of moderate physical activity to your daily routine."}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
               <button onClick={() => { setStep(1); setResults(null); }} className="text-sm text-gray-400 hover:text-white underline">
                 Retake Assessment
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalRisk;
