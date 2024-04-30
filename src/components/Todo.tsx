import { todoMachine, Todo } from '../state/todoMachine';
import { useSelector } from '@xstate/react';
import { useState } from 'react';
import { TextField, Button, Checkbox, IconButton, List, ListItemText, ListItemSecondaryAction, ListItemButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ActorRefFrom } from 'xstate';

interface TodoListProps {
  todoActor: ActorRefFrom<typeof todoMachine>;
}

/**
 * React component that displays and manages a list of todos.
 */
const TodoList = ({ todoActor }: TodoListProps) => {
  const [todoInput, setTodoInput] = useState<Todo['text']>('');
  const [editingId, setEditingId] = useState<Todo['id']>('');
  const isAuthenticated = useSelector(todoActor, (state) => state.context.authenticated);
  const list = useSelector(todoActor, (state) => state.context.list);
  const { send } = todoActor;

  const handleAddTodo = () => {
    send({ type: 'todo.add', text: todoInput });
    setTodoInput('');
  };

  const handleDeleteTodo = (todoId: Todo['id']) => {
    send({ type: 'todo.remove', id: todoId });
  };

  const handleToggleTodo = (todoId: Todo['id']) => {
    send({ type: 'todo.toggle', id: todoId });
  };

  const handleEditTodo = (todoId: Todo['id']) => {
    setEditingId(todoId);
  };

  const handleUpdateTodo = (todoId: Todo['id'], completed: Todo['completed'], newText: Todo['text']) => {
    send({ type: 'todo.update', id: todoId, text: newText, completed });
    setEditingId('');
  };

  return (
    isAuthenticated && 
    <Box>
      <Box display="flex" alignItems="center">
        <TextField
          label="Add Todo"
          variant="outlined"
          value={todoInput}
          onChange={(e) => setTodoInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddTodo();
            }
          }}
        />
        <Button 
          variant="contained" 
          onClick={handleAddTodo}
          sx={{ marginLeft: 4 }}
        >
          Add
        </Button>
      </Box>
      <List>
        {list.map((todo) => (
          <ListItemButton key={todo.id} >
            <Checkbox checked={todo.completed} onClick={() => handleToggleTodo(todo.id)} />
            {editingId === todo.id ? (
              <TextField
                defaultValue={todo.text}
                onBlur={(e) => handleUpdateTodo(todo.id, todo.completed, e.target.value)}
                autoFocus
              />
            ) : (
              <ListItemText primary={todo.text} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }} />
            )}
            <ListItemSecondaryAction>
              <IconButton disabled={todo.completed} onClick={() => handleEditTodo(todo.id)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleDeleteTodo(todo.id)}><DeleteIcon /></IconButton>
            </ListItemSecondaryAction>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export default TodoList;
