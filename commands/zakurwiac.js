const {
  createAudioResource,
  StreamType,
  joinVoiceChannel,
  createAudioPlayer,
  AudioPlayerStatus,
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
        target_lang: 'CS',
        auth_key: auth_key,
      })

      const textToSay = translated.data.translations[0].text

      // Create soundbit using
      const gtts = new gTTS(textToSay, 'cs')
      const audioResource = createAudioResource(gtts.stream(), {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      })

      // Save current queue logic
      let currentTrack = {}
      let savedQueue = []

      const player = interaction.client.player

      // Check for a queue or define new one if called without any songs
      const queue = useQueue(interaction.guild.id)

      if (queue && queue.isPlaying()) {
        // Get current track first cuz latter function queue.tracks does not have it
        currentTrack = queue.currentTrack
        savedQueue = [currentTrack, ...queue.tracks.toArray()]

        // This just skips current song (kills current song)
        queue.node.playRaw(audioResource)

        // Rest of the queue except first song stays in

        // Just put back same song in a 0 index in a queue
        queue.insertTrack(currentTrack, 0)
      } else {
        // If there is no queue
        // Establish new voice connection
        const voiceConnection = joinVoiceChannel({
          channelId: interaction.member.voice.channelId,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        })

        // Create OG player to play created voice cue
        const audioPlayer = createAudioPlayer()
        const subscription = voiceConnection.subscribe(audioPlayer)
        audioPlayer.play(audioResource)

        // // Wait for the audio to finish playing
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
