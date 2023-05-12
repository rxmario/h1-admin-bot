import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';

import { EventData } from '../../../models/internal-models.js';
import { Logger } from '../../../services/logger.js';
import { ClientUtils } from '../../../utils/client-utils.js';
import { EmbedType, EmbedUtils } from '../../../utils/embed-utils.js';
import { FormatUtils } from '../../../utils/format-utils.js';
import { InteractionUtils } from '../../../utils/interaction-utils.js';
import { ChatCommandMetadata, Command, CommandDeferType } from '../../index.js';

interface BotCommand {
    name: string;
    subcommands: string[];
}

export class HelpCommand implements Command {
    public names = ['help'];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const commands: BotCommand[] = [];
        for (const command in ChatCommandMetadata) {
            const metadata = ChatCommandMetadata[command];
            const options = metadata.options ?? [];

            const subcommands = options.map(option => option.name);

            const botCommand: BotCommand = {
                name: metadata.name,
                subcommands: subcommands,
            };
            commands.push(botCommand);
        }

        Logger.info('cmds', commands);

        const sorted = commands.sort((a, b) => {
            if (a.subcommands && !b.subcommands) {
                return 1;
            } else if (!a.subcommands && b.subcommands) {
                return -1;
            } else {
                return 0;
            }
        });

        const response = await Promise.all(
            sorted.map(async command => {
                const cmd = await ClientUtils.findAppCommand(intr.client, command.name);
                const options = cmd.options.map(opt => `\`<${opt.name}>\``);
                return (
                    FormatUtils.commandMention(cmd) + ' ' + `${options}` + `\n${cmd.description}`
                );
            })
        );

        const toString = response.join('\n\n');

        Logger.info('toString', toString);

        const helpEmbed = EmbedUtils.makeEmbed(
            EmbedType.SUCCESS,
            `Here is a list of all available commands:`,
            toString
        );
        await InteractionUtils.send(intr, helpEmbed);
    }
}
