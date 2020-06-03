import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getTokenFromAuthHeader } from "../../auth/utils";
import { createLogger } from "../../utils/logger";
import { deleteTodo } from "../../businessLogic/todos";

const logger = createLogger('lambda:deleteTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const todoId = event.pathParameters.todoId
  const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)

  let statusCode: number = 403

  try {
    await deleteTodo(todoId, jwtToken)
    statusCode = 204
  } catch (e) {
    logger.error('Todo item was not deleted (it does not exist or user does not have sufficient rights).', { error: e.message })
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
