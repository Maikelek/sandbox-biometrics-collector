import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Paper,
  Alert,
  Container,
  Divider,
  InputAdornment,
} from '@mui/material';
import { Brightness4, Brightness7, Visibility, VisibilityOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { useThemeContext } from '../context/ThemeContext';
import ForgotPasswordDialog from '../components/ForgotPasswordDialog';
import '../i18n';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useUser(); 
  const { t, i18n } = useTranslation();
  const { toggleTheme, themeMode } = useThemeContext(); 

  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    validation: ''
  });

  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLangChange = (_, lang) => lang && i18n.changeLanguage(lang);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setLoginError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = t('error-email');
    if (formData.password.length === 0 && !isFirstLogin) newErrors.password = t('error-password-required');
    if (isFirstLogin && !formData.validation) newErrors.validation = t('error-validation-required');
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:1234/auth',
        {
          email: formData.email,
          password: formData.password,
          validation: isFirstLogin ? formData.validation : undefined
        },
        {
          withCredentials: true,
        }
      );

      const data = res.data;

      if (res.status === 200) {
        if (data.user.isValid === 0) {
          setIsFirstLogin(true);
        } else {
          navigate('/'); 
          setUser(data.user);
        }
      } else {
        setLoginError(data.message || t('server-error'));
      }
    } catch (error) {
      console.error('Login error:', error);
      const msg = error.response?.data?.message || t('server-error');
      setLoginError(msg);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          p: 1,
          width: '100%',
        }}
      >
        <ToggleButtonGroup value={i18n.language} exclusive onChange={handleLangChange} size="small">
          <ToggleButton value="en">EN</ToggleButton>
          <ToggleButton value="sk">SK</ToggleButton>
        </ToggleButtonGroup>
        <IconButton onClick={toggleTheme} color="inherit" sx={{ ml: 1 }}>
          {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Box>

      <Container
        component="main"
        maxWidth="sm"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 50px)',
          py: { xs: 2, sm: 4 },
          px: 2,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, md: 5 },
            width: '100%',
            maxWidth: 400,
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="h4" gutterBottom align="center">
            {t('login')}
          </Typography>
          
          <Divider sx={{ my: 2 }} />

          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoginError('')}>
              {loginError}
            </Alert>
          )}

          <TextField
            disabled={isFirstLogin}
            label={t('email')}
            name="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={handleChange}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
          
          <TextField
            disabled={isFirstLogin}
            label={t('password')}
            name="password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            error={Boolean(errors.password)}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={isFirstLogin}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {isFirstLogin && (
            <TextField
              label={t('validation-code')}
              name="validation"
              fullWidth
              margin="normal"
              value={formData.validation}
              onChange={handleChange}
              error={Boolean(errors.validation)}
              helperText={errors.validation}
            />
          )}

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, mb: 1 }}
            onClick={handleSubmit}
          >
            {t('submit')}
          </Button>
          
          <Box mt={2} textAlign="center">
            <Button variant="text" size="small" onClick={() => setForgotOpen(true)}>
              {t('forgot-password')}
            </Button>
          </Box>

          <Box mt={2} textAlign="center">
            <Typography variant="body2">
              {t('no-account')}{' '}
              <Button variant="text" onClick={() => navigate('/register')} size="small">
                {t('register-here')}
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>

      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
};

export default Login;