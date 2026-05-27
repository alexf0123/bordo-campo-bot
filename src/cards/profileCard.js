const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

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

function getBadgePath(level) {
  const safeLevel = Math.max(1, Math.min(5, Number(level || 1)));
  return path.join(process.cwd(), "assets", "levels", `livello${safeLevel}.png`);
}

function fitText(ctx, text, maxWidth, startSize, minSize = 24, weight = "800") {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px "DejaVu Sans"`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawGlowText(ctx, text, x, y, size, color = "#ffffff", weight = "800", align = "left") {
  ctx.save();
  ctx.font = `${weight} ${size}px "DejaVu Sans"`;
  ctx.textAlign = align;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function statCard(ctx, x, y, w, h, title, value, color, subtitle = "") {
  ctx.save();

  roundRect(ctx, x, y, w, h, 22);
  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, "rgba(12, 24, 50, 0.92)");
  bg.addColorStop(1, "rgba(10, 10, 24, 0.92)");
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.font = '700 28px "DejaVu Sans"';
  ctx.fillStyle = color;
  ctx.fillText(title, x + 28, y + 45);

  const valueSize = fitText(ctx, String(value), w - 54, 54, 34);
  ctx.font = `900 ${valueSize}px "DejaVu Sans"`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(value), x + 28, y + 105);

  if (subtitle) {
    ctx.font = '600 22px "DejaVu Sans"';
    ctx.fillStyle = "#9fb4d8";
    ctx.fillText(subtitle, x + 28, y + h - 22);
  }

  ctx.restore();
}

async function createProfileCard(userData, avatarUrl) {
  const canvas = createCanvas(1600, 900);
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

  // BACKGROUND
  const bg = ctx.createLinearGradient(0, 0, 1600, 900);
  bg.addColorStop(0, "#020a14");
  bg.addColorStop(0.45, "#050816");
  bg.addColorStop(1, "#1b062c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1600, 900);

  // NEON GLOWS
  let glow = ctx.createRadialGradient(220, 220, 10, 220, 220, 520);
  glow.addColorStop(0, "rgba(0, 216, 255, 0.32)");
  glow.addColorStop(1, "rgba(0, 216, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 800, 700);

  glow = ctx.createRadialGradient(1300, 240, 10, 1300, 240, 520);
  glow.addColorStop(0, "rgba(194, 58, 255, 0.28)");
  glow.addColorStop(1, "rgba(194, 58, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(850, 0, 750, 700);

  // MAIN PANEL
  roundRect(ctx, 55, 45, 1490, 810, 42);
  ctx.fillStyle = "rgba(5, 10, 25, 0.93)";
  ctx.fill();

  const border = ctx.createLinearGradient(55, 45, 1545, 855);
  border.addColorStop(0, "#00d8ff");
  border.addColorStop(0.5, "#347dff");
  border.addColorStop(1, "#c43cff");
  ctx.strokeStyle = border;
  ctx.lineWidth = 7;
  ctx.shadowColor = "#00d8ff";
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // HUD LINES
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  for (let y = 95; y < 805; y += 24) {
    ctx.beginPath();
    ctx.moveTo(90, y);
    ctx.lineTo(1510, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // AVATAR LEFT
  try {
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(265, 285, 175, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 90, 110, 350, 350);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(265, 285, 188, 0, Math.PI * 2);
    ctx.strokeStyle = "#00d8ff";
    ctx.lineWidth = 9;
    ctx.shadowColor = "#00d8ff";
    ctx.shadowBlur = 20;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(265, 285, 207, 0, Math.PI * 2);
    ctx.strokeStyle = "#b33cff";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#b33cff";
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } catch (err) {
    console.error("Avatar load error:", err.message);
  }

  // LEVEL LOGO RIGHT
  try {
    const badge = await loadImage(getBadgePath(level));
    ctx.drawImage(badge, 1100, 105, 360, 360);
  } catch (err) {
    console.error("Badge load error:", err.message);
  }

  // HEADER
  ctx.font = '800 38px "DejaVu Sans"';
  ctx.fillStyle = "#00d8ff";
  ctx.textAlign = "center";
  ctx.fillText("BORDO CAMPO", 800, 110);

  ctx.font = '700 44px "DejaVu Sans"';
  ctx.fillStyle = "#aab9df";
  ctx.fillText("PROFILO PLAYER", 800, 180);

  const nameSize = fitText(ctx, username, 620, 72, 40);
  drawGlowText(ctx, username, 800, 265, nameSize, "#ffffff", "900", "center");

  ctx.font = '700 34px "DejaVu Sans"';
  ctx.fillStyle = "#00d8ff";
  ctx.fillText("XP GLOBALE COMMUNITY", 800, 335);

  // TOP STAT CARDS
  statCard(ctx, 500, 405, 255, 150, "LIVELLO", level, "#00d8ff");
  statCard(ctx, 790, 405, 330, 150, "XP TOTALI", `${formatNumber(xp)} XP`, "#c43cff");
  statCard(ctx, 1155, 405, 270, 150, "RANK", `#${rank}`, "#ffd166");

  // BOTTOM STAT CARDS
  statCard(ctx, 95, 610, 330, 125, "MESSAGGI", formatNumber(messages), "#00d8ff");
  statCard(ctx, 465, 610, 320, 125, "STREAK", `${streak} GIORNI`, "#ff4d6d");
  statCard(ctx, 825, 610, 320, 125, "STATUS", "ATTIVO", "#56ff96");
  statCard(ctx, 1185, 610, 270, 125, "NETWORK", "BC", "#ffd166");

  // PROGRESS BAR
  ctx.font = '800 30px "DejaVu Sans"';
  ctx.fillStyle = "#00d8ff";
  ctx.fillText("PROGRESSO LIVELLO", 95, 790);

  roundRect(ctx, 410, 762, 810, 42, 21);
  ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
  ctx.fill();

  roundRect(ctx, 410, 762, Math.max(35, 810 * progress), 42, 21);
  const pg = ctx.createLinearGradient(410, 762, 1220, 762);
  pg.addColorStop(0, "#00d8ff");
  pg.addColorStop(0.55, "#347dff");
  pg.addColorStop(1, "#c43cff");
  ctx.fillStyle = pg;
  ctx.shadowColor = "#00d8ff";
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.font = '800 30px "DejaVu Sans"';
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(`${formatNumber(currentXp)} / ${formatNumber(requiredXp)} XP`, 1260, 794);

  ctx.font = '600 24px "DejaVu Sans"';
  ctx.fillStyle = "#6edfff";
  ctx.textAlign = "center";
  ctx.fillText("BORDO CAMPO  •  SISTEMA LIVELLI", 800, 835);

  return new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: "profile-card.png",
  });
}

module.exports = createProfileCard;
module.exports.createProfileCard = createProfileCard;
