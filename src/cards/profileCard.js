const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

// Versione definitiva NO FONT: niente Fontconfig, niente quadratini.
// Tutte le scritte sono disegnate con font vettoriale interno pixel premium.

const FONT = {
  "A":["01110","10001","10001","11111","10001","10001","10001"],"B":["11110","10001","10001","11110","10001","10001","11110"],
  "C":["01111","10000","10000","10000","10000","10000","01111"],"D":["11110","10001","10001","10001","10001","10001","11110"],
  "E":["11111","10000","10000","11110","10000","10000","11111"],"F":["11111","10000","10000","11110","10000","10000","10000"],
  "G":["01111","10000","10000","10111","10001","10001","01111"],"H":["10001","10001","10001","11111","10001","10001","10001"],
  "I":["11111","00100","00100","00100","00100","00100","11111"],"J":["00111","00010","00010","00010","10010","10010","01100"],
  "K":["10001","10010","10100","11000","10100","10010","10001"],"L":["10000","10000","10000","10000","10000","10000","11111"],
  "M":["10001","11011","10101","10101","10001","10001","10001"],"N":["10001","11001","10101","10011","10001","10001","10001"],
  "O":["01110","10001","10001","10001","10001","10001","01110"],"P":["11110","10001","10001","11110","10000","10000","10000"],
  "Q":["01110","10001","10001","10001","10101","10010","01101"],"R":["11110","10001","10001","11110","10100","10010","10001"],
  "S":["01111","10000","10000","01110","00001","00001","11110"],"T":["11111","00100","00100","00100","00100","00100","00100"],
  "U":["10001","10001","10001","10001","10001","10001","01110"],"V":["10001","10001","10001","10001","10001","01010","00100"],
  "W":["10001","10001","10001","10101","10101","10101","01010"],"X":["10001","10001","01010","00100","01010","10001","10001"],
  "Y":["10001","10001","01010","00100","00100","00100","00100"],"Z":["11111","00001","00010","00100","01000","10000","11111"],
  "0":["01110","10001","10011","10101","11001","10001","01110"],"1":["00100","01100","00100","00100","00100","00100","01110"],
  "2":["01110","10001","00001","00010","00100","01000","11111"],"3":["11110","00001","00001","01110","00001","00001","11110"],
  "4":["10010","10010","10010","11111","00010","00010","00010"],"5":["11111","10000","10000","11110","00001","00001","11110"],
  "6":["01110","10000","10000","11110","10001","10001","01110"],"7":["11111","00001","00010","00100","01000","01000","01000"],
  "8":["01110","10001","10001","01110","10001","10001","01110"],"9":["01110","10001","10001","01111","00001","00001","01110"],
  "_":["00000","00000","00000","00000","00000","00000","11111"],"-":["00000","00000","00000","11111","00000","00000","00000"],
  "#":["01010","11111","01010","01010","11111","01010","00000"],"/":["00001","00010","00010","00100","01000","01000","10000"],
  ".":["00000","00000","00000","00000","00000","01100","01100"]," ":["00000","00000","00000","00000","00000","00000","00000"]
};

function clean(t) {
  return String(t ?? "")
    .toUpperCase()
    .replace(/[ÀÁÂÄ]/g,"A").replace(/[ÈÉÊË]/g,"E").replace(/[ÌÍÎÏ]/g,"I")
    .replace(/[ÒÓÔÖ]/g,"O").replace(/[ÙÚÛÜ]/g,"U")
    .replace(/[^A-Z0-9 _#\-/.]/g,"");
}

function textWidth(text, s) {
  text = clean(text);
  return text.length * (5 * s + s);
}

function drawText(ctx, text, x, y, s, color, maxW = 9999, align = "left") {
  text = clean(text);
  while (s > 2 && textWidth(text, s) > maxW) s -= 1;

  if (align === "center") x -= textWidth(text, s) / 2;
  if (align === "right") x -= textWidth(text, s);

  const cw = 5 * s;
  const gap = s;
  let cx = x;

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  for (const ch of text) {
    if (cx + cw > x + maxW) break;
    const m = FONT[ch] || FONT[" "];
    for (let r=0;r<m.length;r++) for (let c=0;c<m[r].length;c++) {
      if (m[r][c] === "1") ctx.fillRect(cx+c*s+s, y+r*s+s, s, s);
    }
    cx += cw + gap;
  }

  cx = x;
  ctx.fillStyle = color;
  for (const ch of text) {
    if (cx + cw > x + maxW) break;
    const m = FONT[ch] || FONT[" "];
    for (let r=0;r<m.length;r++) for (let c=0;c<m[r].length;c++) {
      if (m[r][c] === "1") ctx.fillRect(cx+c*s, y+r*s, s, s);
    }
    cx += cw + gap;
  }
}

function rr(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

function fmt(n){ return new Intl.NumberFormat("it-IT").format(Number(n||0)); }

function levelBadgePath(level) {
  const l = Math.max(1, Math.min(5, Number(level || 1)));
  return path.join(process.cwd(), "assets", "levels", `livello${l}.png`);
}

function panel(ctx, x, y, w, h, color, title, value, valueScale=7) {
  ctx.save();
  rr(ctx,x,y,w,h,20);
  const bg = ctx.createLinearGradient(x,y,x+w,y+h);
  bg.addColorStop(0,"rgba(12,26,56,.96)");
  bg.addColorStop(1,"rgba(6,8,22,.96)");
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.stroke();
  ctx.shadowBlur = 0;

  drawText(ctx, title, x+24, y+24, 4, color, w-48);
  drawText(ctx, String(value), x+24, y+h-58, valueScale, "#ffffff", w-48);
  ctx.restore();
}

async function createProfileCard(userData, avatarUrl) {
  const W=1600,H=900;
  const canvas = createCanvas(W,H);
  const ctx = canvas.getContext("2d");

  const username = clean(userData.username || "UTENTE").slice(0,18);
  const level = Number(userData.level || 0);
  const xp = Number(userData.xp || 0);
  const rank = userData.rank || "-";
  const messages = Number(userData.messages || 0);
  const streak = Number(userData.streak || 0);
  const currentXp = Number(userData.currentXp || xp);
  const requiredXp = Number(userData.requiredXp || 300);
  const progress = Math.max(0, Math.min(1, currentXp / Math.max(requiredXp,1)));

  // BG
  const bg = ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,"#020a14"); bg.addColorStop(.5,"#050816"); bg.addColorStop(1,"#1b062c");
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  let g = ctx.createRadialGradient(260,270,10,260,270,540);
  g.addColorStop(0,"rgba(0,216,255,.34)"); g.addColorStop(1,"rgba(0,216,255,0)");
  ctx.fillStyle=g; ctx.fillRect(0,0,800,760);

  g = ctx.createRadialGradient(1280,250,10,1280,250,520);
  g.addColorStop(0,"rgba(196,60,255,.24)"); g.addColorStop(1,"rgba(196,60,255,0)");
  ctx.fillStyle=g; ctx.fillRect(860,0,740,700);

  // frame
  rr(ctx,55,48,1490,805,44);
  ctx.fillStyle="rgba(5,10,25,.94)"; ctx.fill();
  const br = ctx.createLinearGradient(55,48,1545,853);
  br.addColorStop(0,"#00d8ff"); br.addColorStop(.55,"#347dff"); br.addColorStop(1,"#c43cff");
  ctx.strokeStyle=br; ctx.lineWidth=7; ctx.shadowColor="#00d8ff"; ctx.shadowBlur=15; ctx.stroke(); ctx.shadowBlur=0;

  ctx.globalAlpha=.06; ctx.strokeStyle="#fff"; ctx.lineWidth=2;
  for(let y=95;y<810;y+=24){ ctx.beginPath(); ctx.moveTo(90,y); ctx.lineTo(1510,y); ctx.stroke(); }
  ctx.globalAlpha=1;

  // avatar
  try {
    const av = await loadImage(avatarUrl);
    ctx.save(); ctx.beginPath(); ctx.arc(270,292,178,0,Math.PI*2); ctx.clip();
    ctx.drawImage(av,92,114,356,356); ctx.restore();
    ctx.beginPath(); ctx.arc(270,292,193,0,Math.PI*2); ctx.strokeStyle="#00d8ff"; ctx.lineWidth=9; ctx.shadowColor="#00d8ff"; ctx.shadowBlur=18; ctx.stroke();
    ctx.beginPath(); ctx.arc(270,292,212,0,Math.PI*2); ctx.strokeStyle="#c43cff"; ctx.lineWidth=4; ctx.shadowColor="#c43cff"; ctx.shadowBlur=14; ctx.stroke(); ctx.shadowBlur=0;
  } catch(e){}

  // badge smaller and higher
  try {
    const badge = await loadImage(levelBadgePath(level));
    ctx.drawImage(badge, 1135, 82, 285, 285);
  } catch(e){}

  // header
  drawText(ctx,"BORDO CAMPO",800,95,5,"#00d8ff",500,"center");
  drawText(ctx,"PROFILO PLAYER",800,158,5,"#a9b8dc",560,"center");
  drawText(ctx,username,800,235,8,"#ffffff",650,"center");
  drawText(ctx,"XP GLOBALE COMMUNITY",800,330,4,"#00d8ff",560,"center");

  // main stats aligned and no overlap
  panel(ctx, 500, 405, 255, 150, "#00d8ff", "LIVELLO", level, 9);
  panel(ctx, 790, 405, 335, 150, "#c43cff", "XP TOTALI", `${fmt(xp)} XP`, 6);
  panel(ctx, 1160, 405, 270, 150, "#ffd166", "RANK", `#${rank}`, 8);

  panel(ctx, 95, 610, 330, 125, "#00d8ff", "MESSAGGI", fmt(messages), 7);
  panel(ctx, 465, 610, 320, 125, "#ff4d6d", "STREAK", `${streak} GIORNI`, 5);
  panel(ctx, 825, 610, 320, 125, "#56ff96", "STATUS", "ATTIVO", 5);
  panel(ctx, 1185, 610, 270, 125, "#ffd166", "NETWORK", "BC", 8);

  // progress
  drawText(ctx,"PROGRESSO LIVELLO",95,790,4,"#00d8ff",440);
  rr(ctx,410,762,810,42,21); ctx.fillStyle="rgba(255,255,255,.10)"; ctx.fill();
  rr(ctx,410,762,Math.max(35,810*progress),42,21);
  const pg=ctx.createLinearGradient(410,762,1220,762);
  pg.addColorStop(0,"#00d8ff"); pg.addColorStop(.55,"#347dff"); pg.addColorStop(1,"#c43cff");
  ctx.fillStyle=pg; ctx.shadowColor="#00d8ff"; ctx.shadowBlur=14; ctx.fill(); ctx.shadowBlur=0;
  drawText(ctx,`${fmt(currentXp)} / ${fmt(requiredXp)} XP`,1260,775,4,"#ffffff",300);

  drawText(ctx,"BORDO CAMPO  SISTEMA LIVELLI",800,830,3,"#6edfff",520,"center");

  return new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "profile-card.png" });
}

module.exports = createProfileCard;
module.exports.createProfileCard = createProfileCard;
