import { createSlice } from '@reduxjs/toolkit';
import { readBrowserPreference } from '../../utils/browserStorage';

const savedTheme = readBrowserPreference('app_theme') || 'dark';
const initialTheme = savedTheme === 'light' ? 'light' : 'dark';

const initialState = {
  isMobileMenuOpen: false,
  theme: initialTheme,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },

    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setTheme: (state, action) => {
      state.theme = action.payload === 'light' ? 'light' : 'dark';
    },
  },
});

export const { toggleMobileMenu, closeMobileMenu, toggleTheme, setTheme } = uiSlice.actions;
export default uiSlice.reducer;