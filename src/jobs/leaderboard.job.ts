import {
    Client,
    Locale,
    ShardingManager,
    Snowflake,
    TextBasedChannel,
} from 'discord.js';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import { CustomClient } from '../extensions/index.js';

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
        await this.shardManager.broadcastEval(async (client: CustomClient) => {
            return await client._start(client);
        });
    }
    

}
