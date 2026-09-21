import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 antialiased overflow-x-hidden transition-colors" dir={dir}>
      <Navbar />

      <main className="grow">
        {/* ========================================================
            1. HERO SECTION (Harmonious Sand Palette in Light Mode)
        ======================================================== */}
        <section className="relative bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white pt-20 pb-28 px-4 sm:px-6 md:px-8 overflow-hidden border-b border-[#E8E2D5] dark:border-gray-800 transition-colors">
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight md:leading-[1.2] mb-6">
              <span className="block text-dark dark:text-white mb-2">{t('about.heroTitle1')}</span>
              <span className="bg-linear-to-r from-[#e5be53] via-primary to-[#b38b22] bg-clip-text text-transparent">
                {t('about.heroTitle2')}
              </span>
            </h1>

            {/* Subtitle Description */}
            <p className="max-w-3xl mx-auto text-gray-600 dark:text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed mb-10 font-normal">
              {t('about.heroDesc')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-16">
              <Link
                to="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-bold text-base px-8 py-3.5 rounded-xl shadow-[0_10px_25px_-5px_rgba(212,175,55,0.35)] hover:shadow-none hover:-translate-y-0.5 transition-all duration-300"
              >
                <span>{t('about.heroBtnExplore')}</span>
                <span className="material-symbols-outlined text-lg">
                  {isRtl ? 'arrow_back' : 'arrow_forward'}
                </span>
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white dark:bg-gray-800 hover:bg-[#FAF7F2] dark:hover:bg-gray-700 text-dark dark:text-white border border-[#E8E2D5] dark:border-gray-700 font-semibold text-base px-7 py-3.5 rounded-xl shadow-sm transition-all duration-300"
              >
                <span className="material-symbols-outlined text-primary text-xl">play_circle</span>
                <span>{t('about.heroBtnTour')}</span>
              </Link>
            </div>
          </div>
                      {/* Unified 4 Stat Strip Container matching Image 2 - Widened */}
              <div className="flex items-center justify-center">
                <div className="w-4/5 bg-white/95 dark:bg-[#151311] border border-[#E8E2D5] dark:border-[#2C2722] rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { num: t('about.stat1Num'), label: t('about.stat1Label'), sub: t('about.stat1Sub') },
                      { num: t('about.stat2Num'), label: t('about.stat2Label'), sub: t('about.stat2Sub') },
                      { num: t('about.stat3Num'), label: t('about.stat3Label'), sub: t('about.stat3Sub') },
                      { num: t('about.stat4Num'), label: t('about.stat4Label'), sub: t('about.stat4Sub') },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className={`px-4 py-5 sm:py-3 text-center flex flex-col justify-center items-center ${
                          idx !== 0 ? 'border-t lg:border-t-0 lg:border-s border-[#E8E2D5] dark:border-[#2C2722]' : ''
                        } ${
                          idx === 1 ? 'sm:border-s lg:border-s border-[#E8E2D5] dark:border-[#2C2722]' : ''
                        } ${
                          idx === 2 ? 'sm:border-t sm:border-s lg:border-t-0 lg:border-s border-[#E8E2D5] dark:border-[#2C2722]' : ''
                        }`}
                      >
                        <div className="font-stats-number text-3xl sm:text-4xl lg:text-5xl font-black text-dark dark:text-white mb-2 tracking-tight">
                          {stat.num}
                        </div>
                        <div className="text-dark dark:text-white font-extrabold text-sm sm:text-base mb-1.5 leading-snug max-w-55">
                          {stat.label}
                        </div>
                        <div className="text-gray-500 dark:text-stone-400 text-xs leading-relaxed max-w-55">
                          {stat.sub}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
        </section>
        

        {/* ========================================================
            2. STRATEGIC PILLARS (غايتنا وركائز انطلاقنا)
        ======================================================== */}
        <section className="py-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
            {t('about.pillarsLabel')}
          </span>
            <h2 className="font-headline-lg text-2xl sm:text-4xl md:text-5xl font-extrabold text-dark dark:text-white my-4">
              {t('about.pillarsTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
              {t('about.pillarsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: Vision */}
            <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-8 hover-lift shadow-sm flex flex-col justify-between group transition-all duration-300">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] dark:bg-gray-700/60 border border-[#E8E2D5] dark:border-gray-600 text-primary flex items-center justify-center mb-6 shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl">visibility</span>
                </div>
                <span className="text-xs font-bold text-secondary tracking-wide uppercase block mb-1">
                  {t('about.pillar1Tag')}
                </span>
                <h3 className="font-headline-md text-xl sm:text-2xl font-extrabold text-dark dark:text-white mb-4">
                  {t('about.pillar1Title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                  {t('about.pillar1Desc')}
                </p>
              </div>
              <div className="pt-4 border-t border-[#FAF7F2] dark:border-gray-700/60 flex items-center justify-between text-secondary text-sm font-bold">
                <span>{t('about.pillar1Link')}</span>
                <span className="material-symbols-outlined text-base">
                  {isRtl ? 'arrow_back' : 'arrow_forward'}
                </span>
              </div>
            </div>

            {/* Pillar 2: Mission */}
            <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-8 hover-lift shadow-sm flex flex-col justify-between group transition-all duration-300">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] dark:bg-gray-700/60 border border-[#E8E2D5] dark:border-gray-600 text-primary flex items-center justify-center mb-6 shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl">school</span>
                </div>
                <span className="text-xs font-bold text-secondary tracking-wide uppercase block mb-1">
                  {t('about.pillar2Tag')}
                </span>
                <h3 className="font-headline-md text-xl sm:text-2xl font-extrabold text-dark dark:text-white mb-4">
                  {t('about.pillar2Title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                  {t('about.pillar2Desc')}
                </p>
              </div>
              <div className="pt-4 border-t border-[#FAF7F2] dark:border-gray-700/60 flex items-center justify-between text-secondary text-sm font-bold">
                <span>{t('about.pillar2Link')}</span>
                <span className="material-symbols-outlined text-base">
                  {isRtl ? 'arrow_back' : 'arrow_forward'}
                </span>
              </div>
            </div>

            {/* Pillar 3: Promise */}
            <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-8 hover-lift shadow-sm flex flex-col justify-between group transition-all duration-300">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] dark:bg-gray-700/60 border border-[#E8E2D5] dark:border-gray-600 text-primary flex items-center justify-center mb-6 shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl">verified_user</span>
                </div>
                <span className="text-xs font-bold text-secondary tracking-wide uppercase block mb-1">
                  {t('about.pillar3Tag')}
                </span>
                <h3 className="font-headline-md text-xl sm:text-2xl font-extrabold text-dark dark:text-white mb-4">
                  {t('about.pillar3Title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                  {t('about.pillar3Desc')}
                </p>
              </div>
              <div className="pt-4 border-t border-[#FAF7F2] dark:border-gray-700/60 flex items-center justify-between text-secondary text-sm font-bold">
                <span>{t('about.pillar3Link')}</span>
                <span className="material-symbols-outlined text-base">
                  {isRtl ? 'arrow_back' : 'arrow_forward'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            3. PRACTICAL LAB & NATIONAL PROJECTS (من المختبر إلى الواقع)
        ======================================================== */}
        <section className="py-12 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto mb-16">
          <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-[2.5rem] p-8 sm:p-10 lg:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Image Side (6 cols) */}
              <div className="lg:col-span-6 relative group overflow-hidden rounded-2xl border border-[#E8E2D5] dark:border-gray-700 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80"
                  alt="Engineering Laboratory"
                  className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
                {/* Floating Tag inside image */}
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white text-xs sm:text-sm font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></span>
                  <span>{t('about.labImgTag')}</span>
                </div>
              </div>

              {/* Text Side (6 cols) */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                <div className=" text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
                  {t('about.labBadge')}
                </div>
                <h2 className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl font-extrabold text-dark dark:text-white my-4 leading-snug">
                  {t('about.labTitle')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed mb-6">
                  {t('about.labDesc')}
                </p>

                {/* 3 Checkpoints */}
                <div className="space-y-3.5 mb-8">
                  {[
                    t('about.labPoint1'),
                    t('about.labPoint2'),
                    t('about.labPoint3'),
                  ].map((point, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-secondary flex items-center justify-center mt-0.5 shrink-0">
                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                      </div>
                      <span className="text-dark dark:text-gray-200 text-sm sm:text-base font-medium">
                        {point}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/virtual-lab"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl transition-all shadow-md hover:-translate-y-0.5"
                  >
                    <span>{t('about.labBtn')}</span>
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
        </section>

        {/* ========================================================
            4. CORE VALUES SECTION (قيمنا الأساسية)
        ======================================================== */}
        <section className="bg-[#F3EFE6] dark:bg-gray-900/60 border-y border-[#E8E2D5] dark:border-gray-800 py-24 px-4 sm:px-6 md:px-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
              {t('about.valuesBadge')}
              </span>
              <h2 className="font-headline-lg text-2xl sm:text-4xl md:text-5xl font-extrabold text-dark dark:text-white my-4">
                {t('about.valuesTitle')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
                {t('about.valuesSubtitle')}
              </p>
            </div>

            {/* 6 Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: 'verified', title: t('about.val1Title'), desc: t('about.val1Desc'), num: '01' },
                { icon: 'psychology', title: t('about.val2Title'), desc: t('about.val2Desc'), num: '02' },
                { icon: 'construction', title: t('about.val3Title'), desc: t('about.val3Desc'), num: '03' },
                { icon: 'groups', title: t('about.val4Title'), desc: t('about.val4Desc'), num: '04' },
                { icon: 'trending_up', title: t('about.val5Title'), desc: t('about.val5Desc'), num: '05' },
                { icon: 'public', title: t('about.val6Title'), desc: t('about.val6Desc'), num: '06' },
              ].map((val, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-6 sm:p-7 hover-lift shadow-sm flex flex-col justify-between group transition-all duration-300 relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] dark:bg-gray-700/50 border border-[#E8E2D5] dark:border-gray-600 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <span className="material-symbols-outlined text-2xl">{val.icon}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-400 dark:text-gray-500">
                        {val.num}
                      </span>
                    </div>
                    <h3 className="font-headline-md text-lg sm:text-xl font-bold text-dark dark:text-white mb-2.5">
                      {val.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {val.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            5. JOURNEY TIMELINE (كيف انطلقت الفكرة)
        ======================================================== */}
        <section className="py-24 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
              {t('about.timelineBadge')}
            </span>
            <h2 className="font-headline-lg text-2xl sm:text-4xl md:text-5xl font-extrabold text-dark dark:text-white my-4">
              {t('about.timelineTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
              {t('about.timelineSubtitle')}
            </p>
          </div>

          {/* Timeline Milestones */}
          <div className="relative">
            {/* Center Vertical Line */}
            <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-0.5 bg-[#E8E2D5] dark:bg-gray-700 hidden md:block"></div>

            <div className="space-y-12 md:space-y-16">
              {[
                {
                  year: t('about.step1Year'),
                  title: t('about.step1Title'),
                  desc: t('about.step1Desc'),
                  side: t('about.step1Side'),
                },
                {
                  year: t('about.step2Year'),
                  title: t('about.step2Title'),
                  desc: t('about.step2Desc'),
                  side: t('about.step2Side'),
                },
                {
                  year: t('about.step3Year'),
                  title: t('about.step3Title'),
                  desc: t('about.step3Desc'),
                  side: t('about.step3Side'),
                },
                {
                  year: t('about.step4Year'),
                  title: t('about.step4Title'),
                  desc: t('about.step4Desc'),
                  side: t('about.step4Side'),
                },
              ].map((step, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className="relative flex flex-col md:flex-row items-center gap-8">
                    {/* Content Column 1 */}
                    <div className={`w-full md:w-1/2 ${isEven ? 'md:text-left md:order-1' : 'md:text-right md:order-3'}`}>
                      <div className="p-6 rounded-2xl border bg-white dark:bg-gray-800 border-[#E8E2D5] dark:border-gray-700 shadow-sm transition-all hover-lift">
                        <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-2">
                          {step.year}
                        </div>
                        <h3 className="font-headline-md text-lg sm:text-xl font-bold mb-2 text-dark dark:text-white">
                          {step.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                          {step.desc}
                        </p>
                      </div>
                    </div>

                    {/* Central Badge / Circle */}
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-primary text-primary font-extrabold text-sm shadow-md shrink-0 md:order-2">
                      <span className="w-4 h-4 rounded-full bg-primary animate-pulse"></span>
                    </div>

                    {/* Content Column 2 (Opposing Side Metric/Fact) */}
                    <div className={`w-full md:w-1/2 ${isEven ? 'md:text-right md:order-3' : 'md:text-left md:order-1'}`}>
                      <div className="p-5 rounded-2xl bg-[#F3EFE6] dark:bg-gray-800/50 border border-dashed border-[#E8E2D5] dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {step.side}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================
            6. LEADERSHIP & ADVISORY TEAM (قيادات وخبرات)
        ======================================================== */}
        <section className="py-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
              {t('about.teamBadge')}
            </span>
            <h2 className="font-headline-lg text-2xl sm:text-4xl md:text-5xl font-extrabold text-dark dark:text-white my-4">
              {t('about.teamTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
              {t('about.teamSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: t('about.mem1Name'),
                role: t('about.mem1Role'),
                bio: t('about.mem1Bio'),
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
              },
              {
                name: t('about.mem2Name'),
                role: t('about.mem2Role'),
                bio: t('about.mem2Bio'),
                img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
              },
              {
                name: t('about.mem3Name'),
                role: t('about.mem3Role'),
                bio: t('about.mem3Bio'),
                img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
              },
              {
                name: t('about.mem4Name'),
                role: t('about.mem4Role'),
                bio: t('about.mem4Bio'),
                img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
              },
            ].map((member, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl overflow-hidden hover-lift shadow-sm flex flex-col group transition-all duration-300"
              >
                {/* Photo with Overlay Badge */}
                <div className="relative h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
                  {/* Floating Role Pill */}
                  <div className="absolute bottom-3 inset-s-3 inset-e-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-primary text-xs font-semibold text-center truncate">
                    {member.role}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col grow justify-between">
                  <div>
                    <h3 className="font-headline-md text-lg font-bold text-dark dark:text-white mb-2">
                      {member.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            7. TESTIMONIAL QUOTE (اقتباس من متدرب متميز)
        ======================================================== */}
        <section className="py-12 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto">
          <div className="bg-[#F3EFE6] dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-3xl p-8 sm:p-12 md:p-16 text-center shadow-sm relative overflow-hidden">
            {/* Quote Icon */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-6">
              <span className="material-symbols-outlined text-4xl">format_quote</span>
            </div>

            {/* Quote Body */}
            <blockquote className="font-headline-lg text-lg sm:text-2xl md:text-3xl font-extrabold text-dark dark:text-white leading-relaxed mb-8 max-w-3xl mx-auto">
              "{t('about.quoteText')}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center justify-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80"
                alt="Alumni"
                className="w-12 h-12 rounded-full object-cover border-2 border-primary shadow-sm"
              />
              <div className="text-start">
                <div className="font-bold text-dark dark:text-white text-base">
                  {t('about.quoteAuthor')}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                  {t('about.quoteRole')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            8. CALL TO ACTION (CTA BANNER - Light Sand & White)
        ======================================================== */}
        <section className="py-16 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto mb-16">
          <div className="bg-white dark:bg-gray-800 text-dark dark:text-white rounded-[2.5rem] p-8 sm:p-12 md:p-16 text-center border border-[#E8E2D5] dark:border-gray-700 relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="items-center gap-4 text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
                <span className="material-symbols-outlined text-sm">stars</span>
                <span>{t('about.ctaBadge')}</span>
              </div>

              <h2 className="font-headline-lg text-2xl sm:text-4xl md:text-5xl font-extrabold text-dark dark:text-white my-4 leading-tight">
                {t('about.ctaTitle')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
                {t('about.ctaSubtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-10">
                <Link
                  to="/courses"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-secondary text-dark dark:text-gray-950 font-bold text-base px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span>{t('about.ctaBtn1')}</span>
                  <span className="material-symbols-outlined text-lg">
                    {isRtl ? 'arrow_back' : 'arrow_forward'}
                  </span>
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#FAF7F2] dark:bg-gray-700/60 hover:bg-stone-100 dark:hover:bg-gray-700 text-dark dark:text-white border border-[#E8E2D5] dark:border-gray-600 font-semibold text-base px-7 py-3.5 rounded-xl shadow-sm transition-all duration-300"
                >
                  <span className="material-symbols-outlined text-primary text-lg">forum</span>
                  <span>{t('about.ctaBtn2')}</span>
                </Link>
              </div>

              {/* 3 Tags at the bottom of CTA */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-[#E8E2D5] dark:border-gray-700">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">verified</span>
                  <span>{t('about.ctaTag1')}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">school</span>
                  <span>{t('about.ctaTag2')}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">groups</span>
                  <span>{t('about.ctaTag3')}</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
