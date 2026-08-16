import React from "react";
import { useTheme, DISPLAY } from "../theme.jsx";
import { saveProfile, COUNTRIES, HOBBIES } from "../data";
import { Shell, Button } from "../components/chrome.jsx";

// First-run (and editable) questionnaire — one question per page, skippable at
// any stage. Answers personalise the Sentences "About me" and "Likes" units.

const COUNTRY_OPTS = Object.entries(COUNTRIES).map(([id, v]) => ({ id, label: v.en.replace(/^the /, "") }));
const HOBBY_OPTS = Object.entries(HOBBIES).map(([id, v]) => ({ id, label: v.en[0].toUpperCase() + v.en.slice(1) }));

function Chips({ options, value, onChange, t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(on ? null : o.id)} className="hk-press"
            style={{ padding: "12px 18px", borderRadius: 13, cursor: "pointer",
              background: on ? t.primary : t.surface, border: `1.5px solid ${on ? t.primary : t.line}`,
              color: on ? "#fff" : t.ink, fontFamily: DISPLAY, fontSize: 15, fontWeight: 700 }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ChipsMulti({ options, values, onToggle, t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
      {options.map((o) => {
        const on = values.includes(o.id);
        return (
          <button key={o.id} onClick={() => onToggle(o.id)} className="hk-press"
            style={{ padding: "12px 18px", borderRadius: 13, cursor: "pointer",
              background: on ? t.primary : t.surface, border: `1.5px solid ${on ? t.primary : t.line}`,
              color: on ? "#fff" : t.ink, fontFamily: DISPLAY, fontSize: 15, fontWeight: 700 }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// DOB as three plain number fields (DD / MM / YYYY). Keeps the stored value as an
// ISO "YYYY-MM-DD" string so ageFromDob and everything downstream is unchanged.
function DobInput({ value, onChange, t }) {
  const init = value ? value.split("-") : ["", "", ""]; // [YYYY, MM, DD]
  const [d, setD] = React.useState(init[2] || "");
  const [m, setM] = React.useState(init[1] || "");
  const [y, setY] = React.useState(init[0] || "");
  React.useEffect(() => {
    onChange(d && m && y ? `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "");
  }, [d, m, y]); // eslint-disable-line react-hooks/exhaustive-deps
  const dRef = React.useRef(), mRef = React.useRef(), yRef = React.useRef();
  // auto-advance to the next field once this one is full (DD → MM → YYYY), and
  // backspace on an empty field jumps back to the previous one
  const field = (val, set, ph, len, w, ref, nextRef, prevRef) => (
    <input ref={ref} value={val} inputMode="numeric" placeholder={ph} aria-label={ph}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, "").slice(0, len);
        set(v);
        if (v.length === len && nextRef?.current) nextRef.current.focus();
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace" && !val && prevRef?.current) prevRef.current.focus();
      }}
      style={{ ...inputStyle(t), width: w, textAlign: "center", letterSpacing: "0.06em" }} />
  );
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {field(d, setD, "DD", 2, 72, dRef, mRef, null)}
      {field(m, setM, "MM", 2, 72, mRef, yRef, dRef)}
      {field(y, setY, "YYYY", 4, 104, yRef, null, mRef)}
    </div>
  );
}

function OnboardingBody({ initial, onDone, registerBack }) {
  const { t } = useTheme();
  const [data, setData] = React.useState(() => {
    const base = { name: "", dob: "", country: null, pets: null, occupation: null, hobbies: [], ...(initial || {}) };
    // migrate the old single-hobby field if present
    if (base.hobby && !base.hobbies.length) base.hobbies = [base.hobby];
    delete base.hobby;
    return base;
  });
  const [step, setStep] = React.useState(0);
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const toggleHobby = (id) => setData((d) => ({
    ...d, hobbies: d.hobbies.includes(id) ? d.hobbies.filter((x) => x !== id) : [...d.hobbies, id],
  }));

  // let the Android back button (via App) walk back through the steps
  React.useEffect(() => {
    if (!registerBack) return;
    registerBack(() => { if (step > 0) { setStep((s) => s - 1); return true; } return false; });
    return () => registerBack(null);
  }, [step, registerBack]);

  const steps = [
    {
      key: "name", title: "What's your name?",
      blurb: "We'll use it in sentences like “My name is …”.",
      render: () => (
        <input value={data.name} onChange={(e) => set("name", e.target.value.slice(0, 24))} autoFocus
          placeholder="Your name" autoCapitalize="words"
          style={inputStyle(t)} onKeyDown={(e) => { if (e.key === "Enter") advance(); }} />
      ),
    },
    {
      key: "dob", title: "When's your birthday?",
      blurb: "So “I am … years old” always matches your age.",
      render: () => <DobInput t={t} value={data.dob} onChange={(v) => set("dob", v)} />,
    },
    {
      key: "country", title: "Where are you from?",
      blurb: "For sentences like “I'm from …”.",
      render: () => <Chips t={t} options={COUNTRY_OPTS} value={data.country} onChange={(v) => set("country", v)} />,
    },
    {
      key: "pets", title: "Do you have any pets?",
      blurb: "We'll mention them when you talk about yourself.",
      render: () => <Chips t={t} options={[
        { id: "cat", label: "Cat" }, { id: "dog", label: "Dog" },
        { id: "both", label: "Cat & dog" }, { id: "none", label: "No pets" },
      ]} value={data.pets} onChange={(v) => set("pets", v)} />,
    },
    {
      key: "occupation", title: "Do you study or work?",
      blurb: "For “I am a student” / “I work”.",
      render: () => <Chips t={t} options={[
        { id: "study", label: "I study" }, { id: "work", label: "I work" },
      ]} value={data.occupation} onChange={(v) => set("occupation", v)} />,
    },
    {
      key: "hobby", title: "What do you enjoy?",
      blurb: "Pick any you like — we'll lead the Likes unit with them.",
      render: () => <ChipsMulti t={t} options={HOBBY_OPTS} values={data.hobbies} onToggle={toggleHobby} />,
    },
  ];

  const last = step === steps.length - 1;
  const finish = () => { saveProfile({ ...data, skipped: false }); onDone(); };
  const advance = () => (last ? finish() : setStep((s) => s + 1));
  const skipStep = () => (last ? finish() : setStep((s) => s + 1));
  const skipAll = () => {
    // keep anything already answered, but don't block on the rest
    const answered = !!(data.name || data.dob || data.country || data.pets || data.occupation || data.hobbies.length);
    saveProfile(answered ? { ...data, skipped: false } : { skipped: true });
    onDone();
  };
  const cur = steps[step];

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 22px 24px", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="hk-press" aria-label="Back"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: t.ink, padding: "4px 6px 4px 0", display: "flex" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>HeroKana</h1>
        <div style={{ flex: 1 }} />
        <button onClick={skipAll} className="hk-press" style={{ background: "transparent", border: "none", cursor: "pointer",
          color: t.sub, fontFamily: DISPLAY, fontSize: 13, fontWeight: 700, padding: "6px 4px" }}>Skip all</button>
      </header>

      {/* progress dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 26 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, transition: "background 200ms",
            background: i <= step ? t.primary : t.line }} />
        ))}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 11.5, letterSpacing: "0.14em", fontWeight: 900, color: t.ink }}>
          ABOUT YOU · {step + 1} OF {steps.length}
        </p>
        <h2 style={{ margin: "10px 0 0", fontSize: 25, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>{cur.title}</h2>
        <p style={{ margin: "8px 0 22px", fontSize: 14, color: t.sub, fontWeight: 600, lineHeight: 1.45 }}>{cur.blurb}</p>
        {cur.render()}
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 28 }}>
        <Button onClick={advance} style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 16 }}>
          {last ? "Save & start learning" : "Next →"}
        </Button>
        <button onClick={skipStep} className="hk-press"
          style={{ width: "100%", padding: "12px", borderRadius: 16, border: "none", cursor: "pointer",
            background: "transparent", color: t.sub, fontFamily: DISPLAY, fontSize: 14, fontWeight: 700 }}>
          {last ? "Skip & finish" : "Skip this question"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = (t) => ({
  width: "100%", padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${t.line}`,
  background: t.surface, color: t.ink, fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, outline: "none",
});

export default function Onboarding({ initial, onDone, registerBack }) {
  return <Shell nav={false}><OnboardingBody initial={initial} onDone={onDone} registerBack={registerBack} /></Shell>;
}
