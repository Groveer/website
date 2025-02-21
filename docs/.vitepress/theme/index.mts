import { h } from "vue";
import Theme from "vitepress/theme";
import "./styles/vars.css";
import SvgImage from "./components/SvgImage.vue";
import Layout from "./components/Layout.vue";
import googleAnalytics from 'vitepress-plugin-google-analytics'

export default {
  ...Theme,
  Layout: Layout,
  enhanceApp({ app }) {
    app.component("SvgImage", SvgImage);
    googleAnalytics({
      id: 'G-PBD39V8R72', // Replace with your GoogleAnalytics ID, which should start with the 'G-'
    });
  },
};
