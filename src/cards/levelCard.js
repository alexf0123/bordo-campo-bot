const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const LEVEL_BADGES = {
  1: "livello1.png",
  2: "livello2.png",
  3: "livello3.png",
  4: "livello4.png",
  5: "livello5.png",
};

function formatNumber(num) {
  return new Intl.NumberFormat("it-IT").format(num || 0);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function progressForLevel(currentXp, level, levelXp) {
  const currentLevelXp = levelXp[level] || 0;
  const nextLevelXp = levelXp[level + 1] || levelXp[level] || currentXp;
  const range = Math.max(nextLevelXp - currentLevelXp, 1);
  return Math.max(0, Math.min(1, (currentXp - currentLevelXp) / range));
}

async function createLevelCard({
  username,
  avatarUrl,
  level,
  xp,
  nextXp,
  messages,
  voiceHours,
  type = "up", // up | down | reset | streak
  levelXp = { 1: 100, 2: 300, 3: 700, 4: 1400, 5: 2500 },
}) {
  const width = 1400;
  const height = 820;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#06131f");
  bg.addColorStop(0.45, "#090b17");
  bg.addColorStop(1, "#1a0b28");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Soft glow
  const glow = ctx.createRadialGradient(220, 180, 20, 220, 180, 520);
  glow.addColorStop(0, "rgba(0, 200, 255, 0.28)");
  glow.addColorStop(1, "rgba(0, 200, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(1120, 260, 20, 1120, 260, 520);
  glow2.addColorStop(0, "rgba(166, 70, 255, 0.22)");
  glow2.addColorStop(1, "rgba(166, 70, 255, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // Main border panel
  roundRect(ctx, 70, 80, 1260, 660, 34);
  ctx.fillStyle = "rgba(4, 10, 20, 0.78)";
  ctx.fill();

  const border = ctx.createLinearGradient(70, 80, 1330, 740);
  border.addColorStop(0, "#00c8ff");
  border.addColorStop(0.5, "#2a6dff");
  border.addColorStop(1, "#a94cff");
  ctx.strokeStyle = border;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Header text
  let title = "NUOVO LIVELLO RAGGIUNTO!";
  let mainColor = "#25cfff";
  if (type === "down") {
    title = "LIVELLO ABBASSATO";
    mainColor = "#ff9f43";
  }
  if (type === "reset") {
    title = "LIVELLI AZZERATI";
    mainColor = "#ff4d4d";
  }
  if (type === "streak") {
    title = "STREAK ATTIVITÀ!";
    mainColor = "#ffd166";
  }

  ctx.font = "bold 34px Arial";
  ctx.fillStyle = mainColor;
  ctx.textAlign = "center";
  ctx.fillText(title, 855, 190);

  ctx.font = "bold 96px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(255,255,255,0.35)";
  ctx.shadowBlur = 18;
  ctx.fillText(type === "reset" ? "RESET" : `LIVELLO ${level}`, 855, 305);
  ctx.shadowBlur = 0;

  ctx.font = "bold 42px Arial";
  ctx.fillStyle = mainColor;
  ctx.fillText("BORDO CAMPO", 855, 370);

  ctx.font = "28px Arial";
  ctx.fillStyle = "#d7d7e6";
  const subtitle =
    type === "up"
      ? "Ottimo lavoro! La tua attività è fondamentale per la community."
      : type === "down"
      ? "Sei sceso di livello per inattività. Torna attivo per recuperare."
      : type === "reset"
      ? "I livelli sono stati azzerati per inattività prolungata."
      : "Hai mantenuto una streak attiva nella community!";
  ctx.fillText(subtitle, 855, 435);

  // Badge image
  const badgeFile = LEVEL_BADGES[Math.max(1, Math.min(5, level))];
  const badgePath = path.join(process.cwd(), "assets", "levels", badgeFile);

  try {
    const badge = await loadImage(badgePath);
    ctx.drawImage(badge, 140, 160, 360, 360);
  } catch (err) {
    roundRect(ctx, 165, 160, 310, 310, 32);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.font = "bold 120px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("BC", 320, 350);
  }

  // Avatar
  if (avatarUrl) {
    try {
      const avatar = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(120, 80, 45, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, 75, 35, 90, 90);
      ctx.restore();
    } catch (e) {}
  }

  ctx.font = "bold 30px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(username || "Utente", 180, 92);

  // Stat boxes
  const statY = 500;
  const stats = [
    { label: "MESSAGGI", value: formatNumber(messages), icon: "💬" },
    { label: "TEMPO IN VOCE", value: `${voiceHours || 0} h`, icon: "🎙️" },
    { label: "XP TOTALI", value: `${formatNumber(xp)} XP`, icon: "⭐" },
  ];

  let x = 570;
  for (const stat of stats) {
    roundRect(ctx, x, statY, 220, 100, 18);
    ctx.fillStyle = "rgba(20, 24, 48, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "rgba(80, 130, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "26px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(stat.icon, x + 24, statY + 61);

    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#9db3ff";
    ctx.fillText(stat.label, x + 78, statY + 40);

    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(stat.value), x + 78, statY + 75);

    x += 260;
  }

  // Progress bar
  const barX = 210;
  const barY = 650;
  const barW = 650;
  const barH = 32;

  ctx.font = "bold 30px Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = mainColor;
  ctx.fillText(type === "reset" ? "LIVELLO 0" : `LIVELLO ${level}`, 110, barY + 25);

  roundRect(ctx, barX, barY, barW, barH, 16);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();

  const progress = type === "reset" ? 0 : progressForLevel(xp, level, levelXp);
  const fillW = Math.max(18, barW * progress);
  roundRect(ctx, barX, barY, fillW, barH, 16);
  const prog = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  prog.addColorStop(0, "#00c8ff");
  prog.addColorStop(1, "#a94cff");
  ctx.fillStyle = prog;
  ctx.fill();

  ctx.textAlign = "center";
  ctx.font = "bold 28px Arial";
  ctx.fillStyle = "#c7c9ff";
  ctx.fillText(
    type === "reset" ? "Riparti da 0 XP" : `PROSSIMO LIVELLO ${formatNumber(nextXp || 0)} XP`,
    1090,
    barY + 26
  );

  return canvas.toBuffer("image/png");
}

module.exports = { createLevelCard };
