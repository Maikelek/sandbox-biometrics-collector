import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar, Box, Toolbar, IconButton, Typography, Menu,
  MenuItem, Container, Tooltip, Avatar
} from '@mui/material';
import { Brightness4, Brightness7, Translate } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useUser } from "../context/UserContext";
import axios from 'axios';
import { useThemeContext } from '../context/ThemeContext';

const NavBar = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useUser();
  const { themeMode, toggleTheme } = useThemeContext();
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

    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>

          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
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
              <MenuItem component={Link} to="/profile" onClick={closeUserMenu}>
                {t('profile')}
              </MenuItem>
              
              {user?.isAdmin === 1 && <MenuItem component={Link} to="/admin" onClick={closeUserMenu}>
                {t('admin')}
              </MenuItem> }

              <MenuItem component={Link} to="/problems" onClick={closeUserMenu}>
                {t('problems')}
              </MenuItem>

              <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default NavBar;
