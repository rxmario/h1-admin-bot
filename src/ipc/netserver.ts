// -- BELONGS INTO H1-SERVER --

/*
import net from "node:net";
import { ZoneServer2016 } from "./zoneserver";
import { ZoneClient2016 as Client } from "./classes/zoneclient";

const PIPE_NAME = 'localhost'

export interface CommandResponse {
    commandName: string
    output: string
}

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

export class IPCManager {
    private readonly server: ZoneServer2016;

    key = '123';
    constructor(server: ZoneServer2016) {
        this.server = server;
    }
    public start() {
        const ipcServer = net.createServer((socket) => {
            console.log('Client connected');

            socket.on('data', (data) => {
                const parsed = JSON.parse(data.toString());
                if (parsed.key === this.key) {
                    switch (parsed.cmd) {
                        case ZoneServerCommand.PLAYERS.valueOf():
                            this.respond(this.players(), socket);
                            break;
                        case ZoneServerCommand.KICK.valueOf():
                            this.respond(this.kick(parsed.args), socket);
                            break;
                        default:
                            const unknownCommand: CommandResponse = {
                                commandName: 'unknown',
                                output: 'Unknown command'
                            }
                            this.respond(unknownCommand, socket);
                    }
                } else {
                    const response: CommandResponse = {
                        commandName: 'Sus',
                        output: 'wewooweewoo'
                    }
                    this.respond(response, socket);
                }
            });

        });

        ipcServer.listen(1044, PIPE_NAME, () => {
            console.log(`listening on ${PIPE_NAME}`);
        });
    }

    private players(): CommandResponse {
        const players = `Players: ${Object.values(this.server._clients)
            .map((c) => {
                return `${c.character.name}: ${c.loginSessionId} | ${
                    this.server.getSoeClient(c.soeClientId)?.getNetworkStats()[2]
                } | ${this.server.getSoeClient(c.soeClientId)?.getNetworkStats()[0]} | ${
                    this.server.getSoeClient(c.soeClientId)?.getNetworkStats()[1]
                }`;
            })
            .join(',\n')}`;
        return {
            commandName: ZoneServerCommand.PLAYERS.valueOf(),
            output: players
        }
    }

    private kick(args: string[]): CommandResponse {
        const playerName = args[0]
        if (!playerName) {
            return {
                commandName: ZoneServerCommand.KICK.valueOf(),
                output: 'No argument provided.'
            }
        }
        const targetClient = this.server.getClientByNameOrLoginSession(
            playerName
        );
        if (!targetClient || !(targetClient instanceof Client)) {
            return {
                commandName: ZoneServerCommand.KICK.valueOf(),
                output: `Unable to find ${playerName}`,
            }
        }

        const reason = args[0]

        for (let i = 0; i < 5; i++) {
            this.server.sendAlert(
                targetClient,
                `You are being kicked from the server. ${reason ? 'Reason: ' + reason : ""}`
            );
        }

        setTimeout(() => {
            if (!targetClient) {
                return;
            }
            this.server.sendGlobalChatText(
                `${targetClient.character.name} has been kicked from the server!`
            );

            this.server.sendData(targetClient, "CharacterSelectSessionResponse", {
                status: 1,
                sessionId: targetClient.loginSessionId,
            });
        }, 3000);

        return {
            commandName: ZoneServerCommand.KICK.valueOf(),
            output: `Successfully kicked player ${targetClient.character.name}`,
        }
    }

    private respond(command: CommandResponse, socket: net.Socket): void {
        socket.write(JSON.stringify(command))
    }
}

*/
