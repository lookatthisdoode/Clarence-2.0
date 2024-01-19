const { SlashCommandBuilder } = require("discord.js")
const { useQueue } = require("discord-player")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skips current song"),
  async execute(interaction) {
    await interaction.deferReply()
    const queue = useQueue(interaction.guild.id)
    queue.node.skip()
    await interaction.followUp(`Skipped!`)
  },
}

