import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Paper,
  CircularProgress,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Button,
  useMediaQuery,
  useTheme,
  Divider,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Edit, Delete, Add, Visibility, Refresh, Psychology } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import AdminSidebar from '../../components/AdminSidebar';
import TestCaseDialog from '../../components/TestCaseDialog';

const difficultyColor = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

const limit = 8;

const AdminProblems = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [testCaseDialogOpen, setTestCaseDialogOpen] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(null);

  const apiBase = useMemo(() => {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';
  }, []);

  const cardSx = {
    borderRadius: 2.5,
    backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
    border: `1px solid ${isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'}`,
    boxShadow: 'none',
  };

  const getDifficultyKey = (difficulty) => {
    return String(difficulty || '').toLowerCase();
  };

  const fetchProblems = useCallback(() => {
    setLoading(true);
    setError('');

    axios
      .get(`${apiBase}/admin/problems`, {
        withCredentials: true,
        params: {
          page,
          limit,
        },
      })
      .then((res) => {
        const { problems: loadedProblems = [], total = 0 } = res.data;

        const enhanced = loadedProblems.map((problem) => ({
          ...problem,
          tags: problem.tags
            ? String(problem.tags)
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
        }));

        setProblems(enhanced);
        setTotalPages(Math.max(Math.ceil((total || 0) / limit), 1));
      })
      .catch((err) => {
        console.error('Error fetching problems:', err);
        setError(
          t('admin.problems.loadError', {
            defaultValue: 'Nepodarilo sa načítať úlohy.',
          })
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiBase, page, t]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleEdit = (problemId) => {
    navigate(`/admin/problem/${problemId}`);
  };

  const handleDelete = (problem) => {
    setSelectedProblem(problem);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedProblem(null);
  };

  const confirmDelete = () => {
    if (!selectedProblem) return;

    axios
      .delete(`${apiBase}/admin/problems`, {
        withCredentials: true,
        data: { id: selectedProblem.id },
      })
      .then(() => {
        setSnackbarOpen(true);
        setDeleteDialogOpen(false);
        setSelectedProblem(null);
        fetchProblems();
      })
      .catch((err) => {
        console.error('Error deleting problem:', err);
        setError(
          t('admin.problems.deleteError', {
            defaultValue: 'Nepodarilo sa vymazať úlohu.',
          })
        );
        setDeleteDialogOpen(false);
      });
  };

  const handleViewTestCases = (problemId) => {
    setSelectedProblemId(problemId);
    setTestCaseDialogOpen(true);
  };

  const MobileProblemList = () => (
    <Stack spacing={2}>
      {problems.map((problem) => {
        const difficulty = getDifficultyKey(problem.difficulty);

        return (
          <Paper key={problem.id} elevation={0} sx={{ ...cardSx, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" spacing={2} mb={1}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 750 }}>
                  {problem.name}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  #{problem.id} · {problem.problem}
                </Typography>
              </Box>

              <Chip
                label={t(`problems.levels.${difficulty}`, {
                  defaultValue: problem.difficulty,
                })}
                color={difficultyColor[difficulty] || 'default'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('problems.tags')}:
              </Typography>

              {problem.tags.length > 0 ? (
                <Stack direction="row" gap={0.75} flexWrap="wrap">
                  {problem.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      variant="outlined"
                      size="small"
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  —
                </Typography>
              )}
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
              <Tooltip title={t('admin.problems.viewTests')}>
                <IconButton
                  aria-label="view-test-cases"
                  color="secondary"
                  onClick={() => handleViewTestCases(problem.id)}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('admin.problems.edit')}>
                <IconButton
                  aria-label="edit"
                  color="primary"
                  onClick={() => handleEdit(problem.id)}
                >
                  <Edit />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('admin.problems.delete')}>
                <IconButton
                  aria-label="delete"
                  color="error"
                  onClick={() => handleDelete(problem)}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );

  const DesktopProblemTable = () => (
    <Paper elevation={0} sx={{ ...cardSx, overflowX: 'auto', width: '100%' }}>
      <Table sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>{t('problems.name')}</TableCell>
            <TableCell>{t('problems.difficulty')}</TableCell>
            <TableCell>{t('problems.tags')}</TableCell>
            <TableCell align="right">{t('problems.actions')}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {problems.map((problem) => {
            const difficulty = getDifficultyKey(problem.difficulty);

            return (
              <TableRow key={problem.id} hover>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {problem.id}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography sx={{ fontWeight: 700 }}>
                    {problem.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {problem.problem}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    label={t(`problems.levels.${difficulty}`, {
                      defaultValue: problem.difficulty,
                    })}
                    color={difficultyColor[difficulty] || 'default'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>

                <TableCell>
                  {problem.tags.length > 0 ? (
                    <Stack direction="row" gap={0.75} flexWrap="wrap">
                      {problem.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 2 }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>

                <TableCell align="right">
                  <Tooltip title={t('admin.problems.viewTests')}>
                    <IconButton
                      aria-label="view-test-cases"
                      color="secondary"
                      onClick={() => handleViewTestCases(problem.id)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('admin.problems.edit')}>
                    <IconButton
                      aria-label="edit"
                      color="primary"
                      onClick={() => handleEdit(problem.id)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('admin.problems.delete')}>
                    <IconButton
                      aria-label="delete"
                      color="error"
                      onClick={() => handleDelete(problem)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );

  return (
    <>
      <AdminSidebar />

      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: '240px' },
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
                {t('admin.problems.title')}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, textAlign: { xs: 'center', sm: 'left' } }}
              >
                {t('admin.problems.subtitle', {
                  defaultValue: 'Správa úloh, tagov a testovacích prípadov.',
                })}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              justifyContent={{ xs: 'center', sm: 'flex-end' }}
            >
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchProblems}
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
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <CircularProgress />
            </Box>
          ) : problems.length === 0 ? (
            <Paper elevation={0} sx={{ ...cardSx, p: 4, textAlign: 'center' }}>
              <Psychology sx={{ fontSize: 42, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('admin.problems.emptyTitle', {
                  defaultValue: 'Zatiaľ tu nie sú žiadne úlohy',
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('admin.problems.emptyText', {
                  defaultValue: 'Pridaj prvú úlohu a začne sa zobrazovať v zozname.',
                })}
              </Typography>
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
            </Paper>
          ) : (
            <>
              {isMobile ? <MobileProblemList /> : <DesktopProblemTable />}

              <Stack spacing={2} sx={{ mt: 3 }} alignItems="center">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                  size={isMobile ? 'small' : 'medium'}
                />
              </Stack>
            </>
          )}

          <Dialog
            open={deleteDialogOpen}
            onClose={handleCloseDeleteDialog}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
              },
            }}
          >
            <DialogTitle sx={{ fontWeight: 750 }}>
              {t('admin.problems.confirmDeleteTitle')}
            </DialogTitle>

            <DialogContent>
              <Typography>
                {t('admin.problems.confirmDeleteMessage', {
                  name: selectedProblem?.name,
                })}
              </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                onClick={handleCloseDeleteDialog}
                sx={{ textTransform: 'none', fontWeight: 650 }}
              >
                {t('cancel')}
              </Button>

              <Button
                onClick={confirmDelete}
                color="error"
                variant="contained"
                sx={{ textTransform: 'none', fontWeight: 650 }}
              >
                {t('delete')}
              </Button>
            </DialogActions>
          </Dialog>

          <TestCaseDialog
            open={testCaseDialogOpen}
            onClose={() => setTestCaseDialogOpen(false)}
            problemId={selectedProblemId}
          />

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setSnackbarOpen(false)}
              severity="success"
              sx={{ width: '100%' }}
            >
              {t('admin.problems.deletedSuccess')}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </>
  );
};

export default AdminProblems;