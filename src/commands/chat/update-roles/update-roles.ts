import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../../../models/internal-models.js';
import { Logger } from '../../../services/index.js';
import { EmbedType, EmbedUtils } from '../../../utils/embed-utils.js';
import { InteractionUtils } from '../../../utils/interaction-utils.js';
import { Command, CommandDeferType } from '../../command.js';
import whitelistmanager from '../whitelist/whitelistmanager.js';

const require = createRequire(import.meta.url);
let Config = require('../../../../config/config.json');

export class UpdateRoles implements Command {
    public names = ['updateroles'];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    private useWhitelist = Config.whitelist.enabled;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const guildId = intr.guildId;
        const guild = intr.client.guilds.cache.get(guildId);

        if (this.useWhitelist) {
            const members = await guild.members.fetch();

            const whiteListedRoleId = Config.whitelist.whitelistedRoleId;
            const notWhiteListedRoleId = Config.whitelist.notWhitelistedRoleId;

            if (members.size === 0) {
                await Logger.error('size is empty.');
                return;
            }

            let count = 0;
            for (const [_, member] of members) {
                await member.fetch(true);
                if (!member.roles.cache.some(role => role.id === whiteListedRoleId)) {
                    if(await whitelistmanager.exists(member.id)) {
                        Logger.info('Denied whitelist access for ' + member.id)
                        //await whitelistmanager.deny(member.id);
                        count++
                    }
                    //await member.roles.add(notWhiteListedRoleId);
                    //count++;
                    Logger.info(`Added role to ${member.user.tag}`);
                }
            }

            console.log('count', count);
            const embed = EmbedUtils.makeEmbed(
                EmbedType.SUCCESS,
                null,
                `Added role 'Not Whitelisted' to everyone that's not Whitelisted yet.`
            );
            await InteractionUtils.send(intr, embed);
        } else {
            const errorEmbed = EmbedUtils.makeEmbed(
                EmbedType.ERROR,
                null,
                'Whitelisting is not enabled. Check config.'
            );
            await InteractionUtils.send(intr, errorEmbed);
        }
    }
}
