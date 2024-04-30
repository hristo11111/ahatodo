import Todo from './components/Todo'
import { todoMachine } from './state/todoMachine'
import { useActorRef } from '@xstate/react';
import LoginForm from './components/LoginForm';

import './App.css'


function App() {
  const todoActorRef = useActorRef(todoMachine);

  return (
    <>
      <LoginForm todoActor={todoActorRef} />
      <Todo todoActor={todoActorRef} />
    </>
  )
}

export default App
