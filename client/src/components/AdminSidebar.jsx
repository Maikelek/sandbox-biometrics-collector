import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton,
  Tooltip, Divider, Avatar, Box, Menu, MenuItem, Typography, useTheme, alpha, useMediaQuery
} from '@mui/material';
import {
  Brightness4, Brightness7, Translate, Dashboard, Logout, People, Psychology, ManageAccounts, Menu as MenuIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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

  const isSmallScreen = useMediaQuery('(max-width:899px)');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [langAnchor, setLangAnchor] = useState(null);

  const openLangMenu = (e) => setLangAnchor(e.currentTarget);
  const closeLangMenu = () => setLangAnchor(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    closeLangMenu();
  };

  const handleLogout = async () => {
    try {
      const res = await axios.delete('http://localhost:1234/auth', {
        withCredentials: true
      });
      if (res.data.logout === true) setUser(null);
    } catch (err) {
      console.log(err);
      alert(err);
    }
  };

  const menuItems = [
    { icon: <Dashboard />, label: t('admin'), path: '/admin' },
    { icon: <People />, label: t('users'), path: '/admin/users' },
    { icon: <Psychology />, label: t('problems'), path: '/admin/problems' },
    { icon: <ManageAccounts />, label: t('profile'), path: '/profile' }
  ];

  const drawerOpen = isSmallScreen ? mobileOpen : true;
  const currentDrawerWidth = drawerOpen ? drawerWidth : miniDrawerWidth;

  const drawerContent = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: drawerOpen ? 'space-between' : 'center',
          p: 2,
        }}
      >
        {drawerOpen ? (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar src="/logo.png" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Admin
            </Typography>
          </Box>
        ) : (
          <Avatar src="/logo.png" />
        )}

        {isSmallScreen && drawerOpen && (
          <IconButton onClick={() => setMobileOpen(false)}>
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      <List>
        {menuItems.map(({ icon, label, path }) => (
          <Tooltip
            key={label}
            title={!drawerOpen ? label : ''}
            placement="right"
            arrow
          >
            <ListItem
              button
              component={Link}
              to={path}
              sx={{
                borderRadius: '12px',
                mx: 1,
                my: 0.5,
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                },
                '& a': {
                  textDecoration: 'none',
                  color: 'inherit'
                },
                justifyContent: drawerOpen ? 'initial' : 'center'
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: theme.palette.primary.main }}>
                {icon}
              </ListItemIcon>
              {drawerOpen && <ListItemText primary={label} />}
            </ListItem>
          </Tooltip>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
        <Tooltip title={t('language')} placement="right">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton onClick={openLangMenu} sx={{ color: theme.palette.text.secondary }}>
              <Translate />
            </IconButton>
            {drawerOpen && <Typography variant="caption">{t('language')}</Typography>}
          </Box>
        </Tooltip>
        <Menu anchorEl={langAnchor} open={Boolean(langAnchor)} onClose={closeLangMenu}>
          <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
          <MenuItem onClick={() => changeLanguage('sk')}>Slovensky</MenuItem>
        </Menu>

        <Tooltip title={t('toggle_theme')} placement="right">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton onClick={toggleTheme} sx={{ color: theme.palette.text.secondary }}>
              {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            {drawerOpen && <Typography variant="caption">{t('toggle_theme')}</Typography>}
          </Box>
        </Tooltip>

        {user && (
          <Tooltip title={t('logout')} placement="right">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
                <Logout />
              </IconButton>
              {drawerOpen && <Typography variant="caption">{t('logout')}</Typography>}
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
            boxShadow: theme.shadows[2]
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
        ModalProps={{ keepMounted: true }}
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: currentDrawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            bgcolor: `linear-gradient(135deg, ${theme.palette.background.default}, ${alpha(theme.palette.primary.main, 0.2)})`,
            borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            backdropFilter: 'blur(8px)',
            transition: 'width 0.3s ease',
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default AdminSidebar;
