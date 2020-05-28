import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { parseUserIdFromAuthorizationHeader } from "../../auth/utils"
import { TodoAccess } from "../../dataLayer/TodoAccess";
import { createLogger } from "../../utils/logger";

const logger = createLogger('lambda:getTodos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)
  const userId = parseUserIdFromAuthorizationHeader(event.headers.Authorization)
  const todoAccess = new TodoAccess()
  const todos = await todoAccess.getTodos(userId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items: todos
    })
  }
}
