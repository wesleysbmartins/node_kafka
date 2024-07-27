import { EachMessagePayload } from "kafkajs"

export interface IConsumerFactory {
    listen() : Promise<void>
}

export interface MessageProcessor {
    run(messagePayload: EachMessagePayload) : Promise<any>
}
