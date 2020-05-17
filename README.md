# @fabienjuif/dynamo-client

> An opinionated async/await wrapper to AWS dynamo client (document)

## API

First, you have to create a client:

```js
import { createClient } from '@fabienjuif/dynamo-client'

// createClient(region, apiVersion)
// - default region is process.env.AWS_REGION
// - default apiVersion is 2012-08-10
const dynamoClient = createClient()
```

### delete

```js
// collection(tableName, key = 'id')
//    - key can be a string if you only use a partition key
//    - or it can be an array if you use a partition and a sort key
// delete(keyValue)
await dynamoClient.collection('my-collection').delete('my-id')
```

### get

```js
// get(keyValue, projectionKeys = undefined)
await dynamoClient.collection('my-collection').get('my-id')
await dynamoClient.collection('my-collection').get('my-id', ['id', 'name'])
```

### put

```js
await dynamoClient.collection('my-collection').put({
  id: 'my-id',
  name: 'name !!',
})
```

### update

```js
// update(data)
await dynamoClient.collection('my-collection').update({
  id: 'my-id',
  name: 'name !!',
  score: undefined, // this field will be removed
})
```

### query

```js
// query(keys)
await dynamoClient.collection('my-collection').query('my-partition-id')
```
