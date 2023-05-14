# h1-admin-bot

h1-admin-bot is a Discord bot written in TypeScript, generated from the [KevinNovak/Discord-Bot-TypeScript-Template](https://github.com/KevinNovak/Discord-Bot-TypeScript-Template). It provides necessary features to make the life of an H1Emu server admin easier.

## Configuration

To configure the project, follow these steps:

1. Rename the `config.default.json` file located in the `./config/` directory to `config.json`.

2. Open the `config.json` file and update the following settings:

    - `developers`: Add the Discord user IDs of the developers who have access to administrative commands.

    - `mongoUrl`: Specify the MongoDB connection URL.

    - `databaseName`: Set the name of the MongoDB database for the H1 server.

    - `serverId`: Enter the ID of your H1 server.

    - `logoUrl`: Provide the URL of your server's logo to display it on embeds.

    - `whitelist`: Configure whitelist settings by specifying the `enabled` flag, `whitelistedRoleId`, and `notWhitelistedRoleId`.

    - `client`: Update the Discord bot client settings including `id`, `token` and `guildId`

3. Save the `config.json` file with your modifications.

## Features

##### General

   - Display server status 

##### Slash Commands

-   **/updateroles**: Adds a not whitelisted role to anyone that needs it.
-   **/db \<option>**: Retrieves data from various database collections.
-   **/checkname \<name>**: Retrieves all associated characters and Discord tags based on the character name.
-   **/spy \<name>**: Reveals who is playing with whom and their base locations.
-   **/wl add \<discordId> \<zoneId>**: Adds the specified user to the whitelist.
-   **/wl manage \<discord|zoneId> \<grant|deny>**: Grants or denies access to the specified user.
-   **/wl scan \<days>**: Checks for Discord accounts that: 1) Got created and joined the same day 2) Have left the server or 3) Are a maximum of \<days> days old.
-   **/worldstats**: Shows a portion of the total statistics of the current season.
-   **/leaderboard**: Displays the current Top 10 players with the most kills on the server.
-   **/kd \<name>**: Shows all statistics as well as the player's KD. (Case sensitive)
-   **/help**: Provides an overview of all available commands.

## Roadmap

Here are the planned features and improvements for future releases:

-   Implement IPC (Inter-Process Communication) between the bot and the H1Z1 zone server.
-   Enable ingame commands through Discord, allowing administrative actions such as kicking players when whitelist access is denied.
-   Enhance the /wl command to provide more flexibility and options for managing whitelist access.
-   Implement a controlled server restart feature to allow restarting the server via Discord with configurable duration and in-game announcement intervals.

# Registering/updating commands

-   In order to use slash commands, they first [have to be registered](https://discordjs.guide/creating-your-bot/command-deployment.html).
-   Type `npm run commands:register` to register the bot's commands.
-   Run this script any time you change a command name, structure, or add/remove commands.
-   This is so Discord knows what your commands look like.
-   It may take up to an hour for command changes to appear.

## Start Scripts

You can run the bot in multiple modes:

1. Normal Mode
    - Type `npm start`.
    - Starts a single instance of the bot.
2. Manager Mode
    - Type `npm run start:manager`.
    - Starts a shard manager which will spawn multiple bot shards.
3. PM2 Mode
    - Type `npm run start:pm2`.
    - Similar to Manager Mode but uses [PM2](https://pm2.keymetrics.io/) to manage processes.
