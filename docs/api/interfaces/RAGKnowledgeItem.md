[@elizaos/core v0.25.9](../index.md) / RAGKnowledgeItem

# Interface: RAGKnowledgeItem

## Properties

### id

> **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Defined in

[packages/core/src/types.ts:1563](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1563)

***

### agentId

> **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Defined in

[packages/core/src/types.ts:1564](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1564)

***

### content

> **content**: `object`

#### text

> **text**: `string`

#### metadata?

> `optional` **metadata**: `object`

##### Index Signature

 \[`key`: `string`\]: `unknown`

#### metadata.isMain?

> `optional` **isMain**: `boolean`

#### metadata.isChunk?

> `optional` **isChunk**: `boolean`

#### metadata.originalId?

> `optional` **originalId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### metadata.chunkIndex?

> `optional` **chunkIndex**: `number`

#### metadata.source?

> `optional` **source**: `string`

#### metadata.type?

> `optional` **type**: `string`

#### metadata.isShared?

> `optional` **isShared**: `boolean`

#### Defined in

[packages/core/src/types.ts:1565](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1565)

***

### embedding?

> `optional` **embedding**: `Float32Array`

#### Defined in

[packages/core/src/types.ts:1578](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1578)

***

### createdAt?

> `optional` **createdAt**: `number`

#### Defined in

[packages/core/src/types.ts:1579](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1579)

***

### similarity?

> `optional` **similarity**: `number`

#### Defined in

[packages/core/src/types.ts:1580](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1580)

***

### score?

> `optional` **score**: `number`

#### Defined in

[packages/core/src/types.ts:1581](https://github.com/Shelpin/aeternalsv2/blob/main/packages/core/src/types.ts#L1581)
