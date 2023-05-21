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

export enum WhiteListAddErrorType {
    discordId = 'Discord Id',
    zoneId = 'Zone Id',
}
export class WhiteListAddError extends Error {
    type: WhiteListAddErrorType;
    userTag: string;
    userProfileLink: string;
    constructor(
        type: WhiteListAddErrorType,
        message: string,
        userTag: string,
        userProfileLink: string
    ) {
        super(message);
        this.type = type;
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
        zoneId: string,
        status: WhiteListStatus
    ): Promise<WhiteListEntry> {
        if (await this.isDiscordIdTaken(discordId)) {
            const takenEntity = await this.getEntryByDiscordId(discordId);
            const user = await ClientUtils.getUser(client, takenEntity.discordId);
            const userProfileLink = `https://discord.com/users/${user.id}`;
            throw new WhiteListAddError(
                WhiteListAddErrorType.discordId,
                `Discord User is already linked to a zone client id. Whitelist status for the specified user is: ${takenEntity.status}.`,
                user.tag,
                userProfileLink
            );
        }

        if (await this.isZoneIdTaken(zoneId)) {
            const takenEntity = await this.getEntryByZoneId(zoneId);
            const user = await ClientUtils.getUser(client, takenEntity.discordId);

            const userProfileLink = `https://discord.com/users/${user.id}`;
            throw new WhiteListAddError(
                WhiteListAddErrorType.zoneId,
                `ZoneClientId '${zoneId}' is already taken by ${user.tag} with status: ${takenEntity.status}.`,
                user.tag,
                userProfileLink
            );
        }

        const whiteListEntry: WhiteListEntry = {
            _id: new Types.ObjectId(),
            discordId,
            zoneClientId: zoneId,
            status,
        };

        await this._db.insertOne(whiteListEntry);

        return whiteListEntry;
    }

    async getEntryByZoneId(zoneId: string): Promise<WhiteListEntry | null> {
        const entity = await this._db.findOne({ zoneClientId: zoneId });
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

    async exists(discordId: string): Promise<boolean> {
        const filter = { discordId: discordId };
        try {
            const document = await this._db.findOne(filter);
            return !!document;
        } catch (e) {
            await Logger.error(e);
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
        return;
    }

    async isZoneIdTaken(zoneId: string): Promise<boolean> {
        const document = await this._db.findOne({ zoneId });
        return !!document;
    }

    async isDiscordIdTaken(discordId: string): Promise<boolean> {
        const document = await this._db.findOne({ discordId });
        return !!document;
    }
}

const whitelistManager = new WhitelistManager();
await whitelistManager.connect();
export default whitelistManager;
