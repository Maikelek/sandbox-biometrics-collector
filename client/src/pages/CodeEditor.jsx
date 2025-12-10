import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useLocation } from 'react-router-dom';
import { useUser } from "../context/UserContext";
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
import { PlayArrow, Description, Code, Terminal, CheckCircle, Cancel } from '@mui/icons-material';

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
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
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
            return problem?.starter_code_py || `# ${problem?.name}`;
        case 'java':
            return problem?.starter_code_java || `// ${problem?.name}`;
        case 'c':
            return problem?.starter_code_c || `// ${problem?.name}`;
        default:
            return '';
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

const FormattedOutput = ({ results, status, t }) => {
    const theme = useTheme();

    if (status === t('editor.running') + '...') {
        return <Typography>{t('editor.running')}...</Typography>;
    }
    
    if (results && results.length > 0) {
        return (
            <Box>
                {results.map((r, idx) => (
                    <Paper 
                        key={idx} 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            mb: 2, 
                            borderLeft: `5px solid ${r.passed ? theme.palette.success.main : theme.palette.error.main}`,
                            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100]
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {t('editor.testCase')} #{idx + 1}
                            </Typography>
                            <Chip 
                                label={r.passed ? t('editor.passed') : t('editor.failed')} 
                                icon={r.passed ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                                color={r.passed ? 'success' : 'error'} 
                                size="small"
                            />
                        </Stack>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {t('editor.input')}: {r.input}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {t('editor.expected')}: {r.expected}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {t('editor.output')}: {r.output}
                        </Typography>
                    </Paper>
                ))}
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" align="center" mt={2}>
                    {status}
                </Typography>
            </Box>
        );
    }
    
    return (
        <Typography sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {status}
        </Typography>
    );
};


const CodeEditor = () => {
    const { user } = useUser();
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const problemId = location.pathname.split('/')[2];
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const editorRef = useRef(null); 
    const monacoRef = useRef(null); 
    
    const [problem, setProblem] = useState(null);
    const [language, setLanguage] = useState('python');
    const [rawOutput, setRawOutput] = useState('');
    const [testResults, setTestResults] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0); 
    const [loadingCode, setLoadingCode] = useState(true);
    
    const [userCode, setUserCode] = useState({
        python: null, 
        java: null,
        c: null,
    });

    const isRunning = rawOutput === t('editor.running') + '...';

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        
        if (problem) {
            const initialCode = userCode[language] || getStarterCode(language, problem);
            editor.setValue(initialCode);
        }
    };
    
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleRunCode = async () => {

        const code = editorRef.current?.getValue(); 
        
        if (!problem || !user || !code) return;

        setUserCode(prev => ({ ...prev, [language]: code }));
        
        try {
            setRawOutput(t('editor.running') + '...');
            setTestResults(null);
            
            if (isMobile) { 
                setTabValue(2); 
            } else {
                setDialogOpen(true);
            }

            const response = await axios.post(
                'http://localhost:1234/code',
                {
                    code,
                    language,
                    problem: problem?.problem || '',
                    userId: user?.id || null,
                    problemId: problem?.id || null,
                },
                { withCredentials: true }
            );

            if (response.data.results?.length > 0) {
                const results = response.data.results;
                const allPassed = results.every(r => r.passed);
                
                setTestResults(results);

                const finalStatus = allPassed 
                    ? `\n\n ${t('editor.allTestsPassed')} ✅` 
                    : `\n\n ${t('editor.someTestsFailed')} ❌`;
                
                setRawOutput(finalStatus);
            } else {
                setTestResults(null); 
                setRawOutput(response.data.output || t('editor.noOutput'));
            }
        } catch (err) {
            console.error('Error running code:', err);
            setTestResults(null);
            setRawOutput(`${t('error')}: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    const handleLanguageChange = (event) => {
        const newLang = event.target.value;
        
        if (problem && editorRef.current && monacoRef.current) {
            
            const currentCode = editorRef.current.getValue();
            setUserCode(prev => ({ ...prev, [language]: currentCode }));

            setLanguage(newLang); 

            let codeToSet;
            
            if (userCode[newLang]) {
                codeToSet = userCode[newLang];
            } else {
                codeToSet = getStarterCode(newLang, problem);
            }

            editorRef.current.setValue(codeToSet); 
            monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), newLang);
        } else {
            setLanguage(newLang);
        }
    };

    useEffect(() => {
        setLoadingCode(true);
        axios
            .get(`http://localhost:1234/problem/info/${problemId}`, {
                withCredentials: true,
                params: { lang: i18n.language },
            })
            .then((res) => {
                const loadedProblem = res.data;
                setProblem(loadedProblem);
                
                const initialCode = getStarterCode(language, loadedProblem);
                
                setUserCode(prev => ({ ...prev, [language]: initialCode }));
                
                if (editorRef.current) {
                   editorRef.current.setValue(initialCode);
                }
                setLoadingCode(false);
            })
            .catch((err) => {
                console.error('Error loading problem:', err);
                setProblem('error'); 
                setLoadingCode(false);
            });
    }, [problemId, i18n.language, language]);

    if (!problem || problem === 'error') {
        return (
            <>
                <NavBar />
                <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
                    {problem === 'error' ? (
                        <Typography variant="h5" color="error">{t('editor.failedToLoadProblem')}</Typography>
                    ) : (
                        <CircularProgress />
                    )}
                </Box>
            </>
        );
    }

    const ProblemDescription = () => (
        <LeftPane elevation={0} sx={isMobile ? { width: '100%', height: '100%', overflowY: 'auto' } : {}}>
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
            <Typography variant="subtitle1" fontWeight={600} mb={1}>💡 {t('editor.examples')}:</Typography>
            {problem.examples.map((ex, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 2, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                        {`${t('editor.input')}: ${ex.input}\n${t('editor.output')}: ${ex.output}`}
                    </Typography>
                </Paper>
            ))}
        </LeftPane>
    );

    const CodeArea = () => (
        <RightPane>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ pb: 0.5 }}>
                <FormControl size="small" variant="outlined">
                    <InputLabel id="language-select-label">{t('editor.language')}</InputLabel>
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
                    startIcon={isRunning ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                    sx={{ borderRadius: '8px', textTransform: 'none', px: 3, py: 1 }}
                >
                    {isRunning ? `${t('editor.running')}...` : t('editor.runCode')}
                </Button>
            </Stack>

            <Box sx={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                {loadingCode ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
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
                            padding: { top: 10, bottom: 10 }
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
                    <Box sx={{ width: '100%', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
                        
                        <Paper elevation={3} sx={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: `1px solid ${theme.palette.divider}` }}>
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
                                <Typography variant="h6" mb={2}>{t('editor.executionResults')}</Typography>
                                <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                        p: 2, 
                                        minHeight: 200, 
                                    }}
                                >
                                    <FormattedOutput 
                                        results={testResults} 
                                        status={rawOutput || t('editor.runCodeToSeeOutput')} 
                                        t={t} 
                                    />
                                </Paper>
                            </Box>
                        </CustomTabPanel>
                    </Box>
                )}
            </MainContainer>

            {!isMobile && (
                <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>{t('editor.output')}</DialogTitle>
                    <DialogContent>
                        <FormattedOutput 
                            results={testResults} 
                            status={rawOutput || t('editor.runCodeToSeeOutput')} 
                            t={t} 
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog} autoFocus>
                            OK
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </>
    );
};

export default CodeEditor;