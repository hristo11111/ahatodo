import { setup, assign, fromPromise } from "xstate";

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
    context: {} as { list: Todo[]; error: string | null },
    events: {} as
      | { type: "todo.add", text: string }
      | { type: "todo.toggle", id: string }
      | { type: "todo.update", id: string, text: string, completed: boolean }
      | { type: "todo.remove", id: string }
  },
  schemas: {
    events: {
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
        type: "string | null",
        description:
          'Error message if any',
      },
    },
  },
  actors: {
    fetchTodos: fromPromise(fetchTodos),
    addTodo: fromPromise(async ({ input }: { input: Todo['text']}) => {
      const todo = await addTodo(input);
      
      return todo;
    }),
    toggleTodo: fromPromise(async ({ input }: { input: Todo['id']}) => {
      const todo = await toggleTodo(input)

      return todo
    }),
    updateTodo: fromPromise(async ({ input: { id, text } }: { input: { id: Todo['id'], text: Todo['text'] }}) => {
      const todo = await updateTodo(id, text);

      return todo;
    }),
    removeTodo: fromPromise(async ({ input }: { input: Todo['id']}) => {
      const todo = await removeTodo(input);

      return todo;
    }),
  },
}).createMachine({
  context: {
    list: [],
    error: null
  },
  id: "todo",
  initial: "initial",
  states: {
    initial: {
      always: {
        target: "todosLoading",
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
          actions: assign({ error: ({ event }): string | null => event.error as string }),
        },
      }
    },
    todosLoaded: {
      on: {
        "todo.add": {
          target: "addingTodo",
        },
        "todo.toggle": {
          target: "togglingTodo",
        },
        "todo.update": {
          target: "updatingTodo",
          guard: ({ event }) => !event.completed
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
          actions: assign({ error: ({ event }) => event.error as string }),
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
          actions: assign({ error: ({ event }) => event.error as string }),
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
          actions: assign({ error: ({ event }) => event.error as string }),
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
          actions: assign({ error: ({ event }) => event.error as string }),
        },
      }
    },
  },
});
