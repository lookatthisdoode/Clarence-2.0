const { SlashCommandBuilder } = require('discord.js')
const { useQueue } = require('discord-player')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Allows you to put whole playlist in a queue')
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('URL to a playlist')
        .setRequired(true)
    ),
  execute: async (interaction) => {
    await interaction.deferReply()

    // getting query from initial command
    const query = interaction.options.getString('url', true)
    const player = interaction.client.player
    // needed here to initialise player upon first play
    await player.extractors.loadDefault()

    const queue =
      useQueue(interaction.guild.id) ||
      player.nodes.create(interaction.guild, {
        metadata: {
          channel: interaction.channel,
        },
      })

    //  https://www.youtube.com/watch?v=EymPFkikX_U&list=PLa0w72AhbzM8rOGa92ZJq0P7kfXTWaVZQ

    const searchResult = await player.search(query)

    if (!searchResult.hasPlaylist()) {
      await interaction.folowUp('Thats not a playlist mate')
      return
    } else {
      queue.addTrack(searchResult.playlist.tracks)
    }

    if (!queue.connection) {
      try {
        await queue.connect(interaction.member.voice.channel)
      } catch (e) {
        console.log('error:', e)
        await queue.delete()
        return interaction.followUp(
          'Maybe you are not in a voice channel bud? And also i deleted the queue'
        )
      }
    }

    // finally play
    !queue.isPlaying() ? await queue.node.play() : null
  },
}
