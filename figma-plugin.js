/**
 * HeroKana Figma Plugin
 *
 * HOW TO RUN:
 * 1. Open Figma (any file, or create a new one)
 * 2. Plugins → Development → Open Console
 * 3. Paste this entire file and press Enter
 *
 * Creates 16 frames (8 screens × light/dark) at 390×844.
 */
(async () => {

  // ── Fonts ────────────────────────────────────────────────────────────────
  // Outfit is HeroKana's UI font (from theme.jsx: DISPLAY = "'Outfit', system-ui, sans-serif")
  // Fall back to Inter if Outfit isn't installed locally in Figma
  let FONT = "Outfit";
  try {
    await figma.loadFontAsync({ family: "Outfit", style: "Regular" });
    await figma.loadFontAsync({ family: "Outfit", style: "Medium" });
    await figma.loadFontAsync({ family: "Outfit", style: "SemiBold" });
    await figma.loadFontAsync({ family: "Outfit", style: "Bold" });
    await figma.loadFontAsync({ family: "Outfit", style: "ExtraBold" });
  } catch (e) {
    FONT = "Inter";
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  }

  // ── Theme tokens (from src/theme.jsx) ────────────────────────────────────
  const L = {
    bg: "#F3F5FA", surface: "#FFFFFF", sunk: "#E8EBF4", ink: "#1E2540",
    sub: "#71789A", faint: "#AAB0C6", line: "#E6E9F2",
    primary: "#1D4FD7", primarySoft: "#E9EEFC",
    done: "#27A567", doneSoft: "#E4F5EC", doneMid: "#C5EBD5",
    gold: "#F5B225", wrong: "#E5484D", wrongSoft: "#FBE7E8",
  };
  const D = {
    bg: "#0E1322", surface: "#1A2138", sunk: "#141A2C", ink: "#F0F2F8",
    sub: "#9098B8", faint: "#5A6286", line: "#27304C",
    primary: "#5A85FF", primarySoft: "#1E2A4A",
    done: "#34C07C", doneSoft: "#16301F", doneMid: "#234C35",
    gold: "#FFCB57", wrong: "#FF6166", wrongSoft: "#34191B",
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const W = 390, H = 844;
  const GAP_X = 48, GAP_Y = 96;
  const COLS = 8;
  const allFrames = [];

  function toRgb(h) {
    return {
      r: parseInt(h.slice(1, 3), 16) / 255,
      g: parseInt(h.slice(3, 5), 16) / 255,
      b: parseInt(h.slice(5, 7), 16) / 255,
    };
  }

  function frame(name, col, row) {
    const f = figma.createFrame();
    f.name = name;
    f.resize(W, H);
    f.x = col * (W + GAP_X);
    f.y = row * (H + GAP_Y);
    allFrames.push(f);
    return f;
  }

  function rect(parent, x, y, w, h, fill, opts = {}) {
    const r = figma.createRectangle();
    r.x = x; r.y = y;
    r.resize(Math.max(1, w), Math.max(1, h));
    r.fills = fill ? [{ type: "SOLID", color: toRgb(fill) }] : [];
    if (opts.radius) r.cornerRadius = opts.radius;
    if (opts.stroke) {
      r.strokes = [{ type: "SOLID", color: toRgb(opts.stroke) }];
      r.strokeWeight = opts.strokeWeight || 1.5;
      r.strokeAlign = "INSIDE";
    }
    parent.appendChild(r);
    return r;
  }

  function text(parent, content, x, y, opts = {}) {
    const { size = 14, weight = 400, color, width: fixedW, align = "LEFT" } = opts;
    const fill = color || "#1E2540";
    const isBold = weight >= 700;
    const style = FONT === "Outfit"
      ? (weight >= 800 ? "ExtraBold" : weight >= 700 ? "Bold" : weight >= 600 ? "SemiBold" : weight >= 500 ? "Medium" : "Regular")
      : (weight >= 700 ? "Bold" : weight >= 500 ? "Semi Bold" : "Regular");
    const t = figma.createText();
    t.fontName = { family: FONT, style };
    t.fontSize = size;
    t.fills = [{ type: "SOLID", color: toRgb(fill) }];
    if (fixedW) {
      t.textAutoResize = "HEIGHT";
      t.resize(fixedW, 20);
      t.textAlignHorizontal = align;
    }
    t.characters = String(content);
    t.x = x; t.y = y;
    parent.appendChild(t);
    return t;
  }

  // Centered text helper: cx is the horizontal center point
  function ctext(parent, content, cx, y, opts = {}) {
    const w = opts.width || 200;
    return text(parent, content, cx - w / 2, y, { ...opts, width: w, align: "CENTER" });
  }

  function statusBar(f, t) {
    rect(f, 0, 0, W, 44, t.bg);
    text(f, "9:41", W / 2 - 15, 14, { size: 15, weight: 700, color: t.ink });
    text(f, "●●●", W - 72, 16, { size: 11, color: t.faint });
  }

  function bottomNav(f, t, active) {
    rect(f, 0, H - 82, W, 82, t.surface);
    rect(f, 0, H - 82, W, 1, t.line);
    ["Learn", "Practice", "Profile"].forEach((tab, i) => {
      const cx = (W / 3) * i + W / 6;
      const on = tab === active;
      if (on) rect(f, cx - 16, H - 79, 32, 3, t.primary, { radius: 2 });
      text(f, tab, cx - 22, H - 56, { size: 12, weight: on ? 800 : 600, color: on ? t.primary : t.faint, width: 44, align: "CENTER" });
    });
  }

  function card(f, x, y, w, h, t) {
    return rect(f, x, y, w, h, t.surface, { radius: 22, stroke: t.line });
  }

  function pill(f, x, y, w, h, bg, t, opts = {}) {
    return rect(f, x, y, w, h, bg, { radius: opts.radius || 14, stroke: opts.stroke });
  }

  function primaryBtn(f, x, y, w, label, color, t) {
    rect(f, x, y, w, 52, color, { radius: 16 });
    ctext(f, label, x + w / 2, y + 16, { size: 16, weight: 800, color: "#ffffff", width: w - 32 });
  }

  function ghostBtn(f, x, y, w, label, t) {
    rect(f, x, y, w, 46, t.surface, { radius: 14, stroke: t.line });
    ctext(f, label, x + w / 2, y + 13, { size: 14, weight: 800, color: t.sub, width: w - 32 });
  }

  // ── SCREEN: Home ─────────────────────────────────────────────────────────
  function drawHome(t, col, row) {
    const f = frame(`Home · ${col === 0 ? "Light" : "Dark"}`, col, row);
    f.fills = [{ type: "SOLID", color: toRgb(t.bg) }];
    statusBar(f, t);

    // Header
    rect(f, 20, 58, 28, 28, t.primarySoft, { radius: 8 });
    text(f, "HK", 27, 63, { size: 11, weight: 800, color: t.primary });
    text(f, "HeroKana", 56, 63, { size: 19, weight: 800, color: t.ink });
    rect(f, W - 52, 61, 30, 26, t.sunk, { radius: 8 });
    text(f, "☀︎", W - 44, 65, { size: 14, color: t.sub });

    // Review banner
    rect(f, 20, 100, W - 40, 58, t.primarySoft, { radius: 18, stroke: t.primary });
    rect(f, 32, 111, 36, 36, t.surface, { radius: 10 });
    text(f, "↺", 40, 117, { size: 16, weight: 700, color: t.primary });
    text(f, "Ready to review", 78, 112, { size: 14, weight: 800, color: t.ink });
    text(f, "12 items to refresh", 78, 130, { size: 12, weight: 600, color: t.sub });
    text(f, "›", W - 38, 120, { size: 18, color: t.primary });

    // YOUR PROGRESS label
    text(f, "YOUR PROGRESS", 20, 176, { size: 11, weight: 700, color: t.sub });

    // Progress rail
    const chapters = ["Hiragana", "Katakana", "Words", "Sentences", "Advanced"];
    const states = ["done", "done", "current", "locked", "locked"];
    const railY = 200;
    rect(f, 52, railY + 20, W - 104, 3, t.line, { radius: 2 });
    rect(f, 52, railY + 20, (W - 104) * 0.4, 3, t.doneMid, { radius: 2 });
    chapters.forEach((ch, i) => {
      const cx = 52 + i * ((W - 104) / 4);
      const st = states[i];
      const bg = st === "done" ? t.doneMid : st === "current" ? t.primary : t.sunk;
      rect(f, cx - 20, railY, 40, 40, bg, { radius: 20 });
      if (st === "done") ctext(f, "✓", cx, railY + 10, { size: 14, weight: 800, color: t.done, width: 40 });
      else if (st === "current") ctext(f, "言", cx, railY + 8, { size: 16, weight: 700, color: "#ffffff", width: 40 });
      else ctext(f, "🔒", cx, railY + 10, { size: 12, width: 40 });
      ctext(f, ch.split(" ")[0], cx, railY + 44, { size: 9, weight: st === "current" ? 800 : 600, color: st === "current" ? t.ink : t.faint, width: 60 });
    });

    // Chapter card
    const cardY = 264;
    card(f, 20, cardY, W - 40, 370, t);

    text(f, "CONTINUE LEARNING", 36, cardY + 18, { size: 11, weight: 800, color: t.primary });

    // Ring placeholder
    rect(f, W / 2 - 66, cardY + 46, 132, 132, t.sunk, { radius: 66 });
    rect(f, W / 2 - 52, cardY + 62, 104, 104, t.bg, { radius: 52 });
    ctext(f, "言", W / 2, cardY + 80, { size: 56, weight: 700, color: t.ink, width: 100 });

    text(f, "Words & Sentences", W / 2 - 100, cardY + 196, { size: 21, weight: 800, color: t.ink, width: 200, align: "CENTER" });
    ctext(f, "言葉 · unit 3 of 8", W / 2, cardY + 224, { size: 13, weight: 600, color: t.sub, width: 180 });

    primaryBtn(f, 36, cardY + 258, W - 72, "Continue lesson →", t.primary, t);

    // Sub buttons row
    const bw = (W - 80) / 2;
    pill(f, 36, cardY + 320, bw, 40, t.sunk, t, { radius: 13 });
    text(f, "Kana chart", 36 + 16, cardY + 331, { size: 12, weight: 800, color: t.primary });
    pill(f, 36 + bw + 8, cardY + 320, bw, 40, t.sunk, t, { radius: 13 });
    text(f, "Kana basics", 36 + bw + 24, cardY + 331, { size: 12, weight: 800, color: t.primary });

    // Expand row
    rect(f, 36, cardY + 370, W - 72, 1, t.line);
    text(f, "What's in this chapter", 36, cardY + 380, { size: 13, weight: 700, color: t.ink });
    ctext(f, "⌄", W - 44, cardY + 378, { size: 16, color: t.faint, width: 20 });

    bottomNav(f, t, "Learn");
  }

  // ── SCREEN: Lesson – Question (MCQ) ──────────────────────────────────────
  function drawLesson(t, col, row) {
    const f = frame(`Lesson – Question · ${col === 2 ? "Light" : "Dark"}`, col, row);
    f.fills = [{ type: "SOLID", color: toRgb(t.bg) }];
    statusBar(f, t);

    // Top bar
    rect(f, 20, 52, 24, 24, t.sunk, { radius: 8 });
    ctext(f, "✕", 32, 56, { size: 13, color: t.faint, width: 24 });
    const segW = Math.floor((W - 62) / 8);
    for (let i = 0; i < 8; i++) {
      const c = i === 2 ? t.primary : i < 2 ? t.done : t.line;
      rect(f, 52 + i * (segW + 3), 57, segW, 7, c, { radius: 4 });
    }

    text(f, "HIRAGANA · あ行", 20, 94, { size: 11, weight: 800, color: t.primary });
    text(f, "Which sound is this?", 20, 112, { size: 21, weight: 800, color: t.ink });

    // Prompt card
    card(f, 20, 148, W - 40, 214, t);
    ctext(f, "あ", W / 2, 186, { size: 96, weight: 700, color: t.ink, width: 100 });
    ctext(f, '"a" — like "arm"', W / 2, 314, { size: 13, weight: 600, color: t.sub, width: 180 });

    // 2×2 MCQ options
    const opts = ["a", "i", "u", "e"];
    const ow = (W - 51) / 2;
    opts.forEach((o, i) => {
      const cx = i % 2, cy = Math.floor(i / 2);
      const x = 20 + cx * (ow + 11);
      const y = 382 + cy * 74;
      rect(f, x, y, ow, 62, t.surface, { radius: 16, stroke: t.line });
      ctext(f, o, x + ow / 2, y + 17, { size: 20, weight: 800, color: t.ink, width: ow - 20 });
    });

    // Feedback placeholder row
    rect(f, 20, 540, W - 40, 28, t.bg);

    // Check button (disabled)
    rect(f, 20, 578, W - 40, 52, t.sunk, { radius: 16 });
    ctext(f, "Check", W / 2, 594, { size: 16, weight: 800, color: t.faint, width: 120 });
  }

  // ── SCREEN: Lesson – Correct ──────────────────────────────────────────────
  function drawLessonCorrect(t, col, row) {
    const f = frame(`Lesson – Correct · ${col === 4 ? "Light" : "Dark"}`, col, row);
    f.fills = [{ type: "SOLID", color: toRgb(t.bg) }];
    statusBar(f, t);

    rect(f, 20, 52, 24, 24, t.sunk, { radius: 8 });
    ctext(f, "✕", 32, 56, { size: 13, color: t.faint, width: 24 });
    const segW = Math.floor((W - 62) / 8);
    for (let i = 0; i < 8; i++) {
      const c = i <= 2 ? t.done : t.line;
      rect(f, 52 + i * (segW + 3), 57, segW, 7, c, { radius: 4 });
    }

    text(f, "HIRAGANA · あ行", 20, 94, { size: 11, weight: 800, color: t.primary });
    text(f, "Which sound is this?", 20, 112, { size: 21, weight: 800, color: t.ink });

    // Prompt card – green border
    rect(f, 20, 148, W - 40, 214, t.surface, { radius: 22, stroke: t.done, strokeWeight: 2 });
    ctext(f, "あ", W / 2, 186, { size: 96, weight: 700, color: t.ink, width: 100 });
    // Hear it button
    rect(f, W / 2 - 54, 310, 108, 34, t.bg, { radius: 12, stroke: t.line });
    ctext(f, "♪  Hear it", W / 2, 318, { size: 13, weight: 700, color: t.sub, width: 90 });
    // Badge
    rect(f, W - 44, 133, 38, 38, t.done, { radius: 19 });
    ctext(f, "✓", W - 25, 142, { size: 16, weight: 800, color: "#ffffff", width: 38 });

    // Options — correct highlighted
    const opts = ["a", "i", "u", "e"];
    const ow = (W - 51) / 2;
    opts.forEach((o, i) => {
      const cx = i % 2, cy = Math.floor(i / 2);
      const x = 20 + cx * (ow + 11);
      const y = 382 + cy * 74;
      const isCorrect = o === "a";
      rect(f, x, y, ow, 62, isCorrect ? t.doneSoft : t.surface, { radius: 16, stroke: isCorrect ? t.done : t.line });
      ctext(f, o, x + ow / 2, y + 17, { size: 20, weight: 800, color: isCorrect ? t.done : t.ink, width: ow - 20 });
    });

    ctext(f, "Nicely done!", W / 2, 547, { size: 15, weight: 800, color: t.done, width: 180 });
    primaryBtn(f, 20, 578, W - 40, "Continue →", t.done, t);
  }

  // ── SCREEN: Lesson – Wrong ────────────────────────────────────────────────
  function drawLessonWrong(t, col, row) {
    const f = frame(`Lesson – Wrong · ${col === 6 ? "Light" : "Dark"}`, col, row);
    f.fills = [{ type: "SOLID", color: toRgb(t.bg) }];
    statusBar(f, t);

    rect(f, 20, 52, 24, 24, t.sunk, { radius: 8 });
    ctext(f, "✕", 32, 56, { size: 13, color: t.faint, width: 24 });
    const segW = Math.floor((W - 62) / 8);
    for (let i = 0; i < 8; i++) {
      const c = i < 2 ? t.done : i === 2 ? t.wrong : t.line;
      rect(f, 52 + i * (segW + 3), 57, segW, 7, c, { radius: 4 });
    }

    text(f, "HIRAGANA · あ行", 20, 94, { size: 11, weight: 800, color: t.primary });
    text(f, "Which sound is this?", 20, 112, { size: 21, weight: 800, color: t.ink });

    // Prompt card – red border
    rect(f, 20, 148, W - 40, 214, t.surface, { radius: 22, stroke: t.wrong, strokeWeight: 2 });
    ctext(f, "あ", W / 2, 186, { size: 96, weight: 700, color: t.ink, width: 100 });
    rect(f, W / 2 - 54, 310, 108, 34, t.bg, { radius: 12, stroke: t.line });
    ctext(f, "♪  Hear it", W / 2, 318, { size: 13, weight: 700, color: t.sub, width: 90 });
    rect(f, W - 44, 133, 38, 38, t.wrong, { radius: 19 });
    ctext(f, "✕", W - 25, 142, { size: 14, weight: 800, color: "#ffffff", width: 38 });

    // Options — correct=green, chosen=red
    const opts = ["a", "i", "u", "e"];
    const ow = (W - 51) / 2;
    opts.forEach((o, i) => {
      const cx = i % 2, cy = Math.floor(i / 2);
      const x = 20 + cx * (ow + 11);
      const y = 382 + cy * 74;
      const isCorrect = o === "a", isChosen = o === "u";
      const bg = isCorrect ? t.doneSoft : isChosen ? t.wrongSoft : t.surface;
      const stroke = isCorrect ? t.done : isChosen ? t.wrong : t.line;
      const color = isCorrect ? t.done : isChosen ? t.wrong : t.ink;
      rect(f, x, y, ow, 62, bg, { radius: 16, stroke });
      ctext(f, o, x + ow / 2, y + 17, { size: 20, weight: 800, color, width: ow - 20 });
    });

    ctext(f, "Not quite", W / 2, 547, { size: 15, weight: 800, color: t.wrong, width: 180 });
    primaryBtn(f, 20, 578, W - 40, "Continue →", t.wrong, t);
  }

  // ── SCREEN: Result – Pass ────────────────────────────────────────────────
  function drawResultPass(t, col, row) {
    const f = frame(`Result – Pass · ${col === 0 ? "Light" : "Dark"}`, col, row);
    f.fills = [{ type: "SOLID", color: toRgb(t.bg) }];
    statusBar(f, t);

    // Cat circle
    rect(f, W / 2 - 75, 62, 150, 150, t.doneSoft, { radius: 75 });
    ctext(f, "=^.^=", W / 2, 122, { size: 28, weight: 700, color: t.done, width: 150 });

    ctext(f, "UNIT COMPLETE", W / 2, 230, { size: 12, weight: 800, color: t.done, width: 180 });
    ctext(f, "You nailed it!", W / 2, 250, { size: 27, weight: 800, color: t.ink, width: 280 });
    ctext(f, "あ  Hiragana · あ行", W / 2, 288, { size: 14, weight: 600, color: t.sub, width: 200 });

    // Stat tiles
    const tiles = [{ l: "XP earned", v: "+54", c: t.gold }, { l: "Accuracy", v: "92%", c: t.done }, { l: "Correct", v: "9/10", c: t.ink }];
    const tw = (W - 60) / 3;
    tiles.forEach((tile, i) => {
      const x = 20 + i * (tw + 10);
      rect(f, x, 328, tw, 74, t.surface, { radius: 16, stroke: t.line });
      ctext(f, tile.v, x + tw / 2, 342, { size: 22, weight: 800, color: tile.c, width: tw });
      ctext(f, tile.l, x + tw / 2, 368, { size: 11, weight: 600, color: t.sub, width: tw });
    });

    // Chapter progress
    rect(f, 20, 424, W - 40, 66, t.surface, { radius: 16, stroke: t.line });
    text(f, "Hiragana progress", 36, 436, { size: 13, weight: 700, color: t.ink });
    text(f, "4/10", W - 64, 436, { size: 13, weight: 800, color: t.done });
    rect(f, 36, 458, W - 72, 8, t.sunk, { radius: 5 });
    rect(f, 36, 458, (W - 72) * 0.4, 8, t.done, { radius: 5 });

    primaryBtn(f, 20, 514, W - 40, "Next unit →", t.primary, t);
    ghostBtn(f, 20, 578, W - 40, "Review what I missed", t);
    ghostBtn(f, 20, 636, W - 40, "Back to home", t);
  }

  // ── SCREEN: Result – Fail ─────────────────────────────────────────────────
  function drawResultFail(t, col, row) {
    const f = frame(`Result – Fail · ${col === 2 ? "Light" : "Dark"}`, col, row);
    f.fills = [{ type: "SOLID", color: toRgb(t.bg) }];
    statusBar(f, t);

    rect(f, W / 2 - 75, 62, 150, 150, t.wrongSoft, { radius: 75 });
    ctext(f, "=T.T=", W / 2, 122, { size: 28, weight: 700, color: t.wrong, width: 150 });

    ctext(f, "KEEP PRACTISING", W / 2, 230, { size: 12, weight: 800, color: t.primary, width: 200 });
    ctext(f, "Almost there!", W / 2, 250, { size: 27, weight: 800, color: t.ink, width: 280 });
    ctext(f, "あ  Hiragana · あ行", W / 2, 288, { size: 14, weight: 600, color: t.sub, width: 200 });

    const tiles = [{ l: "XP earned", v: "+12", c: t.gold }, { l: "Accuracy", v: "60%", c: t.wrong }, { l: "Correct", v: "6/10", c: t.ink }];
    const tw = (W - 60) / 3;
    tiles.forEach((tile, i) => {
      const x = 20 + i * (tw + 10);
      rect(f, x, 328, tw, 74, t.surface, { radius: 16, stroke: t.line });
      ctext(f, tile.v, x + tw / 2, 342, { size: 22, weight: 800, color: tile.c, width: tw });
      ctext(f, tile.l, x + tw / 2, 368, { size: 11, weight: 600, color: t.sub, width: tw });
    });

    rect(f, 20, 424, W - 40, 66, t.surface, { radius: 16, stroke: t.line });
    text(f, "Hiragana progress", 36, 436, { size: 13, weight: 700, color: t.ink });
    text(f, "3/10", W - 64, 436, { size: 13, weight: 800, color: t.sub });
    rect(f, 36, 458, W - 72, 8, t.sunk, { radius: 5 });
    rect(f, 36, 458, (W - 72) * 0.3, 8, t.done, { radius: 5 });

    primaryBtn(f, 20, 514, W - 40, "Try again →", t.primary, t);
    ghostBtn(f, 20, 578, W - 40, "Review what I missed", t);
    ghostBtn(f, 20, 636, W - 40, "Back to home", t);
  }

  // ── SCREEN: Practice ─────────────────────────────────────────────────────
  function drawPractice(t, col, row) {
    const f = frame(`Practice · ${col === 4 ? "Light" : "Dark"}`, col, row);
    f.fills = [{ type: "SOLID", color: toRgb(t.bg) }];
    statusBar(f, t);

    rect(f, 20, 58, 28, 28, t.primarySoft, { radius: 8 });
    text(f, "HK", 27, 63, { size: 11, weight: 800, color: t.primary });
    text(f, "Practice", 56, 63, { size: 19, weight: 800, color: t.ink });

    // Reference
    text(f, "REFERENCE", 20, 104, { size: 11, weight: 700, color: t.sub });
    [
      { label: "Kana chart", sub: "Look up any kana & hear it" },
      { label: "Verb list", sub: "Common verbs & conjugation forms" },
    ].forEach((item, i) => {
      const y = 122 + i * 66;
      rect(f, 20, y, W - 40, 54, t.surface, { radius: 18, stroke: t.line });
      rect(f, 32, y + 8, 38, 38, t.primarySoft, { radius: 11 });
      text(f, item.label, 82, y + 9, { size: 14, weight: 800, color: t.ink });
      text(f, item.sub, 82, y + 29, { size: 12, weight: 600, color: t.sub });
      text(f, "›", W - 38, y + 14, { size: 18, color: t.faint });
    });

    // Practice modes
    text(f, "PRACTICE MODES", 20, 274, { size: 11, weight: 700, color: t.sub });

    // Segment
    rect(f, 20, 292, W - 40, 40, t.sunk, { radius: 12 });
    rect(f, 23, 295, (W - 46) / 3, 34, t.surface, { radius: 9 });
    ["Alphabet", "Words", "Numbers"].forEach((tab, i) => {
      const tw2 = (W - 46) / 3;
      ctext(f, tab, 23 + i * tw2 + tw2 / 2, 304, { size: 13, weight: i === 0 ? 800 : 600, color: i === 0 ? t.ink : t.sub, width: tw2 });
    });

    const modes = [
      { title: "Quick review", sub: "Mix what you know", c: t.primary },
      { title: "Weak spots", sub: "Replay your misses", c: t.wrong },
      { title: "Speed round", sub: "Beat the clock", c: t.gold },
      { title: "Listening", sub: "Hear & choose", c: t.done },
    ];
    const mw = (W - 51) / 2;
    modes.forEach((m, i) => {
      const mc = i % 2, mr = Math.floor(i / 2);
      const x = 20 + mc * (mw + 11);
      const y = 350 + mr * 106;
      rect(f, x, y, mw, 94, t.surface, { radius: 18, stroke: t.line });
      rect(f, x + 14, y + 14, 40, 40, m.c + "33", { radius: 12 });
      text(f, m.title, x + 14, y + 62, { size: 14, weight: 800, color: t.ink });
      text(f, m.sub, x + 14, y + 78, { size: 12, weight: 600, color: t.sub });
    });

    // Build custom set teaser
    text(f, "BUILD A CUSTOM SET", 20, 578, { size: 11, weight: 700, color: t.sub });
    rect(f, 20, 596, W - 40, 96, t.surface, { radius: 20, stroke: t.line });
    text(f, "Choose chapters → set difficulty → start", 36, 616, { size: 13, weight: 600, color: t.faint });
    primaryBtn(f, 36, 644, W - 72, "Start practice · 10 questions", t.primary, t);

    bottomNav(f, t, "Practice");
  }

  // ── SCREEN: Profile ───────────────────────────────────────────────────────
  function drawProfile(t, col, row) {
    const f = frame(`Profile · ${col === 6 ? "Light" : "Dark"}`, col, row);
    f.fills = [{ type: "SOLID", color: toRgb(t.bg) }];
    statusBar(f, t);

    rect(f, 20, 58, 28, 28, t.primarySoft, { radius: 8 });
    text(f, "HK", 27, 63, { size: 11, weight: 800, color: t.primary });
    text(f, "Profile", 56, 63, { size: 19, weight: 800, color: t.ink });

    // XP Ring card
    rect(f, 20, 104, W - 40, 180, t.surface, { radius: 22, stroke: t.line });
    rect(f, W / 2 - 54, 120, 108, 108, t.sunk, { radius: 54 });
    rect(f, W / 2 - 44, 130, 88, 88, t.bg, { radius: 44 });
    ctext(f, "1,240 XP", W / 2, 160, { size: 16, weight: 800, color: t.ink, width: 120 });
    ctext(f, "Level 4", W / 2, 183, { size: 12, weight: 600, color: t.sub, width: 100 });
    ctext(f, "60 XP to next level", W / 2, 244, { size: 12, weight: 600, color: t.faint, width: 180 });

    // Week activity
    text(f, "THIS WEEK", 20, 306, { size: 11, weight: 700, color: t.sub });
    rect(f, 20, 324, W - 40, 82, t.surface, { radius: 18, stroke: t.line });
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const bars = [3, 5, 2, 7, 4, 0, 0];
    const maxB = 7;
    days.forEach((d, i) => {
      const bw2 = Math.floor((W - 80) / 7);
      const x = 28 + i * bw2;
      const bh = bars[i] > 0 ? Math.max(8, Math.round((bars[i] / maxB) * 44)) : 0;
      if (bh > 0) rect(f, x, 364 - bh, bw2 - 8, bh, t.primary, { radius: 4 });
      ctext(f, d, x + (bw2 - 8) / 2, 368, { size: 11, weight: 600, color: t.faint, width: bw2 });
    });

    // Settings
    text(f, "SETTINGS", 20, 430, { size: 11, weight: 700, color: t.sub });
    [
      { label: "Hard mode", sub: "Answers in English, no hints", danger: false },
      { label: "Customise profile", sub: "Name & learning goal", danger: false },
      { label: "Export progress", sub: "Save a backup file", danger: false },
      { label: "Reset progress", sub: "Start over from scratch", danger: true },
    ].forEach((s, i) => {
      const y = 448 + i * 66;
      rect(f, 20, y, W - 40, 54, t.surface, { radius: 16, stroke: t.line });
      text(f, s.label, 36, y + 10, { size: 14, weight: 700, color: s.danger ? t.wrong : t.ink });
      text(f, s.sub, 36, y + 30, { size: 11, weight: 600, color: t.sub });
      text(f, "›", W - 38, y + 15, { size: 18, color: t.faint });
    });

    bottomNav(f, t, "Profile");
  }

  // ── Draw all screens ──────────────────────────────────────────────────────
  // Row 0 = Light, Row 1 = Dark
  // Columns: Home | Lesson–Q | Lesson–Correct | Lesson–Wrong | Practice | Profile | Result–Pass | Result–Fail

  drawHome(L, 0, 0);      drawHome(D, 0, 1);
  drawLesson(L, 1, 0);    drawLesson(D, 1, 1);
  drawLessonCorrect(L, 2, 0); drawLessonCorrect(D, 2, 1);
  drawLessonWrong(L, 3, 0);   drawLessonWrong(D, 3, 1);
  drawPractice(L, 4, 0);  drawPractice(D, 4, 1);
  drawProfile(L, 5, 0);   drawProfile(D, 5, 1);
  drawResultPass(L, 6, 0); drawResultPass(D, 6, 1);
  drawResultFail(L, 7, 0); drawResultFail(D, 7, 1);

  figma.viewport.scrollAndZoomIntoView(allFrames);
  figma.notify(`✓ HeroKana — ${allFrames.length} frames created`);

})();
