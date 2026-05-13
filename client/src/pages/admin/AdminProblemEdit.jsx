import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Divider,
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Chip,
  useTheme,
  Autocomplete,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Editor from '@monaco-editor/react';

import AdminSidebar from '../../components/AdminSidebar';

const difficultyOptions = [
  { value: 'Easy', label: 'Easy', color: 'success' },
  { value: 'Medium', label: 'Medium', color: 'warning' },
  { value: 'Hard', label: 'Hard', color: 'error' },
];

const defaultProblem = {
  id: '',
  name: '',
  problem: '',
  difficulty: '',
  description_slovak: '',
  description_english: '',
  input_slovak: '',
  input_english: '',
  output_slovak: '',
  output_english: '',
  example_input: '',
  example_output: '',
  starter_code_py: '',
  starter_code_java: '',
  starter_code_c: '',
  problem_tags: '',
};

const ProblemSection = ({ title, children, sx }) => {
  return (
    <Paper elevation={0} sx={sx}>
      <Typography variant="h6" sx={{ fontWeight: 750, mb: 0.5 }}>
        {title}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {children}
    </Paper>
  );
};

const AdminProblemEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  const problemId = location.pathname.split('/')[3];
  const isEditMode = problemId && problemId !== 'add';

  const [problem, setProblem] = useState(defaultProblem);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

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

  const sectionSx = {
    ...cardSx,
    p: { xs: 2, sm: 3 },
  };

  useEffect(() => {
    const fetchTags = axios
      .get(`${apiBase}/admin/tags`, { withCredentials: true })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];

        return data
          .map((tag) => tag.name || tag.tag_name || tag.tag || '')
          .filter(Boolean);
      })
      .catch((err) => {
        console.error('Error fetching tags:', err);
        return [];
      });

    if (!isEditMode) {
      setLoading(false);
      fetchTags.then(setTags);
      return;
    }

    setLoading(true);
    setError('');

    Promise.all([
      axios.get(`${apiBase}/admin/problem/${problemId}`, {
        withCredentials: true,
      }),
      fetchTags,
    ])
      .then(([problemRes, allTags]) => {
        const loadedProblem = problemRes.data.problem || problemRes.data;

        setProblem({
          ...defaultProblem,
          ...loadedProblem,
        });

        setTags(allTags);
      })
      .catch((err) => {
        console.error('Error fetching problem data:', err);
        setError(
          t('admin.problems.loadError', {
            defaultValue: 'Nepodarilo sa načítať údaje úlohy.',
          })
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiBase, isEditMode, problemId, t]);

  const selectedTags = useMemo(() => {
    return problem.problem_tags
      ? String(problem.problem_tags)
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
  }, [problem.problem_tags]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProblem((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleEditorChange = (value, name) => {
    setProblem((prev) => ({
      ...prev,
      [name]: value || '',
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!problem.name.trim()) {
      newErrors.name = t('validation.required');
    }

    if (!problem.problem.trim()) {
      newErrors.problem = t('validation.required');
    }

    if (!problem.difficulty) {
      newErrors.difficulty = t('validation.required');
    }

    if (!problem.description_slovak.trim()) {
      newErrors.description_slovak = t('validation.required');
    }

    if (!problem.description_english.trim()) {
      newErrors.description_english = t('validation.required');
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    setSaving(true);
    setError('');

    const request = isEditMode
      ? axios.put(`${apiBase}/admin/problem/${problemId}`, problem, {
          withCredentials: true,
        })
      : axios.post(`${apiBase}/admin/problems`, problem, {
          withCredentials: true,
        });

    request
      .then(() => {
        setSnackbarOpen(true);
        setTimeout(() => navigate('/admin/problems'), 1200);
      })
      .catch((err) => {
        console.error('Error saving problem:', err);
        setError(
          isEditMode
            ? t('admin.problems.updateError', {
                defaultValue: 'Nepodarilo sa upraviť úlohu.',
              })
            : t('admin.problems.createError', {
                defaultValue: 'Nepodarilo sa vytvoriť úlohu.',
              })
        );
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const renderMonacoEditor = (language, valueKey, title) => (
    <Box
      key={valueKey}
      sx={{
        width: isDesktop ? 'calc(33.333% - 16px)' : '100%',
        minWidth: 0,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1,
          fontWeight: 750,
          color: isDarkMode ? '#fff' : '#111827',
        }}
      >
        {title}
      </Typography>

      <Paper
        elevation={0}
        sx={{
          height: 210,
          overflow: 'hidden',
          borderRadius: 2.5,
          backgroundColor: '#1e1e1e',
          border: `1px solid ${
            isDarkMode ? alpha('#ffffff', 0.1) : '#d1d5db'
          }`,
        }}
      >
        <Editor
          height="210px"
          defaultLanguage={language}
          value={problem[valueKey] || ''}
          onChange={(value) => handleEditorChange(value, valueKey)}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 10, bottom: 10 },
          }}
        />
      </Paper>
    </Box>
  );

  if (loading) {
    return (
      <>
        <AdminSidebar />

        <Box
          sx={{
            ml: { xs: 0, md: '240px' },
            minHeight: '100vh',
            backgroundColor: isDarkMode ? '#0f1117' : '#f6f7fb',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pt: isMobile ? '76px' : 4,
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

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
                {isEditMode
                  ? t('admin.problems.editTitle')
                  : t('admin.problems.addTitle')}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, textAlign: { xs: 'center', sm: 'left' } }}
              >
                {isEditMode
                  ? t('admin.problems.editSubtitle', {
                      defaultValue:
                        'Úprava zadania, prekladov, tagov a štartovacieho kódu.',
                    })
                  : t('admin.problems.addSubtitle', {
                      defaultValue: 'Vytvorenie novej úlohy pre používateľov.',
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
                onClick={() => navigate('/admin/problems')}
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 650,
                }}
              >
                {t('cancel')}
              </Button>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 650,
                  minWidth: 120,
                }}
              >
                {saving
                  ? t('saving', { defaultValue: 'Ukladám...' })
                  : isEditMode
                  ? t('save')
                  : t('admin.problems.addButton', { defaultValue: 'Pridať' })}
              </Button>
            </Stack>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <ProblemSection title={t('admin.problems.basicInfo')} sx={sectionSx}>
              <Stack spacing={2}>
                {isEditMode && (
                  <TextField label="ID" value={problem.id} disabled fullWidth />
                )}

                <TextField
                  label={t('admin.problems.name')}
                  name="name"
                  value={problem.name}
                  onChange={handleChange}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  fullWidth
                />

                <TextField
                  label={t('admin.problems.functionName')}
                  name="problem"
                  value={problem.problem}
                  onChange={handleChange}
                  error={Boolean(errors.problem)}
                  helperText={
                    errors.problem ||
                    t('admin.problems.functionNameHint', {
                      defaultValue:
                        'Názov funkcie, ktorú bude používateľ implementovať.',
                    })
                  }
                  fullWidth
                  disabled={isEditMode}
                />

                <FormControl fullWidth error={Boolean(errors.difficulty)}>
                  <InputLabel>{t('admin.problems.difficulty')}</InputLabel>

                  <Select
                    name="difficulty"
                    value={problem.difficulty || ''}
                    onChange={handleChange}
                    label={t('admin.problems.difficulty')}
                    renderValue={(selected) => {
                      const option = difficultyOptions.find(
                        (difficulty) => difficulty.value === selected
                      );

                      return option ? (
                        <Chip
                          label={option.label}
                          color={option.color}
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      ) : (
                        selected
                      );
                    }}
                  >
                    {difficultyOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Chip
                          label={option.label}
                          color={option.color}
                          size="small"
                          sx={{ mr: 1, fontWeight: 700 }}
                        />
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors.difficulty && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 1.5 }}
                    >
                      {errors.difficulty}
                    </Typography>
                  )}
                </FormControl>
              </Stack>
            </ProblemSection>

            {[
              ['slovak', 'SK'],
              ['english', 'EN'],
            ].map(([lang, label]) => (
              <ProblemSection
                key={lang}
                title={`${label} ${t('admin.problems.content', {
                  defaultValue: 'obsah',
                })}`}
                sx={sectionSx}
              >
                <Stack spacing={2}>
                  <TextField
                    label={t('admin.problems.description')}
                    name={`description_${lang}`}
                    multiline
                    minRows={4}
                    value={problem[`description_${lang}`] || ''}
                    onChange={handleChange}
                    error={Boolean(errors[`description_${lang}`])}
                    helperText={errors[`description_${lang}`]}
                    fullWidth
                  />

                  <TextField
                    label={t('admin.problems.input')}
                    name={`input_${lang}`}
                    multiline
                    minRows={2}
                    value={problem[`input_${lang}`] || ''}
                    onChange={handleChange}
                    fullWidth
                  />

                  <TextField
                    label={t('admin.problems.output')}
                    name={`output_${lang}`}
                    multiline
                    minRows={2}
                    value={problem[`output_${lang}`] || ''}
                    onChange={handleChange}
                    fullWidth
                  />
                </Stack>
              </ProblemSection>
            ))}

            <ProblemSection title={t('admin.problems.examples')} sx={sectionSx}>
              <Stack spacing={2}>
                <TextField
                  label={t('admin.problems.exampleInput')}
                  name="example_input"
                  multiline
                  minRows={2}
                  value={problem.example_input || ''}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label={t('admin.problems.exampleOutput')}
                  name="example_output"
                  multiline
                  minRows={2}
                  value={problem.example_output || ''}
                  onChange={handleChange}
                  fullWidth
                />
              </Stack>
            </ProblemSection>

            <ProblemSection title={t('admin.problems.starterCode')} sx={sectionSx}>
              <Stack
                spacing={3}
                direction={isDesktop ? 'row' : 'column'}
                useFlexGap
                flexWrap="wrap"
                justifyContent="space-between"
              >
                {renderMonacoEditor('python', 'starter_code_py', 'Python')}
                {renderMonacoEditor('java', 'starter_code_java', 'Java')}
                {renderMonacoEditor('c', 'starter_code_c', 'C')}
              </Stack>
            </ProblemSection>

            <ProblemSection title={t('admin.problems.tags')} sx={sectionSx}>
              <Autocomplete
                multiple
                options={tags}
                value={selectedTags}
                onChange={(event, newValue) => {
                  setProblem((prev) => ({
                    ...prev,
                    problem_tags: newValue.join(', '),
                  }));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option}
                      variant="outlined"
                      label={option}
                      sx={{ borderRadius: 2 }}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label={t('admin.problems.tags')}
                    placeholder={t('admin.problems.selectTags')}
                  />
                )}
              />
            </ProblemSection>

            <Paper
              elevation={0}
              sx={{
                ...cardSx,
                p: 2,
                position: { md: 'sticky' },
                bottom: { md: 16 },
                zIndex: 2,
                backgroundColor: isDarkMode
                  ? alpha('#171a22', 0.94)
                  : alpha('#ffffff', 0.94),
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="flex-end"
              >
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/admin/problems')}
                  disabled={saving}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 650,
                  }}
                >
                  {t('cancel')}
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 650,
                    minWidth: 140,
                  }}
                >
                  {saving
                    ? t('saving', { defaultValue: 'Ukladám...' })
                    : isEditMode
                    ? t('save')
                    : t('admin.problems.addButton', { defaultValue: 'Pridať' })}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {isEditMode
            ? t('admin.problems.updateSuccess')
            : t('admin.problems.createSuccess')}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminProblemEdit;