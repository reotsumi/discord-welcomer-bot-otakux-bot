const Discord = require("discord.js");
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_INVITES"],
});
const config = require("./config.json");
const { MessageActionRow, MessageButton } = require("discord.js");
const { startServer } = require("./alive.js");

let invites = {};

const getInviteCounts = async (guild) => {
  return new Map(
    guild.invites.cache.map((invite) => [invite.code, invite.uses]),
  );
};

client.once("ready", async () => {
  console.log("Bot is online!");
  console.log("Code by Wick Studio!");
  console.log("discord.gg/wicks");

  // Load all server invites
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const currentInvites = await guild.invites.fetch();
      invites[guildId] = new Map(
        currentInvites.map((invite) => [invite.code, invite.uses]),
      );
      console.log(
        `Loaded ${currentInvites.size} invites for guild: ${guild.name}`,
      );
    } catch (err) {
      console.log(`Failed to load invites for guild: ${guild.name}`);
      console.error(err);
    }
  }
});

client.on("inviteCreate", async (invite) => {
  const guildInvites = invites[invite.guild.id];
  guildInvites.set(invite.code, invite.uses);
});

client.on("inviteDelete", async (invite) => {
  const guildInvites = invites[invite.guild.id];
  guildInvites.delete(invite.code);
});

client.on("guildMemberAdd", async (member) => {
  const welcomeChannel = member.guild.channels.cache.get(
    config.welcomeChannelId,
  );
  const role = member.guild.roles.cache.get(config.autoRoleId);

  if (role) {
    member.roles.add(role).catch(console.error);
  } else {
    console.log("Role not found");
  }

  const newInvites = await member.guild.invites.fetch();
  const usedInvite = newInvites.find((inv) => {
    const prevUses = invites[member.guild.id].get(inv.code) || 0;
    return inv.uses > prevUses;
  });

  let inviterMention = "Unknown";
  if (usedInvite && usedInvite.inviter) {
    inviterMention = `<@${usedInvite.inviter.id}>`;
    console.log(
      `Member joined with invite code ${usedInvite.code}, invited by ${inviterMention}`,
    );
  } else {
    console.log(`Member joined, but no matching invite was found.`);
  }

  const fullUser = await client.users.fetch(member.user.id, { force: true });

  const welcomeEmbed = new Discord.MessageEmbed()
    .setColor("#8f00ff")
    .setTitle("Welcome to the Server!")
    .setDescription(
      `Hello ${member}, welcome to **${member.guild.name}**! enjoy your stay.`,
    )
    .addFields(
      { name: "Username", value: member.user.tag, inline: true },
      { name: "Invited By", value: inviterMention, inline: true },
      {
        name: "Invite Used",
        value: usedInvite ? `||${usedInvite.code}||` : "Direct Join",
        inline: true,
      },
      {
        name: "You're Member",
        value: `${member.guild.memberCount}`,
        inline: true,
      },
      { name: "Server Rules", value: "<#1174819663390195786>.", inline: true }, // channel
      {
        name: "Support Channel",
        value: "<#1308889019693924372>.", // channel
        inline: true,
      },
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();
  const bannerUrl = fullUser.bannerURL({
    dynamic: true,
    format: "png",
    size: 1024,
  });
  if (bannerUrl) {
    welcomeEmbed.setImage(bannerUrl);
  }

  // buttons
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setStyle("LINK")
      .setURL("https://www.facebook.com/otakuxworld") // link to button 1
      .setLabel("Facebook") // name of button 1
      .setEmoji("<:Facebook:1052279979473391656>"), // emoji of button 1
    new MessageButton()
      .setStyle("LINK")
      .setURL("https://www.pinterest.com/otakuxnet") // link to button 2
      .setLabel("Pinterest") // name of button 2
      .setEmoji("<a:5notific:1054259468281577522>"), // emoji of button 2
    new MessageButton()
      .setStyle("LINK")
      .setURL("https://www.otakux.net/") //link to button 3
      .setLabel("Website") // name of button 3
      .setEmoji("<:web:1129345172333932595>"), // emoji of button 3
  );

  welcomeChannel.send({ embeds: [welcomeEmbed], components: [row] });

  invites[member.guild.id] = new Map(
    newInvites.map((invite) => [invite.code, invite.uses]),
  );
});

startServer();

client.login(process.env.TOKEN);

const http = require('http');
http.createServer((req, res) => {
  res.write("I'm alive");
  res.end();
}).listen(8080);
