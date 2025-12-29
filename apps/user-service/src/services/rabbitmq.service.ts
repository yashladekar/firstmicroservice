import { Channel, ChannelModel, connect } from "amqplib";
import config from "../config/config";
import { User } from "../database";
import { ApiError } from "../utils";

class RabbitMQService {
    private requestQueue = "USER_DETAILS_REQUEST";
    private responseQueue = "USER_DETAILS_RESPONSE";
    private connection!: ChannelModel;
    private channel!: Channel;
    private initializing?: Promise<void>;

    constructor() {
        // Intentionally do not auto-connect here.
        // Auto-connecting from a constructor creates an unhandled Promise rejection
        // when RabbitMQ isn't ready yet (common in Docker Compose startup).
    }

    async init() {
        if (this.channel) return;
        if (this.initializing) return this.initializing;

        this.initializing = (async () => {
            const maxAttempts = 30;
            const delayMs = 1000;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    this.connection = await connect(config.msgBrokerURL!);
                    this.channel = await this.connection.createChannel();

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

        return this.initializing;
    }

    private async listenForRequests() {
        this.channel.consume(this.requestQueue, async (msg) => {
            if (msg && msg.content) {
                const { userId } = JSON.parse(msg.content.toString());
                const userDetails = await getUserDetails(userId);

                // Send the user details response
                this.channel.sendToQueue(
                    this.responseQueue,
                    Buffer.from(JSON.stringify(userDetails)),
                    { correlationId: msg.properties.correlationId }
                );

                // Acknowledge the processed message
                this.channel.ack(msg);
            }
        });
    }
}

const getUserDetails = async (userId: string) => {
    const userDetails = await User.findById(userId).select("-password");
    if (!userDetails) {
        throw new ApiError(404, "User not found");
    }

    return userDetails;
};
export const rabbitMQService = new RabbitMQService();
