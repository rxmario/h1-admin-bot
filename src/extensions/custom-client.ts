import { ActivityType, Client, ClientOptions, Locale, Presence, Snowflake, TextBasedChannel } from 'discord.js';
import fs from 'node:fs';

import { Logger } from '../services/index.js';
import { EmbedType, EmbedUtils } from '../utils/embed-utils.js';
import { ClientUtils, MessageUtils } from '../utils/index.js';

export class CustomClient extends Client {
    constructor(clientOptions: ClientOptions) {
        super(clientOptions);
    }

    public async _start(): Promise<void> {
        const guild = await ClientUtils.getGuild(this, this.user.id);

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

        // todo: fetch leaderboard

        const embed = EmbedUtils.makeEmbed(EmbedType.SUCCESS, 'Leaderboard', 'Leaderboard');

        const message = await MessageUtils.send(channel, embed);

        const messageId = message.id;

        this.saveMessageId(messageId);
    }

    private async updateLeaderboard(
        channel: TextBasedChannel,
        existingMessageId: Snowflake
    ): Promise<void> {

        const message = await channel.messages.fetch(existingMessageId);

        if (!message) {
            await Logger.error('Got a message id but unable to find the message. Posting again');
            return await this.postLeaderboard(channel);
        }

        await MessageUtils.edit(message, 'Updated Leaderboard');
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
