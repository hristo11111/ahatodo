import { AnyEventObject, assign, fromPromise, raise, sendParent, setup } from "xstate";

interface Credentials {
  email: string
  password: string
}

const login = (email: string, password: string) => (
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation {
          login(email: "${email}", password: "${password}") {
            user {
              id
              email
            }
          }
        }
      `,
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data.login;
    })
);

const register = (email: string, password: string) => (
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation {
          register(email: "${email}", password: "${password}") {
            user {
              id
              email
            }
          }
        }
      `,
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data.register;
    })
);

export const loginMachine = setup({
  types: {
    context: {} as { email: string; password: string; error: string, message: string },
    events: {} as
      | { type: "login", email: Credentials['email'], password: Credentials['password'] }
      | { type: "register", email: Credentials['email'], password: Credentials['password'] }
      | { type: "clearMessage" }
      | { type: "clearError" }
  },
  schemas: {
    events: {
      "login": {
        type: "object",
        properties: {},
      },
      "register": {
        type: "object",
        properties: {},
      },
      "clearMessage": {
        type: "object",
        properties: {},
      },
      "clearError": {
        type: "object",
        properties: {},
      },
    },
    context: {
      email: {
        type: "string",
        description:
          'email',
      },
      password: {
        type: "string",
        description:
          'password',
      },
      error: {
        type: "null",
        description:
          'error',
      },
      message: {
        type: "null",
        description:
          'error',
      },
    },
  },
  actors: {
    login: fromPromise(async ({ input: { email, password } }: { input: Credentials }) => (
      await login(email, password)
    )),
    register: fromPromise(async ({ input: { email, password } }: { input: Credentials }) => (
      await register(email, password)
    )),
  },
  actions: {
    clearError: raise({ type: 'clearError' }, { delay: 2000 }),
    addError: assign({ error: ({ event }: { event: AnyEventObject }) => {
      if (event.error instanceof Error) {
        return event.error.message;
      }
      return ''
    } }),
  }
}).createMachine({
  context: {
    email: "",
    password: "",
    error: "",
    message: ""
  },
  id: "loginForm",
  initial: "Enter credentials",
  states: {
    "Enter credentials": {
      on: {
        login: {
          target: "Logging in",
        },
        register: {
          target: "Registering",
        },
        clearMessage: {
          actions: assign({ message: "" })
        },
        clearError: {
          actions: assign({ error: "" })
        }
      },
    },
    "Logging in": {
      invoke: {
        id: "login",
        src: "login",
        input: ({ event }) => {
          if (event.type === 'login') {
            return { email: event.email, password: event.password };
          }
          return { email: '', password: ''};
        },
        onDone: {
          target: "Login Successful",
          actions: sendParent(() => ({ type: "auth.success" }))
        },
        onError: {
          target: "Enter credentials",
          actions: [
            { type: 'addError'},
            { type: 'clearError' }
          ]
        },
      },
    },
    "Registering": {
      invoke: {
        id: "register",
        src: "register",
        input: ({ event }) => {
          if (event.type === 'register') {
            return { email: event.email, password: event.password };
          }
          return { email: '', password: '' };
        },
        onDone: {
          target: "Enter credentials",
          actions: [
            assign({ message: "Registration is successful" }),
            raise({ type: 'clearMessage' }, { delay: 2000 })
          ]
        },
        onError: {
          target: "Enter credentials",
          actions: [
            { type: 'addError'},
            { type: 'clearError' }
          ]
        },
      },
    },
    "Login Successful": {
      type: "final",
    },
  },
});

