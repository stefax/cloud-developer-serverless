import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createLogger } from '../../utils/logger'
import { createTodo } from "../../businessLogic/todos";
import { getTokenFromAuthHeader } from "../../auth/utils";

const logger = createLogger('lambda:createTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const todoRequest: CreateTodoRequest = JSON.parse(event.body)

  let body: string = ''
  let statusCode: number = 400

  try {
    const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)
    const newTodo = await createTodo(todoRequest, jwtToken)
    statusCode = 201
    body = JSON.stringify({
      item: newTodo
    })
  } catch (e) {
    logger.error('Todo item was not created (name empty or user does not have sufficient rights)', { error: e.message })
  }

  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body
  }
}
