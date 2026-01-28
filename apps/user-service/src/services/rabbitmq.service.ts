import { Channel, ChannelModel, connect } from "amqplib";
import config from "../config/config";
import { prisma } from "../database/prisma";
import { ApiError } from "../utils";

class RabbitMQService {
    private requestQueue = "USER_DETAILS_REQUEST";
    private responseQueue = "USER_DETAILS_RESPONSE";
    private connection?: ChannelModel;
    private channel?: Channel;
    private initializing?: Promise<void>;
    private consumerStarted = false;

    constructor() {
        // Do not auto-connect here
    }

    async init(): Promise<void> {
        if (!config.msgBrokerURL) {
            throw new Error(
                "Missing MESSAGE_BROKER_URL. Set it in apps/user-service/.env"
            );
        }

        const msgBrokerURL = config.msgBrokerURL;

        if (this.channel) return;
        if (this.initializing) return this.initializing;

        this.initializing = (async () => {
            const maxAttempts = 30;
            const delayMs = 1000;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    this.consumerStarted = false;

                    this.connection = await connect(msgBrokerURL);

                    this.connection.on("close", () => {
                        this.connection = undefined;
                        this.channel = undefined;
                        this.initializing = undefined;
                        this.consumerStarted = false;
                        void this.init().catch(() => undefined);
                    });

                    this.channel = await this.connection.createChannel();

                    this.channel.on("close", () => {
                        this.channel = undefined;
                        this.initializing = undefined;
                        this.consumerStarted = false;
                        void this.init().catch(() => undefined);
                    });

                    await this.channel.assertQueue(this.requestQueue);
                    await this.channel.assertQueue(this.responseQueue);

                    this.listenForRequests();
                    return;
                } catch (err) {
                    if (attempt === maxAttempts) throw err;
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                }
            }
        })();

        try {
            await this.initializing;
        } finally {
            this.initializing = undefined;
        }
    }

    private async listenForRequests() {
        if (!this.channel) return;
        if (this.consumerStarted) return;
        this.consumerStarted = true;

        this.channel.consume(this.requestQueue, async (msg) => {
            if (!msg) return;

            try {
                const { userId } = JSON.parse(msg.content.toString());
                const userDetails = await getUserDetails(userId);

                this.channel?.sendToQueue(
                    this.responseQueue,
                    Buffer.from(JSON.stringify(userDetails)),
                    { correlationId: msg.properties.correlationId }
                );

                this.channel?.ack(msg);
            } catch (err) {
                this.channel?.ack(msg);
            }
        });
    }
}

/**
 * 🔁 Mongo → Prisma replacement
 */
const getUserDetails = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return user;
};

export const rabbitMQService = new RabbitMQService();
