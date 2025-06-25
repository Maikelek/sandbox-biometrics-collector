import React from 'react';
import {
  Box,
  Card,
  Typography,
  Divider,
  Avatar,
  Chip,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Verified, Cancel } from '@mui/icons-material';
import NavBar from '../components/NavBar';
import { useUser } from "../context/UserContext";

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <NavBar />
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          px: 2,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 900,
            borderRadius: 5,
            boxShadow: 0,
            p: { xs: 2, md: 4 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: 'background.default',
            ...(theme.palette.mode === 'dark' && {
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }),
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
            <Avatar sx={{ width: 120, height: 120, fontSize: 40 }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>

            <Box flex={1} textAlign={isMobile ? 'center' : 'left'}>
              <Typography variant="h4" fontWeight={600}>{user?.name}</Typography>
              <Typography variant="subtitle1" color="text.secondary">{user?.email}</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {t('role')}: <Chip label={user.isAdmin === 1 ? t('admin') : t('user')} color={user.isAdmin === 1 ? 'primary' : 'default'} />
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1}>
                <Typography variant="body1">
                  {t('biometric-consent')}: <Chip icon={user.consent ? <Verified /> : <Cancel />} label={user.consent ? t('yes') : t('no')} color={user.consent ? 'success' : 'error'} variant="outlined" />
                </Typography>
                <Typography variant="body1">
                  {t('account-status')}: <Chip label={user.isValid ? t('valid') : t('invalid')} color={user.isValid ? 'success' : 'error'} variant="filled" />
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
};

export default Profile;