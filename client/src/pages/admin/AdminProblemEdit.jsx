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

  useEffect(() => {
    if (!isEditMode) {
      setLoading(false);
      axios.get(`http://localhost:1234/admin/tags`, { withCredentials: true })
        .then(res => setTags(res.data || []))
        .catch(err => console.error('Error fetching tags:', err));
      return;
    }

    setLoading(true);
    axios
      .get(`http://localhost:1234/admin/problem/${problemId}`, {
        withCredentials: true,
      })
      .then((res) => {
        setProblem(res.data.problem || res.data);
        setTags(res.data.allTags || []);
      })
      .catch((err) => {
        console.error('Error fetching problem:', err);
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

  const handleSave = () => {
    setSaving(true);
    if (isEditMode) {
      axios
        .put(
          `http://localhost:1234/admin/problem/${problemId}`,
          problem,
          { withCredentials: true }
        )
        .then(() => {
          setSnackbarOpen(true);
          setTimeout(() => navigate('/admin/problems'), 1500);
        })
        .catch((err) => {
          console.error('Error updating problem:', err);
          alert(t('admin.problems.updateError') || 'Error updating problem');
        })
        .finally(() => setSaving(false));
    } else {
      axios
        .post(
          `http://localhost:1234/admin/problems`,
          problem,
          { withCredentials: true }
        )
        .then(() => {
          setSnackbarOpen(true);
          setTimeout(() => navigate('/admin/problems'), 1500);
        })
        .catch((err) => {
          console.error('Error creating problem:', err);
          alert(t('admin.problems.createError') || 'Error creating problem');
        })
        .finally(() => setSaving(false));
    }
  };

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <Box sx={{ ml: { xs: '72px', md: '240px' }, p: 3, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  const selectedTags = problem.problem_tags
    ? problem.problem_tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];

  const renderMonacoEditor = (language, valueKey) => (
    <Box>
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

  return (
    <>
      <AdminSidebar />
      <Box
        sx={{
          ml: { xs: '72px', md: '240px' },
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
        }}
      >
        <Paper elevation={4} sx={{ p: 5, maxWidth: 1000, width: '100%', borderRadius: 4 }}>
          <Typography variant="h4" align="center" gutterBottom fontWeight={600} color="primary">
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
                fullWidth
              />
              <TextField
                label={t('admin.problems.functionName')}
                value={problem.problem}
                disabled={isEditMode}
                onChange={handleChange}
                name="problem"
                fullWidth
              />
              <FormControl fullWidth>
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
                    ) : (
                      selected
                    );
                  }}
                >
                  {difficultyOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Chip label={opt.label} color={opt.color} size="small" sx={{ mr: 1 }} />
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
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
            <Stack spacing={3}>
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

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{ px: 4 }}
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
