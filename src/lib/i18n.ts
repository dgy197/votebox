import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import hu from '../locales/hu.json'
import en from '../locales/en.json'

const savedLanguage = localStorage.getItem('language') || 'hu'

i18n.use(initReactI18next).init({
  resources: {
    hu: { translation: hu },
    en: { translation: en },
  },
  lng: savedLanguage,
  fallbackLng: 'hu',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
