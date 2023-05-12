import axios from 'axios';
import { ActivityType, ShardingManager } from 'discord.js';
import { createRequire } from 'node:module';

import { CustomClient } from '../extensions/index.js';
import { BotSite } from '../models/config-models.js';
import { HttpService, Logger } from '../services/index.js';
import { Job } from './index.js';

const require = createRequire(import.meta.url);
let BotSites: BotSite[] = require('../../config/bot-sites.json');
let Config = require('../../config/config.json');

export class UpdateServerCountJob implements Job {
    public name = 'Update Server Count';
    public schedule: string = Config.jobs.updateServerCount.schedule;
    public log: boolean = Config.jobs.updateServerCount.log;

    private botSites: BotSite[];

    constructor(private shardManager: ShardingManager, private httpService: HttpService) {
        this.botSites = BotSites.filter(botSite => botSite.enabled);
    }

    public async run(): Promise<void> {
        let serverCount = await this.getServerCount();

        let type = ActivityType.Playing;
        let name = `${serverCount}`;
        let url = 'https://h1emu.com/';

        await this.shardManager.broadcastEval(
            (client: CustomClient, context) => {
                return client.setPresence(context.type, context.name, context.url);
            },
            { context: { type, name, url } }
        );
    }

    private async getServerCount(): Promise<string> {
        let population = '';
        try {
            const response = await axios.get('http://loginserver.h1emu.com/servers');
            const data = response.data;
            for (const server of data) {
                if (server['serverId'] == Config.serverId) {
                    const population_number = server['populationNumber'];
                    const max_population_number = server['maxPopulationNumber'];
                    population = `${population_number}/${max_population_number} Online`;
                    Logger.info(`Status updated to ${population}`);
                    break;
                }
            }
        } catch (e) {
            await Logger.error(`Error: ${e}`);
        }
        return population;
    }
}
