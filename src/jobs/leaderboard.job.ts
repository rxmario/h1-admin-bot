import {
    Locale,
    ShardingManager,
    Snowflake,
    TextBasedChannel,
} from 'discord.js';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';

import { Logger } from '../services/index.js';
import { EmbedType, EmbedUtils } from '../utils/embed-utils.js';
import { ClientUtils, MessageUtils } from '../utils/index.js';
import { Job } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class LeaderboardJob implements Job {
    public name = 'Update Leaderboard';
    public schedule: string = Config.jobs.updateLeaderboard.schedule;
    public log: boolean = Config.jobs.updateLeaderboard.log;

    constructor(private shardManager: ShardingManager) {}

    public async run(): Promise<void> {
        await this.shardManager.broadcastEval(async client => {
            const guild = await ClientUtils.getGuild(client, client.user.id);

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
        });
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
}
