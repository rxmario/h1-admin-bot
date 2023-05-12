import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { MongoClient } from 'mongodb';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';

import { DbOptions } from '../../enums/db-options.js';
import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

interface DbMuted {
    name: string;
    reason: string;
    active: boolean;
    expirationDate: Date;
    adminName: string;
    unmuteAdminName?: string;
}

interface DbBanned {
    name: string;
    banType: string;
    banReason: string;
    adminName: string;
    expirationDate: Date;
    active: boolean;
    unbanAdminName?: string;
}

export class DbCommand implements Command {
    public names = [Lang.getRef('chatCommands.db', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let args = {
            option: intr.options.getString(
                Lang.getRef('arguments.option', Language.Default)
            ) as DbOptions,
        };

        const client = new MongoClient(Config.mongoUrl);
        await client.connect();
        const db = client.db(Config.databaseName);

        switch (args.option) {
            case DbOptions.sus:
                await InteractionUtils.send(intr, 'Not implemented yet');
                return;
            case DbOptions.muted: {
                const collection = db.collection('muted');
                const results = await collection.find().toArray();
                await client.close();
                const mapped = results.map((item): DbMuted => {
                    return {
                        name: item.name,
                        reason: item.muteReason,
                        active: item.active,
                        expirationDate: new Date(item.expirationDate),
                        adminName: item.adminName,
                        unmuteAdminName: item.unmuteAdminName,
                    };
                });

                const mutedEntries = mapped.map(
                    entry =>
                        `${entry.name}:\nreason: ${entry.reason}\nactive: ${entry.active}\nadminName: ${entry.adminName}\nunmuteAdminName: ${entry.unmuteAdminName}\n`
                );
                const text = mutedEntries.join('\n');

                await fs.writeFile('muted_entries.txt', text);

                const file = await fs.readFile('muted_entries.txt');

                await InteractionUtils.sendFile(intr, file, 'muted_entries.txt');
                break;
            }
            case DbOptions.banned: {
                const collection = db.collection('banned');
                const results = await collection.find().toArray();
                await client.close();
                const mapped = results.map((item): DbBanned => {
                    return {
                        name: item.name,
                        banType: item.banType,
                        banReason: item.banReason,
                        expirationDate: new Date(item.expirationDate),
                        adminName: item.adminName,
                        active: item.active,
                        unbanAdminName: item.unbanAdminName,
                    };
                });

                const bannedEntries = mapped.map(
                    entry =>
                        `${entry.name}:\nreason: ${entry.banReason}\nban type: ${
                            entry.banType
                        }\nactive: ${entry.active}\nexpiration date: ${
                            entry.expirationDate
                        }\nadminName: ${entry.adminName}\nunbanAdminName: ${
                            entry.unbanAdminName === '' ? entry.unbanAdminName : 'none'
                        }\n`
                );
                const text = bannedEntries.join('\n');

                await fs.writeFile('banned_entries.txt', text);

                const file = await fs.readFile('banned_entries.txt');

                await InteractionUtils.sendFile(intr, file, 'banned_entries.txt');
                break;
            }
        }
    }
}
