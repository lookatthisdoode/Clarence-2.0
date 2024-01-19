const { SlashCommandBuilder } = require("discord.js")
const { useQueue } = require("discord-player")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resumes current song"),
  async execute(interaction) {
    await interaction.deferReply()
    const queue = useQueue(interaction.guild.id)
    queue.node.setPaused(false)
    await interaction.followUp(`Resumed!`)
  },
}

