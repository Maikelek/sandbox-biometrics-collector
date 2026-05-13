import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import AdminSidebar from '../../components/AdminSidebar';

const defaultUser = {
  user_email: '',
  user_name: '',
  user_isAdmin: 0,
  user_isValid: 1,
  user_consent: 0,
  user_id: null,
  user_registration_date: null,
  user_consent_change_date: null,
};

const AdminUserEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  const userId = location.pathname.split('/')[3];
  const isEditMode = userId && userId !== 'add';

  const [user, setUser] = useState({
    ...defaultUser,
    user_id: isEditMode ? userId : null,
  });

  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(Boolean(isEditMode));
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState('');

  const apiBase = useMemo(() => {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';
  }, []);

  const cardSx = {
    borderRadius: 2.5,
    backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
    border: `1px solid ${isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'}`,
    boxShadow: 'none',
  };

  useEffect(() => {
    if (!isEditMode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    axios
      .get(`${apiBase}/admin/user/${userId}`, {
        withCredentials: true,
      })
      .then((res) => {
        setUser({
          ...defaultUser,
          ...res.data,
        });
      })
      .catch((err) => {
        console.error('Error fetching user:', err);
        setError(
          t('admin.users.loadError', {
            defaultValue: 'Nepodarilo sa načítať používateľa.',
          })
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiBase, userId, isEditMode, t]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));

    setError('');
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;

    setUser((prev) => ({
      ...prev,
      [name]: checked ? 1 : 0,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!String(user.user_email || '').match(/^\S+@\S+\.\S+$/)) {
      newErrors.user_email = t('error-email');
    }

    if (!String(user.user_name || '').trim()) {
      newErrors.user_name = t('error-name');
    }

    if (!isEditMode && !newPassword.trim()) {
      newErrors.newPassword = t('validation.required');
    }

    if (newPassword && newPassword.length < 6) {
      newErrors.newPassword = t('error-password-length');
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    setSaving(true);
    setError('');

    const userData = { ...user };

    if (newPassword.trim()) {
      userData.user_password = newPassword;
    }

    const request = isEditMode
      ? axios.put(`${apiBase}/admin/user/${userId}`, userData, {
          withCredentials: true,
        })
      : axios.post(`${apiBase}/admin/users`, userData, {
          withCredentials: true,
        });

    request
      .then(() => {
        setSnackbarOpen(true);
        setTimeout(() => navigate('/admin/users'), 1200);
      })
      .catch((err) => {
        console.error('Error saving user:', err);
        setError(
          isEditMode
            ? t('admin.users.updateError', {
                defaultValue: 'Nepodarilo sa upraviť používateľa.',
              })
            : t('admin.users.createError', {
                defaultValue: 'Nepodarilo sa vytvoriť používateľa.',
              })
        );
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const formatDate = (value) => {
    if (!value) return t('n/a');

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <>
        <AdminSidebar />

        <Box
          sx={{
            ml: { xs: 0, md: '240px' },
            minHeight: '100vh',
            backgroundColor: isDarkMode ? '#0f1117' : '#f6f7fb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pt: isMobile ? '76px' : 4,
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <AdminSidebar />

      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: '240px' },
          minHeight: '100vh',
          backgroundColor: isDarkMode ? '#0f1117' : '#f6f7fb',
          px: { xs: 2, sm: 3, md: 4 },
          py: 3,
          pt: isMobile ? '76px' : 4,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 720, mx: 'auto' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 750,
                  letterSpacing: '-0.035em',
                  color: isDarkMode ? '#fff' : '#111827',
                  textAlign: { xs: 'center', sm: 'left' },
                }}
              >
                {isEditMode ? t('admin.users.editTitle') : t('admin.users.addTitle')}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, textAlign: { xs: 'center', sm: 'left' } }}
              >
                {isEditMode
                  ? t('admin.users.editSubtitle', {
                      defaultValue: 'Úprava údajov používateľa, práv a stavu účtu.',
                    })
                  : t('admin.users.addSubtitle', {
                      defaultValue: 'Vytvorenie nového používateľa v systéme.',
                    })}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              justifyContent={{ xs: 'center', sm: 'flex-end' }}
            >
              <Button
                variant="outlined"
                onClick={() => navigate('/admin/users')}
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 650,
                }}
              >
                {t('cancel')}
              </Button>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 650,
                  minWidth: 120,
                }}
              >
                {saving
                  ? t('saving', { defaultValue: 'Ukladám...' })
                  : t('save')}
              </Button>
            </Stack>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 750, mb: 0.5 }}>
                {t('admin.users.basicInfo', {
                  defaultValue: 'Základné údaje',
                })}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                {isEditMode && (
                  <TextField
                    fullWidth
                    label="ID"
                    name="user_id"
                    value={user.user_id || ''}
                    disabled
                  />
                )}

                <TextField
                  fullWidth
                  label={t('admin.users.email')}
                  name="user_email"
                  value={user.user_email || ''}
                  onChange={handleChange}
                  error={Boolean(errors.user_email)}
                  helperText={errors.user_email}
                />

                <TextField
                  fullWidth
                  label={t('admin.users.name')}
                  name="user_name"
                  value={user.user_name || ''}
                  onChange={handleChange}
                  error={Boolean(errors.user_name)}
                  helperText={errors.user_name}
                />
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 750, mb: 0.5 }}>
                {t('admin.users.permissions', {
                  defaultValue: 'Práva a stav účtu',
                })}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Number(user.user_isAdmin) === 1}
                      onChange={handleCheckboxChange}
                      name="user_isAdmin"
                    />
                  }
                  label={t('admin.users.isAdmin')}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Number(user.user_isValid) === 1}
                      onChange={handleCheckboxChange}
                      name="user_isValid"
                    />
                  }
                  label={t('admin.users.isValid')}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Number(user.user_consent) === 1}
                      onChange={handleCheckboxChange}
                      name="user_consent"
                    />
                  }
                  label={t('admin.users.consent')}
                />
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 750, mb: 0.5 }}>
                {t('admin.users.password', {
                  defaultValue: 'Heslo',
                })}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                type="password"
                label={t('admin.users.newPassword')}
                name="newPassword"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    newPassword: '',
                  }));
                  setError('');
                }}
                error={Boolean(errors.newPassword)}
                helperText={
                  errors.newPassword ||
                  (isEditMode
                    ? t('admin.users.leaveBlankToKeep')
                    : t('admin.users.passwordRequired', {
                        defaultValue: 'Pri vytvorení používateľa zadaj heslo.',
                      }))
                }
              />
            </Paper>

            {isEditMode && (
              <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 750, mb: 0.5 }}>
                  {t('admin.users.systemInfo', {
                    defaultValue: 'Systémové údaje',
                  })}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label={t('admin.users.registrationDate')}
                    name="user_registration_date"
                    value={formatDate(user.user_registration_date)}
                    disabled
                  />

                  <TextField
                    fullWidth
                    label={t('admin.users.consentChangeDate')}
                    name="user_consent_change_date"
                    value={formatDate(user.user_consent_change_date)}
                    disabled
                  />
                </Stack>
              </Paper>
            )}

            <Paper
              elevation={0}
              sx={{
                ...cardSx,
                p: 2,
                position: { md: 'sticky' },
                bottom: { md: 16 },
                zIndex: 2,
                backgroundColor: isDarkMode
                  ? alpha('#171a22', 0.94)
                  : alpha('#ffffff', 0.94),
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="flex-end"
              >
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/admin/users')}
                  disabled={saving}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 650,
                  }}
                >
                  {t('cancel')}
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 650,
                    minWidth: 140,
                  }}
                >
                  {saving
                    ? t('saving', { defaultValue: 'Ukladám...' })
                    : t('save')}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {isEditMode
            ? t('admin.users.updateSuccess')
            : t('admin.users.createSuccess')}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminUserEdit;