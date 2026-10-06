"use client";
import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { useLanguage } from "../context/LanguageContext";

const Footer = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const currentYear = new Date().getFullYear();

  // Mobile accordion open states: default all open for full discoverability with collapse option
  const [openSections, setOpenSections] = useState({
    courses: true,
    services: true,
    policies: true,
  });

  const toggleSection = sectionKey => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      href: "https://wa.me/970599000000",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      href: "https://t.me/pia_academy",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.536-.198 1.006.126.832.942z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/palestinian-international-academy",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      href: "https://youtube.com/@pia_academy",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: "https://facebook.com/palestinian.international.academy",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
        </svg>
      ),
    },
  ];

  return (
    <footer
      className="relative w-full bg-[#FAF7F2] dark:bg-[#0A0908] text-stone-800 dark:text-stone-100 pt-10 sm:pt-14 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-12 px-4 sm:px-6 md:px-8 border-t border-[#E8E2D5] dark:border-amber-500/20 transition-colors overflow-hidden"
      dir={dir}
    >
      {/* Ambient Top Glow Accent Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 dark:via-amber-400/30 to-transparent pointer-events-none" />

      {/* Decorative subtle background radial shimmer (Dark mode only) */}
      <div className="hidden dark:block absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-10 lg:space-y-12">
        {/* ========================================================
            TOP SHOWCASE: Digital Certificate Verification Spotlight
           ======================================================== */}
        <div className="rounded-2xl p-4 sm:p-5 border border-amber-500/25 dark:border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-white/80 to-amber-500/5 dark:from-stone-900/90 dark:via-[#161412] dark:to-stone-900/90 backdrop-blur-md shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <span className="material-symbols-outlined text-2xl font-bold">
                verified
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm sm:text-base text-dark dark:text-white">
                  {isRtl
                    ? "منظومة التحقق من الشهادات الرقمية"
                    : "Digital Certificate Verification"}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {isRtl ? "فوري وموثق" : "Official"}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                {isRtl
                  ? "تحقق من صحة ومصداقية أي شهادة صادرة عن الأكاديمية بواسطة الرمز الرقمي المعتمد"
                  : "Instantly verify the authenticity of any PIA certified diploma or certificate"}
              </p>
            </div>
          </div>

          <Link
            to="/verify-certificate"
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>
              {isRtl ? "فحص كود الشهادة الآن" : "Verify Certificate Now"}
            </span>
            <span className="material-symbols-outlined text-base rtl:rotate-180">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* ========================================================
            MAIN FOOTER GRID
           ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Brand Logo & Description & Social Hub */}
          <div className="flex flex-col items-center md:items-start text-center md:text-start space-y-4">
            <Link to="/" className="inline-flex items-center group">
              <div className="relative p-1 rounded-2xl bg-white/40 dark:bg-stone-900/60 border border-amber-500/15 shadow-xs">
                <img
                  src={logo}
                  alt="PALESTINIAN INTERNATIONAL ACADEMY (PIA)"
                  className="h-20 sm:h-22 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </Link>

            {/* Official Accreditation Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-[11px] font-bold">
              <span className="material-symbols-outlined text-sm">
                workspace_premium
              </span>
              <span>
                {isRtl
                  ? "أكاديمية معتمدة دولياً | PIA"
                  : "Accredited Academy | PIA"}
              </span>
            </div>

            <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm leading-relaxed max-w-sm font-body-md">
              {isRtl
                ? "المنصة العربية الرائدة في التدريب الهندسي التطبيقي والمعامل السحابية الافتراضية، لإعداد كوادر هندسية تواكب متطلبات الصناعة الحديثة."
                : "The premier Arab platform for applied engineering training and virtual cloud labs, preparing world-class engineers for modern industry."}
            </p>

            {/* Social Icons Hub */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2.5">
                {isRtl ? "القنوات الرسمية" : "Official Channels"}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                {socialLinks.map(social => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-stone-900/90 border border-[#E8E2D5] dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-all duration-200 shadow-xs cursor-pointer"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ====================================================
              COLUMNS 2, 3, 4:
              - Mobile: Luxury Collapsible Accordion Cards
              - Desktop (md+): Classic Elegant Multi-Column Lists
             ==================================================== */}

          {/* Section 1: المسارات والدورات */}
          <div className="bg-white/40 dark:bg-stone-900/40 md:bg-transparent md:dark:bg-transparent rounded-2xl md:rounded-none border border-[#E8E2D5] dark:border-stone-800/80 md:border-none p-4 md:p-0 transition-colors">
            {/* Header (Clickable on Mobile, Static on Desktop) */}
            <button
              type="button"
              onClick={() => toggleSection("courses")}
              className="w-full flex items-center justify-between md:cursor-default cursor-pointer text-start group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg md:hidden">
                  <span className="material-symbols-outlined text-[19px]">
                    school
                  </span>
                </span>
                <h4 className="font-extrabold text-dark dark:text-white text-sm sm:text-base font-headline-sm group-hover:text-primary transition-colors">
                  {isRtl ? "المسارات والدورات" : "Courses & Tracks"}
                </h4>
              </div>
            </button>

            {/* List */}
            <div
              className={`mt-3 md:mt-4 space-y-1 md:space-y-2.5 ${openSections.courses ? "block" : "hidden md:block"}`}
            >
              <ul className="space-y-1.5 md:space-y-2.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-body-md">
                <li>
                  <Link
                    to="/courses"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent hover:text-primary dark:hover:text-amber-400 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-stone-400 group-hover:text-primary transition-colors md:hidden">
                        menu_book
                      </span>
                      <span>
                        {isRtl
                          ? "جميع الدورات والبرامج"
                          : "All Courses & Programs"}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/library"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent hover:text-primary dark:hover:text-amber-400 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-stone-400 group-hover:text-primary transition-colors md:hidden">
                        local_library
                      </span>
                      <span>
                        {isRtl
                          ? "المكتبة الهندسية والرقمية"
                          : "Engineering Digital Library"}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/virtual-lab"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent hover:text-primary dark:hover:text-amber-400 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-stone-400 group-hover:text-primary transition-colors md:hidden">
                        science
                      </span>
                      <span>
                        {isRtl
                          ? "المعمل السحابي الافتراضي"
                          : "Virtual Cloud Lab"}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent hover:text-primary dark:hover:text-amber-400 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-stone-400 group-hover:text-primary transition-colors md:hidden">
                        verified
                      </span>
                      <span>
                        {isRtl
                          ? "عن الأكاديمية والاعتماد"
                          : "About PIA & Accreditation"}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: الخدمات والتحقق */}
          <div className="bg-white/40 dark:bg-stone-900/40 md:bg-transparent md:dark:bg-transparent rounded-2xl md:rounded-none border border-[#E8E2D5] dark:border-stone-800/80 md:border-none p-4 md:p-0 transition-colors">
            {/* Header */}
            <button
              type="button"
              onClick={() => toggleSection("services")}
              className="w-full flex items-center justify-between md:cursor-default cursor-pointer text-start group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg md:hidden">
                  <span className="material-symbols-outlined text-[19px]">
                    verified_user
                  </span>
                </span>
                <h4 className="font-extrabold text-dark dark:text-white text-sm sm:text-base font-headline-sm group-hover:text-primary transition-colors">
                  {isRtl ? "الخدمات والتحقق" : "Services & Verification"}
                </h4>
              </div>
            </button>

            {/* List */}
            <div
              className={`mt-3 md:mt-4 space-y-1 md:space-y-2.5 ${openSections.services ? "block" : "hidden md:block"}`}
            >
              <ul className="space-y-1.5 md:space-y-2.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-body-md">
                <li>
                  <Link
                    to="/verify-certificate"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent font-bold hover:text-secondary transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-secondary md:hidden">
                        check_circle
                      </span>
                      <span>
                        {isRtl
                          ? "التحقق من الشهادة الرقمية"
                          : "Certificate Verification"}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/partnerships"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent hover:text-primary dark:hover:text-amber-400 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-stone-400 group-hover:text-primary transition-colors md:hidden">
                        handshake
                      </span>
                      <span>
                        {isRtl
                          ? "المؤسسات والشراكات الهندسية"
                          : "Partnerships & Organizations"}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent hover:text-primary dark:hover:text-amber-400 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-stone-400 group-hover:text-primary transition-colors md:hidden">
                        support_agent
                      </span>
                      <span>
                        {isRtl
                          ? "مركز المساعدة والدعم الفني"
                          : "Help & Support Center"}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent hover:text-primary dark:hover:text-amber-400 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-stone-400 group-hover:text-primary transition-colors md:hidden">
                        groups
                      </span>
                      <span>
                        {isRtl ? "فريق العمل والمدربون" : "Instructors & Team"}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3: السياسات والتواصل */}
          <div className="bg-white/40 dark:bg-stone-900/40 md:bg-transparent md:dark:bg-transparent rounded-2xl md:rounded-none border border-[#E8E2D5] dark:border-stone-800/80 md:border-none p-4 md:p-0 transition-colors">
            {/* Header */}
            <button
              type="button"
              onClick={() => toggleSection("policies")}
              className="w-full flex items-center justify-between md:cursor-default cursor-pointer text-start group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg md:hidden">
                  <span className="material-symbols-outlined text-[19px]">
                    shield
                  </span>
                </span>
                <h4 className="font-extrabold text-dark dark:text-white text-sm sm:text-base font-headline-sm group-hover:text-primary transition-colors">
                  {isRtl ? "السياسات والتواصل" : "Policies & Contact"}
                </h4>
              </div>
            </button>

            {/* List */}
            <div
              className={`mt-3 md:mt-4 space-y-1 md:space-y-2.5 ${openSections.policies ? "block" : "hidden md:block"}`}
            >
              <ul className="space-y-1.5 md:space-y-2.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-body-md">
                <li>
                  <Link
                    to="/privacy"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent hover:text-primary dark:hover:text-amber-400 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-stone-400 group-hover:text-primary transition-colors md:hidden">
                        privacy_tip
                      </span>
                      <span>{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent hover:text-primary dark:hover:text-amber-400 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-stone-400 group-hover:text-primary transition-colors md:hidden">
                        gavel
                      </span>
                      <span>
                        {isRtl ? "شروط الاستخدام والخدمة" : "Terms of Service"}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="flex items-center justify-between p-2 md:p-0 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 md:hover:bg-transparent md:dark:hover:bg-transparent hover:text-primary dark:hover:text-amber-400 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-stone-400 group-hover:text-primary transition-colors md:hidden">
                        mail
                      </span>
                      <span>{isRtl ? "تواصل معنا" : "Contact Us"}</span>
                    </span>
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {isRtl ? "arrow_left_alt" : "arrow_right_alt"}
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========================================================
            DIRECT ADVISORY & SUPPORT BAR
           ======================================================== */}
        <div className="pt-6 border-t border-[#E8E2D5] dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 dark:bg-stone-900/30 p-4 sm:p-5 rounded-2xl border">
          <div className="flex items-center gap-3 text-center sm:text-start">
            <span className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">
                support_agent
              </span>
            </span>
            <div>
              <p className="font-bold text-xs sm:text-sm text-dark dark:text-white">
                {isRtl
                  ? "هل تحتاج إلى استشارة تدريبية أو مساعدة تقنية؟"
                  : "Need training advisory or technical support?"}
              </p>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                {isRtl
                  ? "مستشارونا الأكاديميون متواجدون لمساعدتك في اختيار مسارك الأنسب"
                  : "Our academic advisors are available to guide your learning path"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/contact"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-primary text-stone-700 dark:text-stone-200 hover:text-primary text-xs font-bold transition-colors text-center cursor-pointer"
            >
              {isRtl ? "مركز المساعدة" : "Help Desk"}
            </Link>
            <a
              href="https://wa.me/970599000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              <span>{isRtl ? "واتساب مباشر" : "Live WhatsApp"}</span>
            </a>
          </div>
        </div>

        {/* ========================================================
            BOTTOM BAR: Copyright, Legal & Back to Top
           ======================================================== */}
        <div className="pt-6 border-t border-[#E8E2D5] dark:border-stone-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500 dark:text-stone-400 font-body-md">
          {/* Copyright notice */}
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center md:text-start">
            <p>
              © {currentYear}{" "}
              <span className="font-bold text-stone-700 dark:text-stone-300">
                PALESTINIAN INTERNATIONAL ACADEMY (PIA)
              </span>
              . {isRtl ? "جميع الحقوق محفوظة." : "All rights reserved."}
            </p>
            <span className="hidden sm:inline text-stone-300 dark:text-stone-700">
              •
            </span>
            <span className="text-[11px] text-amber-600/90 dark:text-amber-400/80 font-medium">
              {isRtl
                ? "التميز في التعليم الهندسي التطبيقي"
                : "Excellence in Applied Engineering"}
            </span>
          </div>

          {/* Quick Legal Links & Scroll to top */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <Link
              to="/privacy"
              className="hover:text-primary dark:hover:text-amber-400 transition-colors"
            >
              {isRtl ? "سياسة الخصوصية" : "Privacy"}
            </Link>
            <Link
              to="/terms"
              className="hover:text-primary dark:hover:text-amber-400 transition-colors"
            >
              {isRtl ? "شروط الاستخدام" : "Terms"}
            </Link>
            <Link
              to="/contact"
              className="hover:text-primary dark:hover:text-amber-400 transition-colors"
            >
              {isRtl ? "تواصل معنا" : "Contact"}
            </Link>

            {/* Back to top button */}
            <button
              type="button"
              onClick={scrollToTop}
              aria-label={isRtl ? "العودة للأعلى" : "Back to top"}
              className="w-8 h-8 rounded-lg bg-stone-200/80 dark:bg-stone-800/80 hover:bg-primary hover:text-white dark:hover:bg-amber-500 dark:hover:text-stone-950 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-all cursor-pointer shadow-xs ml-2 rtl:ml-0 rtl:mr-2"
              title={isRtl ? "العودة للأعلى" : "Back to top"}
            >
              <span className="material-symbols-outlined text-base">
                arrow_upward
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
