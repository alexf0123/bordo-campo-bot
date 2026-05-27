
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");

module.exports = async function createProfileCard(userData, avatarUrl) {
    const canvas = createCanvas(1600, 900);
    const ctx = canvas.getContext("2d");

    // BACKGROUND
    const gradient = ctx.createLinearGradient(0, 0, 1600, 900);
    gradient.addColorStop(0, "#041421");
    gradient.addColorStop(1, "#140028");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1600, 900);

    // BORDER
    ctx.strokeStyle = "#00d9ff";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 1560, 860);

    // USERNAME
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Sans";
    ctx.fillText(userData.username, 560, 180);

    ctx.fillStyle = "#00d9ff";
    ctx.font = "40px Sans";
    ctx.fillText("PROFILO PLAYER", 560, 100);

    // AVATAR
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(250, 250, 170, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 80, 80, 340, 340);
    ctx.restore();

    // LEVEL BADGE
    const levelImage = await loadImage(
        path.join(__dirname, "../../assets/levels/livello" + userData.level + ".png")
    );

    ctx.drawImage(levelImage, 1120, 80, 340, 340);

    // BOXES
    function box(x, y, w, h, color, title, value) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = color;
        ctx.font = "30px Sans";
        ctx.fillText(title, x + 20, y + 45);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 55px Sans";
        ctx.fillText(value, x + 20, y + 110);
    }

    box(520, 340, 260, 150, "#00d9ff", "LIVELLO", String(userData.level));
    box(820, 340, 320, 150, "#d946ef", "XP TOTALI", `${userData.xp} XP`);
    box(1180, 340, 260, 150, "#ffd54a", "RANK", `#${userData.rank}`);

    box(80, 560, 380, 130, "#00d9ff", "MESSAGGI", String(userData.messages));
    box(500, 560, 320, 130, "#ff4d6d", "STREAK", `${userData.streak}G`);
    box(860, 560, 280, 130, "#4dff88", "STATUS", "ATTIVO");
    box(1180, 560, 280, 130, "#b84dff", "NETWORK", "BC");

    // XP BAR
    ctx.fillStyle = "#111827";
    ctx.fillRect(120, 760, 1200, 40);

    const progress = Math.min(userData.currentXp / userData.requiredXp, 1);

    const barGradient = ctx.createLinearGradient(0, 0, 1200, 0);
    barGradient.addColorStop(0, "#00d9ff");
    barGradient.addColorStop(1, "#d946ef");

    ctx.fillStyle = barGradient;
    ctx.fillRect(120, 760, 1200 * progress, 40);

    ctx.fillStyle = "#ffffff";
    ctx.font = "32px Sans";
    ctx.fillText(`${userData.currentXp} / ${userData.requiredXp} XP`, 1340, 790);

    return new AttachmentBuilder(canvas.toBuffer("image/png"), {
        name: "profile-card.png"
    });
};
