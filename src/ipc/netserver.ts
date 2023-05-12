
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

export class IPCManager {
    private readonly server: any;

    constructor(server: any) {
        this.server = server;
    }
    public start() {
        const ipcServer = net.createServer((socket) => {
            console.log('Client connected');

            socket.on('data', (data) => {
                const parsed = JSON.parse(data.toString());
                switch (parsed.commandName) {
                    case 'players':
                        const output = this.players();
                        const response: CommandResponse = {
                            commandName: parsed.commandName,
                            output: output,
                        };
                        socket.write(JSON.stringify(response));
                        break;
                    case 'kick':
                        const playerName = parsed.args.join(' ').toString();
                        const kickResponse = this.kick(playerName);
                        socket.write(JSON.stringify(kickResponse));
                        break;
                }
            });
        });

        ipcServer.listen(1044, PIPE_NAME, () => {
            console.log(`listening on ${PIPE_NAME}`);
        });
    }

    private players(): string {
        return `Players: ${Object.values(this.server._clients)
            .map((c) => {
                return `${c.character.name}: ${c.loginSessionId} | ${
                    this.server.getSoeClient(c.soeClientId)?.getNetworkStats()[2]
                } | ${this.server.getSoeClient(c.soeClientId)?.getNetworkStats()[0]} | ${
                    this.server.getSoeClient(c.soeClientId)?.getNetworkStats()[1]
                }`;
            })
            .join(',\n')}`;
    }

    private kick(playerName: string): CommandResponse {
        const targetClient = this.server.getClientByNameOrLoginSession(
            playerName
        );
        if (!targetClient || !(targetClient instanceof Client)) {
            return {
                commandName: 'kick',
                output: `Unable to find ${playerName}`,
            }
        }

        // targetClient.properlyLogout = true;

        for (let i = 0; i < 5; i++) {
            this.server.sendAlert(
                targetClient,
                `You are being kicked from the server.`
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
            commandName: 'kick',
            output: `Sucessfully kicked player`,
        }
    }
}
*/
