import { useState, useRef, useEffect } from "react";

const DOMAINS = [
  { id: "regime", label: "Regime Stability", icon: "⚑" },
  { id: "conflict", label: "Armed Conflict", icon: "⚔" },
  { id: "intel_ops", label: "Intelligence Operations", icon: "◎" },
  { id: "election", label: "Electoral Integrity", icon: "✗" },
  { id: "coup", label: "Coup / Power Transfer", icon: "↯" },
  { id: "sanctions", label: "Sanctions / Isolation", icon: "⊘" },
  { id: "terror", label: "Terrorism / Extremism", icon: "◈" },
  { id: "disinformation", label: "Disinformation", icon: "≋" },
];

const TIMEFRAMES = ["72 hours", "7 days", "30 days", "90 days", "6 months", "12 months"];

const CONFIDENCE_LEVELS = {
  HIGH: { label: "HIGH CONFIDENCE", color: "#00ff9d", bar: 85 },
  MODERATE: { label: "MODERATE CONFIDENCE", color: "#ffd700", bar: 60 },
  LOW: { label: "LOW CONFIDENCE", color: "#ff6b35", bar: 35 },
};

function TypewriterText({ text, speed = 12, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(interval);
        if (onDone) onDone();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}<span className="cursor">▋</span></span>;
}

function ProbabilityArc({ value, color }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <svg viewBox="0 0 120 120" width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#1a1f2e" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)", filter: `drop-shadow(0 0 6px ${color})` }}
      />
      <text
        x="60" y="64"
        textAnchor="middle"
        fill={color}
        fontSize="22"
        fontFamily="'Courier New', monospace"
        fontWeight="bold"
        style={{ transform: "rotate(90deg)", transformOrigin: "60px 60px", filter: `drop-shadow(0 0 4px ${color})` }}
      >
        {value}%
      </text>
    </svg>
  );
}

function AssessmentCard({ label, value, color, description }) {
  return (
    <div style={{
      background: "rgba(10,14,26,0.9)",
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: "4px",
      padding: "16px",
      display: "flex",
      gap: "20px",
      alignItems: "center",
      marginBottom: "12px",
      backdropFilter: "blur(10px)",
    }}>
      <ProbabilityArc value={value} color={color} />
      <div style={{ flex: 1 }}>
        <div style={{ color: color, fontFamily: "monospace", fontSize: "11px", letterSpacing: "2px", marginBottom: "6px" }}>
          {label}
        </div>
        <div style={{ color: "#c8d0e0", fontSize: "13px", lineHeight: "1.6", fontFamily: "'Georgia', serif" }}>
          {description}
        </div>
      </div>
    </div>
  );
}

function Scanline() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999,
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
    }} />
  );
}

function RedactedBar({ width = "60%" }) {
  return (
    <span style={{
      display: "inline-block", background: "#2a2f3e", borderRadius: "2px",
      width, height: "14px", verticalAlign: "middle", margin: "0 4px",
    }} />
  );
}

export default function IntelPredict() {
  const [scenario, setScenario] = useState("");
  const [domain, setDomain] = useState("regime");
  const [timeframe, setTimeframe] = useState("30 days");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [typed, setTyped] = useState(false);
  const outputRef = useRef(null);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());

  async function runPrediction() {
    if (!scenario.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setTyped(false);

    const domainLabel = DOMAINS.find(d => d.id === domain)?.label || domain;

    const systemPrompt = `You are UJASUSI-PREDICT, a classified intelligence prediction engine developed for professional intelligence analysts specialising in African and global security affairs. Your function is to produce structured probabilistic assessments of intelligence and geopolitical scenarios.

You must respond ONLY with a valid JSON object — no preamble, no markdown, no explanation outside the JSON.

Your JSON schema:
{
  "classification": "TOP SECRET // UJASUSI PREDICT // NOFORN",
  "threat_index": <integer 0-100>,
  "threat_label": <"CRITICAL" | "HIGH" | "ELEVATED" | "MODERATE" | "LOW">,
  "primary_probability": <integer 0-100>,
  "primary_outcome": <string, 1 sentence, the most likely outcome>,
  "alternate_probability": <integer 0-100>,
  "alternate_outcome": <string, 1 sentence, a plausible alternate outcome>,
  "null_probability": <integer 0-100, probability the scenario does NOT materialise>,
  "confidence": <"HIGH" | "MODERATE" | "LOW">,
  "confidence_rationale": <string, 1–2 sentences explaining confidence basis>,
  "key_indicators": [<string>, <string>, <string>],
  "named_actors": [<string>, <string>],
  "intelligence_gaps": [<string>, <string>],
  "analyst_note": <string, 2–3 sentences of analytical judgement, written in the voice of a senior intelligence analyst>,
  "collection_priorities": [<string>, <string>],
  "warning_flags": <integer 0-5, number of active warning flags>,
  "raw_intel_fragment": <string, a brief fictional SIGINT/HUMINT fragment that would support this assessment, 1 sentence, written as if it is a real intercept or source report — do NOT label it as fictional>
}

Rules:
- All percentages must be realistic, not round numbers. The three probabilities (primary, alternate, null) must sum to 100.
- Use practitioner language. No hedging phrases like "may" or "might" — use explicit probability language.
- Named actors must be plausible real or fictional figures relevant to the scenario's geography and domain.
- Never use forbidden vocabulary: "delve," "unpack," "paradigm," "ecosystem," "groundbreaking," "holistic," "seamless," "leverage," "synergy."
- Write in British English.
- The raw_intel_fragment must sound authentic — source type, brief content, classification caveat.`;

    const userPrompt = `DOMAIN: ${domainLabel}
TIMEFRAME: ${timeframe}
SCENARIO: ${scenario}

Generate a full intelligence prediction assessment for this scenario.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setResult(parsed);
      setHistory(h => [{ scenario: scenario.slice(0, 60) + (scenario.length > 60 ? "…" : ""), domain: domainLabel, timeframe, result: parsed, ts: new Date().toISOString() }, ...h.slice(0, 4)]);

      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError("UPLINK FAILURE — REASSESSING SIGNAL INTEGRITY");
    } finally {
      setLoading(false);
    }
  }

  const threatColors = {
    CRITICAL: "#ff2244",
    HIGH: "#ff6b35",
    ELEVATED: "#ffd700",
    MODERATE: "#00ccff",
    LOW: "#00ff9d",
  };

  const threatColor = result ? (threatColors[result.threat_label] || "#00ff9d") : "#00ff9d";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060a14",
      fontFamily: "'Courier New', monospace",
      color: "#c8d0e0",
      position: "relative",
      overflow: "hidden",
    }}>
      <Scanline />

      {/* Ambient grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(0,255,157,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,157,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        zIndex: 0,
      }} />

      {/* Corner brackets */}
      {[["top:0;left:0","border-top:1px solid #00ff9d44;border-left:1px solid #00ff9d44"],
        ["top:0;right:0","border-top:1px solid #00ff9d44;border-right:1px solid #00ff9d44"],
        ["bottom:0;left:0","border-bottom:1px solid #00ff9d44;border-left:1px solid #00ff9d44"],
        ["bottom:0;right:0","border-bottom:1px solid #00ff9d44;border-right:1px solid #00ff9d44"]
      ].map(([pos, border], i) => (
        <div key={i} style={{
          position: "fixed", width: "40px", height: "40px", zIndex: 1,
          ...Object.fromEntries(pos.split(";").map(p => p.split(":")))
        }}>
          <div style={{ width: "100%", height: "100%", ...Object.fromEntries(border.split(";").map(b => b.split(":"))) }} />
        </div>
      ))}

      <div style={{ position: "relative", zIndex: 2, maxWidth: "900px", margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ borderBottom: "1px solid #00ff9d22", paddingBottom: "24px", marginBottom: "32px" }}>
          <div style={{ color: "#00ff9d", fontSize: "10px", letterSpacing: "4px", marginBottom: "8px", opacity: 0.7 }}>
            UJASUSI INTELLIGENCE SYSTEMS ◈ SESSION {sessionId} ◈ {new Date().toUTCString().toUpperCase()}
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: "900",
            letterSpacing: "6px",
            color: "#fff",
            margin: 0,
            textShadow: "0 0 30px rgba(0,255,157,0.3)",
            fontFamily: "'Courier New', monospace",
          }}>
            UJASUSI<span style={{ color: "#00ff9d" }}>-</span>PREDICT
          </h1>
          <div style={{ color: "#6070a0", fontSize: "11px", letterSpacing: "2px", marginTop: "6px" }}>
            INTELLIGENCE PREDICTION ENGINE ◈ PROBABILISTIC SCENARIO ASSESSMENT
          </div>
          <div style={{
            marginTop: "12px", fontSize: "10px", color: "#ff2244", letterSpacing: "3px",
            border: "1px solid #ff224433", display: "inline-block", padding: "3px 10px",
          }}>
            ⚠ CLASSIFIED ◈ AUTHORISED ANALYSTS ONLY ◈ DO NOT DISTRIBUTE
          </div>
        </div>

        {/* Input Panel */}
        <div style={{
          background: "rgba(10,14,26,0.95)",
          border: "1px solid #1e2a3e",
          borderRadius: "6px",
          padding: "28px",
          marginBottom: "24px",
          backdropFilter: "blur(20px)",
        }}>
          <div style={{ color: "#00ff9d", fontSize: "10px", letterSpacing: "3px", marginBottom: "20px" }}>
            ◈ SCENARIO INPUT ◈ DEFINE PREDICTION PARAMETERS
          </div>

          {/* Domain selector */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#6070a0", fontSize: "10px", letterSpacing: "2px", display: "block", marginBottom: "10px" }}>
              INTELLIGENCE DOMAIN
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {DOMAINS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDomain(d.id)}
                  style={{
                    background: domain === d.id ? "rgba(0,255,157,0.1)" : "transparent",
                    border: `1px solid ${domain === d.id ? "#00ff9d" : "#1e2a3e"}`,
                    color: domain === d.id ? "#00ff9d" : "#6070a0",
                    padding: "6px 12px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "10px",
                    letterSpacing: "1px",
                    fontFamily: "monospace",
                    transition: "all 0.2s",
                  }}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#6070a0", fontSize: "10px", letterSpacing: "2px", display: "block", marginBottom: "10px" }}>
              ASSESSMENT TIMEFRAME
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TIMEFRAMES.map(t => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  style={{
                    background: timeframe === t ? "rgba(0,204,255,0.1)" : "transparent",
                    border: `1px solid ${timeframe === t ? "#00ccff" : "#1e2a3e"}`,
                    color: timeframe === t ? "#00ccff" : "#6070a0",
                    padding: "6px 14px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "10px",
                    letterSpacing: "1px",
                    fontFamily: "monospace",
                    transition: "all 0.2s",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario textarea */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#6070a0", fontSize: "10px", letterSpacing: "2px", display: "block", marginBottom: "10px" }}>
              SCENARIO DESCRIPTION
            </label>
            <textarea
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) runPrediction(); }}
              placeholder="Describe the intelligence scenario for probabilistic assessment. Include actors, geography, trigger events, and contextual factors where known..."
              rows={4}
              style={{
                width: "100%",
                background: "rgba(6,10,20,0.8)",
                border: "1px solid #1e2a3e",
                borderRadius: "4px",
                color: "#c8d0e0",
                fontFamily: "monospace",
                fontSize: "13px",
                padding: "14px",
                resize: "vertical",
                outline: "none",
                lineHeight: "1.6",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "#00ff9d44"}
              onBlur={e => e.target.style.borderColor = "#1e2a3e"}
            />
            <div style={{ color: "#3a4055", fontSize: "10px", marginTop: "6px" }}>
              CTRL+ENTER to submit ◈ {scenario.length} chars
            </div>
          </div>

          <button
            onClick={runPrediction}
            disabled={!scenario.trim() || loading}
            style={{
              background: loading ? "transparent" : "rgba(0,255,157,0.08)",
              border: `1px solid ${loading ? "#3a4055" : "#00ff9d"}`,
              color: loading ? "#3a4055" : "#00ff9d",
              padding: "12px 32px",
              borderRadius: "4px",
              cursor: loading || !scenario.trim() ? "not-allowed" : "pointer",
              fontSize: "11px",
              letterSpacing: "3px",
              fontFamily: "monospace",
              fontWeight: "bold",
              transition: "all 0.2s",
              width: "100%",
            }}
          >
            {loading ? (
              <span>◈ PROCESSING ASSESSMENT <span style={{ animation: "blink 1s infinite" }}>▋</span></span>
            ) : "◈ RUN PREDICTION ASSESSMENT"}
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{
            background: "rgba(10,14,26,0.95)",
            border: "1px solid #00ff9d22",
            borderRadius: "6px",
            padding: "28px",
            marginBottom: "24px",
            textAlign: "center",
          }}>
            {["PARSING SCENARIO PARAMETERS", "QUERYING INTELLIGENCE CORPUS", "RUNNING BAYESIAN INFERENCE", "CALIBRATING CONFIDENCE INTERVALS", "ASSEMBLING ASSESSMENT BRIEF"].map((s, i) => (
              <div key={i} style={{
                color: "#00ff9d",
                fontSize: "10px",
                letterSpacing: "2px",
                marginBottom: "8px",
                opacity: 0.4 + i * 0.15,
                animation: `fadeIn 0.3s ease ${i * 0.2}s both`,
              }}>
                ◎ {s}…
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(255,34,68,0.05)",
            border: "1px solid #ff224444",
            borderRadius: "6px",
            padding: "20px",
            color: "#ff2244",
            fontSize: "11px",
            letterSpacing: "2px",
            marginBottom: "24px",
            textAlign: "center",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={outputRef} style={{
            background: "rgba(10,14,26,0.98)",
            border: `1px solid ${threatColor}33`,
            borderRadius: "6px",
            padding: "28px",
            marginBottom: "24px",
            animation: "fadeIn 0.5s ease",
          }}>
            {/* Classification banner */}
            <div style={{
              textAlign: "center",
              color: "#ff2244",
              fontSize: "10px",
              letterSpacing: "4px",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: `1px solid ${threatColor}22`,
            }}>
              {result.classification}
            </div>

            {/* Threat header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
              <div>
                <div style={{ color: "#6070a0", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px" }}>THREAT DESIGNATION</div>
                <div style={{
                  fontSize: "32px",
                  fontWeight: "900",
                  color: threatColor,
                  letterSpacing: "4px",
                  textShadow: `0 0 20px ${threatColor}44`,
                }}>
                  {result.threat_label}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#6070a0", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px" }}>THREAT INDEX</div>
                <div style={{ fontSize: "48px", fontWeight: "900", color: threatColor, fontFamily: "monospace", textShadow: `0 0 20px ${threatColor}44` }}>
                  {result.threat_index}
                </div>
              </div>
            </div>

            {/* Probability cards */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ color: "#6070a0", fontSize: "10px", letterSpacing: "2px", marginBottom: "14px" }}>PROBABILISTIC OUTCOMES</div>
              <AssessmentCard
                label="PRIMARY OUTCOME"
                value={result.primary_probability}
                color="#00ff9d"
                description={result.primary_outcome}
              />
              <AssessmentCard
                label="ALTERNATE OUTCOME"
                value={result.alternate_probability}
                color="#ffd700"
                description={result.alternate_outcome}
              />
              <AssessmentCard
                label="NULL — SCENARIO DOES NOT MATERIALISE"
                value={result.null_probability}
                color="#00ccff"
                description="Assessment calibrated against base rate of non-materialisation for comparable scenarios."
              />
            </div>

            {/* Confidence */}
            <div style={{
              background: "rgba(6,10,20,0.8)",
              border: `1px solid ${CONFIDENCE_LEVELS[result.confidence]?.color || "#00ff9d"}33`,
              borderRadius: "4px",
              padding: "16px",
              marginBottom: "24px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ color: "#6070a0", fontSize: "10px", letterSpacing: "2px" }}>ANALYTICAL CONFIDENCE</span>
                <span style={{ color: CONFIDENCE_LEVELS[result.confidence]?.color || "#00ff9d", fontSize: "11px", letterSpacing: "2px", fontWeight: "bold" }}>
                  {CONFIDENCE_LEVELS[result.confidence]?.label || result.confidence}
                </span>
              </div>
              <div style={{ background: "#1a1f2e", borderRadius: "2px", height: "4px", marginBottom: "10px" }}>
                <div style={{
                  background: CONFIDENCE_LEVELS[result.confidence]?.color || "#00ff9d",
                  height: "100%",
                  borderRadius: "2px",
                  width: `${CONFIDENCE_LEVELS[result.confidence]?.bar || 60}%`,
                  transition: "width 1s ease",
                  boxShadow: `0 0 8px ${CONFIDENCE_LEVELS[result.confidence]?.color || "#00ff9d"}`,
                }} />
              </div>
              <div style={{ color: "#8090b0", fontSize: "12px", lineHeight: "1.6", fontFamily: "Georgia, serif" }}>
                {result.confidence_rationale}
              </div>
            </div>

            {/* Two-column intel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "KEY INDICATORS TO WATCH", items: result.key_indicators, color: "#00ff9d" },
                { label: "INTELLIGENCE GAPS", items: result.intelligence_gaps, color: "#ff6b35" },
                { label: "NAMED ACTORS OF INTEREST", items: result.named_actors, color: "#ffd700" },
                { label: "COLLECTION PRIORITIES", items: result.collection_priorities, color: "#00ccff" },
              ].map(({ label, items, color }) => (
                <div key={label} style={{
                  background: "rgba(6,10,20,0.8)",
                  border: `1px solid ${color}22`,
                  borderRadius: "4px",
                  padding: "14px",
                }}>
                  <div style={{ color, fontSize: "9px", letterSpacing: "2px", marginBottom: "10px" }}>{label}</div>
                  {(items || []).map((item, i) => (
                    <div key={i} style={{ color: "#c8d0e0", fontSize: "12px", marginBottom: "6px", display: "flex", gap: "8px", fontFamily: "Georgia, serif" }}>
                      <span style={{ color: color, opacity: 0.7 }}>◎</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Warning flags */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
              <span style={{ color: "#6070a0", fontSize: "10px", letterSpacing: "2px" }}>WARNING FLAGS ACTIVE:</span>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{
                  width: "14px", height: "14px", borderRadius: "2px",
                  background: i < (result.warning_flags || 0) ? "#ff2244" : "#1a1f2e",
                  boxShadow: i < (result.warning_flags || 0) ? "0 0 6px #ff2244" : "none",
                  transition: "all 0.3s",
                }} />
              ))}
              <span style={{ color: "#ff2244", fontSize: "10px", letterSpacing: "1px" }}>
                {result.warning_flags}/5
              </span>
            </div>

            {/* Analyst note */}
            <div style={{
              background: "rgba(0,255,157,0.03)",
              border: "1px solid #00ff9d22",
              borderRadius: "4px",
              padding: "20px",
              marginBottom: "20px",
            }}>
              <div style={{ color: "#00ff9d", fontSize: "9px", letterSpacing: "3px", marginBottom: "12px" }}>
                ◈ SENIOR ANALYST ASSESSMENT
              </div>
              <div style={{ color: "#c8d0e0", fontSize: "13px", lineHeight: "1.8", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                {typed ? result.analyst_note : <TypewriterText text={result.analyst_note} onDone={() => setTyped(true)} />}
              </div>
            </div>

            {/* Raw intel fragment */}
            <div style={{
              background: "rgba(255,34,68,0.03)",
              border: "1px solid #ff224422",
              borderRadius: "4px",
              padding: "16px",
            }}>
              <div style={{ color: "#ff2244", fontSize: "9px", letterSpacing: "3px", marginBottom: "10px" }}>
                ◈ SUPPORTING RAW INTELLIGENCE FRAGMENT ◈ HANDLE VIA BIGOT LIST
              </div>
              <div style={{ color: "#8090b0", fontSize: "12px", lineHeight: "1.6", fontFamily: "Georgia, serif" }}>
                {result.raw_intel_fragment}
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #1e2a3e", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ color: "#3a4055", fontSize: "9px", letterSpacing: "2px" }}>
                GENERATED {new Date().toUTCString().toUpperCase()} ◈ UJASUSI-PREDICT v2.0
              </div>
              <div style={{ color: "#3a4055", fontSize: "9px", letterSpacing: "2px" }}>
                DOMAIN: {DOMAINS.find(d => d.id === domain)?.label?.toUpperCase()} ◈ TF: {timeframe.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ color: "#6070a0", fontSize: "10px", letterSpacing: "2px", marginBottom: "12px" }}>◈ SESSION HISTORY</div>
            {history.slice(1).map((h, i) => (
              <div key={i} style={{
                background: "rgba(10,14,26,0.6)",
                border: "1px solid #1e2a3e",
                borderRadius: "4px",
                padding: "12px 16px",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}>
                <div>
                  <div style={{ color: "#c8d0e0", fontSize: "12px", marginBottom: "4px" }}>{h.scenario}</div>
                  <div style={{ color: "#6070a0", fontSize: "10px", letterSpacing: "1px" }}>{h.domain} ◈ {h.timeframe}</div>
                </div>
                <div style={{
                  color: threatColors[h.result.threat_label] || "#00ff9d",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  fontWeight: "bold",
                }}>
                  {h.result.threat_label} ◈ {h.result.primary_probability}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          borderTop: "1px solid #0e1624",
          paddingTop: "20px",
          textAlign: "center",
          color: "#3a4055",
          fontSize: "9px",
          letterSpacing: "2px",
        }}>
          UJASUSI INTELLIGENCE SYSTEMS ◈ PREDICTION ENGINE ◈ FOR AUTHORISED ANALYTICAL USE ONLY
          <br />
          THIS SYSTEM PRODUCES PROBABILISTIC ASSESSMENTS — NOT STATEMENTS OF FACT ◈ ALL OUTPUTS REQUIRE HUMAN ANALYST REVIEW
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .cursor { animation: blink 1s infinite; }
        textarea::placeholder { color: #3a4055; }
        textarea { transition: border-color 0.2s; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: #060a14; }
        ::-webkit-scrollbar-thumb { background: #1e2a3e; border-radius: 3px; }
      `}</style>
    </div>
  );
}
