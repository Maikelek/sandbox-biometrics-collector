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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Verified, Cancel, Email, AdminPanelSettings } from '@mui/icons-material';
import NavBar from '../components/NavBar';
import { useUser } from "../context/UserContext";

const Profile = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const theme = useTheme();

    if (!user) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
                <Typography variant="h5" color="error">{t('user-not-found')}</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                backgroundColor: 'background.default',
            }}
        >
            <NavBar />
            
            <Container 
                component="main" 
                maxWidth="md"
                sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    py: { xs: 4, md: 8 }
                }}
            >
                <Card
                    sx={{
                        width: '100%',
                        borderRadius: 3,
                        boxShadow: theme.shadows[10],
                        p: { xs: 3, md: 6 },
                        bgcolor: 'background.paper',
                        
                        ...(theme.palette.mode === 'dark' && {
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                        }),
                    }}
                >
                    <Stack 
                        direction={{ xs: 'column', md: 'row' }} 
                        spacing={{ xs: 4, md: 8 }}
                        alignItems={{ xs: 'center', md: 'flex-start' }}
                    >

                        <Avatar 
                            sx={{ 
                                width: 140, 
                                height: 140, 
                                fontSize: 48,
                                bgcolor: theme.palette.primary.main, 
                                boxShadow: `0 0 0 4px ${theme.palette.background.default}, 0 0 0 6px ${theme.palette.primary.light}50`, 
                                mb: { xs: 1, md: 0 }
                            }}
                        >
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>

                        <Box flex={1} textAlign={{ xs: 'center', md: 'left' }}>
                            <Typography variant="h3" fontWeight={700} gutterBottom>
                                {user?.name}
                            </Typography>
                            
                            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1.5 }}>
                                <Email sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} /> {user?.email}
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 3 }}>
                                {t('role')}: 
                                <Chip 
                                    label={user.isAdmin === 1 ? t('admin') : t('user')} 
                                    icon={<AdminPanelSettings fontSize="small" />}
                                    color={user.isAdmin === 1 ? 'info' : 'default'} 
                                    size="small"
                                    sx={{ ml: 1, fontWeight: 600 }}
                                />
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Stack spacing={1.5}>
                                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                    {t('biometric-consent')}: 
                                    <Chip 
                                        icon={user.consent ? <Verified /> : <Cancel />} 
                                        label={user.consent ? t('yes') : t('no')} 
                                        color={user.consent ? 'success' : 'error'} 
                                        variant="outlined" 
                                        size="small"
                                        sx={{ ml: 1, fontWeight: 500 }}
                                    />
                                </Typography>

                                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                    {t('account-status')}: 
                                    <Chip 
                                        label={user.isValid ? t('valid') : t('invalid')} 
                                        color={user.isValid ? 'success' : 'error'} 
                                        variant="filled" 
                                        size="small"
                                        sx={{ ml: 1, fontWeight: 500 }}
                                    />
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>
                </Card>
            </Container>
        </Box>
    );
};

export default Profile;