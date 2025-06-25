import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Paper,
  CircularProgress,
  Pagination,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar';

const AdminUsers = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:1234/admin/users?page=${page}`)
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

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleEdit = (userId) => {
    alert(`Edit user ${userId}`);
  };

  const handleDelete = (userId) => {
    alert(`Delete user ${userId}`);
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
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1 }}
                          onClick={() => handleEdit(user.id)}
                        >
                          {t('admin.users.edit')}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(user.id)}
                        >
                          {t('admin.users.delete')}
                        </Button>
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
      </Box>
    </>
  );
};

export default AdminUsers;
