import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Translate,
  Dashboard,
  Logout,
  People,
  Psychology,
  ManageAccounts,
  Menu as MenuIcon,
  ReportProblemOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useThemeContext } from '../context/ThemeContext';
import axios from 'axios';

const drawerWidth = 240;
const miniDrawerWidth = 72;

const AdminSidebar = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useUser();
  const { themeMode, toggleTheme } = useThemeContext();

  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isSmallScreen = useMediaQuery('(max-width:899px)');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [langAnchor, setLangAnchor] = useState(null);

  const apiBase =
    window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';

  const openLangMenu = (e) => setLangAnchor(e.currentTarget);
  const closeLangMenu = () => setLangAnchor(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    closeLangMenu();
  };

  const handleLogout = async () => {
    try {
      const res = await axios.delete(`${apiBase}/auth`, {
        withCredentials: true,
      });

      if (res.data.logout === true) {
        setUser(null);
        navigate('/login');
      }
    } catch (err) {
      console.log(err);
      alert(t('server-error'));
    }
  };

  const menuItems = [
    {
      icon: <Dashboard />,
      label: t('admin'),
      path: '/admin',
      exact: true,
    },
    {
      icon: <People />,
      label: t('users'),
      path: '/admin/users',
    },
    {
      icon: <Psychology />,
      label: t('problems'),
      path: '/admin/problems',
    },
    {
      icon: <ReportProblemOutlined />,
      label: t('admin.flaggedSubmissions', {
        defaultValue: 'Na kontrolu',
      }),
      path: '/admin/flagged',
    },
    {
      icon: <ManageAccounts />,
      label: t('profile'),
      path: '/profile',
    },
  ];

  const drawerOpen = isSmallScreen ? mobileOpen : true;
  const currentDrawerWidth = drawerOpen ? drawerWidth : miniDrawerWidth;

  const isActivePath = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }

    return location.pathname.startsWith(item.path);
  };

  const handleMenuItemClick = () => {
    if (isSmallScreen) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: drawerOpen ? 'space-between' : 'center',
          p: 2,
          minHeight: 72,
        }}
      >
        {drawerOpen ? (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              src="/logo.png"
              sx={{
                width: 38,
                height: 38,
                bgcolor: theme.palette.primary.main,
              }}
            />

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                Admin
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Kodometria
              </Typography>
            </Box>
          </Box>
        ) : (
          <Avatar
            src="/logo.png"
            sx={{
              width: 38,
              height: 38,
              bgcolor: theme.palette.primary.main,
            }}
          />
        )}

        {isSmallScreen && drawerOpen && (
          <IconButton onClick={() => setMobileOpen(false)}>
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 1.5 }}>
        {menuItems.map((item) => {
          const active = isActivePath(item);

          return (
            <Tooltip
              key={item.path}
              title={!drawerOpen ? item.label : ''}
              placement="right"
              arrow
            >
              <ListItem
                button
                component={Link}
                to={item.path}
                onClick={handleMenuItemClick}
                sx={{
                  borderRadius: '12px',
                  my: 0.5,
                  textDecoration: 'none',
                  color: active ? theme.palette.primary.main : 'inherit',
                  backgroundColor: active
                    ? alpha(theme.palette.primary.main, 0.12)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: active
                      ? alpha(theme.palette.primary.main, 0.16)
                      : alpha(theme.palette.primary.main, 0.1),
                  },
                  justifyContent: drawerOpen ? 'initial' : 'center',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: drawerOpen ? 40 : 0,
                    color: active
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {drawerOpen && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: active ? 700 : 500,
                    }}
                  />
                )}
              </ListItem>
            </Tooltip>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Tooltip title={t('language')} placement="right">
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: drawerOpen ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: drawerOpen ? 'flex-start' : 'center',
              gap: drawerOpen ? 1 : 0,
              px: drawerOpen ? 1 : 0,
            }}
          >
            <IconButton
              onClick={openLangMenu}
              sx={{ color: theme.palette.text.secondary }}
            >
              <Translate />
            </IconButton>

            {drawerOpen && (
              <Typography variant="caption" color="text.secondary">
                {t('language')}
              </Typography>
            )}
          </Box>
        </Tooltip>

        <Menu
          anchorEl={langAnchor}
          open={Boolean(langAnchor)}
          onClose={closeLangMenu}
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

        <Tooltip title={t('toggle_theme')} placement="right">
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: drawerOpen ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: drawerOpen ? 'flex-start' : 'center',
              gap: drawerOpen ? 1 : 0,
              px: drawerOpen ? 1 : 0,
            }}
          >
            <IconButton
              onClick={toggleTheme}
              sx={{ color: theme.palette.text.secondary }}
            >
              {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>

            {drawerOpen && (
              <Typography variant="caption" color="text.secondary">
                {t('toggle_theme')}
              </Typography>
            )}
          </Box>
        </Tooltip>

        {user && (
          <Tooltip title={t('logout')} placement="right">
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: drawerOpen ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: drawerOpen ? 'flex-start' : 'center',
                gap: drawerOpen ? 1 : 0,
                px: drawerOpen ? 1 : 0,
              }}
            >
              <IconButton
                onClick={handleLogout}
                sx={{ color: theme.palette.error.main }}
              >
                <Logout />
              </IconButton>

              {drawerOpen && (
                <Typography variant="caption" color="error">
                  {t('logout')}
                </Typography>
              )}
            </Box>
          </Tooltip>
        )}
      </Box>
    </>
  );

  return (
    <>
      {isSmallScreen && !mobileOpen && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: theme.palette.background.paper,
            boxShadow: theme.shadows[2],
          }}
          size="large"
          aria-label="open sidebar"
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isSmallScreen ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true,
          BackdropProps: {
            invisible: true,
            sx: {
              backgroundColor: 'transparent',
            },
          },
        }}
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: currentDrawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            background: `linear-gradient(135deg, ${
              theme.palette.background.default
            }, ${alpha(theme.palette.primary.main, 0.08)})`,
            borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            backdropFilter: 'blur(8px)',
            transition: 'width 0.3s ease',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default AdminSidebar;