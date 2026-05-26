const { createCanvas, loadImage } = require("canvas");

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
  return new Intl.NumberFormat("it-IT").format(value || 0);
}

function getNextXp(level, levelXp) {
  const nextLevel = Math.min((level || 0) + 1, 5);
  return levelXp[nextLevel] || levelXp[5] || 2500;
}

function getProgress(xp, level, levelXp) {
  if ((level || 0) >= 5) return 1;

  const current = levelXp[level] || 0;
  const next = getNextXp(level, levelXp);
  const total = Math.max(next - current, 1);
  return Math.max(0, Math.min(1, ((xp || 0) - current) / total));
}

async function createProfileCard({
  username,
  avatarUrl,
  level,
  xp,
  messages,
  streak,
  rank,
  levelXp,
}) {
  const canvas = createCanvas(1200, 675);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 1200, 675);
  bg.addColorStop(0, "#061826");
  bg.addColorStop(0.45, "#090d18");
  bg.addColorStop(1, "#190d2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 675);

  const glow1 = ctx.createRadialGradient(180, 120, 10, 180, 120, 520);
  glow1.addColorStop(0, "rgba(0, 210, 255, 0.28)");
  glow1.addColorStop(1, "rgba(0, 210, 255, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, 1200, 675);

  const glow2 = ctx.createRadialGradient(1000, 180, 10, 1000, 180, 520);
  glow2.addColorStop(0, "rgba(170, 70, 255, 0.24)");
  glow2.addColorStop(1, "rgba(170, 70, 255, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, 1200, 675);

  roundRect(ctx, 60, 55, 1080, 565, 36);
  ctx.fillStyle = "rgba(4, 10, 22, 0.86)";
  ctx.fill();

  const border = ctx.createLinearGradient(60, 55, 1140, 620);
  border.addColorStop(0, "#00d4ff");
  border.addColorStop(0.5, "#306fff");
  border.addColorStop(1, "#b14cff");
  ctx.strokeStyle = border;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.font = "bold 34px Arial";
  ctx.fillStyle = "#28d5ff";
  ctx.textAlign = "left";
  ctx.fillText("PROFILO BORDO CAMPO", 110, 120);

  ctx.font = "bold 60px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(username || "Utente", 110, 190);

  ctx.font = "26px Arial";
  ctx.fillStyle = "#aebce8";
  ctx.fillText("Community XP • Livelli • Attività", 110, 235);

  try {
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(960, 165, 92, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 868, 73, 184, 184);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(960, 165, 98, 0, Math.PI * 2);
    ctx.strokeStyle = "#28d5ff";
    ctx.lineWidth = 6;
    ctx.stroke();
  } catch {}

  const boxes = [
    { x: 110, y: 305, w: 230, title: "LIVELLO", value: String(level || 0), color: "#28d5ff" },
    { x: 370, y: 305, w: 230, title: "RANK", value: `#${rank || "-"}`, color: "#b14cff" },
    { x: 630, y: 305, w: 390, title: "XP TOTALI", value: `${formatNumber(xp)} XP`, color: "#ffd166" },
  ];

  for (const box of boxes) {
    roundRect(ctx, box.x, box.y, box.w, 120, 24);
    ctx.fillStyle = "rgba(19, 27, 56, 0.92)";
    ctx.fill();
    ctx.strokeStyle = box.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#9db3ff";
    ctx.fillText(box.title, box.x + 28, box.y + 42);

    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(box.value, box.x + 28, box.y + 92);
  }

  const statBoxes = [
    { x: 110, icon: "💬", title: "MESSAGGI", value: formatNumber(messages) },
    { x: 420, icon: "🔥", title: "STREAK", value: `${streak || 0} giorni` },
    { x: 730, icon: "⭐", title: "STATUS", value: (level || 0) >= 5 ? "MAX" : "ATTIVO" },
  ];

  for (const stat of statBoxes) {
    roundRect(ctx, stat.x, 465, 270, 82, 18);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(80, 130, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "28px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(stat.icon, stat.x + 24, 518);

    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#9db3ff";
    ctx.fillText(stat.title, stat.x + 72, 500);

    ctx.font = "bold 25px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(stat.value, stat.x + 72, 530);
  }

  const nextXp = getNextXp(level, levelXp);
  const progress = getProgress(xp, level, levelXp);

  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "#28d5ff";
  ctx.fillText((level || 0) >= 5 ? "LIVELLO MASSIMO RAGGIUNTO" : `PROSSIMO LIVELLO: ${formatNumber(nextXp)} XP`, 110, 590);

  roundRect(ctx, 500, 565, 520, 32, 16);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();

  roundRect(ctx, 500, 565, Math.max(18, 520 * progress), 32, 16);
  const prog = ctx.createLinearGradient(500, 565, 1020, 565);
  prog.addColorStop(0, "#00d4ff");
  prog.addColorStop(1, "#b14cff");
  ctx.fillStyle = prog;
  ctx.fill();

  return canvas.toBuffer("image/png");
}

module.exports = { createProfileCard };
