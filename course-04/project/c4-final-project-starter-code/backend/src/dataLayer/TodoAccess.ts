import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createDynamoDBClient } from "./utils";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { createLogger } from "../utils/logger";

const logger = createLogger('dynamodb:todo')

export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable: string = process.env.TODOS_TABLE,
    private readonly userAndDueDateIndex: string = process.env.USER_AND_DUE_DATE_INDEX_NAME,
    private readonly imagesBucket: string = process.env.IMAGES_S3_BUCKET) {
  }

  /**
   * Get all todos for the logged-in user.
   */
  async getTodos(userId: string): Promise<TodoItem[]> {
    logger.debug('Get all todos for the logged-in user.')

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.userAndDueDateIndex,
        KeyConditionExpression: 'creatorUserId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items

    return items as TodoItem[]
  }

  /**
   * Get a to-do by id, throw error when logged in user is not owner.
   */
  async getTodo(todoId: string, userId: string): Promise<TodoItem> {
    logger.debug('Get a to-do by id, throw error when logged in user is not owner.')

    const result = await this.docClient.get({
      TableName: this.todosTable,
      Key: {
        todoId,
        creatorUserId: userId
      }
    }).promise()

    if (result.Item.creatorUserId !== userId) {
      throw new Error('Users can only get their own todos.')
    }

    return result.Item as TodoItem;
  }

  /**
   * Check whether a user owns a to-do and can therefore e.g. delete, update, etc.
   */
  async isUserOwnerOfTodo(todoId: string, userId: string): Promise<boolean> {
    try {
      await this.getTodo(todoId, userId)

      return true
    } catch (e) {

      return false
    }
  }

  /**
   * Create a new to-do for the logged in user.
   */
  async createTodo(todo: CreateTodoRequest, creatorUserId: string): Promise<TodoItem> {
    logger.debug('Create a new to-do for the logged in user.')

    if (!todo.name) {
      throw new Error('A name is required.')
    }

    const todoId = uuid.v4()
    const createdAt = new Date().toISOString()
    const newTodo = {
      done: false,
      ...todo,
      creatorUserId,
      todoId,
      createdAt,
      attachmentUrl: `https://${this.imagesBucket}.s3.amazonaws.com/${todoId}`
    }

    await this.docClient.put({
      TableName: this.todosTable,
      Item: newTodo,
    }).promise()

    return newTodo
  }

  /**
   * Update a to-do if it belongs to the logged in user.
   */
  async updateTodoIfOwner(todo: UpdateTodoRequest, todoId: string, updatingUserId: string): Promise<TodoUpdate> {
    logger.debug('Update a to-do if it belongs to the logged in user.')
    // first check whether it's the logged-in user's to-do by trying to get it
    await this.getTodo(todoId, updatingUserId);

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId,
        creatorUserId: updatingUserId
      },
      UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeValues: {
        ':name': todo.name,
        ':dueDate': todo.dueDate,
        ':done': todo.done
      },
      ExpressionAttributeNames: {
        '#name': 'name' // we cannot use it directly in the update expression as "name" is a reserved keyword
      }
    }).promise()

    return todo
  }

  /**
   * Delete a to-do if it belongs to the logged in user.
   */
  async deleteTodoIfOwner(todoId: string, updatingUserId: string): Promise<void> {
    logger.debug('Delete a to-do if it belongs to the logged in user.')
    // first check whether it's the logged-in user's to-do
    await this.getTodo(todoId, updatingUserId)

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        todoId,
        creatorUserId: updatingUserId
      }
    }).promise()
  }
}