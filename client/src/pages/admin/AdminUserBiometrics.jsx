import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  IconButton,
  Stack,
  Chip,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
  Alert,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack,
  Refresh,
  MouseOutlined,
  MonitorOutlined,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

import AdminSidebar from '../../components/AdminSidebar';

const parseJson = (data, fallback = []) => {
  if (!data) return fallback;
  if (typeof data === 'object') return data;

  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
};

const formatDate = (value, language) => {
  if (!value) return '—';

  try {
    return new Date(value).toLocaleString(language);
  } catch {
    return value;
  }
};

const getProblemName = (row, t) => {
  return (
    row?.problem_name ||
    row?.challenge_name ||
    row?.task_name ||
    row?.name ||
    row?.problem ||
    `${t('editor.task')} #${row?.biometrics_challenge || row?.problem_id || '—'}`
  );
};

const getProblemIdentifier = (row) => {
  return (
    row?.problem_function ||
    row?.function_name ||
    row?.problem ||
    row?.biometrics_challenge ||
    row?.problem_id ||
    '—'
  );
};

const getEventStats = (events) => {
  const list = Array.isArray(events) ? events : [];

  const count = (types) => {
    const wanted = Array.isArray(types) ? types : [types];

    return list.filter((event) =>
      wanted.includes(String(event.type || '').toLowerCase())
    ).length;
  };

  const tabLeave = list.filter((event) => {
    const type = String(event.type || '').toLowerCase();
    const visibility = String(event.visibility || '').toLowerCase();

    return (
      type === 'tab' ||
      type === 'tab_visibility' ||
      visibility === 'hidden'
    );
  }).length;

  return {
    total: list.length,
    paste: count('paste'),
    copy: count('copy'),
    cut: count('cut'),
    focus: count(['focus', 'editor_focus']),
    blur: count(['blur', 'editor_blur']),
    scroll: count(['scroll', 'editor_scroll']),
    resize: count('resize'),
    tabLeave,
  };
};

const RawDataBlock = ({ data }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        borderRadius: 2,
        maxHeight: 560,
        overflow: 'auto',
        fontSize: '0.78rem',
        lineHeight: 1.6,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        color: isDarkMode ? '#d1d5db' : '#1f2937',
        backgroundColor: isDarkMode ? '#0b0f17' : '#f8fafc',
        border: `1px solid ${
          isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb'
        }`,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {JSON.stringify(data, null, 2)}
    </Box>
  );
};

const AdminUserBiometrics = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  const [biometrics, setBiometrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailTab, setDetailTab] = useState(0);

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

  const fetchBiometrics = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${apiBase}/admin/user/${id}/biometrics`, {
        withCredentials: true,
      });

      setBiometrics(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError(t('admin.biometrics.loadError'));
    } finally {
      setLoading(false);
    }
  }, [apiBase, id, t]);

  useEffect(() => {
    fetchBiometrics();
  }, [fetchBiometrics]);

  const handleOpenDetail = (row) => {
    setSelectedRow(row);
    setDetailTab(0);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
  };

  const renderOverview = (row) => {
    const events = parseJson(row?.other_events, []);
    const mouseMoves = parseJson(row?.mouse_moves, []);
    const stats = getEventStats(events);

    return (
      <Stack spacing={2.5}>
        <Paper elevation={0} sx={{ ...cardSx, p: 2.25 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {getProblemName(row, t)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {t('admin.biometrics.function_identifier')}:{' '}
            <strong>{getProblemIdentifier(row)}</strong>
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {t('admin.biometrics.record')}:{' '}
            <strong>#{row?.biometrics_id}</strong>
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {t('admin.biometrics.date')}:{' '}
            <strong>{formatDate(row?.collected_at, i18n.language)}</strong>
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {t('admin.biometrics.screen')}:{' '}
            <strong>
              {row?.screen_w || '—'}x{row?.screen_h || '—'}
            </strong>
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ ...cardSx, p: 2.25 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
            {t('admin.biometrics.summary')}
          </Typography>

          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip
              label={`${t('admin.biometrics.mouse_moves')}: ${mouseMoves.length}`}
              variant="outlined"
            />

            <Chip
              label={`${t('admin.biometrics.events')}: ${events.length}`}
              variant="outlined"
            />

            <Chip
              label={`${t('admin.biometrics.paste_events')}: ${stats.paste}`}
              variant="outlined"
            />

            <Chip
              label={`${t('admin.biometrics.copy_events')}: ${stats.copy}`}
              variant="outlined"
            />

            <Chip
              label={`${t('admin.biometrics.cut_events')}: ${stats.cut}`}
              variant="outlined"
            />

            <Chip
              label={`${t('admin.biometrics.tab_leave_events')}: ${stats.tabLeave}`}
              variant="outlined"
            />

            <Chip
              label={`${t('admin.biometrics.scroll_events')}: ${stats.scroll}`}
              variant="outlined"
            />

            <Chip
              label={`${t('admin.biometrics.focus_blur_events')}: ${stats.focus}/${stats.blur}`}
              variant="outlined"
            />

            <Chip
              label={`${t('admin.biometrics.resize_events')}: ${stats.resize}`}
              variant="outlined"
            />
          </Stack>
        </Paper>
      </Stack>
    );
  };

  const renderMousePath = (row) => {
    const mouseMoves = parseJson(row?.mouse_moves, []);
    const screenW = Number(row?.screen_w || 1920);
    const screenH = Number(row?.screen_h || 1080);

    if (!Array.isArray(mouseMoves) || mouseMoves.length === 0) {
      return (
        <Typography color="text.secondary">
          {t('admin.biometrics.no_mouse_moves')}
        </Typography>
      );
    }

    const svgW = 760;
    const ratio = svgW / screenW;
    const svgH = Math.max(260, screenH * ratio);

    const points = mouseMoves.filter(
      (point) => point.x !== undefined && point.y !== undefined
    );

    const pathData = points
      .map((point) => `${Number(point.x) * ratio},${Number(point.y) * ratio}`)
      .join(' ');

    return (
      <Stack spacing={2}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${
              isDarkMode ? alpha('#ffffff', 0.08) : '#e5e7eb'
            }`,
            backgroundColor: isDarkMode ? '#0b0f17' : '#f8fafc',
            overflow: 'hidden',
            p: 1,
          }}
        >
          <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`}>
            <rect width={svgW} height={svgH} fill="transparent" />

            <polyline
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth="2"
              points={pathData}
            />

            {points[0] && (
              <circle
                cx={Number(points[0].x) * ratio}
                cy={Number(points[0].y) * ratio}
                r="5"
                fill={theme.palette.success.main}
              />
            )}

            {points[points.length - 1] && (
              <circle
                cx={Number(points[points.length - 1].x) * ratio}
                cy={Number(points[points.length - 1].y) * ratio}
                r="5"
                fill={theme.palette.error.main}
              />
            )}
          </svg>
        </Paper>

        <Typography variant="body2" color="text.secondary">
          {t('admin.biometrics.mouse_path_legend')}
        </Typography>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            ...cardSx,
            maxHeight: 260,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.biometrics.time')}</TableCell>
                <TableCell>{t('admin.biometrics.position')}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {points.map((point, index) => (
                <TableRow key={index} hover>
                  <TableCell>{point.t ?? '—'} ms</TableCell>
                  <TableCell>
                    {point.x ?? '—'}, {point.y ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  const renderDetailContent = () => {
    if (!selectedRow) return null;

    if (detailTab === 0) return renderOverview(selectedRow);
    if (detailTab === 1) return renderMousePath(selectedRow);
    if (detailTab === 2) return <RawDataBlock data={selectedRow} />;

    return null;
  };

  const DetailButton = ({ row }) => (
    <Button
      variant="outlined"
      size="small"
      onClick={() => handleOpenDetail(row)}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 700,
      }}
    >
      {t('admin.flagged.detail')}
    </Button>
  );

  const MobileList = () => (
    <Stack spacing={2}>
      {biometrics.map((row) => (
        <Paper key={row.biometrics_id} elevation={0} sx={{ ...cardSx, p: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {getProblemName(row, t)}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {t('admin.biometrics.record')} #{row.biometrics_id}
                </Typography>
              </Box>

              <Chip
                icon={<MonitorOutlined fontSize="small" />}
                label={`${row.screen_w || '—'}x${row.screen_h || '—'}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {formatDate(row.collected_at, i18n.language)}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {t('admin.biometrics.function_identifier')}: {getProblemIdentifier(row)}
            </Typography>

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
              <DetailButton row={row} />
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );

  const DesktopTable = () => (
    <TableContainer component={Paper} elevation={0} sx={{ ...cardSx }}>
      <Table sx={{ minWidth: 850 }}>
        <TableHead>
          <TableRow>
            <TableCell>{t('admin.biometrics.record')}</TableCell>
            <TableCell>{t('editor.task')}</TableCell>
            <TableCell>{t('admin.biometrics.date')}</TableCell>
            <TableCell>{t('admin.biometrics.screen')}</TableCell>
            <TableCell align="right">{t('admin.biometrics.actions')}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {biometrics.map((row) => (
            <TableRow key={row.biometrics_id} hover>
              <TableCell>
                <Typography sx={{ fontWeight: 800 }}>
                  #{row.biometrics_id}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography sx={{ fontWeight: 800 }}>
                  {getProblemName(row, t)}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {t('admin.biometrics.function_identifier')}: {getProblemIdentifier(row)}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(row.collected_at, i18n.language)}
                </Typography>
              </TableCell>

              <TableCell>
                <Chip
                  icon={<MonitorOutlined fontSize="small" />}
                  label={`${row.screen_w || '—'}x${row.screen_h || '—'}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </TableCell>

              <TableCell align="right">
                <DetailButton row={row} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
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
        <Box sx={{ width: '100%', maxWidth: 1080, mx: 'auto' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent={{ xs: 'center', sm: 'flex-start' }}
            >
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  border: `1px solid ${
                    isDarkMode ? alpha('#ffffff', 0.1) : '#e5e7eb'
                  }`,
                  backgroundColor: isDarkMode ? '#171a22' : '#ffffff',
                }}
              >
                <ArrowBack />
              </IconButton>

              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.035em',
                    color: isDarkMode ? '#fff' : '#111827',
                  }}
                >
                  {t('admin.biometrics.user_title')}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {t('admin.biometrics.subtitle')}
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchBiometrics}
              disabled={loading}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              {t('admin.dashboard.refresh')}
            </Button>
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
              minHeight="50vh"
            >
              <CircularProgress />
            </Box>
          ) : biometrics.length === 0 ? (
            <Paper elevation={0} sx={{ ...cardSx, p: 4, textAlign: 'center' }}>
              <MouseOutlined
                sx={{ fontSize: 42, color: 'text.secondary', mb: 1 }}
              />

              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('admin.biometrics.emptyTitle')}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {t('admin.biometrics.emptyText')}
              </Typography>
            </Paper>
          ) : (
            <>{isMobile ? <MobileList /> : <DesktopTable />}</>
          )}
        </Box>

        <Dialog
          open={detailOpen}
          onClose={handleCloseDetail}
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
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              spacing={2}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {t('admin.biometrics.detail_title')}
                </Typography>

                {selectedRow && (
                  <Typography variant="body2" color="text.secondary">
                    {getProblemName(selectedRow, t)} ·{' '}
                    {t('admin.biometrics.record').toLowerCase()} #
                    {selectedRow.biometrics_id}
                  </Typography>
                )}
              </Box>

              <IconButton onClick={handleCloseDetail}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>

          <Box sx={{ px: 2.5 }}>
            <Tabs
              value={detailTab}
              onChange={(event, value) => setDetailTab(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label={t('admin.biometrics.overview')} />
              <Tab label={t('admin.biometrics.mouse')} />
              <Tab label={t('admin.biometrics.raw_data')} />
            </Tabs>
          </Box>

          <Divider />

          <DialogContent sx={{ p: 2.5 }}>
            {renderDetailContent()}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleCloseDetail}
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              {t('admin.biometrics.close')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default AdminUserBiometrics;