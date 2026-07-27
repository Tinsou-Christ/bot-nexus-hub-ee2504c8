const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

let fonts;
try {
  fonts = require('../../func/font.js');
} catch (error) {
  fonts = { bold: (t) => t, sansSerif: (t) => t, monospace: (t) => t, fancy: (t) => t };
}

function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

module.exports = {
  config: {
    name: "help",
    aliases: [],
    version: "3.1.1",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: {
      fr: "🧰 Affiche la liste des commandes disponibles et leurs détails"
    },
    category: "info",
    guide: {
      fr: "{pn} : menu principal\n{pn} <commande> : infos sur une commande\n{pn} basics : commandes de base\n{pn} search <mot> : rechercher une commande"
    }
  },

  onStart: async function ({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);
    const arg = args[0]?.toLowerCase();

    const allCommands = [];
    const seen = new Set();

    for (const [name, cmd] of commands) {
      if (cmd.config.role > role) continue;
      if (!seen.has(name)) {
        seen.add(name);
        allCommands.push(cmd);
      }
    }

    allCommands.sort((a, b) => a.config.name.localeCompare(b.config.name));

    if (!arg) {
      const categorized = {};

      for (const cmd of allCommands) {
        const cat = cmd.config.category || "other";
        if (!categorized[cat]) categorized[cat] = [];
        categorized[cat].push(cmd.config.name);
      }

      const sortedCats = Object.keys(categorized).sort();

      let msg = `${fonts.bold("🔍 Available Commands")} 🧰 (${allCommands.length})\n\n`;

      for (const cat of sortedCats) {
        msg += `${fonts.bold(toTitleCase(cat))} (${categorized[cat].length})\n`;

        const cmds = categorized[cat].sort();

        for (let i = 0; i < cmds.length; i += 3) {
          const line = cmds
            .slice(i, i + 3)
            .map(c => `📄 ${fonts.sansSerif(c)}`)
            .join("   ");
          msg += line + "\n";
        }

        msg += "\n";
      }

      msg += `\n${fonts.bold("➜ Command details:")} ${prefix}menu <commande>\n`;
      msg += `${fonts.bold("➜ Basics:")} ${prefix}help basics\n`;
      msg += `${fonts.bold("➜ Search:")} ${prefix}help search <mot>\n`;
      msg += `${fonts.bold("➜ Developed by @Christus")} 🎀`;

      return message.reply(msg);
    }

    if (arg === "basics") {
      const basicCmdList = [
        "register", "items", "gift", "bal", "bank", "active", "streak",
        "vault", "bag", "rank", "ratings", "report", "trade", "uid",
        "pet", "rosashop", "garden", "arena", "mtls"
      ];

      const validCommands = [];

      for (const cmdName of basicCmdList) {
        const cmd = commands.get(cmdName);
        if (cmd && cmd.config.role <= role) {
          validCommands.push(cmd);
        }
      }

      if (validCommands.length === 0) {
        return message.reply(fonts.bold("❌ No basic commands available for your role."));
      }

      let msg = `${fonts.bold("✅ Basic Commands")}\n\n`;

      for (const cmd of validCommands) {
        const cfg = cmd.config;
        const desc = cfg.description?.fr || "No description";
        msg += `📁 ${prefix}${cfg.name} ${fonts.bold("➜")} ${desc}\n`;
      }

      msg += `\n${fonts.bold("➜ Try to Explore more commands!")}\n`;
      msg += `${fonts.bold("➜ View all:")} ${prefix}help all\n`;
      msg += `${fonts.bold("➜ Developed by @Christus")} 🎀`;

      return message.reply(msg);
    }

    if (arg === "search" || arg === "find") {
      const searchStr = args[1];
      if (!searchStr) {
        return message.reply(
          `🔎 Search a command by putting a search keyword as argument.\n\n${fonts.bold("EXAMPLE:")} ${prefix}menu search shop`
        );
      }

      const results = [];
      const searchLower = searchStr.toLowerCase();

      for (const [name, cmd] of commands) {
        if (cmd.config.role > role) continue;
        const cfg = cmd.config;
        const searchableText = `${cfg.name} ${cfg.category || ""} ${(cfg.aliases || []).join(" ")} ${cfg.description?.fr || ""}`.toLowerCase();
        if (searchableText.includes(searchLower)) {
          results.push(cmd);
        }
      }

      if (results.length === 0) {
        return message.reply(`🔎 **Search Results** (0)\n❓ No Results.`);
      }

      const topResults = results.slice(0, 5);
      let msg = `${fonts.bold(`🔎 Search Results (${topResults.length})`)}\n\n`;

      for (const cmd of topResults) {
        const cfg = cmd.config;
        const aliasesList = cfg.aliases && cfg.aliases.length > 0 ? `\nAliases: ${cfg.aliases.join(", ")}` : "";
        msg += `📁 ${prefix}${fonts.bold(cfg.name)}${aliasesList}\n`;
        msg += `${fonts.bold("➜")} ${cfg.description?.fr || "No Description"}\n\n`;
      }

      msg += `${fonts.bold("➜ Developed by @Christus")} 🎀`;

      return message.reply(msg);
    }

    const cmdName = args[0];
    let cmd = commands.get(cmdName);
    if (!cmd) {
      const alias = aliases.get(cmdName);
      if (alias) cmd = commands.get(alias);
    }

    if (!cmd) {
      return message.reply(fonts.bold(`❌ Command "${cmdName}" does not exist`));
    }

    const cfg = cmd.config;

    let usage = cfg.guide?.fr || "No guide available";
    usage = usage.replace(/{p}/g, prefix).replace(/{n}/g, cfg.name);

    const roleText = cfg.role == 0 ? "All users" : cfg.role == 1 ? "Group admins" : cfg.role == 2 ? "Bot admin" : "Unknown";

    const detail = `${fonts.bold(`╭─── 📄 ${toTitleCase(cfg.name)} ───`)}
│ ➤ Name: ${fonts.sansSerif(cfg.name)}
│ ➤ Author: ${cfg.author || "Unknown"}
│ ➤ Description: ${cfg.description?.fr || "None"}
│ ➤ Usage: ${fonts.monospace(usage)}
│ ➤ Category: ${cfg.category || "other"}
│ ➤ Cooldown: ${cfg.countDown || 1}s
│ ➤ Role: ${roleText}
│ ➤ Aliases: ${cfg.aliases?.length ? cfg.aliases.join(", ") : "None"}
${fonts.bold("╰────────────────")}`;

    return message.reply(detail);
  }
};
