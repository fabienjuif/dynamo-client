import AWS from 'aws-sdk'

export const createClient = (
  region = process.env.AWS_REGION,
  apiVersion = '2012-08-10',
) => {
  AWS.config.update({ region })
  const docClient = new AWS.DynamoDB.DocumentClient({ apiVersion })

  const update = (tableName) =>
    /**
     * Update one document.
     *
     * @param {Object} data data you want to update (all fields will be updated!).
     *                      You can set data value to `undefined` to remove it.
     * @param {String} options.key the key to use as an ID, this key will not be updated. Default is `id`
     */
    async (data, { key = 'id' } = { key: 'id' }) => {
      const keys = Object.keys(data).filter((curr) => curr !== key)
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
        Key: {
          [key]: data[key],
        },
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

  const deleteDocument = (tableName) =>
    /**
     * Remove a document given its key value.
     *
     * @param {String} keyValue key value to the document to remove
     * @param {String} options.key key name. Default is `id`.
     */
    (keyValue, { key = 'id' } = { key: 'id' }) =>
      docClient
        .delete({
          TableName: tableName,
          Key: {
            [key]: keyValue,
          },
        })
        .promise()

  const get = (tableName) =>
    /**
     * Read a document.
     *
     * @param {String} keyValue the key value that identify the document to retrieve.
     * @param {Array<String>|String} projectionKeys the projection to apply
     * @param {String} options.key key name. Default is `id`.
     */
    async (
      keyValue,
      projectionKeys = undefined,
      { key = 'id' } = { key: 'id' },
    ) => {
      let params = {
        TableName: tableName,
        Key: {
          [key]: keyValue,
        },
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

  return {
    collection: (tableName) => ({
      delete: deleteDocument(tableName),
      get: get(tableName),
      put: put(tableName),
      update: update(tableName),
    }),
  }
}
