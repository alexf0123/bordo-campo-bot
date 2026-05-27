process.env.FONTCONFIG_PATH = process.env.FONTCONFIG_PATH || "/etc/fonts";

const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

const FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const FONT_CONDENSED = "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf";

try {
  if (fs.existsSync(FONT_REGULAR)) registerFont(FONT_REGULAR, { family: "BCSans" });
  if (fs.existsSync(FONT_BOLD)) registerFont(FONT_BOLD, { family: "BCSansBold" });
  if (fs.existsSync(FONT_CONDENSED)) registerFont(FONT_CONDENSED, { family: "BCSansCondensed" });
} catch (err) {
  console.log("Font register warning:", err.message);
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

function formatNumber(value) {
  return new Intl.NumberFormat("it-IT").format(Number(value || 0));
}

function badgePath(level) {
  const safeLevel = Math.max(1, Math.min(5, Number(level || 1)));
  return path.join(process.cwd(), "assets", "levels", `livello${safeLevel}.png`);
}

function setFont(ctx, size, weight = "bold", family = "BCSansBold") {
  ctx.font = `${weight} ${size}px "${family}", "DejaVu Sans", Arial, sans-serif`;
}

function fitText(ctx, text, maxWidth, startSize, minSize = 24, family = "BCSansCondensed") {
  let size = startSize;
  while (size > minSize) {
    setFont(ctx, size, "bold", family);
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return minSize;
}

function glowText(ctx, text, x, y, size, color, align = "left", family = "BCSansBold") {
  ctx.save();
  setFont(ctx, size, "bold", family);
  ctx.textAlign = align;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCard(ctx, x, y, w, h, title, value, color, valueSize = 48) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 22);

  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, "rgba(15, 28, 58, 0.96)");
  bg.addColorStop(1, "rgba(7, 10, 24, 0.96)");
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const shine = ctx.createLinearGradient(x, y, x + w, y + h);
  shine.addColorStop(0, "rgba(255,255,255,0.09)");
  shine.addColorStop(0.55, "rgba(255,255,255,0)");
  shine.addColorStop(1, "rgba(255,255,255,0.05)");
  ctx.fillStyle = shine;
  ctx.fill();

  setFont(ctx, 26, "bold", "BCSansBold");
  ctx.fillStyle = color;
  ctx.fillText(title, x + 26, y + 42);

  const fitted = fitText(ctx, String(value), w - 52, valueSize, 30, "BCSansCondensed");
  setFont(ctx, fitted, "bold", "BCSansCondensed");
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(value), x + 26, y + h - 26);

  ctx.restore();
}

async function createProfileCard(userData, avatarUrl) {
  const W = 1600;
  const H = 900;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const username = String(userData.username || "UTENTE").toUpperCase();
  const level = Number(userData.level || 0);
  const xp = Number(userData.xp || 0);
  const rank = userData.rank || "-";
  const messages = Number(userData.messages || 0);
  const streak = Number(userData.streak || 0);
  const currentXp = Number(userData.currentXp || xp);
  const requiredXp = Number(userData.requiredXp || 300);
  const progress = Math.max(0, Math.min(1, currentXp / Math.max(requiredXp, 1)));

  // sfondo
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#020a14");
  bg.addColorStop(0.45, "#060817");
  bg.addColorStop(1, "#1c062c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // glow
  let glow = ctx.createRadialGradient(250, 260, 20, 250, 260, 580);
  glow.addColorStop(0, "rgba(0, 216, 255, 0.34)");
  glow.addColorStop(1, "rgba(0, 216, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 900, 800);

  glow = ctx.createRadialGradient(1320, 250, 20, 1320, 250, 520);
  glow.addColorStop(0, "rgba(195, 62, 255, 0.24)");
  glow.addColorStop(1, "rgba(195, 62, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(900, 0, 700, 700);

  // pannello
  roundRect(ctx, 55, 48, 1490, 805, 44);
  ctx.fillStyle = "rgba(5, 10, 25, 0.94)";
  ctx.fill();

  const border = ctx.createLinearGradient(55, 48, 1545, 853);
  border.addColorStop(0, "#00d8ff");
  border.addColorStop(0.5, "#347dff");
  border.addColorStop(1, "#c43cff");
  ctx.strokeStyle = border;
  ctx.lineWidth = 7;
  ctx.shadowColor = "#00d8ff";
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // linee HUD leggere
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  for (let y = 96; y < 805; y += 24) {
    ctx.beginPath();
    ctx.moveTo(90, y);
    ctx.lineTo(1510, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // avatar sinistra
  try {
    const avatar = await loadImage(avatarUrl);

    ctx.save();
    ctx.beginPath();
    ctx.arc(270, 295, 178, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 92, 117, 356, 356);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(270, 295, 193, 0, Math.PI * 2);
    ctx.strokeStyle = "#00d8ff";
    ctx.lineWidth = 9;
    ctx.shadowColor = "#00d8ff";
    ctx.shadowBlur = 18;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(270, 295, 212, 0, Math.PI * 2);
    ctx.strokeStyle = "#c43cff";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#c43cff";
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } catch (err) {
    console.error("Avatar load error:", err.message);
  }

  // logo livello a destra: più piccolo e più alto
  try {
    const badge = await loadImage(badgePath(level));
    ctx.drawImage(badge, 1130, 82, 300, 300);
  } catch (err) {
    console.error("Badge load error:", err.message);
  }

  // header
  ctx.textAlign = "center";
  glowText(ctx, "BORDO CAMPO", 800, 115, 36, "#00d8ff", "center", "BCSansBold");

  setFont(ctx, 42, "bold", "BCSansBold");
  ctx.fillStyle = "#a9b8dc";
  ctx.fillText("PROFILO PLAYER", 800, 180);

  const userSize = fitText(ctx, username, 620, 74, 38, "BCSansCondensed");
  glowText(ctx, username, 800, 270, userSize, "#ffffff", "center", "BCSansCondensed");

  setFont(ctx, 32, "bold", "BCSansBold");
  ctx.fillStyle = "#00d8ff";
  ctx.fillText("XP GLOBALE COMMUNITY", 800, 340);

  ctx.textAlign = "left";

  // statistiche principali
  drawCard(ctx, 500, 405, 255, 150, "LIVELLO", level, "#00d8ff", 64);
  drawCard(ctx, 790, 405, 335, 150, "XP TOTALI", `${formatNumber(xp)} XP`, "#c43cff", 54);
  drawCard(ctx, 1160, 405, 270, 150, "RANK", `#${rank}`, "#ffd166", 64);

  // statistiche sotto
  drawCard(ctx, 95, 610, 330, 125, "MESSAGGI", formatNumber(messages), "#00d8ff", 52);
  drawCard(ctx, 465, 610, 320, 125, "STREAK", `${streak} GIORNI`, "#ff4d6d", 44);
  drawCard(ctx, 825, 610, 320, 125, "STATUS", "ATTIVO", "#56ff96", 44);
  drawCard(ctx, 1185, 610, 270, 125, "NETWORK", "BC", "#ffd166", 56);

  // progress
  setFont(ctx, 30, "bold", "BCSansBold");
  ctx.fillStyle = "#00d8ff";
  ctx.fillText("PROGRESSO LIVELLO", 95, 790);

  roundRect(ctx, 410, 762, 810, 42, 21);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fill();

  roundRect(ctx, 410, 762, Math.max(35, 810 * progress), 42, 21);
  const pg = ctx.createLinearGradient(410, 762, 1220, 762);
  pg.addColorStop(0, "#00d8ff");
  pg.addColorStop(0.55, "#347dff");
  pg.addColorStop(1, "#c43cff");
  ctx.fillStyle = pg;
  ctx.shadowColor = "#00d8ff";
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0;

  setFont(ctx, 30, "bold", "BCSansBold");
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${formatNumber(currentXp)} / ${formatNumber(requiredXp)} XP`, 1260, 794);

  ctx.textAlign = "center";
  setFont(ctx, 24, "normal", "BCSans");
  ctx.fillStyle = "#6edfff";
  ctx.fillText("BORDO CAMPO  •  SISTEMA LIVELLI", 800, 835);

  return new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: "profile-card.png",
  });
}

module.exports = createProfileCard;
module.exports.createProfileCard = createProfileCard;
