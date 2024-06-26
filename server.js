import { buildSchema } from 'graphql';
import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import { ruruHTML } from "ruru/server";
import cors from "cors";

const schema = buildSchema(`
  type User {
    id: ID!
    email: String!
    password: String!
  }

  type AuthPayload {
    user: User!
  }

  type Todo {
    id: ID!
    text: String
    completed: Boolean
  }

  type Query {
    getTodos: [Todo]
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload
    register(email: String!, password: String!): AuthPayload
    addTodo(text: String!): Todo
    toggleTodo(id: ID!): Todo
    updateTodo(id: ID!, text: String!): Todo
    removeTodo(id: ID!): Todo
  }
`);

const fakeDatabase = {
  todos: [],
  users: []
};

const root = {
  login: ({ email, password }) => {
    const user = fakeDatabase.users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    return { user };
  },
  register: ({ email, password }) => {
    if (fakeDatabase.users.find(u => u.email === email)) {
      throw new Error('Email already exists');
    }

    const id = Math.random().toString(36).substring(2, 9);
    const newUser = { id, email, password };
    fakeDatabase.users.push(newUser);

    return { user: newUser };
  },
  getTodos: () => fakeDatabase.todos,
  addTodo: ({ text }) => {
    const todo = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      completed: false
    };
    fakeDatabase.todos.push(todo);

    return todo;
  },
  toggleTodo: ({ id }) => {
    const todoList = [...fakeDatabase.todos];
    const todo = todoList.find((t) => t.id === id);
    todo.completed = !todo.completed;
    fakeDatabase.todos = todoList;

    return todo;
  },
  updateTodo: ({ id, text }) => {
    const todoList = [...fakeDatabase.todos];
    const todo = todoList.find((t) => t.id === id);
    todo.text = text;
    fakeDatabase.todos = todoList;

    return todo;
  },
  removeTodo: ({ id }) => {
    const todoList = [...fakeDatabase.todos];
    const todo = todoList.find((t) => t.id === id);
    fakeDatabase.todos = todoList.filter((t) => t.id !== id);

    return todo;
  }
};

const app = express();

app.use(cors());
app.all(
  "/graphql",
  createHandler({
    schema: schema,
    rootValue: root,
  })
)
 
// Serve the GraphiQL IDE.
app.get("/", (_req, res) => {
  res.type("html")
  res.end(ruruHTML({ endpoint: "/graphql" }))
})
 
// Start the server at port
app.listen(4000)
console.log("Running a GraphQL API server at http://localhost:4000/graphql")
