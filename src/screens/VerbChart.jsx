import React from "react";
import { useTheme, JP, DISPLAY } from "../theme.jsx";
import { speak, useJaVoice } from "../speech.js";
import { NoVoiceHint } from "../components/chrome.jsx";

const GROUPS = [
  {
    id: "ru", label: "RU verbs", sub: "Group 2 · ichidan",
    verbs: [
      { jp: "食べる", r: "たべる", romaji: "taberu",   en: "eat",          masu: "食べます", masuR: "tabemasu",   ta: "食べた",   taR: "tabeta",     te: "食べて",   teR: "tabete",     nai: "食べない", naiR: "tabenai" },
      { jp: "見る",   r: "みる",   romaji: "miru",     en: "see / watch",  masu: "見ます",   masuR: "mimasu",     ta: "見た",     taR: "mita",       te: "見て",     teR: "mite",       nai: "見ない",   naiR: "minai" },
      { jp: "起きる", r: "おきる", romaji: "okiru",    en: "wake up",      masu: "起きます", masuR: "okimasu",    ta: "起きた",   taR: "okita",      te: "起きて",   teR: "okite",      nai: "起きない", naiR: "okinai" },
      { jp: "寝る",   r: "ねる",   romaji: "neru",     en: "sleep",        masu: "寝ます",   masuR: "nemasu",     ta: "寝た",     taR: "neta",       te: "寝て",     teR: "nete",       nai: "寝ない",   naiR: "nenai" },
      { jp: "着る",   r: "きる",   romaji: "kiru",     en: "wear",         masu: "着ます",   masuR: "kimasu",     ta: "着た",     taR: "kita",       te: "着て",     teR: "kite",       nai: "着ない",   naiR: "kinai" },
      { jp: "開ける", r: "あける", romaji: "akeru",    en: "open",         masu: "開けます", masuR: "akemasu",    ta: "開けた",   taR: "aketa",      te: "開けて",   teR: "akete",      nai: "開けない", naiR: "akenai" },
      { jp: "閉める", r: "しめる", romaji: "shimeru",  en: "close",        masu: "閉めます", masuR: "shimemasu",  ta: "閉めた",   taR: "shimeta",    te: "閉めて",   teR: "shimete",    nai: "閉めない", naiR: "shimenai" },
      { jp: "教える", r: "おしえる",romaji: "oshieru", en: "teach",        masu: "教えます", masuR: "oshiemasu",  ta: "教えた",   taR: "oshieta",    te: "教えて",   teR: "oshiete",    nai: "教えない", naiR: "oshienai" },
      { jp: "出る",   r: "でる",   romaji: "deru",     en: "leave / exit", masu: "出ます",   masuR: "demasu",     ta: "出た",     taR: "deta",       te: "出て",     teR: "dete",       nai: "出ない",   naiR: "denai" },
      { jp: "いる",   r: "いる",   romaji: "iru",      en: "be / exist",   masu: "います",   masuR: "imasu",      ta: "いた",     taR: "ita",        te: "いて",     teR: "ite",        nai: "いない",   naiR: "inai" },
      { jp: "出来る", r: "できる", romaji: "dekiru",   en: "can / be able",masu: "出来ます", masuR: "dekimasu",   ta: "出来た",   taR: "dekita",     te: "出来て",   teR: "dekite",     nai: "出来ない", naiR: "dekinai" },
      { jp: "覚える", r: "おぼえる",romaji: "oboeru",  en: "remember",     masu: "覚えます", masuR: "oboemasu",   ta: "覚えた",   taR: "oboeta",     te: "覚えて",   teR: "oboete",     nai: "覚えない", naiR: "oboenai" },
    ],
  },
  {
    id: "u", label: "U verbs", sub: "Group 1 · godan",
    verbs: [
      { jp: "行く",   r: "いく",   romaji: "iku",      en: "go",           masu: "行きます", masuR: "ikimasu",    ta: "行った",   taR: "itta",       te: "行って",   teR: "itte",       nai: "行かない", naiR: "ikanai" },
      { jp: "飲む",   r: "のむ",   romaji: "nomu",     en: "drink",        masu: "飲みます", masuR: "nomimasu",   ta: "飲んだ",   taR: "nonda",      te: "飲んで",   teR: "nonde",      nai: "飲まない", naiR: "nomanai" },
      { jp: "書く",   r: "かく",   romaji: "kaku",     en: "write",        masu: "書きます", masuR: "kakimasu",   ta: "書いた",   taR: "kaita",      te: "書いて",   teR: "kaite",      nai: "書かない", naiR: "kakanai" },
      { jp: "話す",   r: "はなす", romaji: "hanasu",   en: "speak / talk", masu: "話します", masuR: "hanashimasu",ta: "話した",   taR: "hanashita",  te: "話して",   teR: "hanashite",  nai: "話さない", naiR: "hanasanai" },
      { jp: "聞く",   r: "きく",   romaji: "kiku",     en: "listen / ask", masu: "聞きます", masuR: "kikimasu",   ta: "聞いた",   taR: "kiita",      te: "聞いて",   teR: "kiite",      nai: "聞かない", naiR: "kikanai" },
      { jp: "読む",   r: "よむ",   romaji: "yomu",     en: "read",         masu: "読みます", masuR: "yomimasu",   ta: "読んだ",   taR: "yonda",      te: "読んで",   teR: "yonde",      nai: "読まない", naiR: "yomanai" },
      { jp: "買う",   r: "かう",   romaji: "kau",      en: "buy",          masu: "買います", masuR: "kaimasu",    ta: "買った",   taR: "katta",      te: "買って",   teR: "katte",      nai: "買わない", naiR: "kawanai" },
      { jp: "帰る",   r: "かえる", romaji: "kaeru",    en: "return home",  masu: "帰ります", masuR: "kaerimasu",  ta: "帰った",   taR: "kaetta",     te: "帰って",   teR: "kaette",     nai: "帰らない", naiR: "kaeranai" },
      { jp: "作る",   r: "つくる", romaji: "tsukuru",  en: "make / create",masu: "作ります", masuR: "tsukurimasu",ta: "作った",   taR: "tsukutta",   te: "作って",   teR: "tsukutte",   nai: "作らない", naiR: "tsukuranai" },
      { jp: "会う",   r: "あう",   romaji: "au",       en: "meet",         masu: "会います", masuR: "aimasu",     ta: "会った",   taR: "atta",       te: "会って",   teR: "atte",       nai: "会わない", naiR: "awanai" },
      { jp: "ある",   r: "ある",   romaji: "aru",      en: "exist (thing)",masu: "あります", masuR: "arimasu",    ta: "あった",   taR: "atta",       te: "あって",   teR: "atte",       nai: "ない",     naiR: "nai" },
      { jp: "わかる", r: "わかる", romaji: "wakaru",   en: "understand",   masu: "わかります",masuR: "wakarimasu", ta: "わかった", taR: "wakatta",    te: "わかって", teR: "wakatte",    nai: "わからない",naiR: "wakaranai" },
      { jp: "持つ",   r: "もつ",   romaji: "motsu",    en: "hold / have",  masu: "持ちます", masuR: "mochimasu",  ta: "持った",   taR: "motta",      te: "持って",   teR: "motte",      nai: "持たない", naiR: "motanai" },
      { jp: "使う",   r: "つかう", romaji: "tsukau",   en: "use",          masu: "使います", masuR: "tsukaimasu", ta: "使った",   taR: "tsukatta",   te: "使って",   teR: "tsukatte",   nai: "使わない", naiR: "tsukawanai" },
    ],
  },
  {
    id: "irr", label: "Irregular", sub: "Group 3 · special",
    verbs: [
      { jp: "する",   r: "する",   romaji: "suru",     en: "do",           masu: "します",   masuR: "shimasu",    ta: "した",     taR: "shita",      te: "して",     teR: "shite",      nai: "しない",   naiR: "shinai" },
      { jp: "くる",   r: "くる",   romaji: "kuru",     en: "come",         masu: "きます",   masuR: "kimasu",     ta: "きた",     taR: "kita",       te: "きて",     teR: "kite",       nai: "こない",   naiR: "konai" },
      { jp: "です",   r: "です",   romaji: "desu",     en: "be (polite)",  masu: "です",     masuR: "desu",       ta: "でした",   taR: "deshita",    te: "で",       teR: "de",         nai: "じゃない", naiR: "ja nai" },
    ],
  },
];

const FORMS = [
  { key: "masu", romKey: "masuR", label: "Polite" },
  { key: "ta",   romKey: "taR",   label: "Past" },
  { key: "te",   romKey: "teR",   label: "Te-form" },
  { key: "nai",  romKey: "naiR",  label: "Negative" },
];

export default function VerbChart({ onClose }) {
  const { t } = useTheme();
  const [groupId, setGroupId] = React.useState("ru");
  const [active, setActive] = React.useState(null);
  const hasJa = useJaVoice();

  const group = GROUPS.find((g) => g.id === groupId);

  const tap = (v) => {
    setActive((a) => (a === v.romaji ? null : v.romaji));
    if (hasJa) speak(v.jp);
  };

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, height: "100dvh", zIndex: 1500, background: t.bg,
      display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto", fontFamily: DISPLAY, color: t.ink,
      animation: "hkFade 160ms ease both" }}>

      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "calc(14px + env(safe-area-inset-top)) 20px 12px", flexShrink: 0 }}>
        <button onClick={onClose} className="hk-press" aria-label="Close"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: t.faint, padding: 4, flexShrink: 0, display: "flex" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: t.ink }}>Verb list</h1>
      </header>

      <div style={{ margin: "0 20px 14px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: t.sub, fontWeight: 600, lineHeight: 1.5 }}>
          {hasJa ? "Tap a verb to see its forms and hear it." : "Tap a verb to see its conjugation forms."}
        </p>
        {!hasJa && <NoVoiceHint>Verbs are spoken by your device's Japanese voice, which isn't installed.</NoVoiceHint>}
      </div>

      {/* Group toggle */}
      <div style={{ display: "flex", background: t.sunk, borderRadius: 12, padding: 3, margin: "0 20px 16px", flexShrink: 0 }}>
        {GROUPS.map((g) => {
          const on = g.id === groupId;
          return (
            <button key={g.id} onClick={() => { setGroupId(g.id); setActive(null); }} className="hk-press"
              style={{ flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                background: on ? t.surface : "transparent", color: on ? t.ink : t.sub,
                boxShadow: on ? "0 1px 4px rgba(0,0,0,0.12)" : "none", fontFamily: DISPLAY,
                fontSize: 13, fontWeight: on ? 800 : 600 }}>
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Verb list */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 20px 28px" }}>
        <p style={{ margin: "0 0 12px", fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 700, color: t.faint }}>
          {group.sub.toUpperCase()}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {group.verbs.map((v) => {
            const on = active === v.romaji;
            return (
              <div key={v.romaji} style={{ borderRadius: 18, overflow: "hidden",
                border: `1.5px solid ${on ? t.primary : t.line}`, transition: "border-color 150ms" }}>
                {/* Verb row */}
                <button onClick={() => tap(v)} className="hk-press"
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 15px",
                    background: on ? t.primarySoft : t.surface, border: "none", cursor: "pointer", textAlign: "left",
                    transition: "background 150ms" }}>
                  <span style={{ fontFamily: JP, fontSize: 28, fontWeight: 700, lineHeight: 1, color: t.ink, flexShrink: 0, minWidth: 56 }}>{v.jp}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: on ? t.primary : t.sub, fontFamily: JP, lineHeight: 1.3 }}>{v.r}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: on ? t.primary : t.faint, fontFamily: DISPLAY, letterSpacing: "0.02em" }}>{v.romaji}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: on ? t.primary : t.sub, fontFamily: DISPLAY }}>{v.en}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on ? t.primary : t.faint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transform: on ? "rotate(180deg)" : "none", transition: "transform 200ms" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Conjugation forms */}
                {on && (
                  <div style={{ padding: "12px 15px 14px", background: t.bg, borderTop: `1px solid ${t.line}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {FORMS.map(({ key, romKey, label }) => (
                        <div key={key} style={{ background: t.surface, borderRadius: 13, padding: "10px 12px",
                          border: `1.5px solid ${t.line}` }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: t.faint, letterSpacing: "0.1em", marginBottom: 5 }}>{label.toUpperCase()}</div>
                          <div style={{ fontFamily: JP, fontSize: 20, fontWeight: 700, color: t.ink, lineHeight: 1.2 }}>{v[key]}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginTop: 3 }}>{v[romKey]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
