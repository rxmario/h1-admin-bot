import { EmbedBuilder } from 'discord.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
/**
 * An enum representing the types of embeds used in the bot.
 */
export enum EmbedType {
    /**
     * A success embed, indicated by the color code #57F287.
     */
    SUCCESS = 5763719,

    /**
     * A warning embed, indicated by the color code #FFA500.
     */
    WARNING = 16776960,

    /**
     * An error embed, indicated by the color code #EE6352.
     */
    ERROR = 15548997,
}

export function getTitleFor(embedType: EmbedType): string {
    switch (embedType) {
        case EmbedType.SUCCESS:
            return 'Success';
        case EmbedType.WARNING:
            return 'Warning';
        case EmbedType.ERROR:
            return 'Error';
    }
}

export class EmbedUtils {
    public static makeEmbed(
        type: EmbedType,
        title?: string | null,
        msg?: string | null
    ): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setColor(type.valueOf())
            .setTitle(title ? title : getTitleFor(type))
            .setThumbnail(Config.logoUrl);
        if (msg) {
            embed.setDescription(msg ? msg : null);
        }

        return embed;
    }
}
