import mongoose, { Types } from 'mongoose';

export enum WhiteListStatus {
    ACCEPTED = 'accepted',
    PENDING = 'pending',
    DENIED = 'denied',
}

export function getStatusColor(status: string): number {
    switch (status) {
        case WhiteListStatus.ACCEPTED:
            return 5763719;
        case WhiteListStatus.PENDING:
            return 16776960;
        case WhiteListStatus.DENIED:
            return 15548997;
        default:
            return 5763719;
    }
}

export interface WhiteListEntry {
    _id: Types.ObjectId;
    discordId: string;
    zoneId: string;
    status: string;
}

export const whitelistSchema = new mongoose.Schema({
    _id: Types.ObjectId,
    discordId: String,
    zoneClientId: String,
    status: String,
});

export const WhiteList = mongoose.model('WhiteList', whitelistSchema);
