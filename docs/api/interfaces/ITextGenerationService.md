[@elizaos/core v0.25.9](../index.md) / ITextGenerationService

# Interface: ITextGenerationService

## Extends

- [`Service`](../classes/Service.md)

## Accessors

### serviceType

#### Get Signature

> **get** **serviceType**(): [`ServiceType`](../enumerations/ServiceType.md)

##### Returns

[`ServiceType`](../enumerations/ServiceType.md)

#### Inherited from

[`Service`](../classes/Service.md).[`serviceType`](../classes/Service.md#serviceType-1)

#### Defined in

[packages/core/src/types.ts:1285](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1285)

## Methods

### initialize()

> `abstract` **initialize**(`runtime`): `Promise`\<`void`\>

Add abstract initialize method that must be implemented by derived classes

#### Parameters

• **runtime**: [`IAgentRuntime`](IAgentRuntime.md)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`Service`](../classes/Service.md).[`initialize`](../classes/Service.md#initialize)

#### Defined in

[packages/core/src/types.ts:1290](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1290)

***

### initializeModel()

> **initializeModel**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1407](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1407)

***

### queueMessageCompletion()

> **queueMessageCompletion**(`context`, `temperature`, `stop`, `frequency_penalty`, `presence_penalty`, `max_tokens`): `Promise`\<`any`\>

#### Parameters

• **context**: `string`

• **temperature**: `number`

• **stop**: `string`[]

• **frequency\_penalty**: `number`

• **presence\_penalty**: `number`

• **max\_tokens**: `number`

#### Returns

`Promise`\<`any`\>

#### Defined in

[packages/core/src/types.ts:1408](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1408)

***

### queueTextCompletion()

> **queueTextCompletion**(`context`, `temperature`, `stop`, `frequency_penalty`, `presence_penalty`, `max_tokens`): `Promise`\<`string`\>

#### Parameters

• **context**: `string`

• **temperature**: `number`

• **stop**: `string`[]

• **frequency\_penalty**: `number`

• **presence\_penalty**: `number`

• **max\_tokens**: `number`

#### Returns

`Promise`\<`string`\>

#### Defined in

[packages/core/src/types.ts:1416](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1416)

***

### getEmbeddingResponse()

> **getEmbeddingResponse**(`input`): `Promise`\<`number`[]\>

#### Parameters

• **input**: `string`

#### Returns

`Promise`\<`number`[]\>

#### Defined in

[packages/core/src/types.ts:1424](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1424)
