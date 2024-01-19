const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { useQueue } = require("discord-player")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Check current queue"),
  async execute(interaction) {
    await interaction.deferReply()

    const queue = useQueue(interaction.guild.id)

    const tracks = queue.tracks.toArray() //Converts the queue into a array of tracks
    const currentTrack = queue.currentTrack //Gets the current track being played

    const embed = new EmbedBuilder().setTitle("Current Queue").addFields({
      name: "Now Playing",
      value: currentTrack.title,
      inline: true,
    })

    // Add each track to the embed as a field
    tracks.forEach((track, index) => {
      embed.addFields({
        name: `Track ${index + 1}`,
        value: track.title,
      })
    })

    // Send the embed as a reply
    await interaction.followUp({ embeds: [embed] })
  },
}

