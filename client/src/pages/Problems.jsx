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
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { CheckCircle, AccessTime, School, Category, PlayArrow } from '@mui/icons-material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useUser();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;
  const userId = user ? user.id : null;

  const fetchProblems = useCallback((currentPage) => {
    if (!userId) {
        setLoading(false);
        return;
    }

    setLoading(true);
    axios
      .get(`http://localhost:1234/problem/${userId}?page=${currentPage}&limit=${limit}`, {
        withCredentials: true,
      })
      .then((res) => {
        const { problems, done, total } = res.data;

        const enhancedProblems = problems.map((problem) => ({
          ...problem,
          tags: problem.tags ? problem.tags.split(',').map((tag) => tag.trim()).filter(tag => tag.length > 0) : [],
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const MobileDetailRow = ({ icon, label, children }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {icon}
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Box>{children}</Box>
    </Box>
  );

  const MobileProblemList = () => (
    <Stack spacing={3}>
      {problems.map((problem) => (
        <Card key={problem.id} elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {problem.name}
              </Typography>
              <Chip
                label={`#${problem.id}`}
                size="small"
                variant="outlined"
              />
            </Stack>

            <Divider sx={{ my: 1 }} />
            
            <MobileDetailRow 
              icon={<School fontSize="small" color="primary" />} 
              label={t('problems.difficulty')}
            >
              <Chip
                label={t(`problems.levels.${problem.difficulty.toLowerCase()}`)}
                color={difficultyColor[problem.difficulty]}
                size="small"
              />
            </MobileDetailRow>

            <MobileDetailRow 
              icon={problem.solved ? <CheckCircle fontSize="small" color="success" /> : <AccessTime fontSize="small" color="action" />} 
              label={t('problems.status')}
            >
              <Chip
                label={problem.solved ? t('problems.status_solved') : t('problems.status_unsolved')}
                color={problem.solved ? 'success' : 'default'}
                variant="outlined"
                size="small"
              />
            </MobileDetailRow>
            
            <Box mt={1}>
                <Typography variant="body2" fontWeight={600} mb={0.5} display="flex" alignItems="center" color="text.secondary">
                    <Category fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} /> {t('problems.tags')}:
                </Typography>
                <Box>
                    {problem.tags.length > 0 ? (
                        problem.tags.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                                variant="outlined"
                            />
                        ))
                    ) : (
                        <Typography variant="caption" color="text.disabled">
                            {t('problems.no_tags')}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Button 
              variant="contained" 
              fullWidth 
              size="medium"
              sx={{ mt: 2 }}
              component={Link} 
              to={`/editor/${problem.id}`}
              startIcon={<PlayArrow />}
            >
              {t('problems.solve')}
            </Button>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  const DesktopProblemTable = () => (
    <Paper elevation={3} sx={{ overflowX: 'auto' }}>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell sx={{ width: '5%' }}>#</TableCell>
                    <TableCell sx={{ width: '30%', fontWeight: 600 }}>{t('problems.name')}</TableCell>
                    <TableCell sx={{ width: '15%', fontWeight: 600 }}>{t('problems.difficulty')}</TableCell>
                    <TableCell sx={{ width: '35%', fontWeight: 600 }}>{t('problems.tags')}</TableCell>
                    <TableCell sx={{ width: '15%', fontWeight: 600 }}>{t('problems.status')}</TableCell>
                    <TableCell sx={{ width: '10%', fontWeight: 600 }}>{t('problems.actions')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {problems.map((problem) => (
                    <TableRow key={problem.id} hover>
                        <TableCell>{problem.id}</TableCell>
                        <TableCell>
                           <Typography 
                            variant="body1" 
                            component={Link} 
                            to={`/editor/${problem.id}`}
                            sx={{
                                textDecoration: 'none',
                                fontWeight: 500,
                                color: 'primary.main',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                           >
                            {problem.name}
                           </Typography>
                        </TableCell>
                        <TableCell>
                            <Chip
                                label={t(`problems.levels.${problem.difficulty.toLowerCase()}`)}
                                color={difficultyColor[problem.difficulty]}
                                size="small"
                            />
                        </TableCell>
                        <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {problem.tags.map((tag, index) => (
                                    <Chip
                                        key={index}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                        sx={{ mb: 0.5 }}
                                    />
                                ))}
                            </Stack>
                        </TableCell>
                        <TableCell>
                            <Chip
                                label={problem.solved ? t('problems.status_solved') : t('problems.status_unsolved')}
                                color={problem.solved ? 'success' : 'default'}
                                variant="outlined"
                                size="small"
                                icon={problem.solved ? <CheckCircle fontSize="small" /> : <AccessTime fontSize="small" />}
                            />
                        </TableCell>
                        <TableCell>
                            <Button variant="contained" 
                                size="small"
                                component={Link} 
                                to={`/editor/${problem.id}`}
                                startIcon={<PlayArrow fontSize="small" />}
                            >
                                {t('problems.solve')}
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </Paper>
  );

  return (
    <>
      <NavBar />
      <Box 
        sx={{ 
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 4, md: 6 },
          maxWidth: 1400,
          mx: 'auto',
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
          {t('problems.title')}
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isMobile ? <MobileProblemList /> : <DesktopProblemTable />}

            {totalPages > 1 && (
                <Stack spacing={2} sx={{ mt: 4 }} alignItems="center">
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton 
                      showLastButton
                      size={isMobile ? "small" : "medium"}
                    />
                </Stack>
            )}
            
            {problems.length === 0 && !loading && (
                 <Typography variant="body1" color="text.secondary" textAlign="center" py={5}>
                    {t('problems.no_problems_found')}
                 </Typography>
            )}
          </>
        )}
      </Box>
    </>
  );
};

export default Problems;