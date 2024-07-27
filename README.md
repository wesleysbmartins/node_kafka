# Node [![My Skills](https://skillicons.dev/icons?i=nodejs)](https://skillicons.dev) Typescript [![My Skills](https://skillicons.dev/icons?i=ts)](https://skillicons.dev) Kafka Integration [![My Skills](https://skillicons.dev/icons?i=kafka)](https://skillicons.dev)

Este é um exemplo de como uma aplicação Node pode trabalhar integrada ao Kafka.

## Kafka
Apache Kafka é uma plataforma de streaming de eventos distribuída e altamente escalável, projetada para processar e gerenciar grandes volumes de dados em tempo real. Originalmente desenvolvido pela LinkedIn e posteriormente aberto como um projeto de código aberto pela Apache Software Foundation, o Kafka é amplamente utilizado em diversas indústrias para várias aplicações.

> **OBS:** Para entender melhor o que é o Kafka, como instalar e rodar em seu ambiente, acesse o meu [repositório](https://github.com/wesleysbmartins/kafka) onde registrei meus estudos sobre o tema.

## Hands-On
Neste momento iremos abordar de forma simples como integra o Kafka a sua aplicação Node usando a biblioteca [Kafkajs](https://www.npmjs.com/package/kafkajs) utilizando padrões de desenvolvimento como **Singleton**, **Factory** e **Usecases**.

<details>
    <summary>Inicie sua aplicação</summary>

Crie uma pasta para a aplicação:
```shell
mkdir app-example-node-kafka
```
Acesse a pasta e inicie uma aplicação Node Typescript:
```shell
npm init -y
```
Crie a configuração padrão do tsconfig:
```shell
npx tsc --init
```
Instale as dependências de desenvolvimento:
```shell
npm install typescript ts-node nodemon @types/node -D
```
Instale a dependência do Kafka:
```shell
npm install kafkajs
```
</details>

### Client Kafka
Após inicar sua aplicação podemos iniciar o desenvolvimento da aplicação, neste primeiro momento vamos criar o client do Kafka para sua aplicação e instancia-lo utilizando um Singleton.

Interface:
```ts
export interface IKafkaClient {
    connect() : Promise<void>
}
```
Implementação:
```ts
import { Kafka, KafkaConfig } from "kafkajs";
import { IKafkaClient } from "./IKafkaClient";

export class KafkaClient implements IKafkaClient {
    static instance: Kafka;

    async connect(): Promise<void> {
        const config : KafkaConfig = {
            brokers: ["localhost:9092"],
            clientId: "node-client",
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
```

### Factory Kafka
Para a criação dos Producers e Consumers do Kafka vamos utilizar a abordagem de Factory.

### Producer

Interface:
```ts
export interface IProducerFactory {
    sendMessage(key: Buffer | string, value: Buffer | string, partition?: number) : Promise<void>
}
```
Implementação:
```ts
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
```

## Consumer
Interface:
```ts
import { EachMessagePayload } from "kafkajs"

export interface IConsumerFactory {
    listen() : Promise<void>
}

export interface MessageProcessor {
    run(messagePayload: EachMessagePayload) : Promise<any>
}
```

Implementação:
```ts
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
```

## Usecase
Para consumir as mensagens de maneira prevista dentro da sua regra de negócio voce deve criar uma classe que implementa a interface esperada pelo consumer **MessageProcessor**:
```ts
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
```

## Execução
Para testar a aplicação estou fazendo a execução direta do meu arquivo **server.ts**:
```ts
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
```

Voce deve obter o resultado:
```shell
KAFKA CLIENT CREATED!
{"level":"INFO","timestamp":"2024-07-27T14:09:09.198Z","logger":"kafkajs","message":"[Consumer] Starting","groupId":"node-group-id"}
{"level":"INFO","timestamp":"2024-07-27T14:09:12.364Z","logger":"kafkajs","message":"[ConsumerGroup] Consumer has joined the group","groupId":"node-group-id","memberId":"node-client-1ac99cb7-c1bf-4583-a927-6a7cedcc1c85","leaderId":"node-client-1ac99cb7-c1bf-4583-a927-6a7cedcc1c85","isLeader":true,"memberAssignment":{"node-topic":[0]},"groupProtocol":"RoundRobinAssigner","duration":3129}
MESSAGE RECEIVED:
PREFIX: [ TOPIC: node-topic PARTITION: 0 OFFSET: 9 TIMESTAMP: 1722089352518 ]
MESSAGE: [ KEY: node-key VALUE: {"exampleInt":10,"exampleBool":true,"exampleStr":"String Test"} ]
```

**OBS:** Você pode configurar o tipo de log que quer que seu driver do Kafka exiba para você, na configuração do client.
```ts
 const config : KafkaConfig = {
    brokers: ["localhost:9092"],
    clientId: "node-client",
    // para que não exiba nenhuma informação
    logLevel: logLevel.NOTHING
};
```

Finalmente, você tem uma aplicação Node integrada ao Kafka!