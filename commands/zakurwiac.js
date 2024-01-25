const {
  AudioPlayer,
  createAudioResource,
  StreamType,
  entersState,
  VoiceConnectionStatus,
  joinVoiceChannel,
  createAudioPlayer,
  AudioPlayerStatus,
  VoiceConnection,
  getVoiceConnection,
} = require('@discordjs/voice')

const { SlashCommandBuilder } = require('discord.js')
const gTTS = require('gtts')
const { useQueue } = require('discord-player')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('zakurwiac')
    .setDescription('Speaks kurwa')
    .addStringOption((option) =>
      option.setName('co').setDescription('powiedzieć').setRequired(true)
    ),
  async execute(interaction) {
    // Well this shit is not perfect but funny
    // It will stop current song, say stuff and replay current song
    // Saving the queue

    await interaction.deferReply()
    const translate = require('deepl')
    const auth_key = '39cd2306-ac84-1c05-0b73-68a8d9297f9d:fx'

    try {
      const query = interaction.options.getString('co', true)

      // Translate input message using deepl API
      const translated = await translate({
        free_api: true,
        text: query,
        target_lang: 'PL',
        auth_key: auth_key,
      })

      const textToSay = translated.data.translations[0].text

      // Create soundbit using
      const gtts = new gTTS(textToSay, 'pl')
      const audioResource = createAudioResource(gtts.stream(), {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      })

      // Save current queue logic
      let currentTrack = {}
      let savedQueue = []
      const queue = useQueue(interaction.guild.id) || null

      if (queue && queue.isPlaying()) {
        // Get current track first cuz latter function does not have it
        currentTrack = queue.currentTrack
        savedQueue = [currentTrack, ...queue.tracks.toArray()]

        // Getting rid of the current queue and killing existing connection
        queue.delete()
      }

      // Connecting again
      // This could be avoided but I can`t get access to a VoiceConnection
      // to unsubscribe and subscribe old player instance
      // I just can`t fucking access it :X

      const voiceConnection = joinVoiceChannel({
        channelId: interaction.member.voice.channelId,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      })

      // Create OG player to play created voice cue
      const audioPlayer = createAudioPlayer()
      const subscription = voiceConnection.subscribe(audioPlayer)
      audioPlayer.play(audioResource)

      // Wait for the audio to finish playing
      await new Promise((resolve) => {
        const listener = (oldState, newState) => {
          if (newState.status === AudioPlayerStatus.Idle) {
            resolve()
            audioPlayer.off('stateChange', listener)
          }
        }
        audioPlayer.on('stateChange', listener)
      })

      // Destroy OG player connection
      voiceConnection.destroy()
      audioPlayer.stop()

      // Then try to create new queue

      // Reference player
      const player = interaction.client.player
      await player.extractors.loadDefault()

      // THIS IS CRUCIAL PART OF THE CODE
      // EVEN THO I NEVER USE RESULTS OF THE SEARCH
      // IT BREAKS EVERYTHING
      await player.search('THIS IS CRUCIAL')

      // Create brand new queue IF old one gets saved

      if (savedQueue.length > 0) {
        newQueue = player.nodes.create(interaction.guild, {
          metadata: {
            channel: interaction.channel,
          },
        })
        // Connection again
        try {
          if (!newQueue.connection)
            await newQueue.connect(interaction.member.voice.channel)
        } catch (e) {
          console.log(e)
          await newQueue.delete()
          return interaction.channel.send(
            'Something wrong. Maybe you are not in a voice channel?'
          )
        }
        // Add saved tracks and play
        newQueue.addTrack(savedQueue)
        newQueue.node.play()
      }

      await interaction.followUp('przemówił')
    } catch (error) {
      console.error(error)
      await interaction.followUp(
        'An error occurred while processing the command.'
      )
    }
  },
}
