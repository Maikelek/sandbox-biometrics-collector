import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
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
          startIcon={<RocketLaunchIcon />}
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
        sx={{
          py: 8,
          px: 4,
          backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
          width: '100%',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          textAlign="center"
          sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#000' }}
        >
          {t('index.featuresTitle')}
        </Typography>

        <Grid container spacing={4} justifyContent="center" mt={2}>
          {[1, 2, 3].map((index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: isDarkMode ? '#2c2c2c' : '#f9f9f9',
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 'bold' }}
                >
                  {t(`index.feature${index}Title`)}
                </Typography>
                <Typography variant="body2">
                  {t(`index.feature${index}Desc`)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box
        sx={{
          py: 8,
          px: 4,
          backgroundColor: isDarkMode ? '#121212' : '#f4f6f8',
        }}
      >
        <Typography
          variant="h4"
          textAlign="center"
          gutterBottom
          sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#000' }}
        >
          {t('index.infoSectionTitle')}
        </Typography>

        <Box maxWidth="md" mx="auto" mt={4}>
          {[1, 2, 3].map((i) => (
            <Accordion
              key={i}
              sx={{
                backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                color: isDarkMode ? '#fff' : 'inherit',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 500 }}>
                  {t(`index.info${i}Title`)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  {t(`index.info${i}Desc`)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
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
          © {new Date().getFullYear()} {t('index.rights')}
        </Typography>
      </Box>
    </>
  );
};

export default Index;
