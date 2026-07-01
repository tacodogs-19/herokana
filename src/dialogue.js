// Audio dialogue mode — comprehension MVP.
//
// Each setting (konbini / café / restaurant …) has a short, near-scripted
// exchange you'd actually hear. Staff lines flagged with `check` become
// comprehension beats ("What are they asking?"); the rest are guided context.
// Authored ONCE — difficulty comes from how much the UI hides (see SUPPORT),
// not from separate versions. Spoken via Web Speech TTS, like the Listening
// practice mode; keep lines short so device voices stay intelligible.

import { shuffle } from "./questions.js";

// Fading scaffold levels. The learner steps DOWN through these (start guided);
// the saved `clearedLevel` is the hardest one they've passed. `rate` feeds TTS.
export const SUPPORT = [
  { id: "guided", label: "Guided", rate: 0.75, blurb: "See every line as you hear it" },
  { id: "listen", label: "Listen", rate: 0.85, blurb: "Questions are audio-only until you answer" },
  { id: "ear", label: "Ear", rate: 0.95, blurb: "Audio-first — text after you answer" },
];

// line: { who: "staff" | "you", jp, romaji, en, check?: { ask?, distractors[] } }
export const DIALOGUES = [
  {
    id: "konbini-checkout", packId: "konbini", title: "Paying at the register",
    variants: [
      [
        { who: "staff", jp: "いらっしゃいませ", romaji: "irasshaimase", en: "Welcome in" },
        { who: "staff", jp: "ふくろはごりようですか", romaji: "fukuro wa goriyou desu ka", en: "Do you need a bag?",
          check: { distractors: ["Do you have a point card?", "Shall I heat this up?", "Are you paying by card?"] } },
        { who: "you", jp: "はい、おねがいします", romaji: "hai, onegaishimasu", en: "Yes, please" },
        { who: "staff", jp: "おべんとうはあたためますか", romaji: "obentou wa atatamemasu ka", en: "Shall I heat the bento?",
          check: { distractors: ["Would you like a bag?", "Is this for here or to go?", "Do you need chopsticks?"] } },
        { who: "you", jp: "だいじょうぶです", romaji: "daijoubu desu", en: "I'm okay, thanks" },
        { who: "staff", jp: "ごひゃくえんになります", romaji: "gohyaku-en ni narimasu", en: "That'll be ¥500",
          check: { ask: "What did they say?", distractors: ["That'll be ¥1,500", "That'll be ¥150", "That'll be ¥5,000"] } },
        { who: "staff", jp: "ありがとうございました", romaji: "arigatou gozaimashita", en: "Thank you very much" },
      ],
      [
        { who: "staff", jp: "いらっしゃいませ", romaji: "irasshaimase", en: "Welcome in" },
        { who: "staff", jp: "ポイントカードはおもちですか", romaji: "pointo kaado wa omochi desu ka", en: "Do you have a point card?",
          check: { distractors: ["Do you need a bag?", "Shall I heat this up?", "Are you paying by card?"] } },
        { who: "you", jp: "だいじょうぶです", romaji: "daijoubu desu", en: "No, thank you" },
        { who: "staff", jp: "おはしはおつけしますか", romaji: "ohashi wa otsuke shimasu ka", en: "Shall I add chopsticks?",
          check: { distractors: ["Would you like a bag?", "Is this for here?", "Do you need a receipt?"] } },
        { who: "you", jp: "はい、おねがいします", romaji: "hai, onegaishimasu", en: "Yes, please" },
        { who: "staff", jp: "せんにひゃくえんになります", romaji: "sen-nihyaku-en ni narimasu", en: "That'll be ¥1,200",
          check: { ask: "What did they say?", distractors: ["That'll be ¥200", "That'll be ¥2,100", "That'll be ¥120"] } },
        { who: "staff", jp: "ありがとうございました", romaji: "arigatou gozaimashita", en: "Thank you very much" },
      ],
    ],
  },
  {
    id: "cafe-order", packId: "cafe", title: "Ordering a drink",
    variants: [
      [
        { who: "staff", jp: "いらっしゃいませ", romaji: "irasshaimase", en: "Welcome in" },
        { who: "staff", jp: "てんないでめしあがりますか", romaji: "tennai de meshiagarimasu ka", en: "Are you eating in?",
          check: { distractors: ["Would you like it hot?", "What is your name?", "Do you have a point card?"] } },
        { who: "you", jp: "もちかえりです", romaji: "mochikaeri desu", en: "Takeaway, please" },
        { who: "staff", jp: "ホットとアイス、どちらにしますか", romaji: "hotto to aisu, dochira ni shimasu ka", en: "Hot or iced?",
          check: { distractors: ["For here or to go?", "What size would you like?", "Anything to eat?"] } },
        { who: "you", jp: "アイスでおねがいします", romaji: "aisu de onegaishimasu", en: "Iced, please" },
        { who: "staff", jp: "おなまえをおねがいします", romaji: "onamae o onegaishimasu", en: "Your name, please?",
          check: { distractors: ["Your order, please?", "Would you like sugar?", "May I see your card?"] } },
        { who: "staff", jp: "おまちください", romaji: "omachi kudasai", en: "Please wait a moment" },
      ],
      [
        { who: "staff", jp: "いらっしゃいませ", romaji: "irasshaimase", en: "Welcome in" },
        { who: "staff", jp: "サイズはどうなさいますか", romaji: "saizu wa dou nasaimasu ka", en: "What size would you like?",
          check: { distractors: ["Hot or iced?", "For here or to go?", "Do you have a point card?"] } },
        { who: "you", jp: "トールでおねがいします", romaji: "tooru de onegaishimasu", en: "A tall, please" },
        { who: "staff", jp: "こおりはいりますか", romaji: "koori wa irimasu ka", en: "Would you like ice?",
          check: { distractors: ["Would you like sugar?", "Is this for here?", "Anything to eat?"] } },
        { who: "you", jp: "はい、おねがいします", romaji: "hai, onegaishimasu", en: "Yes, please" },
        { who: "staff", jp: "おさきにおかいけいです", romaji: "osaki ni okaikei desu", en: "Payment first, please",
          check: { distractors: ["Please wait over there", "Your receipt, please", "Your order is ready"] } },
        { who: "staff", jp: "ありがとうございます", romaji: "arigatou gozaimasu", en: "Thank you" },
      ],
    ],
  },
  {
    id: "restaurant-seating", packId: "restaurant", title: "Getting a table",
    variants: [
      [
        { who: "staff", jp: "いらっしゃいませ", romaji: "irasshaimase", en: "Welcome in" },
        { who: "staff", jp: "なんめいさまですか", romaji: "nanmei-sama desu ka", en: "How many people?",
          check: { distractors: ["Do you have a reservation?", "Would you like a table?", "Smoking or non-smoking?"] } },
        { who: "you", jp: "ふたりです", romaji: "futari desu", en: "Two people" },
        { who: "staff", jp: "おのみものはいかがですか", romaji: "onomimono wa ikaga desu ka", en: "Would you like a drink?",
          check: { distractors: ["Are you ready to order?", "Would you like dessert?", "Is everything okay?"] } },
        { who: "you", jp: "おみずをおねがいします", romaji: "omizu o onegaishimasu", en: "Water, please" },
        { who: "staff", jp: "ごちゅうもんはおきまりですか", romaji: "gochuumon wa okimari desu ka", en: "Are you ready to order?",
          check: { distractors: ["Would you like the bill?", "How was everything?", "Would you like more water?"] } },
        { who: "staff", jp: "しょうしょうおまちください", romaji: "shoushou omachi kudasai", en: "One moment, please" },
      ],
      [
        { who: "staff", jp: "いらっしゃいませ", romaji: "irasshaimase", en: "Welcome in" },
        { who: "staff", jp: "ごよやくはございますか", romaji: "goyoyaku wa gozaimasu ka", en: "Do you have a reservation?",
          check: { distractors: ["How many people?", "Smoking or non-smoking?", "Would you like a table?"] } },
        { who: "you", jp: "いいえ", romaji: "iie", en: "No" },
        { who: "staff", jp: "カウンターせきでもよろしいですか", romaji: "kauntaa seki demo yoroshii desu ka", en: "Is a counter seat okay?",
          check: { distractors: ["Would you like a drink?", "Are you ready to order?", "Is a window seat okay?"] } },
        { who: "you", jp: "はい、だいじょうぶです", romaji: "hai, daijoubu desu", en: "Yes, that's fine" },
        { who: "staff", jp: "こちらがメニューです", romaji: "kochira ga menyuu desu", en: "Here's the menu",
          check: { distractors: ["Here's your bill", "Here's your water", "Here's your receipt"] } },
        { who: "staff", jp: "ごゆっくりどうぞ", romaji: "goyukkuri douzo", en: "Take your time" },
      ],
    ],
  },
  {
    id: "station-platform", packId: "station", title: "Finding your platform",
    variants: [
      [
        { who: "you", jp: "すみません", romaji: "sumimasen", en: "Excuse me" },
        { who: "you", jp: "しんじゅくはなんばんせんですか", romaji: "shinjuku wa nanbansen desu ka", en: "Which platform for Shinjuku?" },
        { who: "staff", jp: "にばんせんです", romaji: "nibansen desu", en: "Platform 2",
          check: { ask: "What did they say?", distractors: ["Platform 7", "Platform 4", "Platform 10"] } },
        { who: "you", jp: "ありがとうございます", romaji: "arigatou gozaimasu", en: "Thank you" },
        { who: "staff", jp: "つぎのでんしゃです", romaji: "tsugi no densha desu", en: "It's the next train",
          check: { distractors: ["It's the last train", "It's been delayed", "It's the wrong train"] } },
        { who: "you", jp: "はい", romaji: "hai", en: "Okay" },
        { who: "staff", jp: "きをつけて", romaji: "ki o tsukete", en: "Take care",
          check: { distractors: ["Hurry up", "This way", "Please wait here"] } },
      ],
      [
        { who: "you", jp: "すみません", romaji: "sumimasen", en: "Excuse me" },
        { who: "you", jp: "とうきょうえきにいきたいです", romaji: "toukyou eki ni ikitai desu", en: "I want to go to Tokyo Station" },
        { who: "staff", jp: "ごばんせんです", romaji: "go-bansen desu", en: "Platform 5",
          check: { ask: "What did they say?", distractors: ["Platform 9", "Platform 1", "Platform 3"] } },
        { who: "you", jp: "ありがとうございます", romaji: "arigatou gozaimasu", en: "Thank you" },
        { who: "staff", jp: "きゅうこうにのってください", romaji: "kyuukou ni notte kudasai", en: "Take the express",
          check: { distractors: ["Take the local train", "Don't take this train", "Wait for the next one"] } },
        { who: "you", jp: "はい", romaji: "hai", en: "Okay" },
        { who: "staff", jp: "おきをつけて", romaji: "o-ki o tsukete", en: "Take care",
          check: { distractors: ["Hurry, please", "This way", "Please line up"] } },
      ],
    ],
  },
  {
    id: "signs-directions", packId: "signs", title: "Asking the way",
    variants: [
      [
        { who: "you", jp: "すみません、トイレはどこですか", romaji: "sumimasen, toire wa doko desu ka", en: "Excuse me, where's the toilet?" },
        { who: "staff", jp: "まっすぐです", romaji: "massugu desu", en: "It's straight ahead",
          check: { distractors: ["It's on the left", "It's on the right", "It's upstairs"] } },
        { who: "you", jp: "ありがとうございます", romaji: "arigatou gozaimasu", en: "Thank you" },
        { who: "you", jp: "でぐちはどちらですか", romaji: "deguchi wa dochira desu ka", en: "Which way is the exit?" },
        { who: "staff", jp: "ひだりにあります", romaji: "hidari ni arimasu", en: "It's on the left",
          check: { distractors: ["It's on the right", "It's straight ahead", "It's behind you"] } },
        { who: "you", jp: "わかりました", romaji: "wakarimashita", en: "Got it" },
        { who: "staff", jp: "みぎてにみえます", romaji: "migite ni miemasu", en: "You'll see it on your right",
          check: { distractors: ["You'll see it on your left", "It's far from here", "It's next to the toilet"] } },
      ],
      [
        { who: "you", jp: "すみません、えきはどこですか", romaji: "sumimasen, eki wa doko desu ka", en: "Excuse me, where's the station?" },
        { who: "staff", jp: "みぎにまがってください", romaji: "migi ni magatte kudasai", en: "Turn right",
          check: { distractors: ["Turn left", "Go straight ahead", "Go back"] } },
        { who: "you", jp: "ありがとうございます", romaji: "arigatou gozaimasu", en: "Thank you" },
        { who: "you", jp: "とおいですか", romaji: "tooi desu ka", en: "Is it far?" },
        { who: "staff", jp: "ちかいです", romaji: "chikai desu", en: "It's close",
          check: { distractors: ["It's far", "It's straight ahead", "It's upstairs"] } },
        { who: "you", jp: "わかりました", romaji: "wakarimashita", en: "Got it" },
        { who: "staff", jp: "ごふんくらいです", romaji: "go-fun kurai desu", en: "About five minutes",
          check: { distractors: ["About fifteen minutes", "About one minute", "About fifty minutes"] } },
      ],
    ],
  },
  {
    id: "paying-card", packId: "money", title: "Paying by card",
    variants: [
      [
        { who: "staff", jp: "ごうけいさんぜんえんです", romaji: "goukei sanzen-en desu", en: "Total is ¥3,000",
          check: { ask: "What did they say?", distractors: ["Total is ¥2,000", "Total is ¥8,000", "Total is ¥13,000"] } },
        { who: "you", jp: "カードでおねがいします", romaji: "kaado de onegaishimasu", en: "By card, please" },
        { who: "staff", jp: "いっかいばらいでよろしいですか", romaji: "ikkai-barai de yoroshii desu ka", en: "One payment, is that okay?",
          check: { distractors: ["Would you like a receipt?", "Do you have a point card?", "Is cash okay?"] } },
        { who: "you", jp: "はい", romaji: "hai", en: "Yes" },
        { who: "staff", jp: "サインをおねがいします", romaji: "sain o onegaishimasu", en: "Your signature, please",
          check: { distractors: ["Your name, please", "Your card, please", "Your PIN, please"] } },
        { who: "you", jp: "はい", romaji: "hai", en: "Sure" },
        { who: "staff", jp: "レシートです", romaji: "reshiito desu", en: "Here's your receipt" },
      ],
      [
        { who: "staff", jp: "ごうけいよんせんごひゃくえんです", romaji: "goukei yonsen-gohyaku-en desu", en: "Total is ¥4,500",
          check: { ask: "What did they say?", distractors: ["Total is ¥4,000", "Total is ¥14,500", "Total is ¥450"] } },
        { who: "you", jp: "カードでおねがいします", romaji: "kaado de onegaishimasu", en: "By card, please" },
        { who: "staff", jp: "タッチでおねがいします", romaji: "tacchi de onegaishimasu", en: "Tap, please",
          check: { distractors: ["Insert your card", "Sign here", "Enter your PIN"] } },
        { who: "you", jp: "はい", romaji: "hai", en: "Okay" },
        { who: "staff", jp: "ぶんかつばらいですか", romaji: "bunkatsu-barai desu ka", en: "Pay in instalments?",
          check: { distractors: ["One payment?", "Do you have a point card?", "Need a receipt?"] } },
        { who: "you", jp: "いっかいでおねがいします", romaji: "ikkai de onegaishimasu", en: "One payment, please" },
        { who: "staff", jp: "レシートです", romaji: "reshiito desu", en: "Here's your receipt" },
      ],
    ],
  },
  {
    id: "hotel-checkin", packId: "hotel", title: "Checking in",
    variants: [
      [
        { who: "you", jp: "チェックインおねがいします", romaji: "chekkuin onegaishimasu", en: "Check-in, please" },
        { who: "staff", jp: "パスポートをおねがいします", romaji: "pasupooto o onegaishimasu", en: "Your passport, please",
          check: { distractors: ["Your name, please", "Your reservation, please", "Your card, please"] } },
        { who: "you", jp: "はい、どうぞ", romaji: "hai, douzo", en: "Here you go" },
        { who: "staff", jp: "おへやはごかいです", romaji: "oheya wa go-kai desu", en: "Your room is on the 5th floor",
          check: { ask: "What did they say?", distractors: ["On the 1st floor", "On the 8th floor", "On the 3rd floor"] } },
        { who: "you", jp: "ありがとうございます", romaji: "arigatou gozaimasu", en: "Thank you" },
        { who: "staff", jp: "あさごはんはしちじからです", romaji: "asagohan wa shichi-ji kara desu", en: "Breakfast is from 7",
          check: { distractors: ["Breakfast is from 6", "Breakfast is from 9", "Breakfast is from 8"] } },
        { who: "staff", jp: "ごゆっくりどうぞ", romaji: "goyukkuri douzo", en: "Enjoy your stay" },
      ],
      [
        { who: "you", jp: "チェックインおねがいします", romaji: "chekkuin onegaishimasu", en: "Check-in, please" },
        { who: "staff", jp: "おなまえをおねがいします", romaji: "onamae o onegaishimasu", en: "Your name, please",
          check: { distractors: ["Your passport, please", "Your reservation number, please", "Your card, please"] } },
        { who: "you", jp: "たなかです", romaji: "tanaka desu", en: "It's Tanaka" },
        { who: "staff", jp: "おへやはにかいです", romaji: "oheya wa ni-kai desu", en: "Your room is on the 2nd floor",
          check: { ask: "What did they say?", distractors: ["On the 7th floor", "On the 4th floor", "On the 10th floor"] } },
        { who: "you", jp: "ありがとうございます", romaji: "arigatou gozaimasu", en: "Thank you" },
        { who: "staff", jp: "チェックアウトはじゅうじです", romaji: "chekkuauto wa juu-ji desu", en: "Check-out is at 10",
          check: { distractors: ["Check-out is at 11", "Check-out is at 12", "Check-out is at 9"] } },
        { who: "staff", jp: "ごゆっくりどうぞ", romaji: "goyukkuri douzo", en: "Enjoy your stay" },
      ],
    ],
  },
  {
    id: "airport-arrival", packId: "airport", title: "At immigration",
    variants: [
      [
        { who: "staff", jp: "パスポートをおねがいします", romaji: "pasupooto o onegaishimasu", en: "Your passport, please",
          check: { distractors: ["Your ticket, please", "Your bag, please", "Your name, please"] } },
        { who: "you", jp: "はい、どうぞ", romaji: "hai, douzo", en: "Here you go" },
        { who: "staff", jp: "たびのもくてきはなんですか", romaji: "tabi no mokuteki wa nan desu ka", en: "What's the purpose of your trip?",
          check: { distractors: ["How long are you staying?", "Where are you staying?", "Anything to declare?"] } },
        { who: "you", jp: "かんこうです", romaji: "kankou desu", en: "Sightseeing" },
        { who: "staff", jp: "なんにちたいざいしますか", romaji: "nannichi taizai shimasu ka", en: "How many days are you staying?",
          check: { distractors: ["What is your purpose?", "Where are you from?", "Is this your first visit?"] } },
        { who: "you", jp: "いっしゅうかんです", romaji: "isshuukan desu", en: "One week" },
        { who: "staff", jp: "よいたびを", romaji: "yoi tabi o", en: "Enjoy your trip" },
      ],
      [
        { who: "staff", jp: "パスポートをおねがいします", romaji: "pasupooto o onegaishimasu", en: "Your passport, please",
          check: { distractors: ["Your ticket, please", "Your bag, please", "Your name, please"] } },
        { who: "you", jp: "はい、どうぞ", romaji: "hai, douzo", en: "Here you go" },
        { who: "staff", jp: "どちらからきましたか", romaji: "dochira kara kimashita ka", en: "Where did you come from?",
          check: { distractors: ["What's the purpose of your trip?", "How long are you staying?", "Where are you staying?"] } },
        { who: "you", jp: "オーストラリアです", romaji: "oosutoraria desu", en: "From Australia" },
        { who: "staff", jp: "どこにとまりますか", romaji: "doko ni tomarimasu ka", en: "Where are you staying?",
          check: { distractors: ["How many days?", "What is your job?", "Is this your first visit?"] } },
        { who: "you", jp: "ホテルです", romaji: "hoteru desu", en: "At a hotel" },
        { who: "staff", jp: "よいたびを", romaji: "yoi tabi o", en: "Enjoy your trip" },
      ],
    ],
  },
];

export const dialogueById = (id) => DIALOGUES.find((d) => d.id === id);
export const dialoguesForPack = (packId) => DIALOGUES.filter((d) => d.packId === packId);
export const checkCount = (d) => (d.variants ? d.variants[0] : d.lines).filter((l) => l.check).length;

// Pick a random script (variant) each call so replays aren't the same exchange,
// then precompute shuffled options per check. A dialogue can use `lines` (single
// script) or `variants: [script, script, ...]` for repeatable variety.
export function prepareDialogue(d) {
  const scripts = d.variants || [d.lines];
  const lines = scripts[Math.floor(Math.random() * scripts.length)];
  return lines.map((line) => {
    if (!line.check) return { ...line };
    return {
      ...line,
      ask: line.check.ask || "What are they asking?",
      options: shuffle([line.en, ...line.check.distractors]),
    };
  });
}
