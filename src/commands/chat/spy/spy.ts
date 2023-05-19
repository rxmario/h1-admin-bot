import { APIEmbedField, ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { MongoClient } from 'mongodb';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';

import { EventData } from '../../../models/internal-models.js';
import { Logger } from '../../../services/logger.js';
import { EmbedType, EmbedUtils } from '../../../utils/embed-utils.js';
import { InteractionUtils } from '../../../utils/interaction-utils.js';
import { Command, CommandDeferType } from '../../command.js';

const require = createRequire(import.meta.url);
let Config = require('../../../../config/config.json');

interface TeamMate {
    zoneId: string;
    name: string;
}

interface Permission {
    characterId: string;
    characterName: string;
    useContainers: boolean;
    build: boolean;
    demolish: boolean;
    visit: boolean;
}

export class SpyCommand implements Command {
    public names = ['spy'];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    private useWhitelist: boolean = Config.whitelist.enabled;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const name = intr.options.getString('name').valueOf();
        const client = new MongoClient(Config.mongoUrl);
        await client.connect();
        const db = client.db(Config.databaseName);

        const characterCollection = db.collection('characters');
        const character = await characterCollection.findOne({ characterName: name });
        const characters = await characterCollection.find().toArray();

        Logger.info(`Spying on ${name}`);

        if (!character) {
            await Logger.error('Character not found');
            const nameList: string[] = characters.map(character => {
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

        const characterId: string = character.characterId;

        const constructionCollection = db.collection('construction');
        const results = await constructionCollection.find().toArray();

        const filtered = results.filter(result => {
            const s = Object.values(result.permissions).filter(
                // @ts-ignore
                perm => perm.characterId == characterId
            );
            return s.length > 0;
        });

        const uniqued = Array.from(new Set(filtered.map(item => JSON.stringify(item))), item =>
            JSON.parse(item)
        );

        const mates: TeamMate[] = [];

        for (const construction of uniqued) {
            for (const [id, permission] of Object.entries(construction.permissions)) {
                const { characterName } = permission as Permission;
                const teamMate: TeamMate = { name: characterName, zoneId: id };
                if (!mates.includes(teamMate)) {
                    mates.push(teamMate);
                }
            }
        }
        //hack
        const uniquedTeamMates = Array.from(
            new Set(mates.map(item => JSON.stringify(item))),
            item => JSON.parse(item) as TeamMate
        );
        const toMates = uniquedTeamMates.map(res => `${res.name} - ${res.zoneId}`).join('\n');

        const locations = uniqued.map(res => res.position);

        const toCommand = locations.map(loc => `/tp ${loc[0]} ${loc[1]} ${loc[2]} ${loc[3]}`);
        const joined = toCommand.join('\n');

        const content = `Group(${uniquedTeamMates.length}):\n${toMates}\n\nFoundations(All foundations where the target is part of):\n${joined}`;

        Logger.info('Spy completed.');

        const directory = `./out/spy/`;
        const filePath = `${directory}${name.toLowerCase()}.txt`;

        await fs.mkdir(directory, { recursive: true });

        await fs.writeFile(filePath, content);

        const file = await fs.readFile(filePath);
        await client.close();
        await InteractionUtils.sendFile(intr, file, filePath, false);
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
