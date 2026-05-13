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
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CheckCircle,
  AccessTime,
  School,
  Category,
  PlayArrow,
  AssignmentOutlined,
  Search,
  Clear,
  FilterList,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import NavBar from '../components/NavBar';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const difficultyColor = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'error',
};

const limit = 8;
const fetchLimit = 1000;

const Problems = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = theme.palette.mode === 'dark';

  const { user } = useUser();

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const userId = user?.id || user?.user_id || null;

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

  const fetchProblems = useCallback(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    axios
      .get(`${apiBase}/problem/${userId}`, {
        withCredentials: true,
        params: {
          page: 1,
          limit: fetchLimit,
        },
      })
      .then((res) => {
        const { problems: loadedProblems = [], done = [] } = res.data;

        const doneIds = new Set(done.map((id) => String(id)));

        const enhancedProblems = loadedProblems.map((problem) => ({
          ...problem,
          tags: problem.tags
            ? String(problem.tags)
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
          solved: doneIds.has(String(problem.id)),
        }));

        setProblems(enhancedProblems);
      })
      .catch((err) => {
        console.error('Error loading problems:', err);
        setError(t('problems.loadError'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiBase, userId, t]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const getDifficultyLabel = (difficulty) => {
    return t(`problems.levels.${String(difficulty).toLowerCase()}`);
  };

  const allTags = useMemo(() => {
    const tagSet = new Set();

    problems.forEach((problem) => {
      problem.tags.forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [problems]);

  const availableDifficulties = useMemo(() => {
    const difficultySet = new Set();

    problems.forEach((problem) => {
      if (problem.difficulty) {
        difficultySet.add(problem.difficulty);
      }
    });

    return Array.from(difficultySet);
  }, [problems]);

  const filteredProblems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return problems.filter((problem) => {
      const problemName = String(problem.name || '').toLowerCase();
      const functionName = String(problem.problem || '').toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        problemName.includes(normalizedSearch) ||
        functionName.includes(normalizedSearch);

      const matchesDifficulty =
        difficultyFilter === 'all' || problem.difficulty === difficultyFilter;

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((selectedTag) => problem.tags.includes(selectedTag));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'solved' && problem.solved) ||
        (statusFilter === 'unsolved' && !problem.solved);

      return (
        matchesSearch &&
        matchesDifficulty &&
        matchesTags &&
        matchesStatus
      );
    });
  }, [problems, searchTerm, difficultyFilter, selectedTags, statusFilter]);

  const totalPages = Math.max(Math.ceil(filteredProblems.length / limit), 1);

  const paginatedProblems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredProblems.slice(start, start + limit);
  }, [filteredProblems, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, difficultyFilter, selectedTags, statusFilter]);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagChange = (event) => {
    const value = event.target.value;
    setSelectedTags(typeof value === 'string' ? value.split(',') : value);
  };

  const handleTagClick = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDifficultyFilter('all');
    setSelectedTags([]);
    setStatusFilter('all');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() ||
    difficultyFilter !== 'all' ||
    selectedTags.length > 0 ||
    statusFilter !== 'all';

  const renderStatusChip = (solved) => (
    <Chip
      label={solved ? t('problems.status_solved') : t('problems.status_unsolved')}
      color={solved ? 'success' : 'default'}
      variant="outlined"
      size="small"
      icon={
        solved ? (
          <CheckCircle fontSize="small" />
        ) : (
          <AccessTime fontSize="small" />
        )
      }
      sx={{ fontWeight: 700 }}
    />
  );

  const renderMobileDetailRow = (icon, label, children) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 0.75,
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        {icon}

        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>

      <Box>{children}</Box>
    </Box>
  );

  const renderFiltersPanel = () => (
    <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2, md: 2.5 }, mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <FilterList color="primary" />

        <Typography variant="h6" sx={{ fontWeight: 750 }}>
          {t('problems.filters')}
        </Typography>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <TextField
          fullWidth
          label={t('problems.search_by_name')}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          size="small"
          autoComplete="off"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl fullWidth size="small">
          <InputLabel>{t('problems.difficulty')}</InputLabel>

          <Select
            value={difficultyFilter}
            label={t('problems.difficulty')}
            onChange={(event) => setDifficultyFilter(event.target.value)}
          >
            <MenuItem value="all">{t('problems.all_difficulties')}</MenuItem>

            {availableDifficulties.map((difficulty) => (
              <MenuItem key={difficulty} value={difficulty}>
                {getDifficultyLabel(difficulty)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>{t('problems.tags')}</InputLabel>

          <Select
            multiple
            value={selectedTags}
            onChange={handleTagChange}
            input={<OutlinedInput label={t('problems.tags')} />}
            renderValue={(selected) => selected.join(', ')}
          >
            {allTags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                <Checkbox checked={selectedTags.includes(tag)} />
                <ListItemText primary={tag} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>{t('problems.status')}</InputLabel>

          <Select
            value={statusFilter}
            label={t('problems.status')}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <MenuItem value="all">{t('problems.all_statuses')}</MenuItem>
            <MenuItem value="solved">{t('problems.status_solved')}</MenuItem>
            <MenuItem value="unsolved">{t('problems.status_unsolved')}</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          color="inherit"
          onClick={handleResetFilters}
          startIcon={<Clear />}
          disabled={!hasActiveFilters}
          sx={{
            minWidth: { xs: '100%', md: 150 },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          {t('problems.reset_filters')}
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('problems.filtered_count')}: {filteredProblems.length} / {problems.length}
      </Typography>
    </Paper>
  );

  const renderTags = (tags) => {
    if (tags.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          —
        </Typography>
      );
    }

    return (
      <Stack direction="row" gap={0.75} flexWrap="wrap">
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            variant="outlined"
            onClick={() => handleTagClick(tag)}
            sx={{
              borderRadius: 2,
              cursor: 'pointer',
            }}
          />
        ))}
      </Stack>
    );
  };

  const renderMobileProblemList = () => (
    <Stack spacing={2}>
      {paginatedProblems.map((problem) => (
        <Card key={problem.id} elevation={0} sx={cardSx}>
          <CardContent sx={{ p: 2.25 }}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 750 }}>
                  {problem.name}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  #{problem.id} · {problem.problem}
                </Typography>
              </Box>

              <Chip
                label={`#${problem.id}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {renderMobileDetailRow(
              <School fontSize="small" color="primary" />,
              t('problems.difficulty'),
              <Chip
                label={getDifficultyLabel(problem.difficulty)}
                color={difficultyColor[problem.difficulty] || 'default'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}

            {renderMobileDetailRow(
              problem.solved ? (
                <CheckCircle fontSize="small" color="success" />
              ) : (
                <AccessTime fontSize="small" color="action" />
              ),
              t('problems.status'),
              renderStatusChip(problem.solved)
            )}

            <Box mt={1.5}>
              <Typography
                variant="body2"
                fontWeight={700}
                mb={1}
                display="flex"
                alignItems="center"
                color="text.secondary"
              >
                <Category
                  fontSize="small"
                  sx={{ mr: 1, color: theme.palette.primary.main }}
                />

                {t('problems.tags')}
              </Typography>

              {problem.tags.length > 0 ? (
                renderTags(problem.tags)
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {t('problems.no_tags')}
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="medium"
              sx={{
                mt: 2.25,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
              }}
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

  const renderDesktopProblemTable = () => (
    <Paper elevation={0} sx={{ ...cardSx, overflowX: 'auto' }}>
      <Table sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>{t('problems.name')}</TableCell>
            <TableCell>{t('problems.difficulty')}</TableCell>
            <TableCell>{t('problems.tags')}</TableCell>
            <TableCell>{t('problems.status')}</TableCell>
            <TableCell align="right">{t('problems.actions')}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {paginatedProblems.map((problem) => (
            <TableRow key={problem.id} hover>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {problem.id}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography
                  component={Link}
                  to={`/editor/${problem.id}`}
                  sx={{
                    textDecoration: 'none',
                    fontWeight: 700,
                    color: 'text.primary',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  {problem.name}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {problem.problem}
                </Typography>
              </TableCell>

              <TableCell>
                <Chip
                  label={getDifficultyLabel(problem.difficulty)}
                  color={difficultyColor[problem.difficulty] || 'default'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </TableCell>

              <TableCell>{renderTags(problem.tags)}</TableCell>

              <TableCell>{renderStatusChip(problem.solved)}</TableCell>

              <TableCell align="right">
                <Button
                  variant="contained"
                  size="small"
                  component={Link}
                  to={`/editor/${problem.id}`}
                  startIcon={<PlayArrow fontSize="small" />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
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
          minHeight: 'calc(100vh - 68px)',
          backgroundColor: isDarkMode ? '#0f1117' : '#f6f7fb',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 4, md: 5 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1150, mx: 'auto' }}>
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
                {t('problems.title')}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, textAlign: { xs: 'center', sm: 'left' } }}
              >
                {t('problems.subtitle')}
              </Typography>
            </Box>
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
              minHeight="45vh"
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              {renderFiltersPanel()}

              {filteredProblems.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{ ...cardSx, p: 4, textAlign: 'center' }}
                >
                  <AssignmentOutlined
                    sx={{ fontSize: 42, color: 'text.secondary', mb: 1 }}
                  />

                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t('problems.no_problems_found')}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {hasActiveFilters
                      ? t('problems.no_filtered_problems_subtitle')
                      : t('problems.no_problems_subtitle')}
                  </Typography>

                  {hasActiveFilters && (
                    <Button
                      variant="outlined"
                      onClick={handleResetFilters}
                      startIcon={<Clear />}
                      sx={{
                        mt: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                      }}
                    >
                      {t('problems.reset_filters')}
                    </Button>
                  )}
                </Paper>
              ) : (
                <>
                  {isMobile
                    ? renderMobileProblemList()
                    : renderDesktopProblemTable()}

                  {totalPages > 1 && (
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
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Problems;