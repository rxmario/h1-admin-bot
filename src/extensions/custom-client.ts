import {
    ActivityType,
    Client,
    ClientOptions,
    Locale,
    Presence,
    Snowflake,
    TextBasedChannel,
} from 'discord.js';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { WhiteListStatus } from '../commands/chat/whitelist/whitelist-model.js';

import whitelistManager from '../commands/chat/whitelist/whitelistmanager.js';
import { Logger } from '../services/index.js';
import { leaderboardService } from '../services/leaderboard-service.js';
import { ClientUtils, MessageUtils } from '../utils/index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class CustomClient extends Client {
    constructor(clientOptions: ClientOptions) {
        super(clientOptions);
    }

    public async whiteListDenyLeavers(): Promise<void> {
        const guild = await ClientUtils.getGuild(this, Config.client.guildId);
        const entries = await whitelistManager.getAll();
        Logger.info('Deny Leavers Job started...');

        const filtered = await Promise.all(
            entries.map(async entry => {
                if(entry.status === WhiteListStatus.DENIED) {
                    return false;
                }
                const member = await ClientUtils.findMember(guild, entry.discordId);
                return !member;
            })
        );

        const leavers = entries.filter((_, i) => filtered[i]);

        if (leavers.length === 0) {
            Logger.info('No leavers detected. Job done.');
        }

        Logger.info(`Found ${leavers.length} leavers. Denying...`);

        for (const leaver of leavers) {
            Logger.info(`Denying whitelist access for ${leaver.discordId}`);
            await whitelistManager.deny(leaver.discordId);
        }

        Logger.info('Deny Leavers job done');
    }

    public async _start(): Promise<void> {
        const guild = await ClientUtils.getGuild(this, Config.client.guildId);

        if (!guild) {
            await Logger.error('Could not find guild');
            return;
        }

        const channel = await ClientUtils.findLeaderboardChannel(guild, Locale.EnglishGB);

        if (!channel) {
            await Logger.error('Could not find leaderboard channel');
            return;
        }

        const existingMessageId = this.getMessageId();
        if (!existingMessageId) {
            return await this.postLeaderboard(channel);
        }

        return await this.updateLeaderboard(channel, existingMessageId);
    }

    private async postLeaderboard(channel: TextBasedChannel): Promise<void> {
        const leaderboardEmbed = await leaderboardService.leaderboard();

        const message = await MessageUtils.send(channel, leaderboardEmbed);

        const messageId = message.id;

        this.saveMessageId(messageId);
    }

    private async updateLeaderboard(
        channel: TextBasedChannel,
        existingMessageId: Snowflake
    ): Promise<void> {
        const message = await channel.messages.fetch(existingMessageId);

        if (!message.inGuild()) {
            await Logger.error('Got a message id but unable to find the message. Posting again');
            return await this.postLeaderboard(channel);
        }

        const updatedLeaderboard = await leaderboardService.leaderboard();

        await MessageUtils.edit(message, updatedLeaderboard);

        Logger.info('Did update Leaderboard');
    }

    private getMessageId(): Snowflake | null {
        try {
            return fs.readFileSync('messageId.txt', 'utf-8');
        } catch (error) {
            Logger.info('Error receiving message id', error);
            return null;
        }
    }

    private saveMessageId(messageId: Snowflake): void {
        try {
            fs.writeFileSync('messageId.txt', messageId);
        } catch (error) {
            Logger.info('Error while saving message id', error);
        }
    }

    public setPresence(
        type: Exclude<ActivityType, ActivityType.Custom>,
        name: string,
        url: string
    ): Presence {
        return this.user?.setPresence({
            activities: [
                {
                    type,
                    name,
                    url,
                },
            ],
        });
    }
}
