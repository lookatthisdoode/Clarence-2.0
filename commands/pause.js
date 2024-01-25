const { SlashCommandBuilder } = require('discord.js')
const { useQueue } = require('discord-player')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses current song'),
  async execute(interaction) {
    await interaction.deferReply()
    const queue = useQueue(interaction.guild.id)
    queue.node.setPaused(true)
    await interaction.followUp(`Paused!`)
  },
}
