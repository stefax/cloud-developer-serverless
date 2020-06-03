import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { createLogger } from "../../utils/logger";
import { getTokenFromAuthHeader } from "../../auth/utils";
import { updateTodo } from "../../businessLogic/todos";

const logger = createLogger('lambda:updateTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const todoId = event.pathParameters.todoId
  const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  let statusCode: number = 403
  try {
    await updateTodo(updatedTodo, todoId, jwtToken)
    statusCode = 204
  } catch (e) {
    logger.error('Todo item was not updated (it does not exist or you do not have sufficient rights)', { error: e.message })
  }

  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: ''
  }
}
