import * as net from 'node:net';

import { Logger } from '../services/logger.js';

const PIPE_NAME = 'localhost';

export enum ZoneServerCommand {
    KICK = 'kick',
    PLAYERS = 'players',
    BAN = 'ban',
    UNBAN = 'unban',
    SAVE = 'save',
    ALERT = 'alert',
    RESPAWN_LOOT = 'respawnloot',
    LIST_PROCESSES = 'listprocesses'
}

export interface CommandResponse {
    name: string;
    output: string;
}

const socket = net.createConnection(1044, PIPE_NAME, () => {
    console.log(`Connected to named pipe server: ${PIPE_NAME}`);
});

socket.on('data', data => {
    const json = JSON.parse(data.toString());
    const response: CommandResponse = {
        name: json.commandName,
        output: json.output,
    };
    Logger.info('Zoneserver answered', response.output)
});
socket.on('error', err => {
    console.error('Socket error:', err);
    socket.destroy();
});

export interface IngameCommand {
    cmd: ZoneServerCommand;
    args: string[];
    key: string
}

/**
 * Sends a command to the zone server
 * @param command
 */
export const send = (command: IngameCommand): void => {
    const requestObject = {
        ...command,
        key: 'key'
    }
    socket.write(JSON.stringify(requestObject));
    Logger.info(`send ${command.cmd.valueOf()} with args: ${command.args.join(', ')} to zoneserver`);
};
