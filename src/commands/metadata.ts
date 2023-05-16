import {
    ApplicationCommandType,
    PermissionsBitField,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';

import { Language } from '../models/enum-helpers/index.js';
import { Lang } from '../services/index.js';
import { Args } from './index.js';

export const ChatCommandMetadata: {
    [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
    UPDATEROLES: {
        type: ApplicationCommandType.ChatInput,
        name: 'updateroles',
        name_localizations: null,
        description: 'Add not whitelisted role to anyone that needs it',
        description_localizations: null,
        dm_permission: true,
        default_member_permissions: PermissionsBitField.Flags.Administrator.toString(),
    },
    DB: {
        type: ApplicationCommandType.ChatInput,
        name: 'db',
        name_localizations: null,
        description: 'Get one of various database collections.',
        description_localizations: null,
        dm_permission: true,
        default_member_permissions: PermissionsBitField.Flags.BanMembers.toString(),
        options: [
            {
                ...Args.DB_OPTION,
                required: true,
            },
        ],
    },
    CHECKNAME: {
        type: ApplicationCommandType.ChatInput,
        name: 'checkname',
        name_localizations: null,
        description: 'Get all associated characters + discord tag by character name',
        description_localizations: null,
        dm_permission: true,
        default_member_permissions: PermissionsBitField.Flags.BanMembers.toString(),
        options: [
            {
                name: 'name',
                description: 'The name of the player',
                type: 3,
                required: true,
            },
        ],
    },
    HELP: {
        type: ApplicationCommandType.ChatInput,
        name: 'help',
        name_localizations: null,
        description: 'Get an overview of all the available commands',
        description_localizations: null,
        dm_permission: true,
        default_member_permissions: PermissionsBitField.Flags.BanMembers.toString(),
    },
    SPY: {
        type: ApplicationCommandType.ChatInput,
        name: 'spy',
        name_localizations: null,
        description: 'Checks who is playing with who plus reveals their base locations',
        description_localizations: null,
        dm_permission: true,
        default_member_permissions: PermissionsBitField.Flags.BanMembers.toString(),
        options: [
            {
                name: 'name',
                description: 'The name of the player',
                type: 3,
                required: true,
            },
        ],
    },
    WL: {
        type: ApplicationCommandType.ChatInput,
        name: 'wl',
        name_localizations: null,
        description: 'Manage whitelist',
        description_localizations: null,
        dm_permission: true,
        default_member_permissions: PermissionsBitField.Flags.BanMembers.toString(),
        options: [
            {
                name: 'add',
                description: 'Add player to whitelist',
                type: 1,
                options: [
                    {
                        name: 'discord',
                        description:
                            "Players discord id. Obtain by right clicking and then hit 'Copy User-ID'. Developer mode needed.",
                        type: 3,
                        required: true,
                    },
                    {
                        name: 'id',
                        description: 'Players zone client id from /me ingame',
                        type: 3,
                        required: true,
                    },
                ],
            },
            {
                name: 'manage',
                description: 'Manage whitelist for player (discordId || zoneClientId)',
                type: 1,
                options: [
                    {
                        name: 'id',
                        description: 'Either discord id or zone client id',
                        type: 3,
                        required: true,
                    },
                ],
            },
            {
                name: 'scan',
                description: 'Scans the whitelist for fresh discord accounts',
                type: 1,
                options: [
                    {
                        name: 'days',
                        description: 'Days in past',
                        type: 3,
                        required: true,
                    },
                ],
            },
        ],
    },
    WORLDSTATS: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.wstats', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.wstats'),
        description: Lang.getRef('commandDescs.wstats', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.wstats'),
        dm_permission: true,
        default_member_permissions: PermissionsBitField.Flags.Administrator.toString(),
    },
    KD: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.kd', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.kd'),
        description: Lang.getRef('commandDescs.kd', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.kd'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                name: 'name',
                description: 'The name of the player',
                type: 3,
                required: true,
            },
        ],
    },
};

export const MessageCommandMetadata: {
    [command: string]: RESTPostAPIContextMenuApplicationCommandsJSONBody;
} = {
    VIEW_DATE_SENT: {
        type: ApplicationCommandType.Message,
        name: Lang.getRef('messageCommands.viewDateSent', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('messageCommands.viewDateSent'),
        default_member_permissions: undefined,
        dm_permission: true,
    },
};

export const UserCommandMetadata: {
    [command: string]: RESTPostAPIContextMenuApplicationCommandsJSONBody;
} = {
    VIEW_DATE_JOINED: {
        type: ApplicationCommandType.User,
        name: Lang.getRef('userCommands.viewDateJoined', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('userCommands.viewDateJoined'),
        default_member_permissions: undefined,
        dm_permission: true,
    },
};
