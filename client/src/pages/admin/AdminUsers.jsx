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

const AdminUsers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const limit = 8;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    axios
      .get(`http://localhost:1234/admin/users?page=${page}`, {
        withCredentials: true,
        params: { limit },
      })
      .then((res) => {
        const { users, total } = res.data;
        const mappedUsers = users.map((user) => ({
          ...user,
          role: user.isAdmin ? 'admin' : 'user',
        }));
        setUsers(mappedUsers);
        setTotalPages(Math.ceil(total / limit));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
        setLoading(false);
      });
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleEdit = (userId) => {
    navigate(`/admin/user/${userId}`);
  };

  const handleAddUser = () => {
    navigate('/admin/user/add');
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`http://localhost:1234/admin/users`, {
        withCredentials: true,
        data: { id: selectedUser.id },
      })
      .then(() => {
        setSnackbarOpen(true);
        setDeleteDialogOpen(false);
        fetchUsers();
      })
      .catch((err) => {
        console.error('Error deleting user:', err);
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
          {t('admin.users.title')}
        </Typography>

        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddUser}
          >
            {t('admin.users.addUser')}
          </Button>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Paper elevation={3} sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{t('admin.users.name')}</TableCell>
                    <TableCell>{t('role')}</TableCell>
                    <TableCell align="right">{t('problems.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={t(`${user.role}`)}
                          color={user.role === 'admin' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="edit"
                          color="primary"
                          onClick={() => handleEdit(user.id)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          color="error"
                          onClick={() => handleDelete(user)}
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

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>{t('admin.users.confirmDeleteTitle')}</DialogTitle>
          <DialogContent>
            <Typography>
              {t('admin.users.confirmDeleteMessage', {
                name: selectedUser?.name,
              })}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={confirmDelete} color="error">
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
            {t('admin.users.deletedSuccess')}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default AdminUsers;
