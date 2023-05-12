/* eslint-disable no-undef */
import { REST, Routes } from 'discord.js';
import * as fs from 'node:fs';

import config from './config/config.json' assert { type: 'json' };

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
    const command = require(`./src/commands/${file}`);
    commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(config.client.token);

// and deploy your commands!
(async () => {
    try {
        // eslint-disable-next-line no-undef
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(config.client.id, config.client.guildId),
            { body: commands }
        );

        // eslint-disable-next-line no-undef
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        // eslint-disable-next-line no-undef
        console.error(error);
    }
})();
