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
  Button,
  Paper,
  CircularProgress,
  Pagination,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NavBar from '../components/NavBar';
import { useUser } from "../context/UserContext";
import { Link } from 'react-router-dom';
import axios from 'axios';

const difficultyColor = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'error',
};

const Problems = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;
  const userId = user ? user.id : null;

  const fetchProblems = useCallback((currentPage) => {
    if (!userId) return;

    setLoading(true);
    axios
      .get(`http://localhost:1234/problem/${userId}?page=${currentPage}`, {
        withCredentials: true,
      })
      .then((res) => {
        const { problems, done, total } = res.data;

        const enhancedProblems = problems.map((problem) => ({
          ...problem,
          tags: problem.tags.split(',').map((tag) => tag.trim()),
          solved: done.includes(problem.id),
        }));

        setProblems(enhancedProblems);
        setTotalPages(Math.ceil(total / limit));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading problems:', err);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    fetchProblems(page);
  }, [fetchProblems, page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <>
      <NavBar />
      <Box sx={{ px: 4, py: 6 }}>
        <Typography variant="h4" gutterBottom>
          {t('problems.title')}
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
                    <TableCell>{t('problems.status')}</TableCell>
                    <TableCell>{t('problems.actions')}</TableCell>
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
                          color={difficultyColor[problem.difficulty]}
                        />
                      </TableCell>
                      <TableCell>
                        {problem.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{ mr: 0.5 }}
                            variant="outlined"
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            problem.solved
                              ? t('problems.status_solved')
                              : t('problems.status_unsolved')
                          }
                          color={problem.solved ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="contained" 
                                size="small"
                                component={Link} 
                                to={`/editor/${problem.id}`}
                        >
                          {t('problems.solve')}
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

export default Problems;
