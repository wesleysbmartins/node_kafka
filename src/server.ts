import { ConsumerFactory } from "./adapters/kafka/factory/consumers/Consumer";
import { ProducerFactory } from "./adapters/kafka/factory/producers/Producer";
import { KafkaClient } from "./adapters/kafka/KafkaClient";
import { ProcessMessageUsecase } from "./usecases/ProcessMessage";

const kafka = new KafkaClient();
kafka.connect();

async function Run() {

    const groupId = "node-group-id";
    const topic = "node-topic";

    const consumer = new ConsumerFactory(groupId, [topic], new ProcessMessageUsecase);

    await consumer.listen()

    const producer = new ProducerFactory(topic);

    const msgObj = {
        exampleInt: 10,
        exampleBool: true,
        exampleStr: "String Test"
    };

    await producer.sendMessage("node-key", JSON.stringify(msgObj), 1)
}

Run()
