import React, { useMemo } from 'react';
import { Box, CircularProgress, createTheme } from '@mui/material';

const Loading = () => {
  const mode = localStorage.getItem('themeMode') || 'light';
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      width="100vw"
      bgcolor={theme.palette.background.default}
      color={theme.palette.text.primary}
    >
      <CircularProgress size={60} thickness={5} color="primary" />
    </Box>
  );
};

export default Loading;
