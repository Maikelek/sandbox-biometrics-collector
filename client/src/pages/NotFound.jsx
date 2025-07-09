import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';

const NotFound = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #1e1e1e, #121212)'
          : 'linear-gradient(135deg, #f5f7fa, #e0e0e0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        textAlign: 'center',
      }}
    >
      <ReportProblemRoundedIcon
        sx={{
          fontSize: 80,
          mb: 2,
          color: theme.palette.primary.main,
        }}
      />

      <Typography
        variant="h1"
        sx={{
          fontWeight: 900,
          fontSize: { xs: '4rem', md: '6rem' },
          color: isDark ? '#fff' : '#000',
          mb: 1,
        }}
      >
        404
      </Typography>

      <Typography
        variant="h5"
        sx={{
          color: isDark ? 'rgba(255,255,255,0.9)' : 'text.primary',
          fontWeight: 600,
          mb: 2,
        }}
      >
        {t('notfound.title')}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          maxWidth: 500,
          color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary',
          mb: 4,
        }}
      >
        {t(
          'notfound.message',
        )}
      </Typography>

      <Stack direction="row" spacing={2}>
        <Button
          component={Link}
          to="/"
          variant="contained"
          size="large"
          sx={{
            textTransform: 'none',
            fontWeight: 'bold',
            px: 4,
          }}
        >
          {t('notfound.backHome')}
        </Button>
      </Stack>
    </Box>
  );
};

export default NotFound;
