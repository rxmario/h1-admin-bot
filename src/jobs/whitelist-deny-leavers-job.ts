import { ShardingManager } from 'discord.js';
import { createRequire } from 'node:module';

import { CustomClient } from '../extensions/index.js';
import { Job } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class WhitelistDenyLeaversJob implements Job {
    public name = 'Deny Leavers';
    public schedule: string = Config.jobs.denyLeavers.schedule;
    public log: boolean = Config.jobs.denyLeavers.log;

    constructor(private shardManager: ShardingManager) {}

    public async run(): Promise<void> {
        await this.shardManager.broadcastEval(async (client: CustomClient) => {
            return await client.whiteListDenyLeavers();
        });
    }
}
