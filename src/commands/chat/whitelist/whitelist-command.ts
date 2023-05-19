import {
    ActionRowBuilder,
    APIEmbedField,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction, Client,
    EmbedBuilder,
    GuildMember,
    Interaction,
    PermissionsString,
    User,
} from 'discord.js';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';

import { EventData } from '../../../models/internal-models.js';
import { Logger } from '../../../services/index.js';
// eslint-disable-next-line import/extensions
import { EmbedType, EmbedUtils } from '../../../utils/embed-utils.js';
import { ClientUtils, FormatUtils, InteractionUtils, RegexUtils } from '../../../utils/index.js';
import { Command, CommandDeferType } from '../../index.js';
import { getStatusColor, WhiteListEntry, WhiteListStatus } from './whitelist-model.js';
import whitelistManager, { WhiteListAddError } from './whitelistmanager.js';

const require = createRequire(import.meta.url);
let Config = require('../../../../config/config.json');

type InteractionEventHandler = (interaction: Interaction) => Promise<void>;

export class WhiteListAdd implements Command {
    public names = ['wl'];
    public deferType = CommandDeferType.NONE;
    public requireClientPerms: PermissionsString[] = ['Administrator'];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const mode = intr.options.getSubcommand();
        switch (mode) {
            case 'add':
                await this.addInteraction(intr);
                return;
            case 'manage':
                await this.manageInteraction(intr);
                return;
            case 'scan':
                await InteractionUtils.deferReply(intr, false);
                await this.scanInteraction(intr);
                return;
        }
    }

    private async addInteraction(intr: ChatInputCommandInteraction): Promise<void> {
        const discordId = intr.options.getString('discord').valueOf().trim();
        const zoneClientId = intr.options.getString('id').valueOf().trim();
        try {
            const addUser = await ClientUtils.getUser(intr.client, discordId);
            await whitelistManager.createWhitelistEntry(
                intr.client,
                discordId,
                zoneClientId,
                WhiteListStatus.ACCEPTED
            );
            const successEmbed = EmbedUtils.makeEmbed(
                EmbedType.SUCCESS,
                'Success!',
                `The whitelist entry for ${FormatUtils.userMention(addUser.id)} was successfully added.`
            );

            const member = await ClientUtils.findMember(intr.guild, discordId);

            // todo: find a proper way of handling this
            const role = '1095815057792831589';
            const notWhiteListedId = '1097561408901746819';

            const rolesToAdd = [role];
            const rolesToRemove = [notWhiteListedId];
            member.roles
                .set([
                    ...rolesToAdd,
                    ...member.roles.cache
                        .filter(role => !rolesToRemove.includes(role.id))
                        .map(role => role.id),
                ])
                .then(() =>
                    Logger.info(`Successfully updated roles for user with ID ${addUser.tag}`)
                )
                .catch(error =>
                    Logger.info(`Error updating roles for user with ID ${addUser.tag}:`, error)
                );

            await InteractionUtils.send(intr, successEmbed, false);
            return;
        } catch (error) {
            if (error instanceof WhiteListAddError) {
                const whiteListAddErrorEmbed = EmbedUtils.makeEmbed(
                    EmbedType.ERROR,
                    null,
                    error.message
                );
                await InteractionUtils.send(intr, whiteListAddErrorEmbed, true);
                return;
            }
            if (error.code === 10013 || error.code === 50035) {
                const userErrorEmbed = EmbedUtils.makeEmbed(
                    EmbedType.ERROR,
                    'Invalid discord id',
                    'Please provide a valid **discord id**. Right click on the users name and press "Copy User-ID". Developer mode needed.'
                );
                await InteractionUtils.send(intr, userErrorEmbed, true);
                return;
            }
            const errorEmbed = EmbedUtils.makeEmbed(EmbedType.ERROR, 'Error', `${error}`);
            await InteractionUtils.send(intr, errorEmbed, true);
            return;
        }
    }

    private async manageInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
        const id = interaction.options.getString('id').trim();

        const discordId = RegexUtils.discordId(id);
        const zoneClientId = RegexUtils.zoneClientId(id);

        const entity = discordId
            ? await whitelistManager.getEntryByDiscordId(discordId)
            : await whitelistManager.getEntryByClientId(zoneClientId);

        if (!entity) {
            const errorEmbed = EmbedUtils.makeEmbed(
                EmbedType.ERROR,
                null,
                `Couldn't find whitelist entry for ${id}`
            );
            await InteractionUtils.send(interaction, errorEmbed, true);
            return;
        }

        const user = await ClientUtils.getUser(interaction.client, entity.discordId);
        const hasLeftDiscord =
            !user || !(await interaction.guild.members.fetch()).has(entity.discordId);

        const accessButton = new ButtonBuilder()
            .setCustomId('status')
            .setLabel(entity.status === WhiteListStatus.ACCEPTED ? 'Revoke access' : 'Grant access')
            .setStyle(
                entity.status === WhiteListStatus.ACCEPTED
                    ? ButtonStyle.Danger
                    : ButtonStyle.Success
            );

        const accessRow = new ActionRowBuilder<ButtonBuilder>().addComponents([accessButton]);

        const embedFields = this.makeEmbedFields(hasLeftDiscord, entity, user);

        const manageEmbed = EmbedUtils.makeEmbed(
            hasLeftDiscord ? EmbedType.WARNING : EmbedType.SUCCESS,
            'Whitelist Status'
        )
            .addFields(embedFields)
            .setColor(getStatusColor(entity.status));

        const listener = this.getButtonInteractionHandler(entity, manageEmbed);

        const message = await InteractionUtils.send(
            interaction,
            { embeds: [manageEmbed], components: [accessRow] },
            true
        );
        message.channel.client.once('interactionCreate', listener);
    }

    getButtonInteractionHandler(
        entity: WhiteListEntry,
        manageEmbed: EmbedBuilder
    ): InteractionEventHandler {
        const handleButtonInteraction: InteractionEventHandler = async (
            interaction: Interaction
        ) => {
            if (!interaction.isButton() || interaction.customId !== 'status') {
                return;
            }

            const updatedEntity = await whitelistManager.updateWhitelistEntryStatus(
                entity.discordId,
                entity.status !== 'accepted' ? WhiteListStatus.ACCEPTED : WhiteListStatus.DENIED
            );

            const user = await ClientUtils.getUser(interaction.client, updatedEntity.discordId);
            const hasLeftDiscord =
                !user || !(await interaction.guild.members.fetch()).has(updatedEntity.discordId);

            const embedFields = this.makeEmbedFields(hasLeftDiscord, updatedEntity, user);

            manageEmbed.setTitle(
                `Successfully changed status of ${
                    hasLeftDiscord === false ? user.tag : 'Unknown User'
                }`
            );
            manageEmbed.setColor(
                updatedEntity.status === WhiteListStatus.ACCEPTED ? 5763719 : 15548997
            );
            manageEmbed.setFields(embedFields);
            manageEmbed.setThumbnail(Config.logoUrl);

            if (hasLeftDiscord) {
                await InteractionUtils.update(interaction, {
                    embeds: [manageEmbed],
                    components: [],
                });
                interaction.channel.client.removeListener(
                    'interactionCreate',
                    handleButtonInteraction
                );
                return;
            }
            // todo: shit sucks
            const role = await ClientUtils.findRole(interaction.guild, 'Whitelisted');
            const notWhiteListedRole = await ClientUtils.findRole(
                interaction.guild,
                'Not-Whitelisted'
            );

            const member = await ClientUtils.findMember(interaction.guild, updatedEntity.discordId);
            if (role) {
                if (updatedEntity.status === WhiteListStatus.ACCEPTED) {
                    await Promise.all([
                        member.roles.add(role),
                        member.roles.remove(notWhiteListedRole),
                    ]);
                } else {
                    await Promise.all([
                        member.roles.remove(role),
                        member.roles.add(notWhiteListedRole),
                    ]);
                }
            }

            await InteractionUtils.update(interaction, { embeds: [manageEmbed], components: [] });
            interaction.channel.client.removeListener('interactionCreate', handleButtonInteraction);
        };
        return handleButtonInteraction;
    }

    private async scanInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
        const daysString = interaction.options.getString('days').trim();
        const days = Number(daysString);

        const DAYS_IN_MS = days * 24 * 60 * 60 * 1000;

        if (isNaN(days)) {
            await Logger.error('Provided argument is not a number');
            return;
        }

        try {
            const entries = await whitelistManager.getAll();
            const leftDiscordEntries: WhiteListEntry[] = [];
            const joinedAndCreatedSameDayEntries: WhiteListEntry[] = [];

            Logger.info('Started scanning whitelist...');
            const filteredByDate = await Promise.all(
                entries.map(async entry => {
                    const member = await ClientUtils.findMember(interaction.guild, entry.discordId);
                    if (!member) {
                        leftDiscordEntries.push(entry);
                        return false;
                    }

                    const checked = this.checkSameDayCreatedSameDayJoint(member);

                    if (checked) {
                        joinedAndCreatedSameDayEntries.push(entry);
                        return false;
                    }

                    const createdAt = member.user.createdAt;
                    const now = new Date();
                    return now.getTime() - createdAt.getTime() < DAYS_IN_MS;
                })
            );

            const filteredEntries = entries.filter((_, i) => filteredByDate[i]);

            Logger.info('Done scanning whitelist');

            const msg = `Accounts that joined & got created the same day:\n${joinedAndCreatedSameDayEntries
                .map(entry => `${entry.discordId} - ${entry.status}`)
                .join('\n')}\n\nAccounts that left discord:\n${leftDiscordEntries
                .map(entry => `${entry.discordId} - ${entry.status}`)
                .join('\n')}\n\nFresh Accounts:\n${filteredEntries
                .map(entry => `${entry.discordId} - ${entry.status}`)
                .join('\n')}`;

            await fs.writeFile('accounts.txt', msg);

            const file = await fs.readFile('accounts.txt');

            await InteractionUtils.sendFile(interaction, file, 'accounts.txt', false);
        } catch (err) {
            await Logger.error(err);
        }
    }

    private makeEmbedFields(
        hasLeftDiscord: boolean,
        entity: WhiteListEntry,
        user: User
    ): APIEmbedField[] {

        const emoji = '<:arrow:1109099783672569876>'

        const discordField: APIEmbedField = {
            name: ':mirror_ball: Discord',
            value: `${emoji} ${user ? FormatUtils.userMention(user.id) : 'Unknown User'}`,
        };

        const zoneIdField: APIEmbedField = {
            name: ':id: Zone Id',
            value: `${emoji}` + ' ' + entity.zoneClientId,
        };

        const statusField: APIEmbedField = {
            name: entity.status === 'accepted' ? ':green_circle: Status' : ':red_circle: Status' ,
            value: `${emoji}` + ' ' + entity.status,
        };

        const hasLeftDiscordField: APIEmbedField = {
            name: 'Warning!',
            value: 'The user must have left discord. If the user is considered being sus then you might think about removing access right now.',
        };

        const fields: APIEmbedField[] = [discordField, zoneIdField, statusField];

        if (hasLeftDiscord) {
            fields.push(hasLeftDiscordField);
        }

        return fields;
    }

    private checkSameDayCreatedSameDayJoint(member: GuildMember): boolean {
        const joinedAt = new Date(member.joinedAt);
        const createdAt = new Date(member.user.createdAt);
        joinedAt.setHours(0, 0, 0, 0);
        createdAt.setHours(0, 0, 0, 0);
        return joinedAt.getTime() === createdAt.getTime();
    }
}
