import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { parseUserIdFromAuthorizationHeader } from "../../auth/utils";
import { TodoAccess } from "../../dataLayer/TodoAccess";
import { createLogger } from "../../utils/logger";

const logger = createLogger('lambda:deleteTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)
  const todoId = event.pathParameters.todoId
  const userId = parseUserIdFromAuthorizationHeader(event.headers.Authorization)
  const todoAccess = new TodoAccess()

  let statusCode: number

  try {
    await todoAccess.deleteTodoIfOwner(todoId, userId)
    statusCode = 204
  } catch (e) {
    logger.error('Todo item was not deleted (it does not exist or user does not have sufficient rights).', { error: e.message })
    statusCode = 403 // it should actually distinguish between not found and not authorized ...
  } finally {
    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: ''
    }
  }
}
