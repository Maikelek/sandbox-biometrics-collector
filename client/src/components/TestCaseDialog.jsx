import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Editor from '@monaco-editor/react';

const TestCaseDialog = ({ open, onClose, problemId }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !problemId) return;

    setLoading(true);
    setErrorMsg('');
    axios
      .get(`http://localhost:1234/admin/problem/testcase/${problemId}`, {
        withCredentials: true,
      })
      .then((res) => {
        setContent(res.data.content || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading test case:', err);
        setContent('');
        setErrorMsg(t('admin.testCases.loadError'));
        setLoading(false);
      });
  }, [open, problemId, t]);

  const handleSave = () => {
    setSaving(true);
    axios
      .put(
        `http://localhost:1234/admin/problem/testcase/${problemId}`,
        { content },
        { withCredentials: true }
      )
      .then(() => {
        setSaving(false);
      })
      .catch((err) => {
        console.error('Error saving test case:', err);
        setSaving(false);
      });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('admin.testCases.title')}</DialogTitle>
      <DialogContent dividers sx={{ height: '500px' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : errorMsg ? (
          <Typography color="error">{errorMsg}</Typography>
        ) : (
          <Editor
            language="json"
            value={content}
            theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
            onChange={(val) => setContent(val || '')}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
            }}
            height="100%"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('close')}</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={saving}
        >
          {saving ? <CircularProgress size={20} /> : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestCaseDialog;
