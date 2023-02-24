import { h } from 'vue'
import Theme from 'vitepress/theme'
import './styles/vars.css'
import SvgImage from './components/SvgImage.vue'
import Layout from './components/Layout.vue'

export default {
  ...Theme,
  Layout: Layout,
  enhanceApp({ app }) {
    app.component('SvgImage', SvgImage)
  },
}
