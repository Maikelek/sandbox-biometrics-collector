import React, { useEffect, useState } from 'react';
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

const AdminProblemEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const problemId = location.pathname.split("/")[3];
  const isEditMode = problemId && problemId !== 'add';

  const [problem, setProblem] = useState({
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
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchTags = axios.get(`http://localhost:1234/admin/tags`, { withCredentials: true })
      .then(res => res.data || [])
      .catch(err => {
        console.error('Error fetching tags:', err);
        return [];
      });

    if (!isEditMode) {
      setLoading(false);
      fetchTags.then(setTags);
      return;
    }

    setLoading(true);
    Promise.all([
      axios.get(`http://localhost:1234/admin/problem/${problemId}`, { withCredentials: true }),
      fetchTags
    ])
      .then(([problemRes, allTags]) => {
        setProblem(problemRes.data.problem || problemRes.data);
        setTags(allTags);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
      })
      .finally(() => setLoading(false));
  }, [isEditMode, problemId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProblem((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (value, name) => {
    setProblem((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};

    if (!problem.name.trim()) newErrors.name = t('validation.required');
    if (!problem.problem.trim()) newErrors.problem = t('validation.required');
    if (!problem.difficulty) newErrors.difficulty = t('validation.required');
    if (!problem.description_slovak.trim()) newErrors.description_slovak = t('validation.required');
    if (!problem.description_english.trim()) newErrors.description_english = t('validation.required');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    setSaving(true);
    const method = isEditMode ? axios.put : axios.post;
    const url = isEditMode
      ? `http://localhost:1234/admin/problem/${problemId}`
      : `http://localhost:1234/admin/problems`;

    method(url, problem, { withCredentials: true })
      .then(() => {
        setSnackbarOpen(true);
        setTimeout(() => navigate('/admin/problems'), 1500);
      })
      .catch((err) => {
        console.error('Error saving problem:', err);
        alert(
          isEditMode
            ? t('admin.problems.updateError') || 'Error updating problem'
            : t('admin.problems.createError') || 'Error creating problem'
        );
      })
      .finally(() => setSaving(false));
  };

  const selectedTags = problem.problem_tags
    ? problem.problem_tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];

  const renderMonacoEditor = (language, valueKey) => (
    <Box 
      sx={{ 
        width: isDesktop ? 'calc(33.333% - 16px)' : '100%', 
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {language.toUpperCase()}
      </Typography>
      <Paper
        variant="outlined"
        sx={{ height: 200, overflow: 'hidden', borderRadius: 3, backgroundColor: '#1e1e1e' }}
      >
        <Editor
          height="200px"
          defaultLanguage={language}
          value={problem[valueKey] || ''}
          onChange={(value) => handleEditorChange(value, valueKey)}
          theme="vs-dark"
          options={{ fontSize: 14, minimap: { enabled: false } }}
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
            p: 3, 
            textAlign: 'center', 
            minHeight: '100vh',
            pt: isDesktop ? 3 : 10,
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
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          maxWidth: '100%',
          mx: 0,
          pt: isDesktop ? 3 : 10,
        }}
      >
        <Paper 
          elevation={4} 
          sx={{ 
            p: { xs: 2, sm: 3, md: 5 },
            maxWidth: 1000, 
            width: '100%', 
            borderRadius: 4,
            mt: isDesktop ? 0 : 2,
          }}
        >
          <Typography 
            variant="h4" 
            align="center" 
            gutterBottom 
            fontWeight={600} 
            color="primary"
            sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
          >
            {isEditMode ? t('admin.problems.editTitle') : t('admin.problems.addTitle')}
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('admin.problems.basicInfo')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {isEditMode && (
                <TextField label="ID" value={problem.id} disabled fullWidth />
              )}
              <TextField
                label={t('admin.problems.name')}
                name="name"
                value={problem.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                fullWidth
              />
              <TextField
                label={t('admin.problems.functionName')}
                name="problem"
                value={problem.problem}
                onChange={handleChange}
                error={!!errors.problem}
                helperText={errors.problem}
                fullWidth
                disabled={isEditMode}
              />
              <FormControl fullWidth error={!!errors.difficulty}>
                <InputLabel>{t('admin.problems.difficulty')}</InputLabel>
                <Select
                  name="difficulty"
                  value={problem.difficulty || ''}
                  onChange={handleChange}
                  label={t('admin.problems.difficulty')}
                  renderValue={(selected) => {
                    const option = difficultyOptions.find((d) => d.value === selected);
                    return option ? (
                      <Chip label={option.label} color={option.color} variant="outlined" />
                    ) : selected;
                  }}
                >
                  {difficultyOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Chip label={opt.label} color={opt.color} size="small" sx={{ mr: 1 }} />
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.difficulty && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.difficulty}
                  </Typography>
                )}
              </FormControl>
            </Stack>
          </Box>

          {[
            ['slovak', 'SK'],
            ['english', 'EN'],
          ].map(([lang, label]) => (
            <Box key={lang} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {label}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <TextField
                  label={t('admin.problems.description')}
                  name={`description_${lang}`}
                  multiline
                  minRows={3}
                  value={problem[`description_${lang}`] || ''}
                  onChange={handleChange}
                  error={!!errors[`description_${lang}`]}
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
            </Box>
          ))}

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('admin.problems.examples')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
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
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('admin.problems.starterCode')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack 
                spacing={3} 
                direction={isDesktop ? "row" : "column"} 
                useFlexGap 
                flexWrap="wrap"
                justifyContent="space-between"
            >
              {renderMonacoEditor('python', 'starter_code_py')}
              {renderMonacoEditor('java', 'starter_code_java')}
              {renderMonacoEditor('c', 'starter_code_c')}
            </Stack>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('admin.problems.tags')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Autocomplete
              multiple
              options={tags.map((tag) => tag.name)}
              value={selectedTags}
              onChange={(event, newValue) => {
                setProblem((prev) => ({ ...prev, problem_tags: newValue.join(', ') }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip key={option} variant="outlined" label={option} {...getTagProps({ index })} />
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
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              sx={{ px: 4, mb: { xs: 2, sm: 0 } }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? t('saving') || 'Saving...'
                : isEditMode
                ? t('save')
                : t('admin.problems.addButton') || 'Add'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ px: 4 }}
              onClick={() => navigate('/admin/problems')}
              disabled={saving}
            >
              {t('cancel')}
            </Button>
          </Stack>
        </Paper>
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
          variant="filled"
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