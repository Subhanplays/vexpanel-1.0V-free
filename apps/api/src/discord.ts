/** VexPanel Discord Bot - runs alongside the API server */
import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, type Interaction } from "discord.js";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const panelUrl = process.env.PANEL_URL ?? "http://localhost:3000";

if (!token || !clientId) {
  console.log("[discord] DISCORD_TOKEN or DISCORD_CLIENT_ID not set, bot disabled");
  process.exit(0);
}

const finalToken: string = token;
const finalClientId: string = clientId;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const commands = [
  new SlashCommandBuilder().setName("status").setDescription("Show VexPanel system status"),
  new SlashCommandBuilder().setName("vps").setDescription("List your VPS instances"),
  new SlashCommandBuilder().setName("myvps").setDescription("Show your VPS details"),
  new SlashCommandBuilder().setName("panel").setDescription("Get the VexPanel dashboard link"),
  new SlashCommandBuilder().setName("help").setDescription("Show available commands"),
].map(cmd => cmd.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(finalToken);
  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(finalClientId, guildId), { body: commands });
      console.log("[discord] registered guild commands");
    } else {
      await rest.put(Routes.applicationCommands(finalClientId), { body: commands });
      console.log("[discord] registered global commands");
    }
  } catch (error) {
    console.error("[discord] command registration failed:", error);
  }
}

async function getStatusEmbed(): Promise<EmbedBuilder> {
  const [totalVps, runningVps, totalUsers, onlineNodes, totalNodes] = await Promise.all([
    db.vps.count({ where: { status: { notIn: ["DELETED"] } } }),
    db.vps.count({ where: { status: "RUNNING" } }),
    db.user.count(),
    db.node.count({ where: { status: "ONLINE" } }),
    db.node.count(),
  ]);

  const dbStatus = await db.$queryRaw`SELECT 1`.then(() => "Connected").catch(() => "Disconnected");

  return new EmbedBuilder()
    .setTitle("VexPanel Status")
    .setColor(0x34d399)
    .addFields(
      { name: "Panel", value: "Online", inline: true },
      { name: "Database", value: dbStatus, inline: true },
      { name: "Nodes", value: `${onlineNodes}/${totalNodes} Online`, inline: true },
      { name: "VPS", value: `${totalVps} Total\n${runningVps} Running`, inline: true },
      { name: "Users", value: `${totalUsers}`, inline: true },
    )
    .setTimestamp();
}

async function getVpsEmbed(discordId: string): Promise<EmbedBuilder> {
  const user = await db.user.findUnique({ where: { discordId } });
  if (!user) return new EmbedBuilder().setTitle("Not Linked").setDescription("Your Discord account is not linked to VexPanel.").setColor(0xfb7185);

  const vpses = await db.vps.findMany({
    where: { userId: user.id, status: { notIn: ["DELETED"] } },
    include: { node: { select: { name: true } }, ip: true },
    orderBy: { createdAt: "desc" },
  });

  if (!vpses.length) return new EmbedBuilder().setTitle("Your VPSes").setDescription("No VPS instances found.").setColor(0x919aaa);

  const embed = new EmbedBuilder().setTitle("Your VPSes").setColor(0xa78bfa);
  for (const vps of vpses.slice(0, 25)) {
    const statusEmoji = vps.status === "RUNNING" ? "🟢" : vps.status === "STOPPED" ? "🔴" : vps.status === "SUSPENDED" ? "🟡" : "⚪";
    embed.addFields({
      name: vps.name,
      value: [
        `${statusEmoji} ${vps.status}`,
        `${vps.cpu} CPU · ${Math.round(vps.ramMiB / 1024)} GB RAM · ${vps.diskGiB} GB`,
        `Node: ${vps.node.name}`,
        `IP: ${vps.ip?.address ?? "None"}`,
      ].join("\n"),
      inline: true,
    });
  }
  return embed.setTimestamp();
}

client.on("ready", async () => {
  console.log(`[discord] logged in as ${client.user?.tag}`);
  await registerCommands();
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case "status": {
        await interaction.deferReply();
        const embed = await getStatusEmbed();
        await interaction.editReply({ embeds: [embed] });
        break;
      }
      case "vps":
      case "myvps": {
        await interaction.deferReply();
        const member = interaction.member;
        const discordId = member?.user?.id;
        if (!discordId) return interaction.editReply("Could not identify your Discord account.");
        const embed = await getVpsEmbed(discordId);
        await interaction.editReply({ embeds: [embed] });
        break;
      }
      case "panel": {
        const embed = new EmbedBuilder()
          .setTitle("VexPanel Dashboard")
          .setDescription(`[Open Panel](${panelUrl})`)
          .setColor(0xa78bfa)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
      case "help": {
        const embed = new EmbedBuilder()
          .setTitle("VexPanel Commands")
          .setDescription("Available bot commands:")
          .addFields(
            { name: "/status", value: "Show system status", inline: true },
            { name: "/vps", value: "List your VPS instances", inline: true },
            { name: "/myvps", value: "Show your VPS details", inline: true },
            { name: "/panel", value: "Get dashboard link", inline: true },
            { name: "/help", value: "Show this help", inline: true },
          )
          .setColor(0xa78bfa)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  } catch (error) {
    console.error(`[discord] command ${interaction.commandName} failed:`, error);
    const reply = { content: "An error occurred while executing this command.", ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.login(finalToken).catch(err => {
  console.error("[discord] login failed:", err);
  process.exit(1);
});
