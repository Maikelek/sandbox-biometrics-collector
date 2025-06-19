import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useLocation } from 'react-router-dom';
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
} from '@mui/material';
import NavBar from '../components/NavBar';
import { styled } from '@mui/system';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const Container = styled('div')({
  display: 'flex',
  height: 'calc(100vh - 64px)',
  width: '100%',
  backgroundColor: '#f5f5f5',
});

const LeftPane = styled(Paper)(({ theme }) => ({
  width: '35%',
  minWidth: '250px',
  padding: theme.spacing(3),
  overflowY: 'auto',
  borderRight: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
}));

const RightPane = styled('div')(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3),
  gap: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
}));

const OutputBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f0f0f0',
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  fontFamily: 'monospace',
  minHeight: '60px',
  display: 'flex',
  alignItems: 'center',
  borderRadius: '12px',
}));

const languageMap = {
  python: 'Python',
};

const CodeEditor = () => {
  const { t, i18n } = useTranslation();

  const location = useLocation();
  const problemId = location.pathname.split('/')[2];

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState(t('editor.writeYourCodeHere'));
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const isRunning = output === t('editor.running') + '...';
  const theme = useTheme();

  const handleRunCode = async () => {
    try {
      setOutput(t('editor.running') + '...');
  
      const response = await axios.post('http://localhost:1234/code', {
        code,
        language,
      });
  
      setOutput(response.data.output || t('editor.noOutput'));
    } catch (err) {
      console.error('Error running code:', err);
      setOutput(`${t('error')}: ${err.response?.data?.error || err.message}`);
    }
  };

  useEffect(() => {
    axios
      .get(`http://localhost:1234/problem/info/${problemId}`, {
        params: {
          lang: i18n.language,
        },
      })
      .then((res) => {
        setProblem(res.data);
        setCode(t('editor.writeYourCodeHere'));
      })
      .catch((err) => {
        console.error('Error loading problem:', err);
      });
  }, [problemId, i18n.language, t]);

  return (
    <>
      <NavBar />
      <Container>
        <LeftPane elevation={0}>
          {problem ? (
            <>
              <Typography variant="h5" gutterBottom>
                🧩 {t('editor.task')}: {problem.name}
              </Typography>
              <Typography variant="body1" paragraph>
                {problem.description}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('editor.input')}:</strong> {problem.input} <br />
                <strong>{t('editor.output')}:</strong> {problem.output}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">💡 {t('editor.examples')}:</Typography>
              {problem.examples.map((ex, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', mb: 1 }}
                >
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  {`${t('editor.input')}: ${ex.input}\n${t('editor.output')}: ${ex.output}`}
                </Typography>
              ))}
            </>
          ) : (
            <Typography>{t('editor.loadingTask')}</Typography>
          )}
        </LeftPane>

        <RightPane>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <FormControl size="small">
              <InputLabel id="language-select-label">{t('editor.language')}</InputLabel>
              <Select
                labelId="language-select-label"
                value={language}
                label={t('editor.language')}
                onChange={(e) => setLanguage(e.target.value)}
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
              disabled={isRunning}
              sx={{ borderRadius: '10px', textTransform: 'none' }}
            >
              {t('editor.runCode')}
            </Button>
          </Stack>

          <OutputBox elevation={1}>
            <Typography variant="body2">
              {output || t('editor.outputPlaceholder')}
            </Typography>
          </OutputBox>

          <Box sx={{ flex: 1, borderRadius: '12px', overflow: 'hidden' }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
              onChange={(value) => setCode(value)}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
              }}
            />
          </Box>
        </RightPane>
      </Container>
    </>
  );
};

export default CodeEditor;
