import React, { useState, useMemo } from 'react';
import {
  AppBar, Box, Toolbar, IconButton, Typography, Menu,
  MenuItem, CssBaseline, Container, Tooltip, Avatar
} from '@mui/material';
import { Brightness4, Brightness7, Translate } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useUser } from "../context/UserContext";
import axios from 'axios';

const NavBar = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useUser();
  const [themeMode, setThemeMode] = useState(localStorage.getItem('themeMode') || 'light');
  const theme = useMemo(() => createTheme({ palette: { mode: themeMode } }), [themeMode]);

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const [langAnchor, setLangAnchor] = useState(null);
  const openLangMenu = (event) => setLangAnchor(event.currentTarget);
  const closeLangMenu = () => setLangAnchor(null);
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    closeLangMenu();
  };

  const [userAnchor, setUserAnchor] = useState(null);
  const openUserMenu = (event) => setUserAnchor(event.currentTarget);
  const closeUserMenu = () => setUserAnchor(null);

  const handleLogout  = async e => {   
    e.preventDefault();
    try {
      const response = await axios.delete("http://localhost:1234/auth", {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      if (response.data.logout === true) {
        setUser(null);
      }
    } catch (error) {
      console.log(error);
      alert(error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>

            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}
            >
              SBC 
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={t('language')}>
                <IconButton onClick={openLangMenu} color="inherit">
                  <Translate />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={langAnchor}
                open={Boolean(langAnchor)}
                onClose={closeLangMenu}
              >
                <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
                <MenuItem onClick={() => changeLanguage('sk')}>Slovak</MenuItem>
              </Menu>

              <Tooltip title={t('toggle_theme')}>
                <IconButton onClick={toggleTheme} color="inherit">
                  {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>

              <Tooltip title={t('open_settings')}>
                <IconButton onClick={openUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user?.name ? user.name : "User"} src="/avatar.png" />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={userAnchor}
                open={Boolean(userAnchor)}
                onClose={closeUserMenu}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ mt: '40px' }}
              >
                <MenuItem onClick={closeUserMenu}>{t('profile')}</MenuItem>
                <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </ThemeProvider>
  );
};

export default NavBar;
