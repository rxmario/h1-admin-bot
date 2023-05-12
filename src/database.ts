import mongoose from 'mongoose';

import {
    WhiteList,
    whitelistSchema,
    WhiteListStatus,
} from './commands/chat/whitelist/whitelist-model';
import { WhitelistManager } from './commands/chat/whitelist/whitelistmanager';

export class Database {
    private readonly uri: string;
    private connection!: mongoose.Connection;

    constructor(uri: string) {
        this.uri = uri;
    }
}
