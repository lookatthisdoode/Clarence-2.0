const { SlashCommandBuilder } = require('discord.js')
const { useQueue } = require('discord-player')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips current song')
    .addStringOption((option) =>
      option
        .setName('to')
        .setDescription('Song from a queue')
        .setRequired(false)
    ),
  async execute(interaction) {
    const query = parseInt(interaction.options.getString('to')) - 1 || undefined

    await interaction.deferReply()
    const queue = useQueue(interaction.guild.id)
    const tracks = queue.tracks.toArray()

    if (
      !query ||
      query === undefined ||
      isNaN(query) ||
      query >= tracks.length - 1
    ) {
      console.log('bad input')
      await interaction.followUp(`Bad or no input! Skipping to next song..`)
      queue.node.skip()
    } else {
      queue.node.skipTo(query)
      await interaction.followUp(`Skipped!`)
    }
  },
}
