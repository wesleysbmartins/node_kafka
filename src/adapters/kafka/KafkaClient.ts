import { Kafka, KafkaConfig, logLevel } from "kafkajs";
import { IKafkaClient } from "./IKafkaClient";

export class KafkaClient implements IKafkaClient {
    static instance: Kafka;

    async connect(): Promise<void> {
        const config : KafkaConfig = {
            brokers: ["localhost:9092"],
            clientId: "node-client",
            logLevel: logLevel.NOTHING
        };

        try {
            if (!KafkaClient.instance) {
                KafkaClient.instance = new Kafka(config);
            }

            console.log("KAFKA CLIENT CREATED!");
            
        } catch(err) {
            const message = `KAFKA CLIENT ERROR\nCONFIG:\n${JSON.stringify(config)}ERROR:\n${err}`;
            console.log(message);
            throw Error(message);
        }
    }
}
