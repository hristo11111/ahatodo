import { ActorRefFrom, sendTo, setup, stopChild } from "xstate";
import { loginMachine } from "./loginMachine";
import { todoMachine } from "./todoMachine";

export const ahaMachine = setup({
  types: {
    context: {} as {
      todoChildMachine: ActorRefFrom<typeof todoMachine>,
      loginChildMachine: ActorRefFrom<typeof loginMachine>,
    },
    events: {} as { type: "auth.success"}
  },
  schemas: {
    events: {
      "auth.success": {
        type: "object",
        properties: {},
      },
    },
  },
}).createMachine({
  id: 'aha',
  initial: 'loginForm',
  context: ({ spawn }) => ({
    todoChildMachine: spawn(todoMachine),
    loginChildMachine: spawn(loginMachine),
  }),
  states: {
    loginForm: {
      on: {
        "auth.success": {
          target: 'todos',
          actions: [
            stopChild('loginChildMachine'),
            sendTo(({ context }) => context.todoChildMachine, { type: 'todo.load' })
          ]
        }
      }
    },
    todos: {},
  }
})
