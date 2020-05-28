import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { parseUserIdFromAuthorizationHeader } from "../../auth/utils";
import { TodoAccess } from "../../dataLayer/TodoAccess";
import { createLogger } from "../../utils/logger";

const logger = createLogger('lambda:updateTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)
  const todoId = event.pathParameters.todoId
  const userId = parseUserIdFromAuthorizationHeader(event.headers.Authorization)
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const todoAccess = new TodoAccess()

  let statusCode: number
  try {
    await todoAccess.updateTodoIfOwner(updatedTodo, todoId, userId)
    statusCode = 204
  } catch (e) {
    logger.error('Todo item was not updated (it does not exist or you do not have sufficient rights)', { error: e.message })
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
