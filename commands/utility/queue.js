const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { useQueue } = require('discord-player')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Check current queue'),
  async execute(interaction) {
    await interaction.deferReply()

    const queue = useQueue(interaction.guild.id)

    //Converts the queue into a array of tracks
    const tracks = queue.tracks.toArray()

    //Gets the current track being played
    const currentTrack = queue.currentTrack

    const embed = new EmbedBuilder().setTitle('Current Queue').addFields({
      name: 'Now Playing',
      value: currentTrack.title,
      inline: true,
    })

    // Add each track to the embed as a field
    tracks.slice(0, 20).forEach((track, index) => {
      embed.addFields({
        name: `Queue ${index + 1}`,
        value: track.title,
      })

      embed.setFooter({
        text:
          tracks.length > 20
            ? `And ${tracks.length - 21} more songs`
            : 'this is the end of the queue',
      })
    })

    // Send the embed as a reply
    await interaction.followUp({ embeds: [embed] })
  },
}
