import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { parseUserIdFromAuthorizationHeader } from "../../auth/utils";
import { TodoAccess } from "../../dataLayer/TodoAccess";
import { getUploadUrl } from "../../utils/s3";
import { createLogger } from "../../utils/logger";

const logger = createLogger('lambda:generateUploadUrl')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)
  const todoId = event.pathParameters.todoId
  const userId = parseUserIdFromAuthorizationHeader(event.headers.Authorization)
  const todoAccess = new TodoAccess()

  let statusCode: number
  let body: string = ''
  try {
    await todoAccess.getTodo(todoId, userId)
    const uploadUrl = getUploadUrl(todoId)
    statusCode = 200
    body = JSON.stringify({
      uploadUrl
    })
  } catch (e) {
    logger.error('Generating signed url failed.', { error: e.message })
    statusCode = 403 // better would be to distinguish between not found and not authorized ...
  } finally {
    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body
    }
  }
}
