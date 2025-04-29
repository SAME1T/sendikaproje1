module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'sendika-gizli-anahtar-2024',
  jwtExpiration: 86400, // 24 saat
  apiPort: 3001,
  allowedOrigins: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3002',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'http://localhost:8080',
    'http://localhost:8100'
  ]
}; 