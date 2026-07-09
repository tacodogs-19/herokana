// Verb reference data for the Verb list screen (VerbChart.jsx) and the audio
// pre-generator (scripts/make-audio.mjs). Pure data, no React, so the Node
// audio script can import it without pulling in the component tree.

export const GROUPS = [
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

export const FORMS = [
  { key: "masu", romKey: "masuR", label: "Polite" },
  { key: "ta",   romKey: "taR",   label: "Past" },
  { key: "te",   romKey: "teR",   label: "Te-form" },
  { key: "nai",  romKey: "naiR",  label: "Negative" },
];
