import { useState, useEffect } from "react";
import {
  ArrowRight,
  SlidersHorizontal,
  Maximize2,
  ShieldCheck,
  TrendingUp,
  FileText,
  X,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { Orb, oceanDepthsPreset } from "react-ai-orb";
import Slider from "react-slick";

/* ── Types ── */
interface Country { name: string; iso2: string; }
interface State    { name: string; iso2: string; country_code: string; }
interface City     { name: string; country_code: string; state_code: string; }

/* ── 4 feature cards ── */
const CARDS = [
  {
    icon: SlidersHorizontal,
    title: "Tailored for Your Needs",
    desc: "Plans designed around your unique requirements and business goals.",
    iconBg: "#EEF1FB",
    iconColor: "#3B5BDB",
  },
  {
    icon: Maximize2,
    title: "Scalable at Every Step",
    desc: "Easily scale up or down as your business grows — no lock-in.",
    iconBg: "#EEF6FF",
    iconColor: "#2563EB",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Ready",
    desc: "Secure, reliable and built for high performance at any scale.",
    iconBg: "#F0FDF4",
    iconColor: "#16A34A",
  },
  {
    icon: TrendingUp,
    title: "Flexible & Customizable",
    desc: "Upgrade, downgrade or customize your plan anytime as needs change.",
    iconBg: "#FDF4FF",
    iconColor: "#9333EA",
  },
];

/* ══════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════ */
export const ShivaiSubsPlanV2 = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<"form" | "success">("form");
  const [formData, setFormData]   = useState({
    name: "", email: "",
    country: "", countryCode: "",
    state: "",  stateCode: "",
    city: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [countries,     setCountries]     = useState<Country[]>([]);
  const [states,        setStates]        = useState<State[]>([]);
  const [cities,        setCities]        = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch,   setStateSearch]   = useState("");
  const [citySearch,    setCitySearch]    = useState("");
  const [showCDD,  setShowCDD]  = useState(false);
  const [showSDD,  setShowSDD]  = useState(false);
  const [showCiDD, setShowCiDD] = useState(false);

  /* ── API ── */
  const fetchCountries = async () => {
    try {
      const d = await (await fetch("https://restcountries.com/v3.1/all?fields=name,cca2")).json();
      setCountries(d.map((c: any) => ({ name: c.name.common, iso2: c.cca2 }))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name)));
    } catch {}
  };
  const fetchStates = async (cc: string) => {
    setLoadingStates(true);
    try {
      const d = await (await fetch(
        `https://api.countrystatecity.in/v1/countries/${cc}/states`,
        { headers: { "X-CSCAPI-KEY": "NHhvOEcyWk50N2Vna3VFTE00bFp3MjFKR0ZEOUhkZlg4RTk1MlJlaA==" } }
      )).json();
      setStates(d || []);
    } catch { setStates([]); } finally { setLoadingStates(false); }
  };
  const fetchCities = async (cc: string, sc: string) => {
    setLoadingCities(true);
    try {
      const d = await (await fetch(
        `https://api.countrystatecity.in/v1/countries/${cc}/states/${sc}/cities`,
        { headers: { "X-CSCAPI-KEY": "NHhvOEcyWk50N2Vna3VFTE00bFp3MjFKR0ZEOUhkZlg4RTk1MlJlaA==" } }
      )).json();
      setCities(d || []);
    } catch { setCities([]); } finally { setLoadingCities(false); }
  };

  useEffect(() => { fetchCountries(); }, []);
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".loc-dd")) {
        setShowCDD(false); setShowSDD(false); setShowCiDD(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selectCountry = (c: Country) => {
    setFormData(p => ({ ...p, country: c.name, countryCode: c.iso2, state: "", stateCode: "", city: "" }));
    setCountrySearch(c.name); setShowCDD(false); setStates([]); setCities([]); fetchStates(c.iso2);
  };
  const selectState = (s: State) => {
    setFormData(p => ({ ...p, state: s.name, stateCode: s.iso2, city: "" }));
    setStateSearch(s.name); setShowSDD(false); setCities([]);
    if (formData.countryCode) fetchCities(formData.countryCode, s.iso2);
  };
  const selectCity = (c: City) => {
    setFormData(p => ({ ...p, city: c.name }));
    setCitySearch(c.name); setShowCiDD(false);
  };
  const resetModal = () => {
    setShowModal(false); setModalStep("form");
    setFormData({ name: "", email: "", country: "", countryCode: "", state: "", stateCode: "", city: "" });
    setFormErrors({});
    setCountrySearch(""); setStateSearch(""); setCitySearch("");
    setShowCDD(false); setShowSDD(false); setShowCiDD(false);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.name.trim())  errs.name    = "Name is required";
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) errs.email = "Valid email required";
    if (!formData.country.trim()) errs.country = "Country is required";
    if (!formData.state.trim()) errs.state   = "State is required";
    if (!formData.city.trim())  errs.city    = "City is required";
    setFormErrors(errs);
    if (!Object.keys(errs).length) {
      // Send to WhatsApp with form data
      openWhatsAppInquiry(formData);
    }
  };

  const openWhatsAppInquiry = (data: typeof formData) => {
    const message = `Hi ShivAI!\n\nI'm interested in your services.\n\n*Details:*\nName: ${data.name}\nEmail: ${data.email}\nCountry: ${data.country}\nState: ${data.state}\nCity: ${data.city}\n\nPlease get in touch with me.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/919211490707?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    setShowModal(false);
    resetModal();
  };

  const openWhatsAppDirect = () => {
    const message = "Hi ShivAI! I'm interested in learning more about your services.";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/919211490707?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const fCountries = (Array.isArray(countries) ? countries : []).filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  const fStates    = (Array.isArray(states) ? states : []).filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()));
  const fCities    = (Array.isArray(cities) ? cities : []).filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()));

  const iCls = (err?: string) =>
    `w-full px-4 py-3 rounded-xl text-[14px] border ${err ? "border-red-400" : "border-gray-200"} bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors text-[#333333] placeholder:text-gray-400`;


  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <div
      id="pricing-content"
      className="w-full relative overflow-hidden"
      style={{
        backgroundImage: "url('/PriceBG.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-8xl mx-auto px-5 sm:px-6 lg:px-10 pt-10 lg:pt-16 pb-12 lg:pb-20">

        {/* ═══════════════════════════════════════
            MAIN LAYOUT
        ════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10 items-start">

          {/* ── LEFT ── */}
          <div className="w-full lg:w-[300px] xl:w-[581px] flex-shrink-0 space-y-3 sm:space-y-4 lg:space-y-5">

            {/* Label */}
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] uppercase" style={{ color: "#1192BB" }}>
              Flexible &amp; Tailored for You
            </p>

            {/* Heading — scales from mobile to desktop */}
            <h2 className="text-[28px] sm:text-[34px] lg:text-[42px] xl:text-[60px] font-bold text-white leading-[1.1]">
              Call ShivAI<br />Subscription Plans
            </h2>

            <p className="text-[13px] sm:text-[14px] lg:text-[16px] font-[300] leading-relaxed" style={{ color: "rgba(203,213,225,0.85)" }}>
              We offer various subscription models based on your usage, call volume,
              number of AI Employees, languages required, storage space, integrations
              and other customisation required.
            </p>

          </div>

          {/* ── RIGHT — 4-col grid on desktop, slider on mobile ── */}
          <div className="flex-1 min-w-0 w-full lg:pt-[44px]">

            {/* Desktop: 2×2 grid */}
            <div className="hidden sm:grid grid-cols-2 gap-3">
              {CARDS.map((card, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 lg:p-5 bg-white rounded-2xl border"
                  style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)", borderColor: "#EBEBEB" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: card.iconBg }}>
                    <card.icon style={{ width: 18, height: 18, color: card.iconColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] lg:text-[15px] font-semibold text-[#111827] leading-snug">{card.title}</p>
                    <p className="text-[12px] lg:text-[13px] font-[300] text-[#5A5A59] mt-1 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: slider, 1 card at a time */}
            <div className="block sm:hidden">
              <Slider
                dots={false}
                infinite={true}
                speed={400}
                slidesToShow={1}
                slidesToScroll={1}
                autoplay={true}
                autoplaySpeed={3200}
                arrows={false}
                swipeToSlide={true}
                cssEase="ease-in-out"
              >
                {CARDS.map((card, i) => (
                  <div key={i} className="px-1">
                    <div
                      className="flex items-start gap-3 p-4 bg-white rounded-2xl border"
                      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)", borderColor: "#EBEBEB" }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: card.iconBg }}>
                        <card.icon style={{ width: 18, height: 18, color: card.iconColor }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-[#111827] leading-snug">{card.title}</p>
                        <p className="text-[13px] font-[300] text-[#5A5A59] mt-1 leading-relaxed">{card.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════
            FULL-WIDTH CTA BAR — orb left, text center, 2 buttons right
        ═══════════════════════════════════ */}
        <div
          className="mt-8 lg:mt-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 px-5 sm:px-8 py-5 sm:py-6 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          {/* Orb */}
          <div className="flex-shrink-0 w-[64px] h-[64px]">
            <Orb {...oceanDepthsPreset} size={0.78} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-[15px] sm:text-[17px] font-bold text-white leading-snug">
              Let's build the perfect plan for your business.
            </p>
            <p className="text-[12px] sm:text-[13px] font-[400] mt-0.5" style={{ color: "#22d3ee" }}>
              Connect with our sales team and get a solution that fits just right.
            </p>
          </div>

          {/* Two buttons — app theme */}
          <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blackGradient flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-full text-[13px] sm:text-[14px] font-medium text-white hover:opacity-90 active:scale-[0.97] transition-all whitespace-nowrap"
            >
              Book a Demo <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={openWhatsAppDirect}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-full text-[13px] sm:text-[14px] font-medium text-[#333333] hover:opacity-90 active:scale-[0.97] transition-all whitespace-nowrap"
              style={{
                background: "linear-gradient(151deg,#fff -62.65%,#fbfbfe 83.01%)",
                border: "0.886px solid #0a0a0a",
                boxShadow: "0 2.659px 5.318px 0 rgba(7,8,11,0.06), 0 0 1.773px 0 rgba(0,0,0,0.10) inset, 0 3.545px 5.318px 0 rgba(51,51,51,0.12) inset",
              }}
            >
              <FileText className="w-4 h-4" /> Send Your Inquiry
            </button>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════
          INQUIRY MODAL
      ═══════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={resetModal}>
          <div
            className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-white my-auto"
            style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.28)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={resetModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-7 sm:p-8">
              {modalStep === "form" ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-center mb-6">
                    <div
                      className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#1192BB,#A233FF)" }}
                    >
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-[20px] font-semibold text-[#111827]">Get Started with ShivAI</h2>
                    <p className="text-[14px] font-[300] text-[#5A5A59] mt-1">Tell us about yourself and we'll be in touch shortly.</p>
                  </div>

                  {[
                    { key: "name",  label: "Full Name",      type: "text",  placeholder: "Your full name" },
                    { key: "email", label: "Email Address",  type: "email", placeholder: "you@company.com" },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[12px] font-medium text-[#5A5A59] mb-1">{label}</label>
                      <input
                        type={type} placeholder={placeholder}
                        value={(formData as any)[key]}
                        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                        className={iCls((formErrors as any)[key])}
                      />
                      {(formErrors as any)[key] && <p className="text-[11px] text-red-500 mt-1">{(formErrors as any)[key]}</p>}
                    </div>
                  ))}

                  {/* Country */}
                  <div className="loc-dd relative">
                    <label className="block text-[12px] font-medium text-[#5A5A59] mb-1">Country</label>
                    <div className="relative">
                      <input type="text" placeholder="Search country…" value={countrySearch}
                        onChange={e => { setCountrySearch(e.target.value); setShowCDD(true); }}
                        onFocus={() => setShowCDD(true)} className={iCls(formErrors.country)} />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {formErrors.country && <p className="text-[11px] text-red-500 mt-1">{formErrors.country}</p>}
                    {showCDD && (
                      <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                        {fCountries.length > 0 ? (
                          fCountries.slice(0, 50).map(c => (
                            <li key={c.iso2} onClick={() => selectCountry(c)}
                              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] text-[#333333]">{c.name}</li>
                          ))
                        ) : countrySearch.trim() ? (
                          <li onClick={() => { setFormData(p => ({ ...p, country: countrySearch, countryCode: "custom" })); setShowCDD(false); }}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-medium text-blue-600">Use "{countrySearch}" (Custom)</li>
                        ) : null}
                      </ul>
                    )}
                  </div>

                  {/* State */}
                  <div className="loc-dd relative">
                    <label className="block text-[12px] font-medium text-[#5A5A59] mb-1">State / Province</label>
                    <div className="relative">
                      <input type="text" placeholder={loadingStates ? "Loading…" : "Search state…"} value={stateSearch}
                        disabled={!formData.countryCode}
                        onChange={e => { setStateSearch(e.target.value); setShowSDD(true); }}
                        onFocus={() => setShowSDD(true)}
                        className={iCls(formErrors.state) + " disabled:opacity-50 disabled:cursor-not-allowed"} />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {formErrors.state && <p className="text-[11px] text-red-500 mt-1">{formErrors.state}</p>}
                    {showSDD && (
                      <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                        {fStates.length > 0 ? (
                          fStates.slice(0, 50).map(s => (
                            <li key={s.iso2} onClick={() => selectState(s)}
                              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] text-[#333333]">{s.name}</li>
                          ))
                        ) : stateSearch.trim() ? (
                          <li onClick={() => { setFormData(p => ({ ...p, state: stateSearch, stateCode: "custom" })); setShowSDD(false); }}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-medium text-blue-600">Use "{stateSearch}" (Custom)</li>
                        ) : null}
                      </ul>
                    )}
                  </div>

                  {/* City */}
                  <div className="loc-dd relative">
                    <label className="block text-[12px] font-medium text-[#5A5A59] mb-1">City</label>
                    <div className="relative">
                      <input type="text" placeholder={loadingCities ? "Loading…" : "Search city…"} value={citySearch}
                        disabled={!formData.stateCode}
                        onChange={e => { setCitySearch(e.target.value); setShowCiDD(true); }}
                        onFocus={() => setShowCiDD(true)}
                        className={iCls(formErrors.city) + " disabled:opacity-50 disabled:cursor-not-allowed"} />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {formErrors.city && <p className="text-[11px] text-red-500 mt-1">{formErrors.city}</p>}
                    {showCiDD && (
                      <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                        {fCities.length > 0 ? (
                          fCities.slice(0, 50).map((c, i) => (
                            <li key={i} onClick={() => selectCity(c)}
                              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] text-[#333333]">{c.name}</li>
                          ))
                        ) : citySearch.trim() ? (
                          <li onClick={() => { setFormData(p => ({ ...p, city: citySearch })); setShowCiDD(false); }}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] font-medium text-blue-600">Use "{citySearch}" (Custom)</li>
                        ) : null}
                      </ul>
                    )}
                  </div>

                  <button type="submit"
                    className="bg-blackGradient w-full py-3 rounded-full text-[14px] font-medium text-white hover:opacity-90 active:scale-[0.98] transition-all mt-1"
                  >
                    Send My Inquiry →
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-[20px] font-semibold text-[#111827]">Inquiry Sent!</h2>
                  <p className="text-[14px] font-[300] text-[#5A5A59]">
                    Thanks <span className="font-medium text-[#333333]">{formData.name}</span>! Our team will reach out to{" "}
                    <span className="font-medium text-[#333333]">{formData.email}</span> shortly.
                  </p>
                  <button onClick={resetModal}
                    className="bg-blackGradient mt-2 px-8 py-2.5 rounded-full text-[14px] font-medium text-white hover:opacity-90">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShivaiSubsPlanV2;
