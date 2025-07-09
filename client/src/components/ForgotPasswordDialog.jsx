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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const ForgotPasswordDialog = ({ open, onClose }) => {
  const { t } = useTranslation();

  const [phase, setPhase] = useState('email');

  const [formData, setFormData] = useState({
    email: '',
    code: '',
    password: '',
    passwordConfirm: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
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
    if (!formData.code.trim()) errs.code = t('validation.required');
    if (!formData.password) errs.password = t('validation.required');
    if (formData.password !== formData.passwordConfirm) errs.passwordConfirm = t('error-password-match');
    return errs;
  };

  const handleSendEmail = async () => {
    const emailErrors = validateEmail();
    if (Object.keys(emailErrors).length > 0) {
      setErrors(emailErrors);
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        'http://localhost:1234/reset-password/request',
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
    try {
      await axios.post(
        'http://localhost:1234/reset-password/reset',
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
        onClose();
        setPhase('email');
        setFormData({
          email: '',
          code: '',
          password: '',
          passwordConfirm: '',
        });
        setErrors({});
        setServerError('');
        setSuccessMsg('');
      }, 2000);
    } catch (error) {
      const msg = error.response?.data?.message || t('server-error');
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('forgot-password.title')}</DialogTitle>
      <DialogContent dividers>
        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        {phase === 'email' && (
          <TextField
            label={t('email')}
            name="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={handleChange}
            error={Boolean(errors.email)}
            helperText={errors.email}
            disabled={loading}
            autoFocus
          />
        )}

        {phase === 'reset' && (
          <>
            <TextField
              label={t('forgot-password.code')}
              name="code"
              fullWidth
              margin="normal"
              value={formData.code}
              onChange={handleChange}
              error={Boolean(errors.code)}
              helperText={errors.code}
              disabled={loading}
              autoFocus
            />
            <TextField
              label={t('forgot-password.new-password')}
              name="password"
              type="password"
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={handleChange}
              error={Boolean(errors.password)}
              helperText={errors.password}
              disabled={loading}
            />
            <TextField
              label={t('forgot-password.confirm-password')}
              name="passwordConfirm"
              type="password"
              fullWidth
              margin="normal"
              value={formData.passwordConfirm}
              onChange={handleChange}
              error={Boolean(errors.passwordConfirm)}
              helperText={errors.passwordConfirm}
              disabled={loading}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t('cancel')}</Button>

        {phase === 'email' && (
          <Button
            variant="contained"
            onClick={handleSendEmail}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : t('forgot-password.send-code')}
          </Button>
        )}

        {phase === 'reset' && (
          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : t('forgot-password.reset-password')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
