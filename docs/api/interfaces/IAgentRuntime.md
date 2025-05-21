[@elizaos/core v0.25.9](../index.md) / IAgentRuntime

# Interface: IAgentRuntime

## Properties

### agentId

> **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Properties

#### Defined in

[packages/core/src/types.ts:1295](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1295)

***

### serverUrl

> **serverUrl**: `string`

#### Defined in

[packages/core/src/types.ts:1296](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1296)

***

### databaseAdapter

> **databaseAdapter**: [`IDatabaseAdapter`](IDatabaseAdapter.md)

#### Defined in

[packages/core/src/types.ts:1297](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1297)

***

### token

> **token**: `string`

#### Defined in

[packages/core/src/types.ts:1298](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1298)

***

### modelProvider

> **modelProvider**: [`ModelProviderName`](../enumerations/ModelProviderName.md)

#### Defined in

[packages/core/src/types.ts:1299](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1299)

***

### imageModelProvider

> **imageModelProvider**: [`ModelProviderName`](../enumerations/ModelProviderName.md)

#### Defined in

[packages/core/src/types.ts:1300](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1300)

***

### imageVisionModelProvider

> **imageVisionModelProvider**: [`ModelProviderName`](../enumerations/ModelProviderName.md)

#### Defined in

[packages/core/src/types.ts:1301](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1301)

***

### character

> **character**: [`Character`](../type-aliases/Character.md)

#### Defined in

[packages/core/src/types.ts:1302](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1302)

***

### providers

> **providers**: [`Provider`](Provider.md)[]

#### Defined in

[packages/core/src/types.ts:1303](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1303)

***

### actions

> **actions**: [`Action`](Action.md)[]

#### Defined in

[packages/core/src/types.ts:1304](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1304)

***

### evaluators

> **evaluators**: [`Evaluator`](Evaluator.md)[]

#### Defined in

[packages/core/src/types.ts:1305](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1305)

***

### plugins

> **plugins**: [`Plugin`](../type-aliases/Plugin.md)[]

#### Defined in

[packages/core/src/types.ts:1306](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1306)

***

### fetch()?

> `optional` **fetch**: (`input`, `init`?) => `Promise`\<`Response`\>(`input`, `init`?) => `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/fetch)

#### Parameters

• **input**: `RequestInfo` \| `URL`

• **init?**: `RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Parameters

• **input**: `string` \| `Request` \| `URL`

• **init?**: `RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Defined in

[packages/core/src/types.ts:1308](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1308)

***

### messageManager

> **messageManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1310](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1310)

***

### descriptionManager

> **descriptionManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1311](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1311)

***

### documentsManager

> **documentsManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1312](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1312)

***

### knowledgeManager

> **knowledgeManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1313](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1313)

***

### ragKnowledgeManager

> **ragKnowledgeManager**: [`IRAGKnowledgeManager`](IRAGKnowledgeManager.md)

#### Defined in

[packages/core/src/types.ts:1314](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1314)

***

### loreManager

> **loreManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1315](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1315)

***

### cacheManager

> **cacheManager**: [`ICacheManager`](ICacheManager.md)

#### Defined in

[packages/core/src/types.ts:1317](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1317)

***

### services

> **services**: `Map`\<[`ServiceType`](../enumerations/ServiceType.md), [`Service`](../classes/Service.md)\>

#### Defined in

[packages/core/src/types.ts:1319](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1319)

***

### clients

> **clients**: [`ClientInstance`](../type-aliases/ClientInstance.md)[]

#### Defined in

[packages/core/src/types.ts:1320](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1320)

## Methods

### initialize()

> **initialize**(): `Promise`\<`void`\>

verifiableInferenceAdapter?: IVerifiableInferenceAdapter | null;

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1324](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1324)

***

### registerMemoryManager()

> **registerMemoryManager**(`manager`): `void`

#### Parameters

• **manager**: [`IMemoryManager`](IMemoryManager.md)

#### Returns

`void`

#### Defined in

[packages/core/src/types.ts:1326](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1326)

***

### getMemoryManager()

> **getMemoryManager**(`name`): [`IMemoryManager`](IMemoryManager.md)

#### Parameters

• **name**: `string`

#### Returns

[`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1328](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1328)

***

### getService()

> **getService**\<`T`\>(`service`): `T`

#### Type Parameters

• **T** *extends* [`Service`](../classes/Service.md)

#### Parameters

• **service**: [`ServiceType`](../enumerations/ServiceType.md)

#### Returns

`T`

#### Defined in

[packages/core/src/types.ts:1330](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1330)

***

### registerService()

> **registerService**(`service`): `void`

#### Parameters

• **service**: [`Service`](../classes/Service.md)

#### Returns

`void`

#### Defined in

[packages/core/src/types.ts:1332](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1332)

***

### getSetting()

> **getSetting**(`key`): `string`

#### Parameters

• **key**: `string`

#### Returns

`string`

#### Defined in

[packages/core/src/types.ts:1334](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1334)

***

### getConversationLength()

> **getConversationLength**(): `number`

Methods

#### Returns

`number`

#### Defined in

[packages/core/src/types.ts:1337](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1337)

***

### processActions()

> **processActions**(`message`, `responses`, `state`?, `callback`?): `Promise`\<`void`\>

#### Parameters

• **message**: [`Memory`](Memory.md)

• **responses**: [`Memory`](Memory.md)[]

• **state?**: [`State`](State.md)

• **callback?**: [`HandlerCallback`](../type-aliases/HandlerCallback.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1339](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1339)

***

### evaluate()

> **evaluate**(`message`, `state`?, `didRespond`?, `callback`?): `Promise`\<`string`[]\>

#### Parameters

• **message**: [`Memory`](Memory.md)

• **state?**: [`State`](State.md)

• **didRespond?**: `boolean`

• **callback?**: [`HandlerCallback`](../type-aliases/HandlerCallback.md)

#### Returns

`Promise`\<`string`[]\>

#### Defined in

[packages/core/src/types.ts:1346](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1346)

***

### ensureParticipantExists()

> **ensureParticipantExists**(`userId`, `roomId`): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1353](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1353)

***

### ensureUserExists()

> **ensureUserExists**(`userId`, `userName`, `name`, `source`): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **userName**: `string`

• **name**: `string`

• **source**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1355](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1355)

***

### registerAction()

> **registerAction**(`action`): `void`

#### Parameters

• **action**: [`Action`](Action.md)

#### Returns

`void`

#### Defined in

[packages/core/src/types.ts:1362](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1362)

***

### ensureConnection()

> **ensureConnection**(`userId`, `roomId`, `userName`?, `userScreenName`?, `source`?): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **userName?**: `string`

• **userScreenName?**: `string`

• **source?**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1364](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1364)

***

### ensureParticipantInRoom()

> **ensureParticipantInRoom**(`userId`, `roomId`): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1372](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1372)

***

### ensureRoomExists()

> **ensureRoomExists**(`roomId`): `Promise`\<`void`\>

#### Parameters

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1374](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1374)

***

### composeState()

> **composeState**(`message`, `additionalKeys`?): `Promise`\<[`State`](State.md)\>

#### Parameters

• **message**: [`Memory`](Memory.md)

• **additionalKeys?**

#### Returns

`Promise`\<[`State`](State.md)\>

#### Defined in

[packages/core/src/types.ts:1376](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1376)

***

### updateRecentMessageState()

> **updateRecentMessageState**(`state`): `Promise`\<[`State`](State.md)\>

#### Parameters

• **state**: [`State`](State.md)

#### Returns

`Promise`\<[`State`](State.md)\>

#### Defined in

[packages/core/src/types.ts:1381](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1381)
