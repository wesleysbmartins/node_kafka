import { Consumer, EachMessagePayload } from "kafkajs";
import { IConsumerFactory, MessageProcessor } from "./IConsumer";
import { KafkaClient } from "../../KafkaClient";

export class ConsumerFactory implements IConsumerFactory {
    private consumer: Consumer;
    private messageProcessor : MessageProcessor;

    constructor(groupId: string, topics: string[], messageProcessor: MessageProcessor) {
        this.messageProcessor = messageProcessor;
        this.consumer = KafkaClient.instance.consumer({ groupId });
        this.consumer.subscribe({ topics, fromBeginning: true });
    }
    
    async listen(): Promise<void> {
        try {

            await this.consumer.connect();

            await this.consumer.run({
                eachMessage: async (messagePayload: EachMessagePayload) => {
                    await this.messageProcessor.run(messagePayload)
                }
            })

        } catch(err) {
            throw Error(`ERROR TO LISTEN!\n${JSON.stringify({err})}`)
        }
    }
}
