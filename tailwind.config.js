export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope Variable', 'Manrope', 'sans-serif'],
      },
      colors: {
        cosmos: '#02050b',
        glass: 'rgba(9, 16, 28, 0.72)',
      },
      boxShadow: {
        glass: '0 30px 90px rgba(0, 0, 0, 0.42)',
      },
    },
  },
  plugins: [],
}
