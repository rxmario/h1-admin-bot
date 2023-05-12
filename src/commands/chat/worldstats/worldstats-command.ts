import {
    APIEmbedField,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsString,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import { MongoClient } from 'mongodb';
import { createRequire } from 'node:module';

import { Language } from '../../../models/enum-helpers/index.js';
import { EventData } from '../../../models/internal-models.js';
import { Lang } from '../../../services/lang.js';
import { InteractionUtils } from '../../../utils/interaction-utils.js';
import { Command, CommandDeferType } from '../../command.js';

const require = createRequire(import.meta.url);
let Config = require('../../../../config/config.json');

export class WorldStatsCommand implements Command {
    public names = [Lang.getRef('chatCommands.wstats', Language.Default)];
    public cooldown = new RateLimiter(2, 3600000); // alle 1h
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = ['Administrator'];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const client = new MongoClient(Config.mongoUrl);

        await client.connect();

        const db = client.db(Config.databaseName);
        const charactersCollection = db.collection('characters');
        const constructionCollection = db.collection('construction');
        const worldConstructionsCollection = db.collection('worldconstruction');
        const bannedCollection = db.collection('banned');
        const killsCollection = db.collection('kills');
        const construction = await constructionCollection.countDocuments();
        const worldConstructions = await worldConstructionsCollection.countDocuments();
        const characters = await charactersCollection.countDocuments();
        const banned = await bannedCollection.countDocuments();
        const kills = await killsCollection.countDocuments();

        await client.close();

        const constructionsField: APIEmbedField = {
            name: 'Constructions',
            value: `${construction}`,
        };

        const worldConstructionsField: APIEmbedField = {
            name: 'World Constructions',
            value: `${worldConstructions}`,
        };

        const charactersField: APIEmbedField = {
            name: 'Characters created',
            value: `${characters}`,
        };

        const killsField: APIEmbedField = {
            name: 'Kills',
            value: `${kills}`,
        };

        const bannedField: APIEmbedField = {
            name: 'Banned Players',
            value: `${banned}`,
        };

        const fields = [
            constructionsField,
            worldConstructionsField,
            charactersField,
            killsField,
            bannedField,
        ];

        const embed = new EmbedBuilder();
        embed.setTitle(`World Stats`);
        embed.setColor(15105570);
        embed.addFields(fields);
        embed.setTimestamp(new Date());
        await InteractionUtils.send(intr, embed);
    }
}
