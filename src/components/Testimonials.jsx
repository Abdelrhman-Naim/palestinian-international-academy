import { useLanguage } from '../context/LanguageContext';

const Testimonials = () => {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const reviews = [
    {
      text: isRtl
        ? '"الدورات هنا ليست مجرد مقاطع فيديو مسجلة، بل بيئة عمل حقيقية نقلت مهاراتي في هندسة النظم من الأساسيات إلى قيادة مشاريع متقدمة في وقت قياسي."'
        : '"The courses here are not just recorded videos, but a real work environment that transformed my skills in systems engineering from basic concepts to leading advanced projects in record time."',
      initials: isRtl ? 'إ.ح' : 'E.H',
      name: isRtl ? 'م. إياد الحلي' : 'Eng. Eyad Al-Helli',
      role: isRtl ? 'مهندس حلول برمجية وسحابية' : 'Software & Cloud Solutions Engineer',
    },
    {
      text: isRtl
        ? '"المسارات التعليمية المنظمة وتحديات الكود وفرت عليّ سنوات من التشتت، والمجتمع التفاعلي مع المدربين كان الداعم الأكبر لي في اجتياز مقابلات التوظيف."'
        : '"The structured learning paths and coding challenges saved me years of distraction, and the interactive instructor community was my biggest support in passing job interviews."',
      initials: isRtl ? 'إ.ف' : 'I.F',
      name: isRtl ? 'م. إبراهيم فالح' : 'Eng. Ibrahim Faleh',
      role: isRtl ? 'مهندس ذكاء اصطناعي وأتمتة' : 'AI & Automation Engineer',
    },
    {
      text: isRtl
        ? '"أفضل استثمار في مسيرتي الهندسية! الشهادات معتمدة ومحتوى المسارات يحاكي بالضبط متطلبات الشركات الكبرى وسوق العمل الإقليمي."'
        : '"The best investment in my engineering career! The certificates are accredited, and the path content exactly mirrors the requirements of major tech companies and the regional job market."',
      initials: isRtl ? 'س.ش' : 'S.S',
      name: isRtl ? 'د. سماحة الشامي' : 'Dr. Samaha Al-Shami',
      role: isRtl ? 'مهندسة بيانات وبنية تحتية' : 'Data & Infrastructure Engineer',
    },
  ];

  const badgeText = isRtl ? 'قصص نجاح ملهمة' : 'Inspiring Success Stories';
  const titleText = isRtl ? 'ماذا يقول مهندسو أكاديمية فلسطين الدولية؟' : 'What Do PIA Engineers Say?';
  const subtitleText = isRtl
    ? 'تجارب حقيقية لمهندسين غيّرت مساراتهم المهنية بفضل التدريب العملي المكثّف.'
    : 'Real experiences of engineers whose career paths transformed thanks to intensive practical training.';

  return (
    <section
      className="w-full bg-[#FAF7F2] dark:bg-[#12100E] py-24 px-4 md:px-8 border-t border-[#E8E2D5] dark:border-[#2C2722] transition-colors"
      dir={dir}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-primary dark:text-[#D9A54C] font-bold text-xs sm:text-sm tracking-wide inline-block font-label-caps">
            {badgeText}
          </span>
          <h2 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl font-black text-dark dark:text-white">
            {titleText}
          </h2>
          <p className="text-gray-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed font-body-md">
            {subtitleText}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#181512] border border-[#E8E2D5] dark:border-[#2E2720] rounded-2xl p-7 sm:p-8 shadow-sm dark:shadow-xl hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between h-full text-right rtl:text-right ltr:text-left group"
            >
              {/* Quote Text */}
              <p className="text-dark dark:text-white font-bold text-sm sm:text-base leading-relaxed mb-8 font-body-md transition-colors">
                {rev.text}
              </p>

              {/* Bottom Author Row */}
              <div className="flex items-center justify-between pt-5 border-t border-[#E8E2D5] dark:border-[#2E2720] mt-auto">
                <div className="flex flex-col">
                  <h4 className="font-bold text-dark dark:text-white text-base sm:text-lg mb-0.5">
                    {rev.name}
                  </h4>
                  <p className="text-gray-500 dark:text-stone-400 text-xs font-medium">
                    {rev.role}
                  </p>
                </div>

                {/* Initial Badge Circle */}
                <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-[#28221B] border border-amber-300 dark:border-[#3E3326] text-amber-800 dark:text-[#D9A54C] font-bold text-sm flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  {rev.initials}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
