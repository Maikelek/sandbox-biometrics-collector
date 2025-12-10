import React, { useEffect, useState, useCallback } from 'react';
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
} from '@mui/material';
import { Edit, Delete, Add, Visibility } from '@mui/icons-material';
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

const AdminProblems = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [testCaseDialogOpen, setTestCaseDialogOpen] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const limit = 8;

  const fetchProblems = useCallback(() => {
    setLoading(true);
    axios
      .get(`http://localhost:1234/admin/problems?page=${page}`, {
        withCredentials: true,
        params: { limit },
      })
      .then((res) => {
        const { problems, total } = res.data;
        const enhanced = problems.map((p) => ({
          ...p,
          tags: p.tags ? p.tags.split(',').map((tag) => tag.trim()) : [],
        }));
        setProblems(enhanced);
        setTotalPages(Math.ceil((total || 0) / limit));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching problems:', err);
        setLoading(false);
      });
  }, [page, limit]);

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

  const confirmDelete = () => {
    axios
      .delete(`http://localhost:1234/admin/problems`, {
        withCredentials: true,
        data: { id: selectedProblem.id },
      })
      .then(() => {
        setSnackbarOpen(true);
        setDeleteDialogOpen(false);
        fetchProblems();
      })
      .catch((err) => {
        console.error('Error deleting problem:', err);
        setDeleteDialogOpen(false);
      });
  };

  const handleViewTestCases = (problemId) => {
    setSelectedProblemId(problemId);
    setTestCaseDialogOpen(true);
  };

  const MobileProblemList = () => (
    <Stack spacing={2}>
      {problems.map((problem) => (
        <Paper key={problem.id} elevation={3} sx={{ padding: 2, borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight={600}>
              {problem.name}
            </Typography>
            <Chip
              label={t(`problems.levels.${problem.difficulty.toLowerCase()}`)}
              color={difficultyColor[problem.difficulty.toLowerCase()] || 'default'}
              size="small"
              sx={{ ml: 1 }}
            />
          </Stack>
          
          <Divider sx={{ my: 1 }} />

          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('problems.tags')}:
            </Typography>
            {problem.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                variant="outlined"
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
          
          <Box display="flex" justifyContent="flex-end">
            <IconButton
              aria-label="view-test-cases"
              color="secondary"
              onClick={() => handleViewTestCases(problem.id)}
            >
              <Visibility />
            </IconButton>
            <IconButton
              aria-label="edit"
              color="primary"
              onClick={() => handleEdit(problem.id)}
            >
              <Edit />
            </IconButton>
            <IconButton
              aria-label="delete"
              color="error"
              onClick={() => handleDelete(problem)}
            >
              <Delete />
            </IconButton>
          </Box>
        </Paper>
      ))}
    </Stack>
  );

  const DesktopProblemTable = () => (
    <Paper elevation={3} sx={{ overflowX: 'auto', width: '100%' }}>
      <Table sx={{ minWidth: 700 }}>
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
          {problems.map((problem) => (
            <TableRow key={problem.id} hover>
              <TableCell>{problem.id}</TableCell>
              <TableCell>{problem.name}</TableCell>
              <TableCell>
                <Chip
                  label={t(`problems.levels.${problem.difficulty.toLowerCase()}`)}
                  color={difficultyColor[problem.difficulty.toLowerCase()] || 'default'}
                />
              </TableCell>
              <TableCell>
                {problem.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  aria-label="view-test-cases"
                  color="secondary"
                  onClick={() => handleViewTestCases(problem.id)}
                >
                  <Visibility />
                </IconButton>
                <IconButton
                  aria-label="edit"
                  color="primary"
                  onClick={() => handleEdit(problem.id)}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  color="error"
                  onClick={() => handleDelete(problem)}
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
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
          p: 3,
          minHeight: '100vh',
          maxWidth: '100%', 
          mx: 0,
          px: { xs: 2, sm: 3, md: 3 },
          pt: isMobile ? '70px' : '30px',
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ textAlign: isMobile ? 'center' : 'left' }}
        >
          {t('admin.problems.title')}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => navigate('/admin/problem/add')}
          >
            {t('admin.problems.add')}
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isMobile ? <MobileProblemList /> : <DesktopProblemTable />}

            <Stack spacing={2} sx={{ mt: 4 }} alignItems="center">
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

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>{t('admin.problems.confirmDeleteTitle')}</DialogTitle>
          <DialogContent>
            <Typography>
              {t('admin.problems.confirmDeleteMessage', {
                name: selectedProblem?.name,
              })}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
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
    </>
  );
};

export default AdminProblems;