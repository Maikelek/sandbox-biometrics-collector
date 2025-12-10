import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Alert,
  Container,
} from '@mui/material';
import { Brightness4, Brightness7, Visibility, VisibilityOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '../context/ThemeContext';
import '../i18n';

const Register = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { themeMode, toggleTheme } = useThemeContext();

  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordRepeat: '',
    biometricConsent: false,
  });

  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scroll, setScroll] = useState('paper');
  const [showAlert, setShowAlert] = useState(false);

  const [showPassword, setShowPassword] = useState(false); 
  const [showRepeatPassword, setShowRepeatPassword] = useState(false); 

  const allFieldsFilled = useMemo(() => {
    return formData.name.trim() !== '' &&
           formData.email.trim() !== '' &&
           formData.password !== '' &&
           formData.passwordRepeat !== '';
  }, [formData]);


  const handleLangChange = (_, lang) => lang && i18n.changeLanguage(lang);

  const handleDialogOpen = () => {
    setScroll('paper');
    setDialogOpen(true);
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

  const handleSubmit = async () => {
    const validationErrors = validate();
    
    if (!consent) {
      setShowAlert(true);
    }

    if (!consent || Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setShowAlert(false);

    try {
      const res = await axios.post("http://localhost:1234/register", {
        withCredentials: true,
        ...formData,
        biometricConsent: consent,
      });

      if (res.status === 200) {
        setSuccess(true);
        setShowAlert(true);
      }
    } catch (error) {
      const msg = error.response?.data?.message;
      if (msg) {
        const errMap = {};

        if (msg.toLowerCase().includes("nick")) errMap.name = msg;
        else if (msg.toLowerCase().includes("email")) errMap.email = msg;
        else if (msg.toLowerCase().includes("password")) {
          if (msg.toLowerCase().includes("match")) errMap.passwordRepeat = msg;
          else errMap.password = msg;
        } else if (msg.toLowerCase().includes("biometric")) {
          setShowAlert(true);
        }

        setErrors(errMap);
      } else {
        console.error(error);
        alert("Unknown error occurred.");
      }
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
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          p: 1, 
          width: '100%',
        }}
      >
        <ToggleButtonGroup value={i18n.language} exclusive onChange={handleLangChange} size="small">
          <ToggleButton value="en">EN</ToggleButton>
          <ToggleButton value="sk">SK</ToggleButton>
        </ToggleButtonGroup>
        <IconButton onClick={toggleTheme} color="inherit" sx={{ ml: 1 }}>
          {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Box>

      <Container
        component="main"
        maxWidth="sm"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 50px)', 
          py: { xs: 2, sm: 4 }, 
          px: 2,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, md: 5 }, 
            width: '100%',
            maxWidth: 500, 
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="h4" gutterBottom align="center">
            {t('register')}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {showAlert && (
            <Alert
              severity={success ? "success" : "error"}
              onClose={() => setShowAlert(false)}
              sx={{ mb: 2 }}
            >
              {success ? t('registered') : t('biometric-consent-required')}
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
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            error={Boolean(errors.password)}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
          <TextField
            label={t('password-repeat')}
            name="passwordRepeat"
            type={showRepeatPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={formData.passwordRepeat}
            onChange={handleChange}
            error={Boolean(errors.passwordRepeat)}
            helperText={errors.passwordRepeat}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  edge="end"
                >
                  {showRepeatPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />

          <Button variant="outlined" onClick={handleDialogOpen} sx={{ mt: 2 }} fullWidth>
            {t('show-biometric-terms')} {consent && '(✅)'}
          </Button>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, mb: 1 }}
            onClick={handleSubmit}
            disabled={!consent || !allFieldsFilled} 
          >
            {t('submit')}
          </Button>

          <Box mt={2} textAlign="center">
            <Typography variant="body2">
              {t('have-account')}{' '}
              <Button variant="text" onClick={() => navigate('/login')} size="small">
                {t('login-here')}
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
        fullWidth
        maxWidth="sm"
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
              <ToggleButton value="sk">SK</ToggleButton>
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
          <Button onClick={handleAgree} variant="contained">{t('agree')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Register;