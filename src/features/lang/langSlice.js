import { createSlice } from '@reduxjs/toolkit';
import { readBrowserPreference } from '../../utils/browserStorage';

const savedLang = readBrowserPreference('app_lang');
const initialLang = savedLang === 'en' || savedLang === 'ar' ? savedLang : 'en';

const initialState = {
  current: initialLang,
  dir: initialLang === 'ar' ? 'rtl' : 'ltr',
};

export const langSlice = createSlice({
  name: 'lang',

  initialState,

  reducers: {
    toggleLanguage: (state) => {
      state.current = state.current === 'ar' ? 'en' : 'ar';
      state.dir = state.current === 'ar' ? 'rtl' : 'ltr';
    },
    setLanguage: (state, action) => {
      const nextLanguage = action.payload === 'en' ? 'en' : 'ar';
      state.current = nextLanguage;
      state.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr';
    },
  },
});

export const { toggleLanguage, setLanguage } = langSlice.actions;
export default langSlice.reducer;