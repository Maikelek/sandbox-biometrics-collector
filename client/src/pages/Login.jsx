import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Alert,
  Container,
  Divider,
  InputAdornment,
  Stack,
  CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  MailOutline,
  LockOutlined,
  VerifiedUserOutlined,
  Code,
  CheckCircleOutline,
  Timeline,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { useUser } from '../context/UserContext';
import { useThemeContext } from '../context/ThemeContext';
import ForgotPasswordDialog from '../components/ForgotPasswordDialog';
import NavBar from '../components/NavBar';
import '../i18n';

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const { setUser } = useUser();
  const { t, i18n } = useTranslation();
  const { themeMode } = useThemeContext();

  const isDarkMode = themeMode === 'dark';
  const lang = i18n.language?.startsWith('sk') ? 'sk' : 'en';

  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    validation: '',
  });

  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiBase =
    window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';

  const text = {
    sk: {
      badge: 'TUKE FEI',
      title: 'Platforma na riešenie programátorských úloh',
      subtitle:
        'Aplikácia umožňuje riešiť úlohy v bezpečnom prostredí, automaticky overovať výsledky a zbierať údaje potrebné pre analýzu práce používateľa.',
      feature1: 'Programátorské úlohy v Pythone',
      feature2: 'Automatické vyhodnotenie riešení',
      feature3: 'Zber dát pre výskumnú časť práce',
      loginSubtitle: isFirstLogin
        ? 'Zadaj validačný kód, ktorý ti bol odoslaný na e-mail.'
        : 'Prihláste sa do účtu a pokračujte v riešení úloh.',
    },
    en: {
      badge: 'TUKE FEI',
      title: 'Platform for solving programming tasks',
      subtitle:
        'The application allows users to solve tasks in a secure environment, automatically evaluate results and collect data for user behaviour analysis.',
      feature1: 'Python programming tasks',
      feature2: 'Automatic solution evaluation',
      feature3: 'Data collection for research',
      loginSubtitle: isFirstLogin
        ? 'Enter the validation code sent to your email.'
        : 'Sign in to your account and continue solving tasks.',
    },
  }[lang];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));

    setLoginError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = t('error-email');
    }

    if (formData.password.length === 0 && !isFirstLogin) {
      newErrors.password = t('error-password-required');
    }

    if (isFirstLogin && !formData.validation) {
      newErrors.validation = t('error-validation-required');
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setLoginError('');

    try {
      const res = await axios.post(
        `${apiBase}/auth`,
        {
          email: formData.email,
          password: formData.password,
          validation: isFirstLogin ? formData.validation : undefined,
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
          setUser(data.user);
          navigate('/');
        }
      } else {
        setLoginError(data.message || t('server-error'));
      }
    } catch (error) {
      console.error('Login error:', error);
      const msg = error.response?.data?.message || t('server-error');
      setLoginError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Code fontSize="small" />,
      label: text.feature1,
    },
    {
      icon: <CheckCircleOutline fontSize="small" />,
      label: text.feature2,
    },
    {
      icon: <Timeline fontSize="small" />,
      label: text.feature3,
    },
  ];

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: isDarkMode ? '#0f1117' : '#f6f7fb',
          color: isDarkMode ? '#fff' : '#111827',
        }}
      >
        <NavBar publicPage />

        <Container
          maxWidth="lg"
          sx={{
            minHeight: 'calc(100vh - 68px)',
            display: 'flex',
            alignItems: 'center',
            py: { xs: 5, md: 8 },
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
              gap: { xs: 5, md: 8 },
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  display: 'inline-flex',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                }}
              >
                {text.badge}
              </Typography>

              <Typography
                component="h1"
                sx={{
                  maxWidth: 680,
                  fontSize: { xs: '2.35rem', sm: '3rem', md: '3.7rem' },
                  lineHeight: 1.08,
                  fontWeight: 800,
                  letterSpacing: '-0.055em',
                  mb: 2.5,
                }}
              >
                {text.title}
              </Typography>

              <Typography
                sx={{
                  maxWidth: 620,
                  fontSize: { xs: '1rem', md: '1.08rem' },
                  lineHeight: 1.8,
                  color: isDarkMode
                    ? 'rgba(255,255,255,0.68)'
                    : 'rgba(17,24,39,0.68)',
                  mb: 4,
                }}
              >
                {text.subtitle}
              </Typography>

              <Stack spacing={1.5} sx={{ maxWidth: 480 }}>
                {features.map((feature) => (
                  <Box
                    key={feature.label}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
                      border: `1px solid ${
                        isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb'
                      }`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 1.5,
                        display: 'grid',
                        placeItems: 'center',
                        color: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      {feature.icon}
                    </Box>

                    <Typography sx={{ fontWeight: 600 }}>
                      {feature.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Paper
              elevation={0}
              sx={{
                width: '100%',
                maxWidth: 440,
                justifySelf: { xs: 'center', md: 'end' },
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
                border: `1px solid ${
                  isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'
                }`,
                boxShadow: isDarkMode
                  ? '0 20px 60px rgba(0,0,0,0.28)'
                  : '0 20px 60px rgba(15,23,42,0.1)',
              }}
            >
              <Box component="form" onSubmit={handleSubmit}>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 750,
                      letterSpacing: '-0.035em',
                      mb: 1,
                    }}
                  >
                    {isFirstLogin ? t('validation-code') : t('login')}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode
                        ? 'rgba(255,255,255,0.62)'
                        : 'text.secondary',
                      lineHeight: 1.7,
                    }}
                  >
                    {text.loginSubtitle}
                  </Typography>
                </Box>

                <Divider
                  sx={{
                    mb: 3,
                    borderColor: isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb',
                  }}
                />

                {loginError && (
                  <Alert
                    severity="error"
                    sx={{ mb: 2, borderRadius: 2 }}
                    onClose={() => setLoginError('')}
                  >
                    {loginError}
                  </Alert>
                )}

                <Stack spacing={2}>
                  <TextField
                    disabled={isFirstLogin || isSubmitting}
                    label={t('email')}
                    name="email"
                    fullWidth
                    value={formData.email}
                    onChange={handleChange}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailOutline fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    disabled={isFirstLogin || isSubmitting}
                    label={t('password')}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    value={formData.password}
                    onChange={handleChange}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                            disabled={isFirstLogin || isSubmitting}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  {isFirstLogin && (
                    <TextField
                      label={t('validation-code')}
                      name="validation"
                      fullWidth
                      value={formData.validation}
                      onChange={handleChange}
                      error={Boolean(errors.validation)}
                      helperText={errors.validation}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <VerifiedUserOutlined fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    mt: 3,
                    py: 1.25,
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    t('submit')
                  )}
                </Button>

                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setForgotOpen(true)}
                    disabled={isSubmitting}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {t('forgot-password')}
                  </Button>
                </Box>

                <Box
                  sx={{
                    mt: 2.5,
                    pt: 2.5,
                    borderTop: `1px solid ${
                      isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb'
                    }`,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t('no-account')}{' '}
                    <Button
                      variant="text"
                      onClick={() => navigate('/register')}
                      size="small"
                      disabled={isSubmitting}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        p: 0,
                        minWidth: 'auto',
                      }}
                    >
                      {t('register-here')}
                    </Button>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>

      <ForgotPasswordDialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
      />
    </>
  );
};

export default Login;