import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Alert,
  Container,
  Stack,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  PersonOutline,
  MailOutline,
  LockOutlined,
  Code,
  CheckCircleOutline,
  Timeline,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { useThemeContext } from '../context/ThemeContext';
import NavBar from '../components/NavBar';
import '../i18n';

const Register = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const { t } = useTranslation();
  const { themeMode } = useThemeContext();

  const isDarkMode = themeMode === 'dark';

  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordRepeat: '',
    biometricConsent: false,
  });

  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scroll, setScroll] = useState('paper');
  const [showAlert, setShowAlert] = useState(false);
  const [serverError, setServerError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const apiBase =
    window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';

  const allFieldsFilled = useMemo(() => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password !== '' &&
      formData.passwordRepeat !== ''
    );
  }, [formData]);

  const handleDialogOpen = () => {
    setScroll('paper');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleAgree = () => {
    setConsent(true);
    setShowAlert(false);
    setServerError('');
    setDialogOpen(false);
  };

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

    setShowAlert(false);
    setServerError('');
    setSuccess(false);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('error-name');
    }

    if (!formData.email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = t('error-email');
    }

    if (formData.password.length < 6) {
      newErrors.password = t('error-password');
    }

    if (formData.password !== formData.passwordRepeat) {
      newErrors.passwordRepeat = t('error-password-match');
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const validationErrors = validate();

    if (!consent) {
      setShowAlert(true);
    }

    if (!consent || Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setShowAlert(false);
    setServerError('');
    setSuccess(false);

    try {
      const res = await axios.post(
        `${apiBase}/register`,
        {
          ...formData,
          biometricConsent: consent,
        },
        {
          withCredentials: true,
        }
      );

      if (res.status === 200) {
        setSuccess(true);
        setShowAlert(true);
      }
    } catch (error) {
      const msg = error.response?.data?.message;

      if (msg) {
        const errMap = {};
        const lowerMsg = msg.toLowerCase();

        if (lowerMsg.includes('nick')) {
          errMap.name = msg;
        } else if (lowerMsg.includes('email')) {
          errMap.email = msg;
        } else if (lowerMsg.includes('password')) {
          if (lowerMsg.includes('match')) {
            errMap.passwordRepeat = msg;
          } else {
            errMap.password = msg;
          }
        } else if (lowerMsg.includes('biometric')) {
          setShowAlert(true);
        } else {
          setServerError(msg);
        }

        setErrors(errMap);
      } else {
        console.error(error);
        setServerError(t('server-error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const descriptionElementRef = useRef(null);

  useEffect(() => {
    if (dialogOpen) {
      const { current: descriptionElement } = descriptionElementRef;

      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [dialogOpen]);

  const features = [
    {
      icon: <Code fontSize="small" />,
      label: t('registerPage.feature1'),
    },
    {
      icon: <CheckCircleOutline fontSize="small" />,
      label: t('registerPage.feature2'),
    },
    {
      icon: <Timeline fontSize="small" />,
      label: t('registerPage.feature3'),
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
                {t('registerPage.badge')}
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
                {t('registerPage.title')}
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
                {t('registerPage.subtitle')}
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
                maxWidth: 480,
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
                    {t('register')}
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
                    {t('registerPage.formSubtitle')}
                  </Typography>
                </Box>

                <Divider
                  sx={{
                    mb: 3,
                    borderColor: isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb',
                  }}
                />

                {showAlert && (
                  <Alert
                    severity={success ? 'success' : 'error'}
                    onClose={() => setShowAlert(false)}
                    sx={{ mb: 2, borderRadius: 2 }}
                  >
                    {success ? t('registered') : t('biometric-consent-required')}
                  </Alert>
                )}

                {serverError && (
                  <Alert
                    severity="error"
                    onClose={() => setServerError('')}
                    sx={{ mb: 2, borderRadius: 2 }}
                  >
                    {serverError}
                  </Alert>
                )}

                <Stack spacing={2}>
                  <TextField
                    label={t('name')}
                    name="name"
                    fullWidth
                    value={formData.name}
                    onChange={handleChange}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutline fontSize="small" />
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
                    label={t('email')}
                    name="email"
                    fullWidth
                    value={formData.email}
                    onChange={handleChange}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    disabled={isSubmitting}
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
                    label={t('password')}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    value={formData.password}
                    onChange={handleChange}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                    disabled={isSubmitting}
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
                            disabled={isSubmitting}
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

                  <TextField
                    label={t('password-repeat')}
                    name="passwordRepeat"
                    type={showRepeatPassword ? 'text' : 'password'}
                    fullWidth
                    value={formData.passwordRepeat}
                    onChange={handleChange}
                    error={Boolean(errors.passwordRepeat)}
                    helperText={errors.passwordRepeat}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowRepeatPassword((prev) => !prev)
                            }
                            edge="end"
                            disabled={isSubmitting}
                          >
                            {showRepeatPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
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
                </Stack>

                <Button
                  variant={consent ? 'contained' : 'outlined'}
                  onClick={handleDialogOpen}
                  fullWidth
                  disabled={isSubmitting}
                  sx={{
                    mt: 2.5,
                    py: 1.15,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  {t('show-biometric-terms')} {consent ? '✓' : ''}
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={!consent || !allFieldsFilled || isSubmitting}
                  sx={{
                    mt: 2,
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
                    mt: 2.5,
                    pt: 2.5,
                    borderTop: `1px solid ${
                      isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb'
                    }`,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t('have-account')}{' '}
                    <Button
                      variant="text"
                      onClick={() => navigate('/login')}
                      size="small"
                      disabled={isSubmitting}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        p: 0,
                        minWidth: 'auto',
                      }}
                    >
                      {t('login-here')}
                    </Button>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
            border: `1px solid ${
              isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'
            }`,
          },
        }}
      >
        <DialogTitle id="scroll-dialog-title" sx={{ px: 4, pt: 4, pb: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 750,
              letterSpacing: '-0.035em',
              mb: 0.75,
            }}
          >
            {t('biometric-consent-title')}
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
            {t('registerPage.consentSubtitle')}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 4, pt: 2, pb: 1 }} dividers={scroll === 'paper'}>
          <DialogContentText
            id="scroll-dialog-description"
            ref={descriptionElementRef}
            tabIndex={-1}
            sx={{
              whiteSpace: 'pre-line',
              color: isDarkMode
                ? 'rgba(255,255,255,0.72)'
                : 'text.secondary',
              lineHeight: 1.8,
            }}
          >
            {t('biometric-consent-text')}
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 4, pt: 2, pb: 4, gap: 1 }}>
          <Button
            onClick={handleDialogClose}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {t('cancel')}
          </Button>

          <Button
            onClick={handleAgree}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
            }}
          >
            {t('agree')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Register;