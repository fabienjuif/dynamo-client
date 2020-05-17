import AWS from 'aws-sdk'

export const createClient = (
  region = process.env.AWS_REGION,
  apiVersion = '2012-08-10',
) => {
  AWS.config.update({ region })
  const docClient = new AWS.DynamoDB.DocumentClient({ apiVersion })

  const query = (tableName, key = 'id') =>
    /**
     * Query items trough there ID.
     *
     * @param {String|Object} keyValue the key value that identify the document to retrieve.
     */
    async (keyValue) => {
      const keys = typeof keyValue === 'string' ? [key] : Object.keys(keyValue)

      const params = {
        TableName: tableName,
        KeyConditionExpression: keys.map((k) => `#${k} = :${k}`).join(' and '),
        ExpressionAttributeNames: keys.reduce(
          (acc, k) => ({ ...acc, [`#${k}`]: k }),
          {},
        ),
        ExpressionAttributeValues: keys.reduce(
          (acc, k) => ({
            ...acc,
            [`:${k}`]: keyValue[k],
          }),
          {},
        ),
      }

      const { Items } = await docClient.query(params).promise()

      return Items
    }

  const get = (tableName, key = 'id') =>
    /**
     * Read a document.
     *
     * @param {String|Object} keyValue the key value that identify the document to retrieve.
     * @param {String} options.key key name. Default is `id`.
     */
    async (keyValue, projectionKeys = undefined) => {
      let params = {
        TableName: tableName,
        Key:
          typeof keyValue === 'string'
            ? {
                [key]: keyValue,
              }
            : keyValue,
      }

      if (projectionKeys) {
        const innerProjectionKeys = [].concat(projectionKeys)

        params = {
          ...params,
          ExpressionAttributeNames: innerProjectionKeys.reduce(
            (acc, k) => ({ ...acc, [`#${k}`]: k }),
            {},
          ),
          ProjectionExpression: innerProjectionKeys
            .map((k) => `#${k}`)
            .join(','),
        }
      }

      const { Item } = await docClient.get(params).promise()
      return Item
    }

  const update = (tableName, key = 'id') =>
    /**
     * Update one document.
     *
     * @param {Object} data data you want to update (all fields will be updated!).
     *                      You can set data value to `undefined` to remove it.
     */
    async (data) => {
      const keys = Object.keys(data).filter(
        (curr) => ![].concat(key).includes(curr),
      )
      const updateKeys = []
      const updates = []
      const removes = []

      keys.forEach((k) => {
        if (data[k] === undefined || data[k] === null) {
          removes.push(`#${k}`)
        } else {
          updateKeys.push(k)
          updates.push(`#${k} = :${k}`)
        }
      })

      let params = {
        TableName: tableName,
        Key:
          typeof key === 'string'
            ? {
                [key]: data[key],
              }
            : key.reduce((acc, curr) => ({ ...acc, [curr]: data[curr] }), {}),
        ExpressionAttributeNames: keys.reduce(
          (acc, k) => ({ ...acc, [`#${k}`]: k }),
          {},
        ),
      }

      // udpate values
      if (updateKeys.length > 0) {
        params = {
          ...params,
          ExpressionAttributeValues: updateKeys.reduce(
            (acc, k) => ({ ...acc, [`:${k}`]: data[k] }),
            {},
          ),
        }
      }

      // expression
      let UpdateExpression = ''
      if (updates.length > 0) {
        UpdateExpression = `${UpdateExpression} set ${updates.join(', ')}`
      }
      if (removes.length > 0) {
        UpdateExpression = `${UpdateExpression} remove ${removes.join(', ')}`
      }
      params = {
        ...params,
        UpdateExpression,
      }

      await docClient.update(params).promise()
    }

  const put = (tableName) =>
    /**
     * Insert or update a whole document.
     *
     * @param {object} data data to insert (or update)
     */
    (data) =>
      docClient
        .put({
          TableName: tableName,
          Item: data,
        })
        .promise()

  const deleteDocument = (tableName, key = 'id') =>
    /**
     * Remove a document given its key value.
     *
     * @param {String} keyValue key value to the document to remove
     */
    (keyValue) =>
      docClient
        .delete({
          TableName: tableName,
          Key:
            typeof key === 'string'
              ? {
                  [key]: keyValue,
                }
              : keyValue,
        })
        .promise()

  return {
    docClient,
    /**
     * Get a collection (table) helper.
     *
     * @param tableName the table name.
     * @param key the primary key of this table
     *            it can be a single string or an array of strings
     *            (if you use a partition and a sort key).
     */
    collection: (tableName, key = 'id') => ({
      delete: deleteDocument(tableName, key),
      get: get(tableName, key),
      query: query(tableName, key),
      put: put(tableName, key),
      update: update(tableName, key),
    }),
  }
}
