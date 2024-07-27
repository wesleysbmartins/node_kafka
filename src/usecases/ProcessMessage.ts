import { EachMessagePayload } from "kafkajs";
import { MessageProcessor } from "../adapters/kafka/factory/consumers/IConsumer";

export class ProcessMessageUsecase implements MessageProcessor {
    async run(messagePayload: EachMessagePayload): Promise<any> {
        const { topic, partition, message } = messagePayload;
        const prefix = `TOPIC: ${topic} PARTITION: ${partition} OFFSET: ${message.offset} TIMESTAMP: ${message.timestamp}`;
        console.log(`MESSAGE RECEIVED:\nPREFIX: [ ${prefix} ]\nMESSAGE: [ KEY: ${message.key} VALUE: ${message.value} ]`);
        return
    }
}
