import { assign, fromPromise, sendParent, setup } from "xstate";

interface Credentials {
  email: string
  password: string
}

const submitForm = (email: string, password: string) => (
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
      return response.data.submitForm;
    })
);

export const loginMachine = setup({
  types: {
    context: {} as { email: string; error: null; password: string },
    events: {} as { 
      type: "auth.submit", email: Credentials['email']; password: Credentials['password']
    },
  },
  schemas: {
    events: {
      "auth.submit": {
        type: "object",
        properties: {},
      },
    },
    context: {
      email: {
        type: "string",
        description:
          'Generated automatically based on the key: "email" in initial context values',
      },
      error: {
        type: "null",
        description:
          'Generated automatically based on the key: "error" in initial context values',
      },
      password: {
        type: "string",
        description:
          'Generated automatically based on the key: "password" in initial context values',
      },
    },
  },
  actors: {
    submitForm: fromPromise(async ({ input: { email, password } }: { input: Credentials }) => {
      const todo = await submitForm(email, password);

      return todo;
    }),
  }
}).createMachine({
  context: {
    email: "",
    password: "",
    error: null,
  },
  id: "loginForm",
  initial: "Enter credentials",
  states: {
    "Enter credentials": {
      on: {
        "auth.submit": {
          target: "Submitting",
        },
      },
    },
    Submitting: {
      invoke: {
        id: "submitForm",
        src: "submitForm",
        input: ({ event }) => ({ email: event.email, password: event.password }),
        onDone: {
          target: "Login Successful",
        },
        onError: {
          target: "Enter credentials",
          actions: sendParent(({ event }) => ({ type: "addError", error: event.error.message })),
        },
      },
    },
    "Login Successful": {
      type: "final",
    },
  },
})
