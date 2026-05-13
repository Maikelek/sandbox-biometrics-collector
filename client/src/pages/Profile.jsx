import React from 'react';
import {
  Box,
  Card,
  Typography,
  Divider,
  Avatar,
  Chip,
  Stack,
  useTheme,
  Container,
  Paper,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
  Verified,
  Cancel,
  Email,
  AdminPanelSettings,
  PersonOutline,
} from '@mui/icons-material';

import NavBar from '../components/NavBar';
import { useUser } from '../context/UserContext';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const theme = useTheme();

  const isDarkMode = theme.palette.mode === 'dark';

  const normalizedUser = {
    name: user?.name || user?.user_name || 'User',
    email: user?.email || user?.user_email || '',
    isAdmin: Number(user?.isAdmin ?? user?.user_isAdmin ?? 0),
    consent: Number(user?.consent ?? user?.user_consent ?? 0),
    isValid: Number(user?.isValid ?? user?.user_isValid ?? 0),
  };

  const cardSx = {
    borderRadius: 3,
    backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
    border: `1px solid ${isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'}`,
    boxShadow: isDarkMode
      ? '0 24px 70px rgba(0,0,0,0.32)'
      : '0 24px 70px rgba(15,23,42,0.12)',
  };

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: isDarkMode ? '#0f1117' : '#f6f7fb',
        }}
      >
        <NavBar />

        <Container
          maxWidth="sm"
          sx={{
            minHeight: 'calc(100vh - 68px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              ...cardSx,
            }}
          >
            <Typography variant="h5" color="error" sx={{ fontWeight: 700 }}>
              {t('user-not-found')}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDarkMode
          ? `
            radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.18)} 0, transparent 32%),
            radial-gradient(circle at 80% 30%, ${alpha(theme.palette.primary.main, 0.1)} 0, transparent 28%),
            #0f1117
          `
          : `
            radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.14)} 0, transparent 32%),
            radial-gradient(circle at 80% 30%, ${alpha(theme.palette.primary.main, 0.08)} 0, transparent 28%),
            #f6f7fb
          `,
      }}
    >
      <NavBar />

      <Container
        component="main"
        maxWidth="md"
        sx={{
          minHeight: 'calc(100vh - 68px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 4, md: 8 },
        }}
      >
        <Card
          elevation={0}
          sx={{
            ...cardSx,
            width: '100%',
            p: { xs: 3, md: 5 },
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 4, md: 6 }}
            alignItems={{ xs: 'center', md: 'flex-start' }}
          >
            <Avatar
              sx={{
                width: 132,
                height: 132,
                fontSize: 48,
                fontWeight: 800,
                bgcolor: theme.palette.primary.main,
                boxShadow: `0 0 0 6px ${
                  isDarkMode ? '#171a22' : '#ffffff'
                }, 0 0 0 8px ${alpha(theme.palette.primary.main, 0.25)}`,
              }}
            >
              {normalizedUser.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>

            <Box flex={1} textAlign={{ xs: 'center', md: 'left' }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.045em',
                  mb: 1,
                  color: isDarkMode ? '#ffffff' : '#111827',
                }}
              >
                {normalizedUser.name}
              </Typography>

              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{
                  mb: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  gap: 1,
                }}
              >
                <Email sx={{ fontSize: 18 }} />
                {normalizedUser.email}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                justifyContent={{ xs: 'center', md: 'flex-start' }}
                sx={{ mb: 3 }}
              >
                <Chip
                  icon={<AdminPanelSettings fontSize="small" />}
                  label={normalizedUser.isAdmin === 1 ? t('admin') : t('user')}
                  color={normalizedUser.isAdmin === 1 ? 'info' : 'default'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />

                <Chip
                  icon={normalizedUser.consent === 1 ? <Verified /> : <Cancel />}
                  label={`${t('biometric-consent')}: ${
                    normalizedUser.consent === 1 ? t('yes') : t('no')
                  }`}
                  color={normalizedUser.consent === 1 ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />

                <Chip
                  label={`${t('account-status')}: ${
                    normalizedUser.isValid === 1 ? t('valid') : t('invalid')
                  }`}
                  color={normalizedUser.isValid === 1 ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('role')}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {normalizedUser.isAdmin === 1 ? t('admin') : t('user')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('biometric-consent')}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {normalizedUser.consent === 1 ? t('yes') : t('no')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('account-status')}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {normalizedUser.isValid === 1 ? t('valid') : t('invalid')}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
};

export default Profile;