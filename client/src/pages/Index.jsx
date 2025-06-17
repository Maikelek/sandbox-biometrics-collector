import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import NavBar from '../components/NavBar';

const Index = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { t } = useTranslation();

  return (
    <>
      <NavBar />

      <Box
        sx={{
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#121212' : '#f5f7fa',
          textAlign: 'center',
          px: 3,
          py: 6,
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#000' }}
        >
          {t('index.title')}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
            maxWidth: 600,
          }}
        >
          {t('index.subtitle')}
        </Typography>
        <Button
          variant="contained"
          size="large"
          component={Link} 
          to="/problems"
          sx={{
            backgroundColor: theme.palette.primary.main,
            px: 5,
            py: 1.5,
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          {t('index.button')}
        </Button>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 4,
          textAlign: 'center',
          backgroundColor: isDarkMode ? '#1e1e1e' : '#eceff1',
          color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary',
          mt: 8,
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()}{t('index.rights')}
        </Typography>
      </Box>
    </>
  );
};

export default Index;
