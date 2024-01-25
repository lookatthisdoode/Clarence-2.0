const { QueryType } = require('discord-player')
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { useQueue } = require('discord-player')
const discordTTS = require('discord-tts')
const { createAudioResource } = require('@discordjs/voice')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Searches for the song')
    .addStringOption((option) =>
      option.setName('query').setDescription('Song to search').setRequired(true)
    ),
  execute: async (interaction) => {
    await interaction.deferReply()

    // getting query from initial command
    const query = interaction.options.getString('query', true)

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

    // maybe add search by playlist etc later
    const startTime = new Date()
    const searchResult = await player.search(query)
    const endTime = new Date()
    const searchSpeed = endTime - startTime

    if (!searchResult || !searchResult.hasTracks()) {
      return interaction.reply('Nothing Found')
    }

    const collector = interaction.channel.createMessageCollector({
      time: 15000,
      errors: ['time'],
      filter: (message) => message.author.id === interaction.user.id,
    })

    await interaction.followUp({
      embeds: [
        {
          title: `This is what I found only in ${searchSpeed} ms, happy now, Jaro?`,
          description: `${searchResult.tracks
            .slice(0, 5)
            .map(
              (track, i) =>
                `\`${i + 1}.\` **${track.title}** by ${track.author}`
            )
            .join('\n')}\n\n`,
          footer: { text: 'Choose 1 - 5, or type cancel to cancel duh' },
          color: 0xffffff,
          //   timestamp: new Date(),
        },
      ],
    })

    collector.on('collect', async (query) => {
      if (query.content.toLowerCase() === 'cancel')
        return (
          interaction.channel.send('Aight then, keep your secrets') &&
          collector.stop()
        )
      const value = parseInt(query.content)
      const selectedTrack = searchResult.tracks[value - 1]

      if (
        !value ||
        value <= 0 ||
        value > searchResult.tracks.slice(0, 5).length
      ) {
        collector.stop()
        return interaction.channel.send(
          'Invalid choice. Please provide a valid number between 1 and 5.'
        )
      } else {
        try {
          if (!queue.connection)
            await queue.connect(interaction.member.voice.channel)
        } catch (e) {
          console.log(e)
          await queue.delete()
          return interaction.channel.send(
            'Something wrong. Maybe you are not in a voice channel?'
          )
        }

        queue.addTrack(selectedTrack)

        !queue.isPlaying() ? await queue.node.play() : null

        await interaction.channel.send(
          `Aight man, **${selectedTrack.title}** enqueued!`
        )
      }
    })

    collector.on('end', (msg, reason) => {
      if (reason === 'time' && !queue.isPlaying())
        return interaction.channel.send('Too slow boy, try searching again')
    })
  },
}
