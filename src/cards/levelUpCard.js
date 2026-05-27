const profileCardModule = require("./profileCard");

const createProfileCard =
  typeof profileCardModule === "function"
    ? profileCardModule
    : profileCardModule.createProfileCard;

async function createLevelUpCard(userData, avatarUrl) {
  if (!createProfileCard) {
    throw new Error("createProfileCard non trovato in src/cards/profileCard.js");
  }

  return createProfileCard(
    {
      ...userData,
      username: userData.username || "UTENTE",
    },
    avatarUrl
  );
}

module.exports = createLevelUpCard;
module.exports.createLevelUpCard = createLevelUpCard;
