const { REST, Routes } = require('discord.js')
const fs = require('node:fs')
const path = require('node:path')
require('dotenv').config()

const commands = []
const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'))

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = require(filePath)
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON())
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    )
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)

RegisterCommands = async () => {
  try {
    console.log('Started refreshing application (/) commands.')

    //if guild id not specified after client ID, it will apply globally
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    })

    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error(error)
  }
}

RegisterCommands()
