import {
    APIEmbedField,
    ChatInputCommandInteraction,
    GuildMember,
    PermissionsBitField,
    PermissionsString,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import { MongoClient } from 'mongodb';
import { createRequire } from 'node:module';

import { Language } from '../../../models/enum-helpers/index.js';
import { EventData } from '../../../models/internal-models.js';
import { Logger } from '../../../services/index.js';
import { Lang } from '../../../services/lang.js';
import { EmbedType, EmbedUtils } from '../../../utils/embed-utils.js';
import { InteractionUtils } from '../../../utils/interaction-utils.js';
import { Command, CommandDeferType } from '../../index.js';
// eslint-disable-next-line import/extensions
import whitelistManager from '../whitelist/whitelistmanager.js';

const require = createRequire(import.meta.url);
let Config = require('../../../../config/config.json');

export class KillDeathRatioCommand implements Command {
    public names = [Lang.getRef('chatCommands.kd', Language.Default)];
    public cooldown: RateLimiter;
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    private useWhitelist: boolean = Config.whitelist.enabled;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const playerName = intr.options.getString('name').valueOf();
        const client = new MongoClient(Config.mongoUrl);

        await client.connect();

        const db = client.db(Config.databaseName);

        if (!(intr.member instanceof GuildMember)) {
            const somethingWentWrongEmbed = EmbedUtils.makeEmbed(
                EmbedType.ERROR,
                null,
                `Something went horribly wrong here.`
            );
            await Logger.error('Something went horribly wrong here..');
            await InteractionUtils.send(intr, somethingWentWrongEmbed, true);
            return;
        }

        if (intr.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            this.cooldown = new RateLimiter(9999, 3600000);
        } else {
            this.cooldown = new RateLimiter(2, 3600000);
        }

        const characterCollection = db.collection('characters');
        const characters = await characterCollection.find().toArray();

        const user = intr.user;

        Logger.info(`User ${user.tag} using /kd`);

        if (this.useWhitelist) {
            const whitelistEntry = await whitelistManager.getEntryByDiscordId(user.id);

            if (!intr.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                if (!whitelistEntry) {
                    const notWhiteListedEmbed = EmbedUtils.makeEmbed(
                        EmbedType.ERROR,
                        null,
                        `Seem's like you're not white listed. Accordingly, I cannot connect you with any ingame character.`
                    );
                    Logger.warn(
                        `Non whitelisted user ${user.tag} trying to attempt /kd from ${playerName}`
                    );
                    await InteractionUtils.send(intr, notWhiteListedEmbed, true);
                    return;
                }

                const userCharacters = characters.filter(
                    character => character.ownerId === whitelistEntry.zoneClientId
                );
                const userCharacterNames: string[] = userCharacters.map(
                    character => character.characterName
                );

                if (!userCharacterNames.includes(playerName)) {
                    const userMismatchEmbed = EmbedUtils.makeEmbed(
                        EmbedType.ERROR,
                        null,
                        `Either this is not your character or this character does not exist. Please try again with **your** character name and pay attention to upper and lower case.`
                    );
                    Logger.warn(
                        `User ${user.tag} trying to check out kd from ${playerName}. Forbidden.`
                    );
                    await InteractionUtils.send(intr, userMismatchEmbed, true);
                    return;
                }
            }
        }

        const collection = db.collection('kills');
        const kills = await collection.countDocuments({
            characterName: playerName,
            type: 'player',
        });
        const deaths = await collection.countDocuments({
            playerKilled: playerName,
            type: 'player',
        });
        await client.close();

        if (kills === 0 && deaths === 0) {
            const reply = `I don't know much about **${playerName}** yet..`;
            const unknownEmbed = EmbedUtils.makeEmbed(EmbedType.ERROR, null, reply);
            await InteractionUtils.send(intr, unknownEmbed);

            return;
        }

        const kd = deaths === 0 ? kills : kills / deaths;

        const totalValue = `${kills}/${deaths}`;
        const kdValue = `${kd.toFixed(2)}`;

        const totalField: APIEmbedField = {
            name: 'Total',
            value: totalValue,
        };

        const kdField: APIEmbedField = {
            name: 'KD',
            value: kdValue,
        };

        const fields = [totalField, kdField];

        Logger.info(`name: ${playerName}\ntotal: ${totalValue}\nkd: ${kdValue}\n`);

        const successEmbed = EmbedUtils.makeEmbed(
            EmbedType.SUCCESS,
            `Stats for ${playerName}`,
            null
        ).setFields(fields);
        await InteractionUtils.send(intr, successEmbed, true);
    }
}
