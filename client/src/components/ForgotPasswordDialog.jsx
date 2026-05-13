import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Stack,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  MailOutline,
  KeyOutlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const initialFormData = {
  email: '',
  code: '',
  password: '',
  passwordConfirm: '',
};

const ForgotPasswordDialog = ({ open, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [phase, setPhase] = useState('email');
  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const apiBase =
    window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';

  const resetDialogState = () => {
    setPhase('email');
    setFormData(initialFormData);
    setErrors({});
    setServerError('');
    setSuccessMsg('');
    setLoading(false);
    setShowPassword(false);
    setShowPasswordConfirm(false);
  };

  const handleClose = () => {
    if (loading) return;

    resetDialogState();
    onClose();
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

    setServerError('');
    setSuccessMsg('');
  };

  const validateEmail = () => {
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) {
      return { email: t('error-email') };
    }

    return {};
  };

  const validateReset = () => {
    const errs = {};

    if (!formData.code.trim()) {
      errs.code = t('validation.required');
    }

    if (!formData.password) {
      errs.password = t('validation.required');
    }

    if (formData.password !== formData.passwordConfirm) {
      errs.passwordConfirm = t('error-password-match');
    }

    return errs;
  };

  const handleSendEmail = async () => {
    const emailErrors = validateEmail();

    if (Object.keys(emailErrors).length > 0) {
      setErrors(emailErrors);
      return;
    }

    setLoading(true);
    setServerError('');
    setSuccessMsg('');

    try {
      await axios.post(
        `${apiBase}/reset-password/request`,
        { email: formData.email },
        { withCredentials: true }
      );

      setPhase('reset');
      setSuccessMsg(t('forgot-password.email-sent'));
    } catch (error) {
      const msg = error.response?.data?.message || t('server-error');
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const resetErrors = validateReset();

    if (Object.keys(resetErrors).length > 0) {
      setErrors(resetErrors);
      return;
    }

    setLoading(true);
    setServerError('');
    setSuccessMsg('');

    try {
      await axios.post(
        `${apiBase}/reset-password/reset`,
        {
          email: formData.email,
          resetCode: formData.code,
          newPassword: formData.password,
          confirmPassword: formData.passwordConfirm,
        },
        { withCredentials: true }
      );

      setSuccessMsg(t('forgot-password.password-changed'));

      setTimeout(() => {
        resetDialogState();
        onClose();
      }, 1600);
    } catch (error) {
      const msg = error.response?.data?.message || t('server-error');
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (phase === 'email') {
      handleSendEmail();
      return;
    }

    handleResetPassword();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
          border: `1px solid ${
            isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'
          }`,
          boxShadow: isDarkMode
            ? '0 20px 60px rgba(0,0,0,0.35)'
            : '0 20px 60px rgba(15,23,42,0.14)',
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ px: 4, pt: 4, pb: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 750,
              letterSpacing: '-0.035em',
              mb: 0.75,
            }}
          >
            {t('forgot-password.title')}
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
            {phase === 'email'
              ? t('forgot-password.request-description')
              : t('forgot-password.reset-description')}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 4, pt: 2, pb: 1 }}>
          <Divider
            sx={{
              mb: 3,
              borderColor: isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb',
            }}
          />

          {serverError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {serverError}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {successMsg}
            </Alert>
          )}

          <Stack spacing={2}>
            {phase === 'email' && (
              <TextField
                label={t('email')}
                name="email"
                fullWidth
                value={formData.email}
                onChange={handleChange}
                error={Boolean(errors.email)}
                helperText={errors.email}
                disabled={loading}
                autoFocus
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
            )}

            {phase === 'reset' && (
              <>
                <TextField
                  label={t('forgot-password.code')}
                  name="code"
                  fullWidth
                  value={formData.code}
                  onChange={handleChange}
                  error={Boolean(errors.code)}
                  helperText={errors.code}
                  disabled={loading}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyOutlined fontSize="small" />
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
                  label={t('forgot-password.new-password')}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={formData.password}
                  onChange={handleChange}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  disabled={loading}
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
                          disabled={loading}
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
                  label={t('forgot-password.confirm-password')}
                  name="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  fullWidth
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  error={Boolean(errors.passwordConfirm)}
                  helperText={errors.passwordConfirm}
                  disabled={loading}
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
                            setShowPasswordConfirm((prev) => !prev)
                          }
                          edge="end"
                          disabled={loading}
                        >
                          {showPasswordConfirm ? (
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
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 4,
            pt: 2,
            pb: 4,
            gap: 1,
          }}
        >
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {t('cancel')}
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              minWidth: 130,
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : phase === 'email' ? (
              t('forgot-password.send-code')
            ) : (
              t('forgot-password.reset-password')
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ForgotPasswordDialog;