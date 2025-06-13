import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const changeLang = (_, lang) => {
    if (lang) i18n.changeLanguage(lang);
  };

  return (
    <ToggleButtonGroup value={i18n.language} exclusive onChange={changeLang} size="small">
      <ToggleButton value="en">EN</ToggleButton>
      <ToggleButton value="sk">SK</ToggleButton>
    </ToggleButtonGroup>
  );
};

export default LanguageToggle;
