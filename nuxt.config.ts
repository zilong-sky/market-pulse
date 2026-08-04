export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  devtools: { enabled: false },
  app: {
    head: {
      title: '市场行情分析',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' }
      ]
    }
  },
  nitro: {
    preset: 'vercel'
  },
  runtimeConfig: {
    public: {
      deepseekKey: process.env.DEEPSEEK_API_KEY || ''
    }
  }
})
