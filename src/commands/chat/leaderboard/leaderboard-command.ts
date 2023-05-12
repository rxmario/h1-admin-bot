import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import { MongoClient } from 'mongodb';
import { createRequire } from 'node:module';

import { Language } from '../../../models/enum-helpers/language.js';
import { EventData } from '../../../models/internal-models.js';
import { Lang } from '../../../services/lang.js';
import { EmbedType, EmbedUtils } from '../../../utils/embed-utils.js';
import { InteractionUtils } from '../../../utils/interaction-utils.js';
import { Command, CommandDeferType } from '../../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../../config/config.json');

export class LeaderboardCommand implements Command {
    public names = [Lang.getRef('chatCommands.leaderboard', Language.Default)];
    public cooldown = new RateLimiter(1, 3600000); // 1x pro stunde
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const client = new MongoClient(Config.mongoUrl);

        await client.connect();

        const db = client.db(Config.databaseName);
        const collection = db.collection('kills');

        const pipeline = [
            { $match: { type: 'player' } },
            { $group: { _id: '$characterName', kills: { $sum: 1 } } },
            { $sort: { kills: -1 } },
            { $limit: 10 },
        ];

        const results = await collection.aggregate(pipeline).toArray();
        await client.close();

        if (results.length === 0) {
            const errorEmbed = EmbedUtils.makeEmbed(
                EmbedType.ERROR,
                'Kill Leaderboard',
                'Seems like we just wiped'
            );
            await InteractionUtils.send(intr, errorEmbed);
            return;
        }

        const formatted = results.map(
            (entry, index) => `${index + 1}. **${entry._id}** - ${entry.kills}`
        );

        const toString = formatted.join('\n');
        const embed = EmbedUtils.makeEmbed(
            EmbedType.SUCCESS,
            'Kill Leaderboard',
            `${toString}`
        ).setTimestamp(new Date());

        await InteractionUtils.send(intr, embed);
    }
}
