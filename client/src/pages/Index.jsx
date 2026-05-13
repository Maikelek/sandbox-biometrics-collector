import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Container,
  Stack,
  Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TimelineIcon from '@mui/icons-material/Timeline';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

import NavBar from '../components/NavBar';

const Index = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { t } = useTranslation();

  const featureIcons = [
    <CodeOutlinedIcon />,
    <CheckCircleOutlineIcon />,
    <TimelineIcon />,
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#0f1117' : '#f6f7fb',
        color: isDarkMode ? '#fff' : '#111827',
      }}
    >
      <NavBar />

      <Box
        component="main"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: 'calc(100vh - 68px)',
          display: 'flex',
          alignItems: 'center',
          py: { xs: 5, sm: 6, md: 10 },
          background: isDarkMode
            ? `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.18)} 0, transparent 32%),
               radial-gradient(circle at 80% 30%, ${alpha(theme.palette.primary.main, 0.1)} 0, transparent 28%),
               #0f1117`
            : `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.14)} 0, transparent 32%),
               radial-gradient(circle at 80% 30%, ${alpha(theme.palette.primary.main, 0.08)} 0, transparent 28%),
               #f6f7fb`,
        }}
      >
        <Container maxWidth="lg">
          <Grid
            container
            spacing={{ xs: 4, sm: 4, md: 9 }}
            alignItems="center"
            sx={{
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            <Grid item xs={12} sm={6} md={7}>
              <Stack spacing={{ xs: 2.5, md: 3 }}>
                <Chip
                  label="TUKE FEI"
                  sx={{
                    width: 'fit-content',
                    borderRadius: 999,
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                  }}
                />

                <Typography
                  component="h1"
                  sx={{
                    maxWidth: 720,
                    fontSize: {
                      xs: '2.35rem',
                      sm: '2.55rem',
                      md: '4.35rem',
                    },
                    lineHeight: 1.03,
                    fontWeight: 850,
                    letterSpacing: '-0.06em',
                  }}
                >
                  {t('index.title')}
                </Typography>

                <Typography
                  sx={{
                    maxWidth: 620,
                    fontSize: { xs: '1rem', md: '1.12rem' },
                    lineHeight: 1.8,
                    color: isDarkMode
                      ? 'rgba(255,255,255,0.68)'
                      : 'rgba(17,24,39,0.68)',
                  }}
                >
                  {t('index.subtitle')}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    pt: 1,
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    component={Link}
                    to="/problems"
                    startIcon={<RocketLaunchIcon />}
                    sx={{
                      px: { xs: 3, md: 3.5 },
                      py: 1.35,
                      borderRadius: 2,
                      fontWeight: 750,
                      textTransform: 'none',
                    }}
                  >
                    {t('index.button')}
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    component={Link}
                    to="/profile"
                    sx={{
                      px: { xs: 3, md: 3.5 },
                      py: 1.35,
                      borderRadius: 2,
                      fontWeight: 750,
                      textTransform: 'none',
                      backgroundColor: isDarkMode
                        ? alpha('#ffffff', 0.02)
                        : alpha('#ffffff', 0.65),
                    }}
                  >
                    {t('profile')}
                  </Button>
                </Stack>

                <Stack
                  direction="row"
                  sx={{
                    pt: 1,
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  {[
                    t('index.feature1Title'),
                    t('index.feature2Title'),
                    t('index.feature3Title'),
                  ].map((item) => (
                    <Box
                      key={item}
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        fontSize: '0.88rem',
                        fontWeight: 650,
                        color: isDarkMode
                          ? 'rgba(255,255,255,0.78)'
                          : 'rgba(17,24,39,0.78)',
                        backgroundColor: isDarkMode
                          ? alpha('#ffffff', 0.055)
                          : alpha('#ffffff', 0.85),
                        border: `1px solid ${
                          isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb'
                        }`,
                      }}
                    >
                      {item}
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={5}>
              <Paper
                elevation={0}
                sx={{
                  width: '100%',
                  borderRadius: { xs: 3, md: 4 },
                  overflow: 'hidden',
                  backgroundColor: isDarkMode ? '#151923' : '#ffffff',
                  border: `1px solid ${
                    isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'
                  }`,
                  boxShadow: isDarkMode
                    ? '0 26px 80px rgba(0,0,0,0.38)'
                    : '0 26px 80px rgba(15,23,42,0.14)',
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isDarkMode ? '#10131b' : '#f8fafc',
                    borderBottom: `1px solid ${
                      isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb'
                    }`,
                  }}
                >
                  <Stack direction="row" spacing={0.8}>
                    {['#ef4444', '#f59e0b', '#22c55e'].map((color) => (
                      <Box
                        key={color}
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: color,
                        }}
                      />
                    ))}
                  </Stack>

                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: isDarkMode
                        ? 'rgba(255,255,255,0.55)'
                        : 'text.secondary',
                    }}
                  >
                    solution.py
                  </Typography>
                </Box>

                <Box sx={{ p: { xs: 2.5, sm: 2.5, md: 3 } }}>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: { xs: 2, md: 2.5 },
                      borderRadius: 3,
                      overflow: 'auto',
                      fontSize: {
                        xs: '0.78rem',
                        sm: '0.74rem',
                        md: '0.88rem',
                      },
                      lineHeight: 1.75,
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      color: isDarkMode ? '#d1d5db' : '#1f2937',
                      backgroundColor: isDarkMode ? '#0b0f17' : '#f8fafc',
                      border: `1px solid ${
                        isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb'
                      }`,
                    }}
                  >
{`def graduateMe(project, thesis):
    return True
`}
                  </Box>

                  <Stack spacing={1.2} sx={{ mt: 2.5 }}>
                    {[1, 2, 3].map((item) => (
                      <Box
                        key={item}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          p: { xs: 1.5, sm: 1.25, md: 1.5 },
                          borderRadius: 2,
                          backgroundColor: isDarkMode
                            ? alpha('#ffffff', 0.04)
                            : '#f8fafc',
                          border: `1px solid ${
                            isDarkMode ? alpha('#ffffff', 0.07) : '#edf0f4'
                          }`,
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Box
                            sx={{
                              width: { xs: 32, sm: 30, md: 32 },
                              height: { xs: 32, sm: 30, md: 32 },
                              flexShrink: 0,
                              borderRadius: 1.5,
                              display: 'grid',
                              placeItems: 'center',
                              color: theme.palette.primary.main,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            }}
                          >
                            {featureIcons[item - 1]}
                          </Box>

                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: '1rem', sm: '0.86rem', md: '1rem' },
                            }}
                          >
                            {t(`index.feature${item}Title`)}
                          </Typography>
                        </Stack>

                        <CheckCircleOutlineIcon
                          fontSize="small"
                          sx={{
                            color: theme.palette.success.main,
                            flexShrink: 0,
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>

                  <Button
                    fullWidth
                    variant="contained"
                    component={Link}
                    to="/problems"
                    startIcon={<PlayArrowRoundedIcon />}
                    sx={{
                      mt: 2.5,
                      py: 1.2,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 750,
                    }}
                  >
                    {t('index.button')}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Index;