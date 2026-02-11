import './index.css'
import './styles/global.css'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'

import Layout from './pages/Layout.jsx'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./pages/**/*.jsx', { eager: true })
    const page = pages[`./pages/${name}.jsx`]

    // 👉 Apply global layout if page doesn't define one
    page.default.layout ??= (page) => <Layout>{page}</Layout>

    return page
  },

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
