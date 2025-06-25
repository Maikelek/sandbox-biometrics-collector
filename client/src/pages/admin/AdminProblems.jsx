import React, { useState } from 'react';
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
  Pagination,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AdminSidebar from '../../components/AdminSidebar';

const fakeProblems = [
  { id: 1, title: 'Two Sum', difficulty: 'easy', status: 'active' },
  { id: 2, title: 'Reverse Linked List', difficulty: 'medium', status: 'active' },
  { id: 3, title: 'Merge Intervals', difficulty: 'hard', status: 'inactive' },
  { id: 4, title: 'Binary Search', difficulty: 'easy', status: 'active' },
  { id: 5, title: 'Clone Graph', difficulty: 'hard', status: 'active' },
  { id: 6, title: 'Valid Parentheses', difficulty: 'easy', status: 'inactive' },
  { id: 7, title: 'Longest Substring', difficulty: 'medium', status: 'active' },
  { id: 8, title: 'Graph Valid Tree', difficulty: 'medium', status: 'active' },
];

const AdminProblems = () => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const limit = 8;
  const totalPages = Math.ceil(fakeProblems.length / limit);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const problemsToShow = fakeProblems.slice((page - 1) * limit, page * limit);

  const handleEdit = (problemId) => {
    alert(`Edit problem ${problemId}`);
  };

  const handleDelete = (problemId) => {
    alert(`Delete problem ${problemId}`);
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

        <Paper elevation={3} sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t('problems.name')}</TableCell>
                <TableCell>{t('problems.difficulty')}</TableCell>
                <TableCell align="right">{t('problems.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {problemsToShow.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell>{problem.id}</TableCell>
                  <TableCell>{problem.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={t(`problems.levels.${problem.difficulty}`)}
                      color={
                        problem.difficulty === 'easy'
                          ? 'success'
                          : problem.difficulty === 'medium'
                          ? 'warning'
                          : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                      onClick={() => handleEdit(problem.id)}
                    >
                      {t('admin.users.edit')}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(problem.id)}
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
      </Box>
    </>
  );
};

export default AdminProblems;
