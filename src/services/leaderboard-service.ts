import { EmbedBuilder } from 'discord.js';
import { MongoClient } from 'mongodb';
import { createRequire } from 'node:module';

import { EmbedType, EmbedUtils } from '../utils/embed-utils.js';
import { Logger } from './logger.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
class LeaderboardService {
    public async leaderboard(): Promise<EmbedBuilder> {
        const client = new MongoClient(Config.mongoUrl);

        await client.connect();

        const db = client.db(Config.databaseName);
        const collection = db.collection('kills');

        const size = Number(Config.leaderboard.size);

        if (isNaN(size)) {
            await Logger.error('Size is not a number');
            return;
        }

        const pipeline = [
            { $match: { type: 'player' } },
            { $group: { _id: '$characterName', kills: { $sum: 1 } } },
            { $sort: { kills: -1 } },
            { $limit: size },
        ];

        const results = await collection.aggregate(pipeline).toArray();

        await client.close();

        if (results.length === 0) {
            return EmbedUtils.makeEmbed(
                EmbedType.ERROR,
                'Kill Leaderboard',
                'Seems like we just wiped'
            );
        }

        const formatted = results.map(
            (entry, index) => `${index + 1}. **${entry._id}** - ${entry.kills}`
        );

        const toString = formatted.join('\n');
        return EmbedUtils.makeEmbed(
            EmbedType.SUCCESS,
            'Kill Leaderboard',
            `${toString}`
        ).setTimestamp(new Date());
    }
}
export const leaderboardService = new LeaderboardService();
