import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';

export default function SkillCharts({ candidates = [], jobRequirements = [] }) {
  
  // 1. Compute Match Score Distribution Data
  const getDistributionData = () => {
    const buckets = {
      '80-100% (Elite)': 0,
      '70-79% (Strong)': 0,
      '50-69% (Average)': 0,
      '0-49% (Low Match)': 0,
    };

    candidates.forEach(c => {
      const score = c.match_percentage;
      if (score >= 80) buckets['80-100% (Elite)']++;
      else if (score >= 70) buckets['70-79% (Strong)']++;
      else if (score >= 50) buckets['50-69% (Average)']++;
      else buckets['0-49% (Low Match)']++;
    });

    return Object.keys(buckets).map(key => ({
      range: key,
      count: buckets[key]
    }));
  };

  // 2. Compute Common Skills Frequency in this list
  const getSkillsFrequencyData = () => {
    const counts = {};
    candidates.forEach(c => {
      c.skills.forEach(skill => {
        const lowerSkill = skill.toLowerCase();
        counts[lowerSkill] = (counts[lowerSkill] || 0) + 1;
      });
    });

    // Convert, sort, and slice top 7
    return Object.keys(counts)
      .map(name => ({
        skill: name.charAt(0).toUpperCase() + name.slice(1),
        frequency: counts[name]
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 7);
  };

  // 3. Compute Gap Analysis: JD Requirements vs Candidate Presence
  const getGapAnalysisData = () => {
    if (!jobRequirements || jobRequirements.length === 0) {
      return [
        { skill: 'Python', required: 100, candidates: 75 },
        { skill: 'React', required: 100, candidates: 50 },
        { skill: 'FastAPI', required: 100, candidates: 33 },
        { skill: 'SQL', required: 100, candidates: 80 }
      ];
    }

    return jobRequirements.slice(0, 6).map(req => {
      const lowerReq = req.toLowerCase();
      let matchedCount = 0;
      
      candidates.forEach(c => {
        if (c.skills.map(s => s.toLowerCase()).includes(lowerReq)) {
          matchedCount++;
        }
      });

      const presencePercent = candidates.length > 0 
        ? Math.round((matchedCount / candidates.length) * 100) 
        : 0;

      return {
        skill: req.charAt(0).toUpperCase() + req.slice(1),
        'JD Requirement': 100,
        'Pool Competency (%)': presencePercent
      };
    });
  };

  const distData = getDistributionData();
  const freqData = getSkillsFrequencyData();
  const gapData = getGapAnalysisData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-xl shadow-xl text-xs font-semibold">
          <p className="text-white mb-1">{label}</p>
          {payload.map((pld, idx) => (
            <p key={idx} style={{ color: pld.color || pld.fill }}>
              {pld.name}: {pld.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-8">
      {/* 1. Skill Gap Analysis */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-white mb-1">Requirement Skill Gap Analysis</h3>
          <p className="text-xs text-slate-400 mb-4">Required skills vs candidate pool expertise indices</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gapData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
              <Bar dataKey="JD Requirement" fill="rgba(99, 102, 241, 0.2)" name="Target Fit" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pool Competency (%)" fill="#06b6d4" name="Pool Score" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Candidate Matching Score Curves */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-white mb-1">Match Quality Curve</h3>
          <p className="text-xs text-slate-400 mb-4">Candidate volume counts grouped by ranking buckets</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={distData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 9 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#scoreColor)" name="Candidates" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Top Pool Skills */}
      {freqData.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Talent Pool Core Competencies</h3>
            <p className="text-xs text-slate-400 mb-4">Most prevalent technical expertise across all candidate files</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis type="category" dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="frequency" fill="#d946ef" name="Candidate Count" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
