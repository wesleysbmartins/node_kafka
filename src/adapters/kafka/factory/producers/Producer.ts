import { Partitioners, Producer, ProducerRecord } from "kafkajs";
import { IProducerFactory } from "./IProducer";
import { KafkaClient } from "../../KafkaClient";

export class ProducerFactory implements IProducerFactory {
    private topic: string;
    private producer: Producer;

    constructor(topic: string) {
        this.topic = topic;
        this.producer = KafkaClient.instance.producer({ createPartitioner: Partitioners.LegacyPartitioner });
    }
    
    async sendMessage(key: Buffer | string, value: Buffer | string, partition?: number): Promise<void> {
        try {

            await this.producer.connect();

            const record : ProducerRecord = {
                topic: this.topic,
                messages: [{
                    key: key,
                    value: value
                }],
            };

            await this.producer.send(record);

        } catch(err) {
            throw Error(`ERROR TO SEND MESSAGE!\n${JSON.stringify({key, value, partition, err})}`)
        }
    }
}
