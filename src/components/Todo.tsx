import { todoMachine, Todo } from '../state/todoMachine';
import { useSelector } from '@xstate/react';
import { useState } from 'react';
import { TextField, Button, Checkbox, IconButton, List, ListItemText, ListItemButton, Box, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ActorRefFrom } from 'xstate';

interface TodoListProps {
  todoActor: ActorRefFrom<typeof todoMachine>;
}

/**
 * React component that displays and manages a list of todos.
 *  
 * @param todoActor actor reference
 */
const TodoList = ({ todoActor }: TodoListProps) => {
  const [todoInput, setTodoInput] = useState<Todo['text']>('');
  const [editingId, setEditingId] = useState<Todo['id']>('');
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
    <Grid container justifyContent="center">
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
          fullWidth
        />
        <Button 
          variant="contained" 
          onClick={handleAddTodo}
          sx={{ marginLeft: 4 }}
        >
          Add
        </Button>
      </Box>
      <Grid item xs={12}>
        <List>
          {list.map((todo) => (
            <ListItemButton key={todo.id} >
              <Checkbox checked={todo.completed} onClick={() => handleToggleTodo(todo.id)} />
              <Box display="flex" alignItems="center" justifyContent="space-between" flexGrow={1}>
                {editingId === todo.id ? (
                  <TextField
                    defaultValue={todo.text}
                    onBlur={(e) => handleUpdateTodo(todo.id, todo.completed, e.target.value)}
                    autoFocus
                  />
                ) : (
                  <ListItemText primary={todo.text} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }} />
                )}
                <Box>
                  <IconButton disabled={todo.completed} onClick={() => handleEditTodo(todo.id)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteTodo(todo.id)}><DeleteIcon /></IconButton>
                </Box>
              </Box>
            </ListItemButton>
          ))}
        </List>
      </Grid>
    </Grid>
  );
}

export default TodoList;
