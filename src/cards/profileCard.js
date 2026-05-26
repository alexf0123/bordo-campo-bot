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
  return levelXp[nextLevel] || 2500;
}

function getProgress(xp, level, levelXp) {
  const current = levelXp[level] || 0;
  const next = getNextXp(level, levelXp);
  const needed = Math.max(next - current, 1);

  return Math.max(0, Math.min(1, ((xp || 0) - current) / needed));
}

async function createProfileCard(data) {
  const {
    username,
    avatarUrl,
    level,
    xp,
    messages,
    streak,
    rank,
    levelXp,
  } = data;

  const canvas = createCanvas(1200, 675);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 1200, 675);
  bg.addColorStop(0, "#061826");
  bg.addColorStop(1, "#170a28");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 675);

  roundRect(ctx, 60, 55, 1080, 565, 36);
  ctx.fillStyle = "rgba(5,10,25,0.92)";
  ctx.fill();

  const border = ctx.createLinearGradient(60, 55, 1140, 620);
  border.addColorStop(0, "#00d4ff");
  border.addColorStop(1, "#a020f0");
  ctx.strokeStyle = border;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.font = "bold 34px Sans";
  ctx.fillStyle = "#00d4ff";
  ctx.fillText("PROFILO BORDO CAMPO", 110, 120);

  ctx.font = "bold 58px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(username || "Utente", 110, 190);

  ctx.font = "24px Sans";
  ctx.fillStyle = "#a8b3cf";
  ctx.fillText("Sistema livelli e progressione", 110, 235);

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
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 6;
    ctx.stroke();
  } catch {}

  const cards = [
    {
      x: 110,
      y: 305,
      w: 230,
      title: "LIVELLO",
      value: String(level || 0),
      color: "#00d4ff",
    },
    {
      x: 370,
      y: 305,
      w: 230,
      title: "RANK",
      value: `#${rank || "-"}`,
      color: "#b14cff",
    },
    {
      x: 630,
      y: 305,
      w: 390,
      title: "XP TOTALI",
      value: `${formatNumber(xp)} XP`,
      color: "#ffd166",
    },
  ];

  for (const card of cards) {
    roundRect(ctx, card.x, card.y, card.w, 120, 24);

    ctx.fillStyle = "rgba(20,30,60,0.92)";
    ctx.fill();

    ctx.strokeStyle = card.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "bold 20px Sans";
    ctx.fillStyle = "#9db3ff";
    ctx.fillText(card.title, card.x + 24, card.y + 38);

    ctx.font = "bold 46px Sans";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(card.value, card.x + 24, card.y + 88);
  }

  const stats = [
    {
      x: 110,
      title: "MESSAGGI",
      value: formatNumber(messages),
    },
    {
      x: 420,
      title: "STREAK",
      value: `${streak || 0} giorni`,
    },
    {
      x: 730,
      title: "STATUS",
      value: (level || 0) >= 5 ? "MAX" : "ATTIVO",
    },
  ];

  for (const stat of stats) {
    roundRect(ctx, stat.x, 465, 270, 82, 18);

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();

    ctx.strokeStyle = "#203d90";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "bold 18px Sans";
    ctx.fillStyle = "#9db3ff";
    ctx.fillText(stat.title, stat.x + 24, 498);

    ctx.font = "bold 26px Sans";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(stat.value, stat.x + 24, 532);
  }

  const nextXp = getNextXp(level, levelXp);
  const progress = getProgress(xp, level, levelXp);

  ctx.font = "bold 22px Sans";
  ctx.fillStyle = "#00d4ff";
  ctx.fillText(`PROSSIMO LIVELLO: ${formatNumber(nextXp)} XP`, 110, 590);

  roundRect(ctx, 500, 565, 520, 32, 16);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();

  roundRect(ctx, 500, 565, Math.max(20, 520 * progress), 32, 16);

  const prog = ctx.createLinearGradient(500, 565, 1020, 565);
  prog.addColorStop(0, "#00d4ff");
  prog.addColorStop(1, "#a020f0");

  ctx.fillStyle = prog;
  ctx.fill();

  return canvas.toBuffer("image/png");
}

module.exports = { createProfileCard };
