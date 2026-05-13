import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add,
  Refresh,
  AssignmentOutlined,
  PeopleAltOutlined,
  SellOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import AdminSidebar from '../../components/AdminSidebar';

const drawerWidth = 240;

const difficultyColor = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

const normalizeList = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalProblems, setTotalProblems] = useState(0);
  const [totalUsers, setTotalUsers] = useState(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const apiBase =
    window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [problemsResult, usersResult] = await Promise.allSettled([
        axios.get(`${apiBase}/admin/problems`, {
          withCredentials: true,
          params: { page: 1, limit: 500 },
        }),
        axios.get(`${apiBase}/admin/users`, {
          withCredentials: true,
          params: { page: 1, limit: 500 },
        }),
      ]);

      if (problemsResult.status === 'fulfilled') {
        const payload = problemsResult.value.data;

        const problemList = normalizeList(payload, 'problems').map((problem) => ({
          ...problem,
          tags: problem.tags
            ? String(problem.tags)
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
        }));

        setProblems(problemList);
        setTotalProblems(payload?.total ?? problemList.length);
      } else {
        console.error(problemsResult.reason);
        setError(
          t('admin.dashboard.loadError', {
            defaultValue: 'Nepodarilo sa načítať údaje dashboardu.',
          })
        );
      }

      if (usersResult.status === 'fulfilled') {
        const payload = usersResult.value.data;
        const userList = normalizeList(payload, 'users');

        setUsers(userList);
        setTotalUsers(payload?.total ?? userList.length);
      } else {
        setUsers([]);
        setTotalUsers(null);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(
        t('admin.dashboard.loadError', {
          defaultValue: 'Nepodarilo sa načítať údaje dashboardu.',
        })
      );
    } finally {
      setLoading(false);
    }
  }, [apiBase, t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const difficultyStats = useMemo(() => {
    const stats = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    problems.forEach((problem) => {
      const key = String(problem.difficulty || '').toLowerCase();

      if (stats[key] !== undefined) {
        stats[key] += 1;
      }
    });

    return stats;
  }, [problems]);

  const tagStats = useMemo(() => {
    const tags = new Map();

    problems.forEach((problem) => {
      problem.tags.forEach((tag) => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    });

    return Array.from(tags.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [problems]);

  const recentProblems = useMemo(() => {
    return [...problems]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 6);
  }, [problems]);

  const cardSx = {
    borderRadius: 2.5,
    backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
    border: `1px solid ${isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'}`,
    boxShadow: 'none',
  };

  const StatCard = ({ icon, label, value }) => (
    <Paper elevation={0} sx={{ ...cardSx, p: 2.5 }}>
      <Stack direction="row" spacing={1.75} alignItems="center">
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 750,
              letterSpacing: '-0.035em',
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );

  const DifficultyRow = ({ level, count }) => {
    const total = totalProblems || problems.length || 1;
    const percentage = Math.round((count / total) * 100);

    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" mb={0.75}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              color={difficultyColor[level] || 'default'}
              label={t(`problems.levels.${level}`, {
                defaultValue: level,
              })}
              sx={{ fontWeight: 650 }}
            />

            <Typography variant="body2" color="text.secondary">
              {count}
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {percentage}%
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={percentage}
          color={difficultyColor[level] || 'primary'}
          sx={{
            height: 7,
            borderRadius: 999,
            backgroundColor: isDarkMode
              ? alpha('#ffffff', 0.08)
              : '#eef2f7',
          }}
        />
      </Box>
    );
  };

  return (
    <>
      <AdminSidebar />

      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: `${drawerWidth}px` },
          minHeight: '100vh',
          backgroundColor: isDarkMode ? '#0f1117' : '#f6f7fb',
          px: { xs: 2, sm: 3, md: 4 },
          py: 3,
          pt: isMobile ? '76px' : 4,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 750,
                  letterSpacing: '-0.035em',
                  color: isDarkMode ? '#fff' : '#111827',
                  textAlign: { xs: 'center', sm: 'left' },
                }}
              >
                {t('admin.dashboard.title', {
                  defaultValue: 'Dashboard',
                })}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, textAlign: { xs: 'center', sm: 'left' } }}
              >
                {t('admin.dashboard.subtitle', {
                  defaultValue: 'Krátky prehľad obsahu v administrácii.',
                })}
              </Typography>

              {lastUpdated && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.75 }}
                >
                  {t('admin.dashboard.lastUpdated', {
                    defaultValue: 'Naposledy načítané',
                  })}
                  : {lastUpdated.toLocaleTimeString()}
                </Typography>
              )}
            </Box>

            <Stack
              direction="row"
              spacing={1}
              justifyContent={{ xs: 'center', sm: 'flex-end' }}
            >
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchDashboard}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 650,
                }}
              >
                {t('admin.dashboard.refresh', {
                  defaultValue: 'Obnoviť',
                })}
              </Button>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/admin/problem/add')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 650,
                }}
              >
                {t('admin.problems.add')}
              </Button>
            </Stack>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="50vh"
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <StatCard
                    icon={<AssignmentOutlined fontSize="small" />}
                    label={t('admin.dashboard.totalProblems', {
                      defaultValue: 'Úlohy',
                    })}
                    value={totalProblems}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <StatCard
                    icon={<PeopleAltOutlined fontSize="small" />}
                    label={t('admin.dashboard.totalUsers', {
                      defaultValue: 'Používatelia',
                    })}
                    value={totalUsers === null ? '—' : totalUsers}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <StatCard
                    icon={<SellOutlined fontSize="small" />}
                    label={t('admin.dashboard.uniqueTags', {
                      defaultValue: 'Tagy',
                    })}
                    value={tagStats.length}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <Paper elevation={0} sx={{ ...cardSx, p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 750, mb: 0.5 }}>
                      {t('admin.dashboard.difficultyOverview', {
                        defaultValue: 'Náročnosť úloh',
                      })}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2.5 }}
                    >
                      {t('admin.dashboard.difficultySubtitle', {
                        defaultValue: 'Koľko úloh je v jednotlivých úrovniach.',
                      })}
                    </Typography>

                    <Stack spacing={2.2}>
                      <DifficultyRow level="easy" count={difficultyStats.easy} />
                      <DifficultyRow level="medium" count={difficultyStats.medium} />
                      <DifficultyRow level="hard" count={difficultyStats.hard} />
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Paper elevation={0} sx={{ ...cardSx, p: 3, height: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 750, mb: 0.5 }}>
                      {t('admin.dashboard.tagsOverview', {
                        defaultValue: 'Tagy',
                      })}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2.5 }}
                    >
                      {t('admin.dashboard.tagsSubtitle', {
                        defaultValue: 'Najčastejšie používané kategórie úloh.',
                      })}
                    </Typography>

                    {tagStats.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t('admin.dashboard.noTags', {
                          defaultValue: 'Zatiaľ nie sú dostupné žiadne tagy.',
                        })}
                      </Typography>
                    ) : (
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        {tagStats.slice(0, 14).map((tag) => (
                          <Chip
                            key={tag.name}
                            label={`${tag.name} (${tag.count})`}
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              fontWeight: 600,
                            }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              <Paper elevation={0} sx={{ ...cardSx, p: 3 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  spacing={1.5}
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 750 }}>
                      {t('admin.dashboard.recentProblems', {
                        defaultValue: 'Najnovšie úlohy',
                      })}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {t('admin.dashboard.recentProblemsSubtitle', {
                        defaultValue: 'Posledné pridané úlohy podľa ID.',
                      })}
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/problems')}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 650,
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    {t('admin.dashboard.showAllProblems', {
                      defaultValue: 'Zobraziť všetky',
                    })}
                  </Button>
                </Stack>

                <Divider sx={{ mb: 1.5 }} />

                <Stack spacing={0.5}>
                  {recentProblems.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('admin.dashboard.noProblems', {
                        defaultValue: 'Zatiaľ nie sú dostupné žiadne úlohy.',
                      })}
                    </Typography>
                  ) : (
                    recentProblems.map((problem) => {
                      const difficulty = String(problem.difficulty || '').toLowerCase();

                      return (
                        <Box
                          key={problem.id}
                          sx={{
                            py: 1.25,
                            display: 'flex',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 2,
                            flexDirection: { xs: 'column', sm: 'row' },
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>
                              {problem.name}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                              #{problem.id} · {problem.problem}
                            </Typography>
                          </Box>

                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                          >
                            {problem.tags?.slice(0, 3).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                              />
                            ))}

                            <Chip
                              size="small"
                              color={difficultyColor[difficulty] || 'default'}
                              label={t(`problems.levels.${difficulty}`, {
                                defaultValue: difficulty || '—',
                              })}
                              sx={{ fontWeight: 650 }}
                            />
                          </Stack>
                        </Box>
                      );
                    })
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}
        </Box>
      </Box>
    </>
  );
};

export default AdminDashboard;