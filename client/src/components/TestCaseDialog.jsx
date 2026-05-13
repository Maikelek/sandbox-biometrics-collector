import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Typography,
  useTheme,
  Alert,
  Snackbar,
  Stack,
  IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Close as CloseIcon,
  SaveOutlined,
  AutoFixHighOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Editor from '@monaco-editor/react';

const normalizeJsonContent = (value) => {
  if (!value) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) return '';

    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const TestCaseDialog = ({ open, onClose, problemId }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const apiBase = useMemo(() => {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';
  }, []);

  useEffect(() => {
    if (!open || !problemId) return;

    setLoading(true);
    setErrorMsg('');

    axios
      .get(`${apiBase}/admin/problem/testcase/${problemId}`, {
        withCredentials: true,
      })
      .then((res) => {
        setContent(normalizeJsonContent(res.data.content));
      })
      .catch((err) => {
        console.error('Error loading test case:', err);
        setContent('');
        setErrorMsg(
          t('admin.testCases.loadError', {
            defaultValue: 'Nepodarilo sa načítať testovacie prípady.',
          })
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiBase, open, problemId, t]);

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(content);
      setContent(JSON.stringify(parsed, null, 2));
      setErrorMsg('');
    } catch {
      setErrorMsg(
        t('admin.testCases.invalidJson', {
          defaultValue: 'JSON nie je platný. Skontroluj syntax.',
        })
      );
    }
  };

  const handleSave = () => {
    setSaving(true);
    setErrorMsg('');

    let formattedContent = content;

    try {
      const parsed = JSON.parse(content);
      formattedContent = JSON.stringify(parsed, null, 2);
      setContent(formattedContent);
    } catch {
      setSaving(false);
      setErrorMsg(
        t('admin.testCases.invalidJson', {
          defaultValue: 'JSON nie je platný. Skontroluj syntax.',
        })
      );
      return;
    }

    axios
      .put(
        `${apiBase}/admin/problem/testcase/${problemId}`,
        { content: formattedContent },
        { withCredentials: true }
      )
      .then(() => {
        setSnackbarOpen(true);
      })
      .catch((err) => {
        console.error('Error saving test case:', err);
        setErrorMsg(
          t('admin.testCases.saveError', {
            defaultValue: 'Nepodarilo sa uložiť testovacie prípady.',
          })
        );
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
            backgroundImage: 'none',
            border: `1px solid ${
              isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'
            }`,
          },
        }}
      >
        <DialogTitle sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 750 }}>
                {t('admin.testCases.title')}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {t('admin.testCases.subtitle', {
                  defaultValue:
                    'Testy môžu obsahovať stringy, čísla, polia [] aj objekty {}.',
                })}
              </Typography>
            </Box>

            <IconButton onClick={handleClose} disabled={saving}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            height: { xs: '60vh', md: 520 },
            p: 0,
            borderColor: isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb',
          }}
        >
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              {errorMsg && (
                <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              <Box sx={{ height: errorMsg ? 'calc(100% - 72px)' : '100%' }}>
                <Editor
                  language="json"
                  value={content}
                  theme={isDarkMode ? 'vs-dark' : 'light'}
                  onChange={(value) => {
                    setContent(value || '');
                    setErrorMsg('');
                  }}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                    formatOnPaste: true,
                    formatOnType: true,
                    padding: { top: 12, bottom: 12 },
                  }}
                  height="100%"
                />
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleClose}
            disabled={saving}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 650,
            }}
          >
            {t('close')}
          </Button>

          <Button
            onClick={handleFormatJson}
            disabled={saving || loading || !content.trim()}
            startIcon={<AutoFixHighOutlined />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 650,
            }}
          >
            {t('admin.testCases.format', {
              defaultValue: 'Formátovať',
            })}
          </Button>

          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || loading || !content.trim()}
            startIcon={
              saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />
            }
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              minWidth: 110,
            }}
          >
            {saving ? t('saving', { defaultValue: 'Ukladám...' }) : t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setSnackbarOpen(false)}
          sx={{ width: '100%' }}
        >
          {t('admin.testCases.saveSuccess', {
            defaultValue: 'Testovacie prípady boli uložené.',
          })}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TestCaseDialog;