import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { TodoAccess } from '../dataLayer/TodoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserIdFromJwtToken } from '../auth/utils'
import { fileExists, getUploadUrl, removeFile } from "../utils/s3";
import { createLogger } from "../utils/logger";

const todoAccess = new TodoAccess()
const logger = createLogger('businessLogic:todos')

export async function getTodos(jwtToken: string): Promise<TodoItem[]> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  return todoAccess.getTodos(userId)
}

export async function createTodo(createTodoRequest: CreateTodoRequest, jwtToken: string): Promise<TodoItem> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  return await todoAccess.createTodo(createTodoRequest, userId)
}

export async function updateTodo(updateTodoRequest: UpdateTodoRequest, todoId: string, jwtToken: string): Promise<TodoUpdate> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  return await todoAccess.updateTodoIfOwner(updateTodoRequest, todoId, userId)
}

export async function deleteTodo(todoId: string, jwtToken: string): Promise<void> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  if (await fileExists(todoId)) {
    logger.info('Deleting related image for todo that will be removed.')
    await removeFile(todoId)
  }

  return await todoAccess.deleteTodoIfOwner(todoId, userId)
}

export async function generateUploadUrl(todoId: string, jwtToken: string): Promise<string> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  if (await todoAccess.isUserOwnerOfTodo(todoId, userId)) {
    return await getUploadUrl(todoId)
  }
}
