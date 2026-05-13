import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Button,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Snackbar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Visibility,
  Refresh,
  ReportProblemOutlined,
  CheckCircleOutline,
  AssignmentOutlined,
  PersonOutline,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import AdminSidebar from '../../components/AdminSidebar';

const drawerWidth = 240;
const limit = 10;

const statusOptions = [
  { value: 'all', labelKey: 'admin.flagged.statusAll', fallback: 'Všetky' },
  { value: 'open', labelKey: 'admin.flagged.statusOpen', fallback: 'Otvorené' },
  { value: 'reviewed', labelKey: 'admin.flagged.statusReviewed', fallback: 'Skontrolované' },
  { value: 'approved', labelKey: 'admin.flagged.statusApproved', fallback: 'V poriadku' },
  { value: 'rejected', labelKey: 'admin.flagged.statusRejected', fallback: 'Problémové' },
];

const statusColor = {
  open: 'warning',
  reviewed: 'info',
  approved: 'success',
  rejected: 'error',
};

const formatDate = (value) => {
  if (!value) return '—';

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const AdminFlaggedSubmissions = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('open');
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [reviewStatus, setReviewStatus] = useState('reviewed');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);

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

  const getStatusLabel = (status) => {
    const option = statusOptions.find((item) => item.value === status);

    if (!option) return status || '—';

    return t(option.labelKey, {
      defaultValue: option.fallback,
    });
  };

  const fetchFlaggedSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${apiBase}/admin/flagged-submissions`, {
        withCredentials: true,
        params: {
          page,
          limit,
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        },
      });

      const payload = response.data;

      setItems(payload.flaggedSubmissions || []);
      setTotalPages(Math.max(Math.ceil((payload.total || 0) / limit), 1));
    } catch (err) {
      console.error(err);
      setError(
        t('admin.flagged.loadError', {
          defaultValue: 'Nepodarilo sa načítať riešenia na kontrolu.',
        })
      );
    } finally {
      setLoading(false);
    }
  }, [apiBase, page, statusFilter, t]);

  useEffect(() => {
    fetchFlaggedSubmissions();
  }, [fetchFlaggedSubmissions]);

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handleOpenDetail = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedSubmission(null);
    setAdminNote('');
    setReviewStatus('reviewed');

    try {
      const response = await axios.get(
        `${apiBase}/admin/flagged-submissions/${id}`,
        {
          withCredentials: true,
        }
      );

      const data = response.data;

      setSelectedSubmission(data);
      setReviewStatus(data.status === 'open' ? 'reviewed' : data.status);
      setAdminNote(data.admin_note || '');
    } catch (err) {
      console.error(err);
      setError(
        t('admin.flagged.detailLoadError', {
          defaultValue: 'Nepodarilo sa načítať detail riešenia.',
        })
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    if (saving) return;

    setDetailOpen(false);
    setSelectedSubmission(null);
  };

  const handleSaveReview = async () => {
    if (!selectedSubmission) return;

    setSaving(true);

    try {
      const response = await axios.patch(
        `${apiBase}/admin/flagged-submissions/${selectedSubmission.id}`,
        {
          status: reviewStatus,
          admin_note: adminNote,
        },
        {
          withCredentials: true,
        }
      );

      setSelectedSubmission(response.data.flaggedSubmission);
      setSnackbarOpen(true);
      setDetailOpen(false);
      fetchFlaggedSubmissions();
    } catch (err) {
      console.error(err);
      setError(
        t('admin.flagged.saveError', {
          defaultValue: 'Nepodarilo sa uložiť kontrolu.',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const ReasonList = ({ reasons }) => {
    if (!Array.isArray(reasons) || reasons.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          {t('admin.flagged.noReasons', {
            defaultValue: 'Bez detailných dôvodov.',
          })}
        </Typography>
      );
    }

    return (
      <Stack spacing={1}>
        {reasons.map((reason, index) => (
          <Box
            key={`${reason.code || 'reason'}-${index}`}
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: isDarkMode ? alpha('#ffffff', 0.035) : '#f8fafc',
              border: `1px solid ${isDarkMode ? alpha('#ffffff', 0.08) : '#edf0f4'}`,
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>
              {reason.message || reason.code || t('admin.flagged.reason', { defaultValue: 'Dôvod' })}
            </Typography>

            {reason.value !== undefined && (
              <Typography variant="body2" color="text.secondary">
                {t('admin.flagged.value', { defaultValue: 'Hodnota' })}: {String(reason.value)}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    );
  };

  const MetricsBlock = ({ metrics }) => {
    const rows = [
      ['activeTypingSeconds', t('admin.flagged.activeTypingSeconds', { defaultValue: 'Aktívne písanie' }), 's'],
      ['totalKeystrokes', t('admin.flagged.totalKeystrokes', { defaultValue: 'Stlačenia kláves' }), ''],
      ['charsAdded', t('admin.flagged.charsAdded', { defaultValue: 'Pridané znaky' }), ''],
      ['charsRemoved', t('admin.flagged.charsRemoved', { defaultValue: 'Odstránené znaky' }), ''],
      ['typingSpeedCpm', t('admin.flagged.typingSpeedCpm', { defaultValue: 'Rýchlosť písania' }), 'znakov/min'],
      ['typingSpeedWpm', t('admin.flagged.typingSpeedWpm', { defaultValue: 'Odhad WPM' }), 'WPM'],
      ['backspaces', t('admin.flagged.backspaces', { defaultValue: 'Backspace' }), ''],
      ['pasteCount', t('admin.flagged.pasteCount', { defaultValue: 'Vloženia' }), ''],
      ['pauseCount', t('admin.flagged.pauseCount', { defaultValue: 'Pauzy' }), ''],
      ['maxPauseMs', t('admin.flagged.maxPauseMs', { defaultValue: 'Najdlhšia pauza' }), 'ms'],
    ];

    return (
      <Stack spacing={1}>
        {rows.map(([key, label, suffix]) => (
          <Box
            key={key}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              py: 0.75,
              borderBottom: `1px solid ${isDarkMode ? alpha('#ffffff', 0.07) : '#edf0f4'}`,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {metrics?.[key] ?? '—'} {suffix}
            </Typography>
          </Box>
        ))}
      </Stack>
    );
  };

  const DesktopTable = () => (
    <Paper elevation={0} sx={{ ...cardSx, overflowX: 'auto' }}>
      <Table sx={{ minWidth: 850 }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>
              {t('admin.flagged.user', { defaultValue: 'Používateľ' })}
            </TableCell>
            <TableCell>
              {t('admin.flagged.problem', { defaultValue: 'Úloha' })}
            </TableCell>
            <TableCell>
              {t('admin.flagged.score', { defaultValue: 'Skóre' })}
            </TableCell>
            <TableCell>
              {t('admin.flagged.status', { defaultValue: 'Stav' })}
            </TableCell>
            <TableCell>
              {t('admin.flagged.createdAt', { defaultValue: 'Vytvorené' })}
            </TableCell>
            <TableCell align="right">
              {t('problems.actions', { defaultValue: 'Akcie' })}
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.id}</TableCell>

              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>
                  {item.user_name || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.user_email || `ID: ${item.user_id || '—'}`}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>
                  {item.problem_name || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.problem_function || `ID: ${item.problem_id || '—'}`}
                </Typography>
              </TableCell>

              <TableCell>
                <Chip
                  label={item.anomaly_score}
                  color={item.anomaly_score >= 80 ? 'error' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </TableCell>

              <TableCell>
                <Chip
                  label={getStatusLabel(item.status)}
                  color={statusColor[item.status] || 'default'}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </TableCell>

              <TableCell>{formatDate(item.created_at)}</TableCell>

              <TableCell align="right">
                <Tooltip title={t('admin.flagged.detail', { defaultValue: 'Detail' })}>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDetail(item.id)}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );

  const MobileList = () => (
    <Stack spacing={2}>
      {items.map((item) => (
        <Paper key={item.id} elevation={0} sx={{ ...cardSx, p: 2 }}>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 750 }}>
                {item.problem_name || `#${item.id}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.user_name || item.user_email || `User ID: ${item.user_id || '—'}`}
              </Typography>
            </Box>

            <Chip
              label={item.anomaly_score}
              color={item.anomaly_score >= 80 ? 'error' : 'warning'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Chip
              label={getStatusLabel(item.status)}
              color={statusColor[item.status] || 'default'}
              size="small"
              variant="outlined"
            />

            <Button
              size="small"
              variant="outlined"
              onClick={() => handleOpenDetail(item.id)}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
            >
              {t('admin.flagged.detail', { defaultValue: 'Detail' })}
            </Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );

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
                {t('admin.flagged.title', {
                  defaultValue: 'Riešenia na kontrolu',
                })}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, textAlign: { xs: 'center', sm: 'left' } }}
              >
                {t('admin.flagged.subtitle', {
                  defaultValue:
                    'Zoznam odoslaní, ktoré systém označil kvôli neobvyklým metrikám.',
                })}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              justifyContent={{ xs: 'center', sm: 'flex-end' }}
            >
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>
                  {t('admin.flagged.status', { defaultValue: 'Stav' })}
                </InputLabel>
                <Select
                  value={statusFilter}
                  label={t('admin.flagged.status', { defaultValue: 'Stav' })}
                  onChange={handleStatusFilterChange}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {t(option.labelKey, { defaultValue: option.fallback })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchFlaggedSubmissions}
                disabled={loading}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                {t('admin.dashboard.refresh', { defaultValue: 'Obnoviť' })}
              </Button>
            </Stack>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Paper elevation={0} sx={{ ...cardSx, p: 4, textAlign: 'center' }}>
              <ReportProblemOutlined
                sx={{ fontSize: 42, color: 'text.secondary', mb: 1 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('admin.flagged.emptyTitle', {
                  defaultValue: 'Žiadne riešenia na kontrolu',
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.flagged.emptyText', {
                  defaultValue: 'Momentálne tu nie sú žiadne označené odoslania.',
                })}
              </Typography>
            </Paper>
          ) : (
            <>
              {isMobile ? <MobileList /> : <DesktopTable />}

              <Stack alignItems="center" sx={{ mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </>
          )}
        </Box>
      </Box>

      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ReportProblemOutlined color="warning" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 750 }}>
                {t('admin.flagged.detailTitle', {
                  defaultValue: 'Detail označeného riešenia',
                })}
              </Typography>
              {selectedSubmission && (
                <Typography variant="body2" color="text.secondary">
                  #{selectedSubmission.id} · {formatDate(selectedSubmission.created_at)}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : selectedSubmission ? (
            <Stack spacing={3}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
              >
                <Paper elevation={0} sx={{ ...cardSx, p: 2, flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <PersonOutline color="primary" />
                    <Typography sx={{ fontWeight: 750 }}>
                      {t('admin.flagged.user', { defaultValue: 'Používateľ' })}
                    </Typography>
                  </Stack>
                  <Typography>{selectedSubmission.user_name || '—'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSubmission.user_email || `ID: ${selectedSubmission.user_id || '—'}`}
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ ...cardSx, p: 2, flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <AssignmentOutlined color="primary" />
                    <Typography sx={{ fontWeight: 750 }}>
                      {t('admin.flagged.problem', { defaultValue: 'Úloha' })}
                    </Typography>
                  </Stack>
                  <Typography>{selectedSubmission.problem_name || '—'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSubmission.problem_function || `ID: ${selectedSubmission.problem_id || '—'}`}
                  </Typography>
                </Paper>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`${t('admin.flagged.score', { defaultValue: 'Skóre' })}: ${selectedSubmission.anomaly_score}`}
                  color={selectedSubmission.anomaly_score >= 80 ? 'error' : 'warning'}
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={getStatusLabel(selectedSubmission.status)}
                  color={statusColor[selectedSubmission.status] || 'default'}
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={selectedSubmission.language}
                  variant="outlined"
                />
              </Stack>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 750, mb: 1.5 }}>
                  {t('admin.flagged.reasons', { defaultValue: 'Dôvody označenia' })}
                </Typography>
                <ReasonList reasons={selectedSubmission.reasons} />
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 750, mb: 1.5 }}>
                  {t('admin.flagged.metrics', { defaultValue: 'Metriky písania' })}
                </Typography>
                <Paper elevation={0} sx={{ ...cardSx, p: 2 }}>
                  <MetricsBlock metrics={selectedSubmission.typing_metrics} />
                </Paper>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 750, mb: 1.5 }}>
                  {t('admin.flagged.submittedCode', { defaultValue: 'Odoslaný kód' })}
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    borderRadius: 2,
                    overflow: 'auto',
                    maxHeight: 360,
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    color: isDarkMode ? '#d1d5db' : '#1f2937',
                    backgroundColor: isDarkMode ? '#0b0f17' : '#f8fafc',
                    border: `1px solid ${isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb'}`,
                  }}
                >
                  {selectedSubmission.submitted_code}
                </Box>
              </Box>

              <Divider />

              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>
                    {t('admin.flagged.reviewStatus', { defaultValue: 'Výsledok kontroly' })}
                  </InputLabel>
                  <Select
                    value={reviewStatus}
                    label={t('admin.flagged.reviewStatus', { defaultValue: 'Výsledok kontroly' })}
                    onChange={(event) => setReviewStatus(event.target.value)}
                  >
                    {statusOptions
                      .filter((option) => option.value !== 'all')
                      .map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {t(option.labelKey, { defaultValue: option.fallback })}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <TextField
                  label={t('admin.flagged.adminNote', { defaultValue: 'Poznámka admina' })}
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                />
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDetail} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutline />}
            onClick={handleSaveReview}
            disabled={saving || detailLoading || !selectedSubmission}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {t('admin.flagged.saveReview', { defaultValue: 'Uložiť kontrolu' })}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setSnackbarOpen(false)}
          sx={{ width: '100%' }}
        >
          {t('admin.flagged.saved', {
            defaultValue: 'Kontrola bola uložená.',
          })}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminFlaggedSubmissions;