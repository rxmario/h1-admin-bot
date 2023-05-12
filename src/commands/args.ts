import { APIApplicationCommandBasicOption, ApplicationCommandOptionType } from 'discord.js';

import { CheckOptions } from '../enums/check.options.js';
import { DbOptions } from '../enums/db-options.js';
import { HelpOption, InfoOption } from '../enums/index.js';
import { Language } from '../models/enum-helpers/index.js';
import { Lang } from '../services/index.js';

export class Args {
    public static readonly HELP_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.option'),
        description: Lang.getRef('argDescs.helpOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.helpOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('helpOptionDescs.contactSupport', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('helpOptionDescs.contactSupport'),
                value: HelpOption.CONTACT_SUPPORT,
            },
            {
                name: Lang.getRef('helpOptionDescs.commands', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('helpOptionDescs.commands'),
                value: HelpOption.COMMANDS,
            },
        ],
    };
    public static readonly INFO_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.option'),
        description: Lang.getRef('argDescs.helpOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.helpOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('infoOptions.dev', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('infoOptions.dev'),
                value: InfoOption.DEV,
            },
        ],
    };
    public static readonly DB_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.option'),
        description: Lang.getRef('argDescs.dbOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.dbOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('dbOptions.muted', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('dbOptions.muted'),
                value: DbOptions.muted,
            },
            {
                name: Lang.getRef('dbOptions.banned', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('dbOptions.banned'),
                value: DbOptions.banned,
            },
            {
                name: Lang.getRef('dbOptions.sus', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('dbOptions.sus'),
                value: DbOptions.sus,
            },
        ],
    };
    public static readonly CHECK_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.option'),
        description: Lang.getRef('argDescs.checkOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.checkOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('checkOptions.id', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('checkOptions.id'),
                value: CheckOptions.id,
            },
        ],
    };
}
