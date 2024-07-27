export interface IProducerFactory {
    sendMessage(key: Buffer | string, value: Buffer | string, partition?: number) : Promise<void>
}
