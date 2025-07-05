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
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

const difficultyColor = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

const AdminProblems = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const limit = 8;

  const fetchProblems = useCallback(() => {
    setLoading(true);
    axios
      .get(`http://localhost:1234/admin/problems?page=${page}`, {
        withCredentials: true,
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
  }, [page]);

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

  return (
    <>
      <AdminSidebar />
      <Box
        component="main"
        sx={{
          ml: { xs: '72px', sm: '72px', md: '240px' },
          p: 3,
          minHeight: '100vh',
        }}
      >
        <Typography variant="h4" gutterBottom>
          {t('admin.problems.title')}
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Paper elevation={3} sx={{ overflowX: 'auto' }}>
              <Table>
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
                    <TableRow key={problem.id}>
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

            <Stack spacing={2} sx={{ mt: 4 }} alignItems="center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
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
