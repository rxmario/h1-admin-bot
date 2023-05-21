import { APIEmbedField, ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { MongoClient } from 'mongodb';
import { createRequire } from 'node:module';

import { EventData } from '../../../models/internal-models.js';
import { Logger } from '../../../services/index.js';
import { FormatUtils } from '../../../utils/format-utils.js';
import { ClientUtils } from '../../../utils/client-utils.js';
import { EmbedType, EmbedUtils } from '../../../utils/embed-utils.js';
import { InteractionUtils } from '../../../utils/interaction-utils.js';
import { Command, CommandDeferType } from '../../index.js';
import whitelistManager from '../whitelist/whitelistmanager.js';

const require = createRequire(import.meta.url);
let Config = require('../../../../config/config.json');

export interface CheckIdResponse {
    ownerId: string;
    name: string;
    lastLoginDate: string;
}

export class CheckCommand implements Command {
    public names = ['checkname'];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    private useWhitelist: boolean = Config.whitelist.enabled;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const name = intr.options.getString('name').valueOf();
        const client = new MongoClient(Config.mongoUrl);
        await client.connect();
        const db = client.db(Config.databaseName);

        const collection = db.collection('characters');
        const results = await collection.find().toArray();

        Logger.info(`Checking name for ${name}`);

        await client.close();

        const filtered = results.filter(character => {
            return character.characterName === name;
        });

        if (filtered.length === 0) {
            const nameList: string[] = results.map(character => {
                return character.characterName;
            });

            const suggestions = this.suggestName(name, nameList);

            if (suggestions.length === 0) {
                const reply = `No player named **${name}** found.`;
                const noPlayerFoundEmbed = EmbedUtils.makeEmbed(EmbedType.ERROR, null, reply);
                await InteractionUtils.send(intr, noPlayerFoundEmbed, true);
                return;
            } else {
                const uniqueSuggestions = [...new Set(suggestions)];
                const firstThreeSuggestions = uniqueSuggestions.slice(0, 3);
                const formattedSuggestions = firstThreeSuggestions.join(', ');

                const reply = `No player named **${name}** found.\nDo you mean ${formattedSuggestions}?`;
                const suggestionEmbed = EmbedUtils.makeEmbed(EmbedType.ERROR, null, reply);
                await InteractionUtils.send(intr, suggestionEmbed, true);
                return;
            }
        }
        try {
            const ownerId = filtered.slice(-1)[0].ownerId;

            const toEmbedField = await this.getCharacterInfo(ownerId, results);

            if (this.useWhitelist) {
                const whiteListEntry = await whitelistManager.getEntryByZoneId(ownerId);

                let hasLeftDiscord = false;

                if (whiteListEntry) {
                    const discordId = whiteListEntry.discordId;
                    const user = await ClientUtils.getUser(intr.client, discordId);

                    if (!user) {
                        hasLeftDiscord = true;
                    }

                    const members = await intr.guild.members.fetch();

                    if (!members.has(discordId)) {
                        hasLeftDiscord = true;
                    }
                    const successEmbed = EmbedUtils.makeEmbed(
                        EmbedType.SUCCESS,
                        `Characters for ${name} (${ownerId})`,
                        hasLeftDiscord
                            ? 'Unknown Discord User. Must have left the discord. If the user is considered being sus then you might think about removing access right now.'
                            : `${FormatUtils.userMention(user.id)}`
                    ).addFields(toEmbedField);
                    await InteractionUtils.send(intr, successEmbed, true);
                    return;
                }
            } else {
                const successEmbed = EmbedUtils.makeEmbed(
                    EmbedType.SUCCESS,
                    `Characters for ${name} (${ownerId})`,
                    null
                ).addFields(toEmbedField);
                await InteractionUtils.send(intr, successEmbed, true);
                return;
            }
        } catch (error) {
            const errorEmbed = EmbedUtils.makeEmbed(EmbedType.ERROR, null, error);
            await InteractionUtils.send(intr, errorEmbed, true);
            return;
        }
    }

    private async getCharacterInfo(ownerId: string, results: any[]): Promise<APIEmbedField[]> {
        const filteredByOwnerId = results.filter(character => {
            return character.ownerId === ownerId;
        });

        const mapped = filteredByOwnerId.map((entry): CheckIdResponse => {
            return {
                ownerId: entry.ownerId,
                name: entry.characterName,
                lastLoginDate: entry.lastLoginDate,
            };
        });

        return mapped.map((entry): APIEmbedField => {
            const timestamp = parseInt(entry.lastLoginDate, 16) / 1000;
            const lastLoginDate = new Date(timestamp * 1000);
            return { name: entry.name, value: `Last seen: ${lastLoginDate} (not working)` };
        });
    }

    // todo: move to utils
    private suggestName = (input: string, nameList: string[]): string[] => {
        const similarNames: { name: string; similarity: number }[] = [];
        nameList.forEach(name => {
            const similarity = this.compareStrings(name, input);
            if (similarity > 0.5) {
                similarNames.push({ name: name, similarity: similarity });
            }
        });
        similarNames.sort((a, b) => b.similarity - a.similarity);
        return similarNames.map(name => name.name);
    };

    private compareStrings = (lhs: string, rhs: string): number => {
        const longer = lhs.length > rhs.length ? lhs : rhs;
        const shorter = lhs.length > rhs.length ? rhs : lhs;
        const longerLength = longer.length;
        if (longerLength === 0) {
            return 1.0;
        }
        return (longerLength - this.editDistance(longer, shorter)) / longerLength;
    };

    private editDistance = (lhs: string, rhs: string): number => {
        const string1 = lhs.toLowerCase();
        const string2 = rhs.toLowerCase();

        const costs: number[] = [];
        for (let i = 0; i <= string1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= string2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (string1.charAt(i - 1) !== string2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) {
                costs[string2.length] = lastValue;
            }
        }
        return costs[string2.length];
    };
}
