import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const CloudLab = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState([
    '>>> Python 3.11.8 (Interactive Engineering Sandbox)',
    '>>> Loading structural matrix simulator...',
    '>>> Status: Ready for execution.'
  ]);

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput(prev => [...prev, '>>> Executing load_analysis.py...']);
    setTimeout(() => {
      setOutput(prev => [
        ...prev,
        '✔ Convergence test: PASSED (Tolerance: 0.0001)',
        '✔ Maximum Shear Stress: 142.6 MPa (Safe Limit: 250 MPa)',
        '✔ Dynamic factor validated. All constraints satisfied.'
      ]);
      setIsRunning(false);
    }, 700);
  };

  return (
    <section className="w-full bg-[#FAF7F2] dark:bg-gray-900 py-24 px-4 md:px-8 transition-colors" dir={dir}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-[2.5rem] p-6 sm:p-10 lg:p-14 text-dark dark:text-white shadow-sm relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
            {/* Interactive Code Editor (7 cols) */}
            <div className="lg:col-span-7 bg-[#1a1714] border border-[#332c25] rounded-2xl overflow-hidden shadow-xl font-mono text-xs sm:text-sm">
              {/* Window Header */}
              <div className="bg-[#24201c] px-4 py-3 border-b border-[#332c25] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                  <span className="ms-3 text-stone-300 font-sans text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">code</span>
                    structural_sim.py
                  </span>
                </div>
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="bg-primary hover:bg-secondary text-[#12100e] font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isRunning ? 'hourglass_top' : 'play_arrow'}
                  </span>
                  <span>{isRunning ? t('homeNew.labRunning') : t('homeNew.labRun')}</span>
                </button>
              </div>

              {/* Code Snippet */}
              <div className="p-4 sm:p-5 text-stone-300 space-y-1.5 overflow-x-auto leading-relaxed bg-[#151210]" dir="ltr">
                <p><span className="text-rose-400">import</span> numpy <span className="text-rose-400">as</span> np</p>
                <p><span className="text-rose-400">from</span> academy.simulation <span className="text-rose-400">import</span> LoadVector, FEAEngine</p>
                <p className="text-stone-500"># 1. Define physical constraints and loads</p>
                <p>beam = FEAEngine.create_cantilever(length=<span className="text-amber-300">12.5</span>, modulus=<span className="text-amber-300">210e9</span>)</p>
                <p>loads = [LoadVector(point=<span className="text-amber-300">6.0</span>, force=<span className="text-amber-300">-45000</span>)]</p>
                <p className="text-stone-500"># 2. Run stress convergence analysis</p>
                <p>result = beam.solve_stress_distribution(loads=loads)</p>
                <p><span className="text-primary">print</span>(f<span className="text-emerald-300">{'"Convergence: {result.is_converged} | Safety Factor: {result.sf}"'}</span>)</p>
              </div>

              {/* Terminal Output */}
              <div className="bg-[#0e0c0b] p-4 border-t border-[#2a241f] text-[11px] sm:text-xs text-stone-400" dir="ltr">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e1915] text-stone-500 uppercase tracking-widest text-[10px]">
                  <span>{t('homeNew.labOutputTitle')}</span>
                  <span className="text-emerald-400">● LIVE</span>
                </div>
                {output.map((line, idx) => (
                  <p key={idx} className={line.startsWith('✔') ? 'text-emerald-400 font-bold' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Information & Feature bullets (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
              <span className="self-start px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-secondary text-xs font-bold">
                {t('homeNew.labBadge')}
              </span>

              <h2 className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl font-extrabold text-dark dark:text-white leading-tight">
                {t('homeNew.labTitle')}
              </h2>

              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                {t('homeNew.labSubtitle')}
              </p>

              <div className="space-y-3.5 pt-2">
                {[
                  t('homeNew.labCheck1'),
                  t('homeNew.labCheck2'),
                  t('homeNew.labCheck3'),
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-3">
                <Link
                  to="/virtual-lab"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl transition-all shadow-md hover:-translate-y-0.5"
                >
                  <span>{t('homeNew.labBtn')}</span>
                  <span className="material-symbols-outlined text-lg">
                    {isRtl ? 'arrow_back' : 'arrow_forward'}
                  </span>
                </Link>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20">
                  {isRtl ? 'قريباً (Coming Soon)' : 'Coming Soon'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CloudLab;
