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
  CssBaseline,
  Paper,
  Alert
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { useThemeContext } from '../context/ThemeContext';
import '../i18n';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const { t, i18n } = useTranslation();
  const { toggleTheme, mode } = useThemeContext();

  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    validation: ''
  });

  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');

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
      <CssBaseline />
      <div className="top-bar">
        <ToggleButtonGroup value={i18n.language} exclusive onChange={handleLangChange}>
          <ToggleButton value="en">EN</ToggleButton>
          <ToggleButton value="sk">SK</ToggleButton>
        </ToggleButtonGroup>
        <IconButton onClick={toggleTheme}>
          {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </div>

      <div className="holder-sign">
        <Paper elevation={6} className="register-form" sx={{ p: 4, width: '100%', maxWidth: 500 }}>
          <Typography variant="h4" gutterBottom align="center">
            {t('login')}
          </Typography>

          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
            type="password"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            error={Boolean(errors.password)}
            helperText={errors.password}
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
            sx={{ mt: 2 }}
            onClick={handleSubmit}
          >
            {t('submit')}
          </Button>

          <Box mt={2} textAlign="center">
            <Typography variant="body2">
              {t('no-account')}{' '}
              <Button variant="text" onClick={() => navigate('/register')}>
                {t('register-here')}
              </Button>
            </Typography>
          </Box>
        </Paper>
      </div>
    </>
  );
};

export default Login;
