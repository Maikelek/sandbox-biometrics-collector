import React, { useState, useEffect, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  useMediaQuery,
  CircularProgress,
  Chip,
} from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import NavBar from '../components/NavBar';
import {
  PlayArrow,
  Description,
  Code,
  Terminal,
  CheckCircle,
  Cancel,
  ArrowBack,
} from '@mui/icons-material';

import { useBiometricTracker } from '../hooks/useBiometricTracker';

const MainContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  height: 'calc(100vh - 64px)',
  width: '100%',
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down('sm')]: {
    height: 'auto',
    flexDirection: 'column',
  },
}));

const LeftPane = styled(Paper)(({ theme }) => ({
  width: '35%',
  minWidth: '300px',
  padding: theme.spacing(3),
  overflowY: 'auto',
  borderRadius: 0,
  boxShadow: 'none',
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    minWidth: 'auto',
    height: 'auto',
    padding: theme.spacing(2),
    order: 1,
  },
}));

const RightPane = styled('div')(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3),
  gap: theme.spacing(2),
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[900]
      : theme.palette.grey[50],
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    order: 2,
    height: 'calc(100vh - 120px)',
  },
}));

const languageMap = {
  python: 'Python',
  java: 'Java',
  c: 'C',
};

const getStarterCode = (language, problem) => {
  switch (language) {
    case 'python':
      return problem?.starter_code_py || `# ${problem?.name || ''}`;
    case 'java':
      return problem?.starter_code_java || `// ${problem?.name || ''}`;
    case 'c':
      return problem?.starter_code_c || `// ${problem?.name || ''}`;
    default:
      return '';
  }
};

const formatOutputValue = (value) => {
  if (value === null) return 'null';
  if (value === undefined) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return value;
      }
    }

    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ flexGrow: 1, overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 0 }, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const OutputBlock = ({ label, value, highlight, passed }) => {
  const theme = useTheme();

  const getBackground = () => {
    if (!highlight) {
      return theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : '#ffffff';
    }

    if (passed) {
      return theme.palette.mode === 'dark'
        ? 'rgba(46, 125, 50, 0.16)'
        : 'rgba(46, 125, 50, 0.08)';
    }

    return theme.palette.mode === 'dark'
      ? 'rgba(211, 47, 47, 0.16)'
      : 'rgba(211, 47, 47, 0.08)';
  };

  const getBorderColor = () => {
    if (!highlight) return theme.palette.divider;
    return passed ? theme.palette.success.main : theme.palette.error.main;
  };

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'block',
          mb: 0.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </Typography>

      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.35,
          borderRadius: 1.5,
          overflowX: 'auto',
          fontSize: '0.86rem',
          lineHeight: 1.6,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          backgroundColor: getBackground(),
          border: `1px solid ${getBorderColor()}`,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {formatOutputValue(value)}
      </Box>
    </Box>
  );
};

const FormattedOutput = ({ results, status, t }) => {
  const theme = useTheme();

  const isRunning = status === `${t('editor.running')}...`;

  if (isRunning) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 5 }}>
        <CircularProgress size={30} />
        <Typography color="text.secondary">
          {t('editor.running')}...
        </Typography>
      </Stack>
    );
  }

  if (results && results.length > 0) {
    const passedCount = results.filter((result) => result.passed).length;
    const totalCount = results.length;
    const allPassed = passedCount === totalCount;

    return (
      <Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={750}>
              {t('editor.executionResults')}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {passedCount}/{totalCount} {t('editor.passed').toLowerCase()}
            </Typography>
          </Box>

          <Chip
            label={
              allPassed
                ? t('editor.allTestsPassed')
                : t('editor.someTestsFailed')
            }
            color={allPassed ? 'success' : 'error'}
            icon={
              allPassed ? (
                <CheckCircle fontSize="small" />
              ) : (
                <Cancel fontSize="small" />
              )
            }
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <Stack spacing={2}>
          {results.map((r, idx) => (
            <Paper
              key={idx}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2.5,
                borderLeft: `5px solid ${
                  r.passed
                    ? theme.palette.success.main
                    : theme.palette.error.main
                }`,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.grey[900]
                    : theme.palette.grey[50],
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="subtitle1" fontWeight={750}>
                  {t('editor.testCase')} #{idx + 1}
                </Typography>

                <Chip
                  label={r.passed ? t('editor.passed') : t('editor.failed')}
                  icon={
                    r.passed ? (
                      <CheckCircle fontSize="small" />
                    ) : (
                      <Cancel fontSize="small" />
                    )
                  }
                  color={r.passed ? 'success' : 'error'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Stack spacing={1.4}>
                <OutputBlock label={t('editor.input')} value={r.input} />
                <OutputBlock label={t('editor.expected')} value={r.expected} />
                <OutputBlock
                  label={t('editor.output')}
                  value={r.output}
                  highlight
                  passed={r.passed}
                />
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2.5,
            textAlign: 'center',
            backgroundColor: allPassed
              ? theme.palette.mode === 'dark'
                ? 'rgba(46, 125, 50, 0.16)'
                : 'rgba(46, 125, 50, 0.08)'
              : theme.palette.mode === 'dark'
              ? 'rgba(211, 47, 47, 0.16)'
              : 'rgba(211, 47, 47, 0.08)',
            border: `1px solid ${
              allPassed
                ? theme.palette.success.main
                : theme.palette.error.main
            }`,
          }}
        >
          <Typography variant="h6" fontWeight={750}>
            {allPassed
              ? `${t('editor.allTestsPassed')} ✅`
              : `${t('editor.someTestsFailed')} ❌`}
          </Typography>

          {allPassed && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {t('editor.problemSolvedMessage')}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        borderRadius: 2,
        minHeight: 160,
        fontSize: '0.9rem',
        lineHeight: 1.7,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        backgroundColor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
        border: `1px solid ${theme.palette.divider}`,
        whiteSpace: 'pre-wrap',
      }}
    >
      {status}
    </Box>
  );
};

const CodeEditor = () => {
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const problemId = location.pathname.split('/')[2];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const languageRef = useRef('python');

  const { setEditorInstance, getMetrics, clearMetrics } =
    useBiometricTracker();

  const apiBase = useMemo(() => {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';
  }, []);

  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('python');
  const [rawOutput, setRawOutput] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loadingCode, setLoadingCode] = useState(true);
  const [taskSolved, setTaskSolved] = useState(false);

  const [userCode, setUserCode] = useState({
    python: null,
    java: null,
    c: null,
  });

  const isRunning = rawOutput === `${t('editor.running')}...`;

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    setEditorInstance(editor);

    if (problem) {
      const initialCode =
        userCode[language] || getStarterCode(language, problem);
      editor.setValue(initialCode);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRunCode = async () => {
    const code = editorRef.current?.getValue();

    if (!problem || !user || !code) return;

    setUserCode((prev) => ({
      ...prev,
      [language]: code,
    }));

    try {
      setRawOutput(`${t('editor.running')}...`);
      setTestResults(null);
      setTaskSolved(false);

      if (isMobile) {
        setTabValue(2);
      } else {
        setDialogOpen(true);
      }

      const metrics = getMetrics();

      const payload = {
        code,
        language,
        problem: problem?.problem || '',
        userId: user?.id || user?.user_id || null,
        problemId: problem?.id || null,

        mouse_moves: metrics.mouse_moves,
        other_events: metrics.other_events,

        typing_metrics: metrics.typing_metrics,
        typing_sessions: metrics.typing_sessions,

        screen_h: window.innerHeight,
        screen_w: window.innerWidth,
      };

      const response = await axios.post(`${apiBase}/code`, payload, {
        withCredentials: true,
      });

      if (response.data.results?.length > 0) {
        const results = response.data.results;
        const allPassed = results.every((r) => r.passed);

        setTestResults(results);

        const finalStatus = allPassed
          ? `${t('editor.allTestsPassed')} ✅`
          : `${t('editor.someTestsFailed')} ❌`;

        setRawOutput(finalStatus);

        if (allPassed) {
          setTaskSolved(true);
        }
      } else {
        setTestResults(null);
        setRawOutput(response.data.output || t('editor.noOutput'));
      }

      clearMetrics();
    } catch (err) {
      console.error('Error running code:', err);
      setTestResults(null);
      setTaskSolved(false);
      setRawOutput(
        `${t('error')}: ${err.response?.data?.error || err.message}`
      );
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleBackToProblems = () => {
    navigate('/problems');
  };

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;

    if (problem && editorRef.current && monacoRef.current) {
      const currentCode = editorRef.current.getValue();

      setUserCode((prev) => ({
        ...prev,
        [language]: currentCode,
      }));

      setLanguage(newLang);
      languageRef.current = newLang;

      const codeToSet = userCode[newLang] || getStarterCode(newLang, problem);

      editorRef.current.setValue(codeToSet);
      monacoRef.current.editor.setModelLanguage(
        editorRef.current.getModel(),
        newLang
      );

      clearMetrics();
    } else {
      setLanguage(newLang);
      languageRef.current = newLang;
    }
  };

  useEffect(() => {
    setLoadingCode(true);

    axios
      .get(`${apiBase}/problem/info/${problemId}`, {
        withCredentials: true,
        params: { lang: i18n.language },
      })
      .then((res) => {
        const loadedProblem = res.data;
        setProblem(loadedProblem);

        setUserCode((prev) => {
          const next = {
            python: prev.python || getStarterCode('python', loadedProblem),
            java: prev.java || getStarterCode('java', loadedProblem),
            c: prev.c || getStarterCode('c', loadedProblem),
          };

          if (editorRef.current) {
            const currentLanguage = languageRef.current;
            editorRef.current.setValue(
              next[currentLanguage] ||
                getStarterCode(currentLanguage, loadedProblem)
            );
          }

          return next;
        });

        setLoadingCode(false);
      })
      .catch((err) => {
        console.error('Error loading problem:', err);
        setProblem('error');
        setLoadingCode(false);
      });
  }, [apiBase, problemId, i18n.language]);

  if (!problem || problem === 'error') {
    return (
      <>
        <NavBar />

        <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
          {problem === 'error' ? (
            <Typography variant="h5" color="error">
              {t('editor.failedToLoadProblem')}
            </Typography>
          ) : (
            <CircularProgress />
          )}
        </Box>
      </>
    );
  }

  const ProblemDescription = () => (
    <LeftPane
      elevation={0}
      sx={
        isMobile
          ? { width: '100%', height: '100%', overflowY: 'auto' }
          : {}
      }
    >
      <Typography variant="h5" fontWeight={700} gutterBottom>
        🧩 {t('editor.task')}: {problem.name}
      </Typography>

      <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
        {problem.description}
      </Typography>

      <Typography variant="body2" paragraph>
        <strong>{t('editor.input')}:</strong> {problem.input} <br />
        <strong>{t('editor.output')}:</strong> {problem.output}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" fontWeight={600} mb={1}>
        💡 {t('editor.examples')}:
      </Typography>

      {problem.examples.map((ex, index) => (
        <Paper
          key={index}
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? theme.palette.grey[800]
                : theme.palette.grey[100],
          }}
        >
          <Typography
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
          >
            {`${t('editor.input')}: ${ex.input}\n${t('editor.output')}: ${
              ex.output
            }`}
          </Typography>
        </Paper>
      ))}
    </LeftPane>
  );

  const CodeArea = () => (
    <RightPane>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ pb: 0.5 }}
      >
        <FormControl size="small" variant="outlined">
          <InputLabel id="language-select-label">
            {t('editor.language')}
          </InputLabel>

          <Select
            labelId="language-select-label"
            value={language}
            label={t('editor.language')}
            onChange={handleLanguageChange}
            sx={{ minWidth: 150 }}
          >
            {Object.entries(languageMap).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="success"
          onClick={handleRunCode}
          disabled={isRunning || loadingCode}
          startIcon={
            isRunning ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <PlayArrow />
            )
          }
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            px: 3,
            py: 1,
          }}
        >
          {isRunning ? `${t('editor.running')}...` : t('editor.runCode')}
        </Button>
      </Stack>

      <Box
        sx={{
          flex: 1,
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {loadingCode ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : (
          <Editor
            height="100%"
            language={language}
            defaultValue={userCode[language] || getStarterCode(language, problem)}
            theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 10, bottom: 10 },
            }}
          />
        )}
      </Box>
    </RightPane>
  );

  return (
    <>
      <NavBar />

      <MainContainer>
        {!isMobile && (
          <>
            <ProblemDescription />
            <CodeArea />
          </>
        )}

        {isMobile && (
          <Box
            sx={{
              width: '100%',
              height: 'calc(100vh - 64px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Paper
              elevation={3}
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                aria-label="Editor sections"
              >
                <Tab icon={<Code />} label={t('editor.code')} />
                <Tab icon={<Description />} label={t('editor.task')} />
                <Tab icon={<Terminal />} label={t('editor.output')} />
              </Tabs>
            </Paper>

            <CustomTabPanel value={tabValue} index={0}>
              <CodeArea />
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={1}>
              <ProblemDescription />
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={2}>
              <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    minHeight: 200,
                    borderRadius: 2.5,
                  }}
                >
                  <FormattedOutput
                    results={testResults}
                    status={rawOutput || t('editor.runCodeToSeeOutput')}
                    t={t}
                  />

                  {taskSolved && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<ArrowBack />}
                      onClick={handleBackToProblems}
                      sx={{
                        mt: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                      }}
                    >
                      {t('editor.backToProblems')}
                    </Button>
                  )}
                </Paper>
              </Box>
            </CustomTabPanel>
          </Box>
        )}
      </MainContainer>

      {!isMobile && (
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 750 }}>
            {t('editor.output')}
          </DialogTitle>

          <DialogContent dividers>
            <FormattedOutput
              results={testResults}
              status={rawOutput || t('editor.runCodeToSeeOutput')}
              t={t}
            />
          </DialogContent>

          <DialogActions
            sx={{
              p: 2,
              justifyContent: taskSolved ? 'space-between' : 'flex-end',
              gap: 1.5,
            }}
          >
            {taskSolved && (
              <Button
                onClick={handleBackToProblems}
                variant="contained"
                color="success"
                startIcon={<ArrowBack />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                {t('editor.backToProblems')}
              </Button>
            )}

            <Button
              onClick={handleCloseDialog}
              variant={taskSolved ? 'outlined' : 'contained'}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default CodeEditor;