import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import {TodoAccess} from "../../dataLayer/TodoAccess";
import {parseUserIdFromAuthorizationHeader} from "../../auth/utils";
import { createLogger } from '../../utils/logger'

const logger = createLogger('lambda:createTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)
  const todoRequest: CreateTodoRequest = JSON.parse(event.body)
  const userId = parseUserIdFromAuthorizationHeader(event.headers.Authorization)
  const todoAccess = new TodoAccess()

  let statusCode: number
  let body: string = ''

  try {
    const newTodo = await todoAccess.createTodo(todoRequest, userId)
    statusCode = 201
    body = JSON.stringify({
      item: newTodo
    })
  } catch (e) {
    logger.error('Todo item was not created (name empty or user does not have sufficient rights)', { error: e.message })
    statusCode = 400
  } finally {
    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body
    }
  }
}
