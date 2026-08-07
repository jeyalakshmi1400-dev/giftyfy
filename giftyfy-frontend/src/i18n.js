import i18n from "i18next";

import {
  initReactI18next,
} from "react-i18next";

i18n
  .use(initReactI18next)
  .init({

    resources: {

      // ================= ENGLISH =================

      en: {

        translation: {

          built:
            "Built for innovation and success",

          shop: "Shop",

          categories: "Categories",

          support: "Support",

          company: "Company",

          products: "All Products",

          arrivals: "New Arrivals",

          sellers: "Best Sellers",

          gift: "Gifts",

          personalised:
            "Personalised",

          accessories:
            "Accessories",

          contact: "Contact",

          faq: "FAQ",

          returns: "Returns",

          about: "About",

          careers: "Careers",

          privacy: "Privacy",

          terms: "Terms",

          cookies: "Cookies",

          sitemap: "Sitemap",

          timing1:
            "Mon - Fri: 10:00 - 18:00",

          timing2:
            "Sat - Sun: Closed",

        },

      },

      // ================= TAMIL =================

      ta: {

        translation: {

          built:
            "புதுமை மற்றும் வெற்றிக்காக உருவாக்கப்பட்டது",

          shop: "கடை",

          categories: "வகைகள்",

          support: "உதவி",

          company: "நிறுவனம்",

          products:
            "அனைத்து பொருட்கள்",

          arrivals:
            "புதிய வரவுகள்",

          sellers:
            "அதிகம் விற்கப்படும்",

          gift: "பரிசுகள்",

          personalised:
            "தனிப்பயனாக்கப்பட்டது",

          accessories:
            "அணிகலன்கள்",

          contact:
            "தொடர்பு",

          faq:
            "அடிக்கடி கேட்கப்படும் கேள்விகள்",

          returns:
            "திருப்பி அனுப்புதல்",

          about:
            "எங்களை பற்றி",

          careers:
            "வேலைவாய்ப்புகள்",

          privacy:
            "தனியுரிமை",

          terms:
            "விதிமுறைகள்",

          cookies:
            "குக்கீகள்",

          sitemap:
            "தள வரைபடம்",

          timing1:
            "திங்கள் - வெள்ளி: 10 - 18",

          timing2:
            "சனி - ஞாயிறு: மூடப்பட்டது",

        },

      },

    },

    lng: "en",

    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },

  });

export default i18n;