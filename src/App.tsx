import Todo from './components/Todo'
import { useMachine } from '@xstate/react';
import { ahaMachine } from './state/ahaMachine';
import LoginForm from './components/LoginForm';

import './App.css'

/**
 * React component that renders the login form and todo list.
 */
function App() {
  const [state] = useMachine(ahaMachine);
  const todoActor = state.context.todoChildMachine
  const loginActor = state.context.loginChildMachine

  return (
    <>
      { 
      state.matches('loginForm') 
        ? <LoginForm loginActor={loginActor} />
        : <Todo todoActor={todoActor} />
      }
    </>
  )
}

export default App
