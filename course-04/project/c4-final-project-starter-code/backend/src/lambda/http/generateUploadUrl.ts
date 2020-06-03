import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import {getTokenFromAuthHeader} from "../../auth/utils";
import { createLogger } from "../../utils/logger";
import { generateUploadUrl } from "../../businessLogic/todos";

const logger = createLogger('lambda:generateUploadUrl')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const todoId = event.pathParameters.todoId
  const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)

  let statusCode: number = 403
  let body: string = ''
  try {
    const uploadUrl: string = await generateUploadUrl(todoId, jwtToken)
    statusCode = 200
    body = JSON.stringify({
      uploadUrl
    })
  } catch (e) {
    logger.error('Generating signed url failed.', { error: e.message })
  }

  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body
  }
}
