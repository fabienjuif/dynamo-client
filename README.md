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
// delete(keyValue, { key: 'id' })
await dynamoClient.collection('my-collection').delete('my-id')
```

### get

```js
// get(keyValue, projectionKeys = undefined, { key = 'id' })
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
// update(data, { key = 'id' })
await dynamoClient.collection('my-collection').update({
  id: 'my-id',
  name: 'name !!',
  score: undefined, // this field will be removed
})
```
