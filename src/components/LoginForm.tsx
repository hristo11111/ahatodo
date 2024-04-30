import { FormEvent, useState } from 'react';
import { Button, TextField, Grid, Paper, Typography, Box } from '@mui/material';
import { useSelector } from '@xstate/react';
import { todoMachine } from '../state/todoMachine';
import { ActorRefFrom } from 'xstate';

interface LoginFormProps {
  todoActor: ActorRefFrom<typeof todoMachine>
}

const LoginForm = ({ todoActor }: LoginFormProps) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { send } = todoActor;
  const error = useSelector(todoActor, (state) => state.context.error);
  const isAuthenticated = useSelector(todoActor, (state) => state.context.authenticated);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send({ type: 'login', email, password: password });
  };

  return (
    !isAuthenticated && <Grid container justifyContent="center">
      <Grid item component={Paper}>
        <Box p={2}>
          <Typography variant="h5">Login</Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Submit
            </Button>
          </form>
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </Grid>
    </Grid>
  );
};

export default LoginForm;
