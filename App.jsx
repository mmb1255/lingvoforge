import { useState, useEffect, useRef } from "react";

const API_URL = "/api/chat";

const CEFR_LEVELS = [
  { value: "A1", label: "A1 – Başlangıç", labelEn: "Beginner", color: "#4ade80" },
  { value: "A2", label: "A2 – Temel", labelEn: "Elementary", color: "#86efac" },
  { value: "B1", label: "B1 – Orta Altı", labelEn: "Intermediate", color: "#fbbf24" },
  { value: "B2", label: "B2 – Orta Üstü", labelEn: "Upper-Intermediate", color: "#f59e0b" },
  { value: "C1", label: "C1 – İleri", labelEn: "Advanced", color: "#f97316" },
  { value: "C2", label: "C2 – Uzman", labelEn: "Proficiency", color: "#ef4444" },
];

const TONES = [
  { value: "friendly", label: "Arkadaşça", icon: "😊", labelEn: "Friendly" },
  { value: "formal", label: "Resmi", icon: "👔", labelEn: "Formal" },
  { value: "academic", label: "Akademik", icon: "🎓", labelEn: "Academic" },
  { value: "casual", label: "Günlük", icon: "☕", labelEn: "Casual" },
  { value: "narrative", label: "Hikâye", icon: "📖", labelEn: "Narrative" },
  { value: "humorous", label: "Komik", icon: "😄", labelEn: "Humorous" },
];

const LANGUAGES = [
  { value: "en", label: "İngilizce", flag: "🇬🇧", labelEn: "English" },
  { value: "de", label: "Almanca", flag: "🇩🇪", labelEn: "Deutsch" },
];

const TEXT_TYPES = [
  { value: "paragraph", label: "Paragraf", icon: "📝" },
  { value: "dialogue", label: "Diyalog", icon: "💬" },
  { value: "email", label: "E-posta", icon: "✉️" },
  { value: "story", label: "Kısa Hikâye", icon: "📚" },
  { value: "article", label: "Makale", icon: "📰" },
  { value: "letter", label: "Mektup", icon: "💌" },
];

async function callAPI(prompt, maxTokens = 1000) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.map((c) => c.text || "").join("") || "";
}

export default function App() {
  const [language, setLanguage] = useState("de");
  const [level, setLevel] = useState("B2");
  const [tone, setTone] = useState("friendly");
  const [textType, setTextType] = useState("paragraph");
  const [topic, setTopic] = useState("");
  const [wordCount, setWordCount] = useState(80);
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [history, setHistory] = useState([]);
  const resultRef = useRef(null);

  const [showVocab, setShowVocab] = useState(false);
  const [vocabList, setVocabList] = useState([]);
  const [isVocabLoading, setIsVocabLoading] = useState(false);

  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const [showGrammar, setShowGrammar] = useState(false);
  const [grammarAnalysis, setGrammarAnalysis] = useState([]);
  const [isGrammarLoading, setIsGrammarLoading] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [error, setError] = useState("");

  const selectedLevel = CEFR_LEVELS.find((l) => l.value === level);
  const selectedTone = TONES.find((t) => t.value === tone);
  const selectedLang = LANGUAGES.find((l) => l.value === language);

  const speakText = () => {
    if (!generatedText) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(generatedText);
    u.lang = language === "de" ? "de-DE" : "en-US";
    u.rate = speechRate;
    u.pitch = 1;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  useEffect(() => { return () => window.speechSynthesis?.cancel(); }, []);

  const generateText = async () => {
    if (!topic.trim()) return;
    setIsLoading(true); setGeneratedText(""); setError("");
    setShowVocab(false); setVocabList([]);
    setShowTranslation(false); setTranslatedText("");
    setShowGrammar(false); setGrammarAnalysis([]);
    window.speechSynthesis?.cancel(); setIsSpeaking(false);

    const langName = language === "de" ? "German" : "English";
    const prompt = `Generate a ${selectedTone.labelEn.toLowerCase()} ${textType} in ${langName} at CEFR ${level} level about "${topic}". 
The text should be approximately ${wordCount} words long. Write ONLY the text, no explanations, no translations, no notes.
The vocabulary and grammar must strictly match ${level} level.
${language === "de" ? "Use proper German grammar with correct articles, cases, and verb conjugation." : ""}`;

    try {
      const text = await callAPI(prompt);
      if (!text) throw new Error("Boş yanıt");
      setGeneratedText(text);
      setHistory((p) => [{ text, language, level, tone, topic, textType, timestamp: Date.now() }, ...p.slice(0, 9)]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err) {
      setError("Metin üretilirken bir hata oluştu. API anahtarınızı kontrol edin.");
    }
    setIsLoading(false);
  };

  const extractVocab = async () => {
    if (!generatedText) return;
    setIsVocabLoading(true); setShowVocab(true);
    const langName = language === "de" ? "German" : "English";
    try {
      const raw = await callAPI(`From this ${langName} text at CEFR ${level} level, extract 8-10 important vocabulary words for a Turkish learner.\nText: "${generatedText}"\nReturn ONLY a JSON array with objects: "word", "translation" (Turkish), "example" (short ${langName} sentence), "type" (noun/verb/adj/adv)${language === "de" ? ', "article" (der/die/das if noun)' : ""}. Return ONLY the JSON array.`);
      setVocabList(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch { setVocabList([]); }
    setIsVocabLoading(false);
  };

  const translateText = async () => {
    if (!generatedText) return;
    if (showTranslation && translatedText) { setShowTranslation(false); return; }
    setIsTranslating(true); setShowTranslation(true);
    const langName = language === "de" ? "German" : "English";
    try {
      const text = await callAPI(`Translate this ${langName} text to Turkish. Provide ONLY the Turkish translation:\n"${generatedText}"`);
      setTranslatedText(text || "Çeviri yapılamadı.");
    } catch { setTranslatedText("Çeviri yapılamadı."); }
    setIsTranslating(false);
  };

  const analyzeGrammar = async () => {
    if (!generatedText) return;
    if (showGrammar && grammarAnalysis.length) { setShowGrammar(false); return; }
    setIsGrammarLoading(true); setShowGrammar(true);
    const langName = language === "de" ? "German" : "English";
    try {
      const raw = await callAPI(`Analyze grammar structures in this ${langName} text for a Turkish learner at CEFR ${level} level.\nText: "${generatedText}"\nReturn ONLY a JSON array of 5-8 grammar points. Each object: "structure" (grammar rule name in Turkish), "example" (exact phrase from text), "explanation" (short Turkish explanation), "level" (CEFR level A1-C2). Return ONLY the JSON array.`, 1500);
      setGrammarAnalysis(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch { setGrammarAnalysis([]); }
    setIsGrammarLoading(false);
  };

  const ToolBtn = ({ icon, label, onClick, active, loading }) => (
    <button onClick={onClick} style={{ ...st.toolBtn, ...(active ? { borderColor: "#3b82f6", background: "rgba(59,130,246,0.15)", color: "#60a5fa" } : {}) }}>
      {loading ? <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
      </svg> : <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );

  const Spinner = ({ color = "#60a5fa", text }) => (
    <div style={st.miniLoader}>
      <svg width="22" height="22" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
      </svg>
      <span>{text}</span>
    </div>
  );

  return (
    <div style={st.container}>
      <div style={st.bgOrb1} /><div style={st.bgOrb2} /><div style={st.bgOrb3} />

      <header style={st.header}>
        <div style={st.logoArea}>
          <div style={st.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 style={st.titleText}>LingvoForge</h1>
            <p style={st.subtitle}>AI Dil Metin Üreticisi</p>
          </div>
        </div>
        <div style={st.langPills}>
          {LANGUAGES.map((l) => (
            <button key={l.value} onClick={() => setLanguage(l.value)} style={{ ...st.langPill, ...(language === l.value ? st.langPillActive : {}) }}>
              <span style={{ fontSize: 20 }}>{l.flag}</span><span>{l.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div style={st.tabs}>
        <button onClick={() => setActiveTab("generate")} style={{ ...st.tab, ...(activeTab === "generate" ? st.tabActive : {}) }}>✨ Metin Üret</button>
        <button onClick={() => setActiveTab("history")} style={{ ...st.tab, ...(activeTab === "history" ? st.tabActive : {}) }}>📋 Geçmiş ({history.length})</button>
      </div>

      {activeTab === "generate" ? (
        <div style={st.mainGrid}>
          <div style={st.settingsPanel}>
            <div style={st.section}>
              <label style={st.sLabel}><span style={st.lIcon}>📊</span> Zorluk Seviyesi (CEFR)</label>
              <div style={st.cefrGrid}>
                {CEFR_LEVELS.map((l) => (
                  <button key={l.value} onClick={() => setLevel(l.value)} style={{ ...st.cefrBtn, ...(level === l.value ? { background: l.color + "22", borderColor: l.color, color: l.color } : {}) }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{l.value}</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>{l.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={st.section}>
              <label style={st.sLabel}><span style={st.lIcon}>📄</span> Metin Türü</label>
              <div style={st.typeGrid}>
                {TEXT_TYPES.map((t) => (
                  <button key={t.value} onClick={() => setTextType(t.value)} style={{ ...st.typeBtn, ...(textType === t.value ? st.typeBtnActive : {}) }}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span><span style={{ fontSize: 12 }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={st.section}>
              <label style={st.sLabel}><span style={st.lIcon}>🎭</span> Metin Tarzı / Tonu</label>
              <div style={st.toneGrid}>
                {TONES.map((t) => (
                  <button key={t.value} onClick={() => setTone(t.value)} style={{ ...st.toneBtn, ...(tone === t.value ? st.toneBtnActive : {}) }}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={st.section}>
              <label style={st.sLabel}><span style={st.lIcon}>🔢</span> Kelime Sayısı: <span style={{ color: "#60a5fa", fontWeight: 700 }}>{wordCount}</span></label>
              <input type="range" min="30" max="300" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} style={st.slider} />
              <div style={st.sliderLabels}><span>30</span><span>100</span><span>200</span><span>300</span></div>
            </div>
            <div style={st.section}>
              <label style={st.sLabel}><span style={st.lIcon}>💡</span> Metin Konusu</label>
              <input type="text" placeholder={language === "de" ? "z.B. Mein Lieblingshobby" : "e.g. My favorite hobby"} value={topic} onChange={(e) => setTopic(e.target.value)} style={st.topicInput} onKeyDown={(e) => e.key === "Enter" && generateText()} />
              <div style={st.quickTopics}>
                {(language === "de" ? ["Reisen", "Familie", "Arbeit", "Gesundheit", "Technologie", "Essen", "Ausbildung", "Wohnung"] : ["Travel", "Family", "Work", "Health", "Technology", "Food", "Education", "Housing"]).map((t) => (
                  <button key={t} onClick={() => setTopic(t)} style={st.quickTopic}>{t}</button>
                ))}
              </div>
            </div>
            <button onClick={generateText} disabled={isLoading || !topic.trim()} style={{ ...st.generateBtn, ...(isLoading || !topic.trim() ? st.genBtnOff : {}) }}>
              {isLoading ? <span style={st.loadFlex}><svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg> Üretiliyor...</span> : <>🚀 Metni Oluştur</>}
            </button>
            {error && <div style={st.errorBox}>{error}</div>}
          </div>

          <div style={st.resultPanel} ref={resultRef}>
            {generatedText ? (
              <>
                <div style={st.resultHeader}>
                  <div style={st.rBadges}>
                    <span style={{ ...st.badge, background: selectedLevel.color + "22", color: selectedLevel.color }}>{selectedLevel.value}</span>
                    <span style={st.badge}>{selectedLang.flag} {selectedLang.labelEn}</span>
                    <span style={st.badge}>{selectedTone.icon} {selectedTone.label}</span>
                  </div>
                  <button onClick={() => navigator.clipboard?.writeText(generatedText)} style={st.copyBtn}>📋 Kopyala</button>
                </div>

                <div style={st.toolRow}>
                  <ToolBtn icon={isSpeaking ? "⏹️" : "🔊"} label={isSpeaking ? "Durdur" : "Sesli Oku"} onClick={speakText} active={isSpeaking} />
                  <ToolBtn icon="🔄" label="Çevir" onClick={translateText} active={showTranslation} loading={isTranslating} />
                  <ToolBtn icon="📝" label="Gramer" onClick={analyzeGrammar} active={showGrammar} loading={isGrammarLoading} />
                  <ToolBtn icon="📚" label="Kelimeler" onClick={extractVocab} active={showVocab} loading={isVocabLoading} />
                </div>

                {isSpeaking && (
                  <div style={st.ttsBar}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>🐢</span>
                    <input type="range" min="0.5" max="1.5" step="0.05" value={speechRate} onChange={(e) => setSpeechRate(Number(e.target.value))} style={{ ...st.slider, flex: 1 }} />
                    <span style={{ fontSize: 12, color: "#64748b" }}>🐇</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 36 }}>{speechRate.toFixed(2)}x</span>
                  </div>
                )}

                {showTranslation ? (
                  <div style={st.transContainer}>
                    <div style={st.transCol}>
                      <div style={st.transHead}><span>{selectedLang.flag}</span> <strong>Orijinal</strong></div>
                      <div style={st.transText}>{generatedText}</div>
                    </div>
                    <div style={st.transDivider} />
                    <div style={st.transCol}>
                      <div style={st.transHead}><span>🇹🇷</span> <strong>Türkçe Çeviri</strong></div>
                      <div style={st.transText}>{isTranslating ? <Spinner text="Çevriliyor..." /> : translatedText}</div>
                    </div>
                  </div>
                ) : (
                  <div style={st.resultText}>{generatedText}</div>
                )}

                {showGrammar && (
                  <div style={st.aSection}>
                    <h3 style={st.aTitle}>📝 Gramer Analizi</h3>
                    {isGrammarLoading ? <Spinner color="#a78bfa" text="Gramer analiz ediliyor..." /> : grammarAnalysis.length > 0 ? (
                      <div style={st.gGrid}>
                        {grammarAnalysis.map((g, i) => (
                          <div key={i} style={st.gCard}>
                            <div style={st.gHead}>
                              <span style={st.gStruct}>{g.structure}</span>
                              <span style={{ ...st.gLevel, background: (CEFR_LEVELS.find((l) => l.value === g.level)?.color || "#64748b") + "22", color: CEFR_LEVELS.find((l) => l.value === g.level)?.color || "#64748b" }}>{g.level}</span>
                            </div>
                            <div style={st.gExample}>"{g.example}"</div>
                            <div style={st.gExplain}>{g.explanation}</div>
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ color: "#94a3b8", textAlign: "center" }}>Analiz yapılamadı.</p>}
                  </div>
                )}

                {showVocab && (
                  <div style={st.aSection}>
                    <h3 style={st.aTitle}>📚 Kelime Listesi</h3>
                    {isVocabLoading ? <Spinner text="Kelimeler çıkarılıyor..." /> : vocabList.length > 0 ? (
                      <div style={st.vGrid}>
                        {vocabList.map((v, i) => (
                          <div key={i} style={st.vCard}>
                            <div style={st.vWordRow}>
                              <span style={st.vWord}>{v.article ? `${v.article} ` : ""}{v.word}</span>
                              <span style={st.vType}>{v.type}</span>
                            </div>
                            <div style={st.vTrans}>{v.translation}</div>
                            <div style={st.vEx}>{v.example}</div>
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ color: "#94a3b8", textAlign: "center" }}>Kelime bulunamadı.</p>}
                  </div>
                )}
              </>
            ) : (
              <div style={st.empty}>
                <div style={st.emptyIcon}>{language === "de" ? "🇩🇪" : "🇬🇧"}</div>
                <h3 style={st.emptyTitle}>{language === "de" ? "Bereit zum Schreiben!" : "Ready to Write!"}</h3>
                <p style={st.emptyDesc}>Ayarları seçin, bir konu yazın ve "Metni Oluştur" butonuna tıklayın.</p>
                <div style={st.featureGrid}>
                  {[
                    { icon: "🔊", title: "Sesli Okuma", desc: "Doğru telaffuzu dinleyin" },
                    { icon: "🔄", title: "Çeviri Modu", desc: "Yan yana Türkçe çeviri" },
                    { icon: "📝", title: "Gramer Analizi", desc: "Yapıları Türkçe açıklama" },
                    { icon: "📚", title: "Kelime Listesi", desc: "Otomatik kelime çıkarma" },
                  ].map((f, i) => (
                    <div key={i} style={st.featureItem}>
                      <span style={{ fontSize: 22 }}>{f.icon}</span>
                      <div><strong>{f.title}</strong><br /><span style={{ fontSize: 11, color: "#64748b" }}>{f.desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={st.historyPanel}>
          {history.length === 0 ? (
            <div style={{ ...st.empty, minHeight: 300 }}>
              <div style={st.emptyIcon}>📋</div>
              <h3 style={st.emptyTitle}>Henüz geçmiş yok</h3>
              <p style={st.emptyDesc}>Metin ürettikçe burada görünecek.</p>
            </div>
          ) : history.map((item, i) => (
            <div key={i} style={st.hCard}>
              <div style={st.hMeta}>
                <span style={st.badge}>{LANGUAGES.find((l) => l.value === item.language)?.flag} {item.level}</span>
                <span style={st.badge}>{item.topic}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{new Date(item.timestamp).toLocaleTimeString("tr-TR")}</span>
              </div>
              <p style={st.hText}>{item.text.slice(0, 150)}...</p>
              <button onClick={() => { setGeneratedText(item.text); setLanguage(item.language); setLevel(item.level); setTone(item.tone); setTopic(item.topic); setActiveTab("generate"); }} style={st.hBtn}>Tekrar Göster →</button>
            </div>
          ))}
        </div>
      )}

      <footer style={st.footer}>
        <div style={st.footerInner}>
          <div style={st.fBrand}>
            <div style={st.fLogo}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg></div>
            <span style={st.fTitle}>LingvoForge</span>
          </div>
          <div style={st.fCredit}>
            <div style={st.fCreditLine}><span>⚡</span> Tasarlayan & Geliştiren</div>
            <div style={st.fCreditName}>Muhammed Mustafa Bayraktar</div>
          </div>
          <div style={st.fMeta}>
            <span style={st.fBadge}>Claude AI ile güçlendirilmiştir</span>
            <span style={{ fontSize: 11, color: "#475569" }}>© 2025</span>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.1); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-20px,30px) scale(0.9); } }
        @keyframes float3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(15px,15px); } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        html, body { margin: 0; padding: 0; }
        input[type="range"] { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px; background: linear-gradient(90deg, #1e3a5f, #60a5fa); outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #60a5fa; cursor: pointer; border: 3px solid #0f172a; }
        * { box-sizing: border-box; margin: 0; }
        @media (max-width: 768px) {
          #root > div > div:nth-child(6) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const st = {
  container: { fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #0b0f1a 0%, #0f172a 40%, #1a1f3a 100%)", color: "#e2e8f0", padding: "20px 20px 0", position: "relative", overflow: "hidden" },
  bgOrb1: { position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", top: -100, right: -100, animation: "float1 8s ease-in-out infinite", pointerEvents: "none" },
  bgOrb2: { position: "fixed", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)", bottom: -50, left: -50, animation: "float2 10s ease-in-out infinite", pointerEvents: "none" },
  bgOrb3: { position: "fixed", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)", top: "40%", left: "50%", animation: "float3 6s ease-in-out infinite", pointerEvents: "none" },
  header: { maxWidth: 1100, margin: "0 auto 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  logoArea: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },
  titleText: { margin: 0, fontSize: 26, fontWeight: 700, background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Space Mono', monospace" },
  subtitle: { margin: 0, fontSize: 12, color: "#64748b", letterSpacing: 1 },
  langPills: { display: "flex", gap: 8 },
  langPill: { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, border: "1.5px solid #1e293b", background: "rgba(15,23,42,0.6)", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" },
  langPillActive: { borderColor: "#3b82f6", background: "rgba(59,130,246,0.1)", color: "#60a5fa", boxShadow: "0 0 20px rgba(59,130,246,0.15)" },
  tabs: { maxWidth: 1100, margin: "0 auto 20px", display: "flex", gap: 4, background: "rgba(15,23,42,0.5)", borderRadius: 14, padding: 4, border: "1px solid #1e293b" },
  tab: { flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", background: "transparent", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" },
  tabActive: { background: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  mainGrid: { maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 },
  settingsPanel: { background: "rgba(15,23,42,0.7)", borderRadius: 20, padding: 24, border: "1px solid #1e293b", backdropFilter: "blur(20px)", animation: "fadeIn 0.4s ease-out" },
  section: { marginBottom: 22 },
  sLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  lIcon: { fontSize: 16 },
  cefrGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  cefrBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 8px", borderRadius: 12, border: "1.5px solid #1e293b", background: "rgba(30,41,59,0.5)", color: "#94a3b8", cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" },
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  typeBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 8px", borderRadius: 12, border: "1.5px solid #1e293b", background: "rgba(30,41,59,0.5)", color: "#94a3b8", cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" },
  typeBtnActive: { borderColor: "#8b5cf6", background: "rgba(139,92,246,0.12)", color: "#a78bfa" },
  toneGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  toneBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1.5px solid #1e293b", background: "rgba(30,41,59,0.5)", color: "#94a3b8", cursor: "pointer", fontSize: 13, transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" },
  toneBtnActive: { borderColor: "#3b82f6", background: "rgba(59,130,246,0.12)", color: "#60a5fa" },
  slider: { width: "100%", cursor: "pointer" },
  sliderLabels: { display: "flex", justifyContent: "space-between", fontSize: 10, color: "#475569", marginTop: 4 },
  topicInput: { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #1e293b", background: "rgba(30,41,59,0.6)", color: "#e2e8f0", fontSize: 15, outline: "none", fontFamily: "'DM Sans', sans-serif" },
  quickTopics: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
  quickTopic: { padding: "4px 10px", borderRadius: 8, border: "1px solid #1e293b", background: "rgba(30,41,59,0.4)", color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  generateBtn: { width: "100%", padding: "14px 24px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 20px rgba(59,130,246,0.3)" },
  genBtnOff: { opacity: 0.5, cursor: "not-allowed" },
  loadFlex: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  errorBox: { marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 13 },
  resultPanel: { background: "rgba(15,23,42,0.7)", borderRadius: 20, padding: 24, border: "1px solid #1e293b", backdropFilter: "blur(20px)", minHeight: 400, display: "flex", flexDirection: "column", animation: "fadeIn 0.4s ease-out 0.1s both" },
  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 },
  rBadges: { display: "flex", gap: 6, flexWrap: "wrap" },
  badge: { padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(30,41,59,0.8)", color: "#94a3b8", border: "1px solid #1e293b" },
  copyBtn: { padding: "6px 14px", borderRadius: 10, border: "1px solid #1e293b", background: "rgba(30,41,59,0.6)", color: "#94a3b8", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  toolRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  toolBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1.5px solid #1e293b", background: "rgba(30,41,59,0.5)", color: "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif", flex: "1 1 auto", justifyContent: "center" },
  ttsBar: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 12px", borderRadius: 10, background: "rgba(30,41,59,0.4)", border: "1px solid #1e293b" },
  resultText: { fontSize: 16, lineHeight: 1.8, color: "#cbd5e1", whiteSpace: "pre-wrap", flex: 1 },
  transContainer: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 0, flex: 1, animation: "fadeIn 0.3s ease-out" },
  transCol: { padding: "0 12px" },
  transHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 14, color: "#e2e8f0" },
  transText: { fontSize: 15, lineHeight: 1.8, color: "#cbd5e1", whiteSpace: "pre-wrap" },
  transDivider: { width: 1, background: "linear-gradient(180deg, transparent, #1e293b, #3b82f6, #1e293b, transparent)", margin: "0 4px" },
  miniLoader: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 20, color: "#64748b" },
  aSection: { marginTop: 20, paddingTop: 20, borderTop: "1px solid #1e293b", animation: "fadeIn 0.3s ease-out" },
  aTitle: { margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#e2e8f0" },
  gGrid: { display: "grid", gap: 10 },
  gCard: { padding: "14px 16px", borderRadius: 12, background: "rgba(30,41,59,0.6)", border: "1px solid #1e293b", borderLeft: "3px solid #a78bfa" },
  gHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  gStruct: { fontSize: 14, fontWeight: 700, color: "#a78bfa" },
  gLevel: { fontSize: 10, padding: "2px 8px", borderRadius: 6, fontWeight: 700 },
  gExample: { fontSize: 13, color: "#60a5fa", fontStyle: "italic", marginBottom: 6, padding: "4px 8px", borderRadius: 6, background: "rgba(59,130,246,0.08)" },
  gExplain: { fontSize: 13, color: "#94a3b8", lineHeight: 1.6 },
  vGrid: { display: "grid", gap: 10 },
  vCard: { padding: "12px 16px", borderRadius: 12, background: "rgba(30,41,59,0.6)", border: "1px solid #1e293b" },
  vWordRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  vWord: { fontSize: 15, fontWeight: 700, color: "#60a5fa" },
  vType: { fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(139,92,246,0.15)", color: "#a78bfa", textTransform: "uppercase" },
  vTrans: { fontSize: 14, color: "#fbbf24", marginBottom: 4 },
  vEx: { fontSize: 12, color: "#64748b", fontStyle: "italic" },
  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 30 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#e2e8f0" },
  emptyDesc: { margin: "0 0 24px", fontSize: 14, color: "#64748b", maxWidth: 300 },
  featureGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 360 },
  featureItem: { display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, background: "rgba(30,41,59,0.4)", border: "1px solid #1e293b", textAlign: "left", fontSize: 13, color: "#cbd5e1" },
  historyPanel: { maxWidth: 1100, margin: "0 auto", display: "grid", gap: 12 },
  hCard: { background: "rgba(15,23,42,0.7)", borderRadius: 16, padding: 20, border: "1px solid #1e293b" },
  hMeta: { display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" },
  hText: { fontSize: 14, color: "#94a3b8", lineHeight: 1.6, margin: "0 0 10px" },
  hBtn: { padding: "6px 14px", borderRadius: 8, border: "1px solid #1e293b", background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" },
  footer: { marginTop: 40, borderTop: "1px solid #1e293b", background: "rgba(8,12,24,0.8)", backdropFilter: "blur(20px)", padding: "24px 20px", marginLeft: -20, marginRight: -20 },
  footerInner: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  fBrand: { display: "flex", alignItems: "center", gap: 8 },
  fLogo: { width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },
  fTitle: { fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono', monospace", background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  fCredit: { textAlign: "center" },
  fCreditLine: { display: "flex", alignItems: "center", gap: 6, justifyContent: "center", fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  fCreditName: { fontSize: 16, fontWeight: 700, background: "linear-gradient(135deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 0.5 },
  fMeta: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  fBadge: { fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" },
};
