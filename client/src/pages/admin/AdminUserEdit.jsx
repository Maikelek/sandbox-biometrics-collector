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

  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    axios
      .get(`http://localhost:1234/admin/user/${userId}`)
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching user:', err);
        setLoading(false);
      });
  }, [userId]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.checked ? 1 : 0 });
  };

  const handleSave = () => {
    const updatedUser = { ...user };
    if (newPassword.trim() !== '') {
      updatedUser.user_password = newPassword;
    } else {
      delete updatedUser.user_password;
    }

    axios
      .put(`http://localhost:1234/admin/user/${userId}`, updatedUser)
      .then(() => {
        setSnackbarOpen(true);
        setTimeout(() => navigate('/admin/users'), 1500);
      })
      .catch((err) => {
        console.error('Error updating user:', err);
      });
  };

  if (loading || !user) {
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
            {t('admin.users.editTitle')}
          </Typography>

          <TextField
            fullWidth
            label="ID"
            name="user_id"
            value={user.user_id}
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('admin.users.email')}
            name="user_email"
            value={user.user_email}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('admin.users.name')}
            name="user_name"
            value={user.user_name}
            onChange={handleChange}
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
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('admin.users.leaveBlankToKeep')}
            sx={{ mb: 2 }}
          />

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
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {t('admin.users.updateSuccess')}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminUserEdit;
