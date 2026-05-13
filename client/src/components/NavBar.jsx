import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Tooltip,
  Avatar,
  Button,
  Stack,
  Divider,
  ListItemIcon,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Brightness4,
  Brightness7,
  Translate,
  Logout,
  PersonOutline,
  AdminPanelSettingsOutlined,
  CodeOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { useThemeContext } from '../context/ThemeContext';

const NavBar = ({ publicPage = false }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const { t, i18n } = useTranslation();
  const { user, setUser } = useUser();
  const { themeMode, toggleTheme } = useThemeContext();

  const isDarkMode = themeMode === 'dark';

  const [langAnchor, setLangAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);

  const apiBase =
    window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';

  const openLangMenu = (event) => setLangAnchor(event.currentTarget);
  const closeLangMenu = () => setLangAnchor(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    closeLangMenu();
  };

  const openUserMenu = (event) => setUserAnchor(event.currentTarget);
  const closeUserMenu = () => setUserAnchor(null);

  const handleLogout = async () => {
    try {
      const response = await axios.delete(`${apiBase}/auth`, {
        withCredentials: true,
      });

      if (response.data.logout === true) {
        setUser(null);
        closeUserMenu();
        navigate('/login');
      }
    } catch (error) {
      console.error(error);
      alert(t('server-error'));
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const menuPaperProps = {
    elevation: 0,
    sx: {
      mt: 1.5,
      minWidth: 190,
      borderRadius: 2,
      border: `1px solid ${
        isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'
      }`,
      backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
      boxShadow: isDarkMode
        ? '0 18px 50px rgba(0,0,0,0.35)'
        : '0 18px 50px rgba(15,23,42,0.12)',
      '& .MuiMenuItem-root': {
        fontSize: '0.92rem',
        py: 1.1,
        px: 1.5,
      },
    },
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: isDarkMode
          ? alpha('#0f1117', 0.88)
          : alpha('#ffffff', 0.86),
        color: isDarkMode ? '#ffffff' : '#111827',
        borderBottom: `1px solid ${
          isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb'
        }`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            minHeight: '68px !important',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center">
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to={publicPage ? '/login' : '/'}
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                fontWeight: 800,
                letterSpacing: '-0.035em',
              }}
            >
              Kodometria
            </Typography>

            {!publicPage && (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                }}
              >
                <Button
                  component={Link}
                  to="/problems"
                  color="inherit"
                  startIcon={<CodeOutlined />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 650,
                    borderRadius: 2,
                    px: 1.5,
                    color: isDarkMode
                      ? 'rgba(255,255,255,0.78)'
                      : 'rgba(17,24,39,0.78)',
                    '&:hover': {
                      backgroundColor: isDarkMode
                        ? alpha('#ffffff', 0.07)
                        : alpha('#111827', 0.05),
                    },
                  }}
                >
                  {t('problems')}
                </Button>

                {user?.isAdmin === 1 && (
                  <Button
                    component={Link}
                    to="/admin"
                    color="inherit"
                    startIcon={<AdminPanelSettingsOutlined />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 650,
                      borderRadius: 2,
                      px: 1.5,
                      color: isDarkMode
                        ? 'rgba(255,255,255,0.78)'
                        : 'rgba(17,24,39,0.78)',
                      '&:hover': {
                        backgroundColor: isDarkMode
                          ? alpha('#ffffff', 0.07)
                          : alpha('#111827', 0.05),
                      },
                    }}
                  >
                    {t('admin')}
                  </Button>
                )}
              </Stack>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={t('language')}>
              <IconButton
                onClick={openLangMenu}
                size="small"
                sx={{
                  color: 'inherit',
                  border: `1px solid ${
                    isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'
                  }`,
                  backgroundColor: isDarkMode
                    ? alpha('#ffffff', 0.04)
                    : alpha('#ffffff', 0.7),
                }}
              >
                <Translate fontSize="small" />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={langAnchor}
              open={Boolean(langAnchor)}
              onClose={closeLangMenu}
              PaperProps={menuPaperProps}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                selected={i18n.language?.startsWith('en')}
                onClick={() => changeLanguage('en')}
              >
                English
              </MenuItem>
              <MenuItem
                selected={i18n.language?.startsWith('sk')}
                onClick={() => changeLanguage('sk')}
              >
                Slovensky
              </MenuItem>
            </Menu>

            <Tooltip title={t('toggle_theme')}>
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{
                  color: 'inherit',
                  border: `1px solid ${
                    isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'
                  }`,
                  backgroundColor: isDarkMode
                    ? alpha('#ffffff', 0.04)
                    : alpha('#ffffff', 0.7),
                }}
              >
                {themeMode === 'dark' ? (
                  <Brightness7 fontSize="small" />
                ) : (
                  <Brightness4 fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            {publicPage ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  component={Link}
                  to="/login"
                  color="inherit"
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    textTransform: 'none',
                    fontWeight: 650,
                    borderRadius: 2,
                  }}
                >
                  {t('login')}
                </Button>

                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                  }}
                >
                  {t('register')}
                </Button>
              </Stack>
            ) : (
              <>
                <Tooltip title={t('open_settings')}>
                  <IconButton onClick={openUserMenu} sx={{ p: 0.25 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        backgroundColor: theme.palette.primary.main,
                      }}
                    >
                      {userInitial}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={userAnchor}
                  open={Boolean(userAnchor)}
                  onClose={closeUserMenu}
                  PaperProps={menuPaperProps}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <Box sx={{ px: 1.5, py: 1.2 }}>
                    <Typography sx={{ fontWeight: 750, lineHeight: 1.3 }}>
                      {user?.name || 'User'}
                    </Typography>

                    {user?.email && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: isDarkMode
                            ? 'rgba(255,255,255,0.55)'
                            : 'text.secondary',
                        }}
                      >
                        {user.email}
                      </Typography>
                    )}
                  </Box>

                  <Divider
                    sx={{
                      borderColor: isDarkMode
                        ? alpha('#ffffff', 0.08)
                        : '#e5e7eb',
                    }}
                  />

                  <MenuItem component={Link} to="/profile" onClick={closeUserMenu}>
                    <ListItemIcon>
                      <PersonOutline fontSize="small" />
                    </ListItemIcon>
                    {t('profile')}
                  </MenuItem>

                  <MenuItem component={Link} to="/problems" onClick={closeUserMenu}>
                    <ListItemIcon>
                      <CodeOutlined fontSize="small" />
                    </ListItemIcon>
                    {t('problems')}
                  </MenuItem>

                  {user?.isAdmin === 1 && (
                    <MenuItem component={Link} to="/admin" onClick={closeUserMenu}>
                      <ListItemIcon>
                        <AdminPanelSettingsOutlined fontSize="small" />
                      </ListItemIcon>
                      {t('admin')}
                    </MenuItem>
                  )}

                  <Divider
                    sx={{
                      my: 0.5,
                      borderColor: isDarkMode
                        ? alpha('#ffffff', 0.08)
                        : '#e5e7eb',
                    }}
                  />

                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    {t('logout')}
                  </MenuItem>
                </Menu>
              </>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default NavBar;