import { FormEvent, useState } from 'react';
import { Button, TextField, Grid, Paper, Typography, Box } from '@mui/material';
import { useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { loginMachine } from '../state/loginMachine';

interface LoginFormProps {
  loginActor: ActorRefFrom<typeof loginMachine>
}

type ActionType = 'login' | 'register';

/**
 * Login form component that allows users to login or register.
 * 
 * @param loginActor login actor reference
 */
const LoginForm = ({ loginActor }: LoginFormProps) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { send } = loginActor;
  const error = useSelector(loginActor, (state) => state.context.error);
  const message = useSelector(loginActor, (state) => state.context.message);
  const isAuthenticated = false;

  const handleSubmit = (event: FormEvent, actionType: ActionType) => {
    event.preventDefault();
    send({ type: actionType, email, password });
    setEmail('');
    setPassword('');
  };

  return (
    !isAuthenticated && <Grid container justifyContent="center">
      <Grid item component={Paper}>
        <Box p={2}>
          <Typography variant="h5">Login/Register</Typography>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!(event.nativeEvent instanceof SubmitEvent)) return;
            const submitter = event.nativeEvent.submitter;
            if (!(submitter instanceof HTMLButtonElement)) return;
            
            handleSubmit(event, submitter.value as ActionType);
          }}>
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
            <Button type="submit" value="login" variant="contained" color="primary" fullWidth>
              Login
            </Button>
            <Box mt={2}>
              <Button type="submit" value="register" variant="contained" color="primary" fullWidth>
                Register
              </Button>
            </Box>
          </form>
          {error && <Typography sx={{ marginTop: 2 }} color="error">{error}</Typography>}
          {message && <Typography sx={{ marginTop: 2, color: 'green' }}>{message}</Typography>}
        </Box>
      </Grid>
    </Grid>
  );
};

export default LoginForm;
