import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar';

const AdminUserEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.pathname.split('/')[3];
  const isEditMode = userId && userId !== 'add';

  const [user, setUser] = useState({
    user_email: '',
    user_name: '',
    user_isAdmin: 0,
    user_isValid: 1,
    user_consent: 0,
  });

  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditMode);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      axios
        .get(`http://localhost:1234/admin/user/${userId}`, {
          withCredentials: true,
        })
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching user:', err);
          setLoading(false);
        });
    }
  }, [userId, isEditMode]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleCheckboxChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.checked ? 1 : 0 });
  };

  const validate = () => {
    const newErrors = {};

    if (!user.user_email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.user_email = t('error-email');
    }

    if (!user.user_name.trim()) {
      newErrors.user_name = t('error-name');
    }

    if (newPassword && newPassword.length < 6) {
      newErrors.newPassword = t('error-password-length');
    }

    return newErrors;
  };

  const handleSave = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const userData = { ...user };
    if (newPassword.trim()) {
      userData.user_password = newPassword;
    }

    const request = isEditMode
      ? axios.put(`http://localhost:1234/admin/user/${userId}`, userData, { withCredentials: true })
      : axios.post(`http://localhost:1234/admin/users`, userData, { withCredentials: true });

    request
      .then(() => {
        setSnackbarOpen(true);
        setTimeout(() => navigate('/admin/users'), 1500);
      })
      .catch((err) => {
        console.error('Error saving user:', err);
      });
  };

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <Box sx={{ ml: { xs: '72px', md: '240px' }, p: 3 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <AdminSidebar />
      <Box
        sx={{
          ml: { xs: '72px', md: '240px' },
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper elevation={3} sx={{ p: 3, maxWidth: 600, width: '100%' }}>
          <Typography variant="h4" gutterBottom align="center">
            {isEditMode ? t('admin.users.editTitle') : t('admin.users.addTitle')}
          </Typography>

          {isEditMode && (
            <TextField
              fullWidth
              label="ID"
              name="user_id"
              value={user.user_id}
              disabled
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            label={t('admin.users.email')}
            name="user_email"
            value={user.user_email}
            onChange={handleChange}
            error={Boolean(errors.user_email)}
            helperText={errors.user_email}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label={t('admin.users.name')}
            name="user_name"
            value={user.user_name}
            onChange={handleChange}
            error={Boolean(errors.user_name)}
            helperText={errors.user_name}
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          <FormControlLabel
            control={
              <Checkbox
                checked={user.user_isAdmin === 1}
                onChange={handleCheckboxChange}
                name="user_isAdmin"
              />
            }
            label={t('admin.users.isAdmin')}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={user.user_isValid === 1}
                onChange={handleCheckboxChange}
                name="user_isValid"
              />
            }
            label={t('admin.users.isValid')}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={user.user_consent === 1}
                onChange={handleCheckboxChange}
                name="user_consent"
              />
            }
            label={t('admin.users.consent')}
          />

          <Divider sx={{ my: 2 }} />

          <TextField
            fullWidth
            type="password"
            label={t('admin.users.newPassword')}
            name="newPassword"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setErrors((prev) => ({ ...prev, newPassword: '' }));
            }}
            error={Boolean(errors.newPassword)}
            helperText={errors.newPassword || t('admin.users.leaveBlankToKeep')}
            sx={{ mb: 2 }}
          />

          {isEditMode && (
            <>
              <TextField
                fullWidth
                label={t('admin.users.registrationDate')}
                name="user_registration_date"
                value={new Date(user.user_registration_date).toLocaleString()}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={t('admin.users.consentChangeDate')}
                name="user_consent_change_date"
                value={new Date(user.user_consent_change_date).toLocaleString()}
                disabled
                sx={{ mb: 2 }}
              />
            </>
          )}

          <Box mt={2} display="flex" justifyContent="center">
            <Button variant="contained" color="primary" onClick={handleSave}>
              {t('save')}
            </Button>
            <Button sx={{ ml: 2 }} onClick={() => navigate('/admin/users')}>
              {t('cancel')}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {isEditMode ? t('admin.users.updateSuccess') : t('admin.users.createSuccess')}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminUserEdit;
