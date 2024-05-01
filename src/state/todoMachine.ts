import { setup, assign, fromPromise, AnyEventObject, and } from "xstate";
import { loginMachine } from "./loginMachine";

export interface Todo {
  id: string
  text: string
  completed: boolean
}

const fetchTodos = () => (
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          getTodos {
            id
            text
            completed
          }
        }
      `,
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data.getTodos)
);

const addTodo = (text: string) => (
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation {
          addTodo(text: "${text}") {
            id
            text
            completed
          }
        }
      `,
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data.addTodo)
);

const toggleTodo = (id: string) => (
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation {
          toggleTodo(id: "${id}") {
            id
            completed
          }
        }
      `,
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data.toggleTodo)
);

const updateTodo = (id: string, text: string) => (
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation {
          updateTodo(id: "${id}", text: "${text}") {
            id
            text
          }
        }
      `,
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data.updateTodo)
);

const removeTodo = (id: string) => (
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation {
          removeTodo(id: "${id}") {
            id
          }
        }
      `,
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data.removeTodo)
);

export const todoMachine = setup({
  types: {
    context: {} as { list: Todo[]; error: string },
    events: {} as
      | { type: "todo.load" }
      | { type: "todo.add", text: string }
      | { type: "todo.toggle", id: string }
      | { type: "todo.update", id: string, text: string, completed: boolean }
      | { type: "todo.remove", id: string }
  },
  schemas: {
    events: {
      "todo.load": {
        type: "object",
        properties: {},
      },
      "todo.add": {
        type: "object",
        properties: {
        },
      },
      "todo.toggle": {
        type: "object",
        properties: {},
      },
      "todo.update": {
        type: "object",
        properties: {},
      },
      "todo.remove": {
        type: "object",
        properties: {},
      },
    },
    context: {
      list: {
        type: "array",
        items: {
          type: "Todo",
        },
        description:
          'List of todos',
      },
      error: {
        type: "string",
        description:
          'Error message if any',
      },
    },
  },
  actors: {
    fetchTodos: fromPromise(fetchTodos),
    addTodo: fromPromise(async ({ input }: { input: Todo['text']}) => (
      await addTodo(input)
    )),
    toggleTodo: fromPromise(async ({ input }: { input: Todo['id']}) => (
      await toggleTodo(input)
    )),
    updateTodo: fromPromise(async ({ input: { id, text } }: { input: { id: Todo['id'], text: Todo['text'] }}) => (
      await updateTodo(id, text)
    )),
    removeTodo: fromPromise(async ({ input }: { input: Todo['id']}) => (
      await removeTodo(input)
    )),
    loginMachine: loginMachine
  },
  actions: {
    addError: assign({ error: ({ event }: { event: AnyEventObject }) => event.error })
  },
  guards: {
    textRequired: ({ event }: { event: AnyEventObject }) => !!event.text,
  }
}).createMachine({
  context: {
    list: [],
    error: '',
  },
  id: "todo",
  initial: "idle",
  states: {
    idle: {
      on: {
        'todo.load': {
          target: 'todosLoading',
        },
      }
    },
    todosLoading: {
      invoke: {
        id: "fetchTodos",
        src: "fetchTodos",
        onDone: {
          target: 'todosLoaded',
          actions: assign({ list: ({ event }) => {
            return event.output;
          } }),
        },
        onError: {
          actions: { type: "addError" },
        },
      }
    },
    todosLoaded: {
      on: {
        "todo.add": {
          target: "addingTodo",
          guard: { type: "textRequired" }
        },
        "todo.toggle": {
          target: "togglingTodo",
        },
        "todo.update": {
          target: "updatingTodo",
          guard: and([{ type: "textRequired" }, ({ event }) => !event.completed ])
        },
        "todo.remove": {
          target: "removingTodo",
        }
      },
    },
    addingTodo: {
      invoke: {
        id: "addTodo",
        src: "addTodo",
        input: ({ event }) => event.type === "todo.add" ? event.text : '',
        onDone: {
          target: 'todosLoaded',
          actions: assign({ list: ({ context, event } ) => {
            return [...context.list, event.output];
          } }),
        },
        onError: {
          target: 'todosLoaded',
          actions: { type: "addError" },
        },
      }
    },
    togglingTodo: {
      invoke: {
        id: "toggleTodo",
        src: "toggleTodo",
        input: ({ event }) => event.type === "todo.toggle" ? event.id : '',
        onDone: {
          target: 'todosLoaded',
          actions: assign({ list: ({ context, event } ) => {
            return context.list.map((todo) => {
              if (todo.id === event.output.id) {
                return {
                  ...todo,
                  completed: event.output.completed,
                };
              } else {
                return todo;
              }
            });
          } }),
        },
        onError: {
          target: 'todosLoaded',
          actions: { type: "addError" },
        },
      }
    },
    updatingTodo: {
      invoke: {
        id: "updateTodo",
        src: "updateTodo",
        input: ({ event }) => event.type === "todo.update" ? ({ id: event.id, text: event.text }) : ({ id: '', text: ''}),
        onDone: {
          target: 'todosLoaded',
          actions: assign({ list: ({ context, event } ) => {
            return context.list.map((todo) => {
              if (todo.id === event.output.id) {
                return {
                  ...todo,
                  text: event.output.text,
                };
              } else {
                return todo;
              }
            });
          } }),
        },
        onError: {
          target: 'todosLoaded',
          actions: { type: "addError" },
        },
      }
    },
    removingTodo: {
      invoke: {
        id: "removeTodo",
        src: "removeTodo",
        input: ({ event }) => event.type === "todo.remove" ? event.id : '',
        onDone: {
          target: 'todosLoaded',
          actions: assign({ list: ({ context, event } ) => (
            context.list.filter((todo) => todo.id !== event.output.id)
          ) }),
        },
        onError: {
          target: 'todosLoaded',
          actions: { type: "addError" },
        },
      }
    },
  },
});
