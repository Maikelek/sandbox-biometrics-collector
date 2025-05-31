import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  CssBaseline,
  ThemeProvider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Alert
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { createTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import '../i18n';

const Register = () => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState('light');
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  const toggleMode = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleLangChange = (_, lang) => lang && i18n.changeLanguage(lang);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordRepeat: '',
    biometricConsent: false
  });

  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scroll, setScroll] = useState('paper');
  const [showAlert, setShowAlert] = useState(false);

  const handleDialogOpen = () => {
    setScroll('paper');
    setDialogOpen(true);
    console.log(formData)
  };

  const handleDialogClose = () => setDialogOpen(false);

  const handleAgree = () => {
    setConsent(true);
    setShowAlert(false);
    setDialogOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('error-name');
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = t('error-email');
    if (formData.password.length < 6) newErrors.password = t('error-password');
    if (formData.password !== formData.passwordRepeat)
      newErrors.passwordRepeat = t('error-password-match');
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (!consent) {
      setShowAlert(true);
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (consent) {
      setShowAlert(false);
    }
  };

  const descriptionElementRef = useRef(null);
  useEffect(() => {
    if (dialogOpen) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [dialogOpen]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="top-bar">
        <ToggleButtonGroup value={i18n.language} exclusive onChange={handleLangChange}>
          <ToggleButton value="en">EN</ToggleButton>
          <ToggleButton value="de">DE</ToggleButton>
        </ToggleButtonGroup>
        <IconButton onClick={toggleMode}>
          {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </div>

      <div className="holder-sign">
        <Paper elevation={6} className="register-form" sx={{ p: 4, width: '100%', maxWidth: 500 }}>
          <Typography variant="h4" gutterBottom align="center">
            {t('register')}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {showAlert && (
            <Alert severity="error" onClose={() => setShowAlert(false)} sx={{ mb: 2 }}>
              {t('biometric-consent-required')}
            </Alert>
          )}

          <TextField
            label={t('name')}
            name="name"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={handleChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
          />
          <TextField
            label={t('email')}
            name="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={handleChange}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
          <TextField
            label={t('password')}
            name="password"
            type="password"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            error={Boolean(errors.password)}
            helperText={errors.password}
          />
          <TextField
            label={t('password-repeat')}
            name="passwordRepeat"
            type="password"
            fullWidth
            margin="normal"
            value={formData.passwordRepeat}
            onChange={handleChange}
            error={Boolean(errors.passwordRepeat)}
            helperText={errors.passwordRepeat}
          />

          <Button
            variant="outlined"
            onClick={handleDialogOpen}
            sx={{ mt: 2 }}
            fullWidth
          >
            {t('show-biometric-terms')}
          </Button>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleSubmit}
          >
            {t('submit')}
          </Button>
        </Paper>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">
          {t('biometric-consent-title')}
          <Box sx={{ float: 'right' }}>
            <ToggleButtonGroup
              size="small"
              value={i18n.language}
              exclusive
              onChange={handleLangChange}
            >
              <ToggleButton value="en">EN</ToggleButton>
              <ToggleButton value="de">DE</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </DialogTitle>
        <DialogContent dividers={scroll === 'paper'}>
          <DialogContentText
            id="scroll-dialog-description"
            ref={descriptionElementRef}
            tabIndex={-1}
            sx={{ whiteSpace: 'pre-line' }}
          >
            {t('biometric-consent-text')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>{t('cancel')}</Button>
          <Button onClick={handleAgree}>{t('agree')}</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default Register;
