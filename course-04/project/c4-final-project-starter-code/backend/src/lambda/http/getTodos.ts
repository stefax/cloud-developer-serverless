import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { createLogger } from "../../utils/logger";
import {getTodos} from "../../businessLogic/todos";
import {getTokenFromAuthHeader} from "../../auth/utils";

const logger = createLogger('lambda:getTodos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)

  const todos = await getTodos(jwtToken)

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
