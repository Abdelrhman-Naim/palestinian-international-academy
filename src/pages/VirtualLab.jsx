import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomSelect from '../components/CustomSelect';
import { useLanguage } from '../context/LanguageContext';

const VirtualLab = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    field: 'civil',
    notes: ''
  });

  const fieldOptions = [
    { value: 'civil', label: isRtl ? 'الهندسة المدنية والإنشائية' : 'Civil & Structural Eng' },
    { value: 'mechanical', label: isRtl ? 'الهندسة الميكانيكية والتحليل' : 'Mechanical Eng & FEA' },
    { value: 'electrical', label: isRtl ? 'الهندسة الكهربائية والأنظمة' : 'Electrical Systems Eng' },
    { value: 'software', label: isRtl ? 'برمجة البرمجيات الهندسية' : 'Engineering Software Dev' },
    { value: 'other', label: isRtl ? 'تخصص آخر' : 'Other Field' }
  ];

  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  // Terminal simulator state
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState([
    '>>> PIA Cloud Simulation Node v2.4',
    '>>> Initializing FEA structural mesh solver...',
    '>>> Status: Pre-Alpha Cloud Sandbox Ready.'
  ]);

  const handleRunSimulation = () => {
    setIsRunning(true);
    setOutput(prev => [...prev, '>>> Running structural_cantilever.py test execution...']);
    setTimeout(() => {
      setOutput(prev => [
        ...prev,
        '✔ Mesh density: 10,000 elements converged.',
        '✔ Maximum Bending Moment: 185.4 kN·m (Safe limit).',
        '✔ Virtual Cloud Engine test completed successfully.'
      ]);
      setIsRunning(false);
    }, 750);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRegistered(true);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased overflow-x-hidden transition-colors" dir={dir}>
      <Navbar />

      <main className="grow">
        {/* Coming Soon Hero Banner */}
        <section className="relative bg-[#FAF7F2] dark:bg-gray-900 pt-20 pb-20 px-4 sm:px-6 md:px-8 border-b border-[#E8E2D5] dark:border-gray-800 transition-colors overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Coming Soon Badge */}
            <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps mb-4">
              {isRtl ? 'المعمل الافتراضي السحابي' : 'Virtual Cloud Laboratory'}
            </span>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              <span className="block text-dark dark:text-white mb-2">
                {isRtl ? 'بيئة المحاكاة والتطبيق الهندسي' : 'Cloud Engineering Simulation &'}
              </span>
              <span className="bg-linear-to-r from-[#e5be53] via-primary to-[#b38b22] bg-clip-text text-transparent">
                {isRtl ? 'المعمل الافتراضي السحابي' : 'Virtual Cloud Laboratory'}
              </span>
            </h1>

            <p className="max-w-3xl mx-auto text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed mb-8">
              {isRtl
                ? 'نعمل حالياً على إطلاق أول معمل هندسي افتراضي سحابي يتيح للمتدربين إجراء المحاكاة وتطبيق المشاريع الهندسية الضخمة مباشرة عبر المتصفح باستخدام أفضل أدوات التحليل.'
                : 'We are currently launching a cloud engineering sandbox for real-time FEA simulation and project testing directly inside your browser.'}
            </p>
          </div>
        </section>

        {/* Interactive Lab Preview Sandbox */}
        <section className="py-12 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
          <div className="bg-[#181512] border border-[#332c25] rounded-3xl overflow-hidden shadow-2xl font-mono text-xs sm:text-sm">
            {/* Terminal Header */}
            <div className="bg-[#24201c] px-5 py-3 border-b border-[#332c25] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="ms-3 text-stone-300 font-sans text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">biotech</span>
                  PIA_Virtual_Sandbox_Preview.py
                </span>
              </div>
              <button
                onClick={handleRunSimulation}
                disabled={isRunning}
                className="bg-primary hover:bg-secondary text-dark font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">
                  {isRunning ? 'hourglass_top' : 'play_arrow'}
                </span>
                <span>{isRunning ? (isRtl ? 'جاري الاختبار...' : 'Testing...') : (isRtl ? 'تشغيل نموذج المحاكاة' : 'Run Demo Simulation')}</span>
              </button>
            </div>

            {/* Code */}
            <div className="p-5 text-stone-300 space-y-1.5 overflow-x-auto leading-relaxed bg-[#13110f]" dir="ltr">
              <p><span className="text-rose-400">import</span> edu_cloud_lab <span className="text-rose-400">as</span> lab</p>
              <p className="text-stone-500"># 1. Initialize cloud virtual solver node</p>
              <p>solver = lab.FEASolver(mesh_resolution=<span className="text-amber-300">0.005</span>, material=<span className="text-emerald-300">"Structural Steel"</span>)</p>
              <p>solver.apply_load(point=[<span className="text-amber-300">10.0, 2.5, 0.0</span>], vector=[<span className="text-amber-300">0, -150000, 0</span>])</p>
              <p className="text-stone-500"># 2. Run high-performance finite element simulation</p>
              <p>results = solver.compute_stress_distribution()</p>
              <p><span className="text-primary">print</span>(f<span className="text-emerald-300">{'"Simulation Passed: Safety Factor = {results.safety_factor}"'}</span>)</p>
            </div>

            {/* Console Output */}
            <div className="bg-[#0b0a09] p-4 border-t border-[#26201b] text-[11px] sm:text-xs text-stone-400" dir="ltr">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1b1714] text-stone-500 uppercase tracking-widest text-[10px]">
                <span>LAB TERMINAL OUTPUT</span>
                <span className="text-amber-400 font-bold">● PREVIEW MODE</span>
              </div>
              {output.map((line, idx) => (
                <p key={idx} className={line.startsWith('✔') ? 'text-emerald-400 font-bold' : ''}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Interest Registration Form Section */}
        <section className="py-16 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto mb-16">
          <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-6 sm:p-10 shadow-md">
            
            {registered ? (
              <div className="text-center py-10 space-y-5">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-4xl">mark_email_read</span>
                </div>
                <h3 className="text-2xl font-extrabold text-dark dark:text-white">
                  {isRtl ? 'تم تسجيل اهتمامك بنجاح! 🎉' : 'Your Interest Has Been Registered! 🎉'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  {isRtl
                    ? 'شكراً لك! تم تدوين بريدك الإلكتروني بنجاح وسنكون أول من يخطرك ويمنحك الوصول المبكر المجاني فور إطلاق المعمل الافتراضي.'
                    : 'Thank you! We will notify you immediately once the Virtual Cloud Lab goes live for early access.'}
                </p>
                <button
                  onClick={() => setRegistered(false)}
                  className="bg-primary hover:bg-secondary text-dark font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
                >
                  {isRtl ? 'تسجيل بريد آخر' : 'Register Another Email'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center max-w-xl mx-auto mb-6">
                  <span className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 inline-flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-2xl">notifications_active</span>
                  </span>
                  <h3 className="text-2xl font-extrabold text-dark dark:text-white mb-2">
                    {isRtl ? 'احصل على وصول مبكر للمعمل الافتراضي' : 'Get Early Access to Virtual Lab'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                    {isRtl ? 'سجّل اهتمامك ليصلك إشعار فوري وحصري فور إتاحة المعمل للاستخدام.' : 'Register your interest to get priority early access upon public release.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {isRtl ? 'الاسم *' : 'Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder={isRtl ? 'اسمك الكامل' : 'Your name'}
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {isRtl ? 'البريد الإلكتروني *' : 'Email Address *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {isRtl ? 'المجال الهندسي / التخصص' : 'Engineering Specialization'}
                    </label>
                    <CustomSelect
                      options={fieldOptions}
                      value={formData.field}
                      onChange={val => setFormData({ ...formData, field: val })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {isRtl ? 'ملاحظة أو ميزة ترغب بوجودها بالمعمل' : 'Requested Feature / Note'}
                    </label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={isRtl ? 'مثال: محاكاة أبعاد ثلاثية' : 'e.g., 3D FEA simulation'}
                      className="w-full rounded-xl border border-[#E8E2D5] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-900 px-4 py-3 text-sm text-dark dark:text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-bold text-base py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>{isRtl ? 'سجّل اهتمامك واحصل على وصول مبكر' : 'Register Interest for Early Access'}</span>
                      <span className="material-symbols-outlined text-lg rtl:rotate-180">rocket_launch</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VirtualLab;
