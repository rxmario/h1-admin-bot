import { Client } from 'discord.js';
import { Collection, MongoClient, ReturnDocument } from 'mongodb';
import { Types } from 'mongoose';
import { createRequire } from 'node:module';
import { Logger } from '../../../services/index.js';

import { ClientUtils } from '../../../utils/client-utils.js';
import { WhiteListEntry, WhiteListStatus } from './whitelist-model.js';

const require = createRequire(import.meta.url);

let Config = require('../../../../config/config.json');

const COLLECTION_NAME = 'internal-whitelist';

export class WhiteListAddError extends Error {
    userTag: string;
    userProfileLink: string;
    constructor(message: string, userTag: string, userProfileLink: string) {
        super(message);
        this.name = 'WhiteListAddError';
        this.userTag = userTag;
        this.userProfileLink = userProfileLink;
    }
}
export class WhitelistManager {
    async connect(): Promise<void> {
        this._client = new MongoClient(Config.mongoUrl, {
            maxPoolSize: 100,
        });
        await this._client.connect();
        this._db = this._client.db('h1server').collection(COLLECTION_NAME);
    }

    private _db: Collection<WhiteListEntry>;
    private _client: MongoClient;

    async getAll(): Promise<WhiteListEntry[]> {
        try {
            return await this._db.find().toArray();
        } catch {
            return [];
        }
    }

    async createWhitelistEntry(
        client: Client,
        discordId: string,
        zoneClientId: string,
        status: WhiteListStatus
    ): Promise<WhiteListEntry> {
        if (await this.isDiscordIdTaken(discordId)) {
            const takenEntity = await this.getEntryByDiscordId(discordId);
            const user = await ClientUtils.getUser(client, takenEntity.discordId);
            const userProfileLink = `https://discord.com/users/${user.id}`;
            throw new WhiteListAddError(
                `Discord User is already linked to a zone client id. Whitelist status for the specified user is: ${takenEntity.status}.`,
                user.tag,
                userProfileLink
            );
        }

        if (await this.isZoneClientIdTaken(zoneClientId)) {
            const takenEntity = await this.getEntryByClientId(zoneClientId);
            const user = await ClientUtils.getUser(client, takenEntity.discordId);

            const userProfileLink = `https://discord.com/users/${user.id}`;
            throw new WhiteListAddError(
                `ZoneClientId '${zoneClientId}' is already taken by ${user.tag} with status: ${takenEntity.status}.`,
                user.tag,
                userProfileLink
            );
        }

        const whiteListEntry: WhiteListEntry = {
            _id: new Types.ObjectId(),
            discordId,
            zoneClientId,
            status,
        };

        await this._db.insertOne(whiteListEntry);

        return whiteListEntry;
    }

    async getEntryByClientId(clientId: string): Promise<WhiteListEntry | null> {
        const entity = await this._db.findOne({ zoneClientId: clientId });
        if (!entity) {
            return null;
        }
        return {
            _id: new Types.ObjectId(entity._id),
            discordId: entity.discordId,
            zoneClientId: entity.zoneClientId,
            status: entity.status,
        };
    }

    async getEntryByDiscordId(discordId: string): Promise<WhiteListEntry | null> {
        const entity = await this._db.findOne({ discordId: discordId });
        if (!entity) {
            return null;
        }
        return {
            _id: new Types.ObjectId(entity._id),
            discordId: entity.discordId,
            zoneClientId: entity.zoneClientId,
            status: entity.status,
        };
    }

    async updateWhitelistEntryStatus(
        discordId: string,
        newStatus: WhiteListStatus
    ): Promise<WhiteListEntry | null> {
        const filter = { discordId: discordId };
        const update = { $set: { status: newStatus } };
        const options = { returnDocument: ReturnDocument.AFTER };
        try {
            const updated = await this._db.findOneAndUpdate(filter, update, options);
            return {
                _id: new Types.ObjectId(updated.value._id),
                discordId: updated.value.discordId,
                zoneClientId: updated.value.zoneClientId,
                status: updated.value.status,
            };
        } catch (error) {
            return null;
        }
    }

    async deny(discordId: string): Promise<void> {
        const filter = { discordId: discordId };
        const update = { $set: { status: WhiteListStatus.DENIED } };
        const options = { returnDocument: ReturnDocument.AFTER };
        try {
            await this._db.findOneAndUpdate(filter, update, options);
        } catch (e) {
            await Logger.error(e);
        }
    }

    async isZoneClientIdTaken(zoneClientId: string): Promise<boolean> {
        const count = await this._db.countDocuments({ zoneClientId });
        return count > 0;
    }

    async isDiscordIdTaken(discordId: string): Promise<boolean> {
        const count = await this._db.countDocuments({ discordId });
        return count > 0;
    }
}

const whitelistManager = new WhitelistManager();
await whitelistManager.connect();
export default whitelistManager;
