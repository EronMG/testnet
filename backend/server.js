const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'mints.db');
const db = new sqlite3.Database(dbPath);

// Initialize database table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS minted_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    mint_address TEXT,
    transaction_signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// API Routes

// Get mint status for a wallet
app.get('/api/mint-status/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  db.get(
    'SELECT * FROM minted_wallets WHERE wallet_address = ?',
    [walletAddress],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        hasMinted: !!row,
        mintData: row || null
      });
    }
  );
});

// Record a new mint
app.post('/api/record-mint', (req, res) => {
  const { walletAddress, mintAddress, transactionSignature } = req.body;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }
  
  // First check if max supply is reached
  db.get(
    'SELECT COUNT(*) as count FROM minted_wallets',
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const MAX_SUPPLY = 400;
      if (row.count >= MAX_SUPPLY) {
        return res.status(400).json({ 
          error: 'Maximum supply reached',
          message: 'All 400 NFTs have been minted'
        });
      }
      
      // Check if wallet already minted
      db.get(
        'SELECT * FROM minted_wallets WHERE wallet_address = ?',
        [walletAddress],
        (err, existingRow) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          if (existingRow) {
            return res.status(400).json({ 
              error: 'Wallet already minted',
              message: 'This wallet has already minted an NFT'
            });
          }
          
          // Insert new mint record
          db.run(
            'INSERT INTO minted_wallets (wallet_address, mint_address, transaction_signature) VALUES (?, ?, ?)',
            [walletAddress, mintAddress, transactionSignature],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to record mint' });
              }
              
              res.json({
                success: true,
                message: 'Mint recorded successfully',
                id: this.lastID,
                totalMinted: row.count + 1
              });
            }
          );
        }
      );
    }
  );
});

// Get total mint count
app.get('/api/mint-count', (req, res) => {
  db.get(
    'SELECT COUNT(*) as count FROM minted_wallets',
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ count: row.count });
    }
  );
});

// Get all minted wallets (for admin purposes)
app.get('/api/minted-wallets', (req, res) => {
  db.all(
    'SELECT wallet_address, transaction_signature, created_at FROM minted_wallets ORDER BY created_at DESC',
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ wallets: rows });
    }
  );
});

// Admin dashboard HTML page
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NFT Mint Admin Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
            .stat-label { font-size: 0.9em; opacity: 0.9; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .wallet-address { font-family: monospace; font-size: 0.9em; }
            .transaction-link { color: #007bff; text-decoration: none; }
            .transaction-link:hover { text-decoration: underline; }
            .refresh-btn { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
            .refresh-btn:hover { background: #218838; }
            .loading { text-align: center; padding: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔥 NFT Mint Admin Dashboard</h1>
            
            <button class="refresh-btn" onclick="loadData()">🔄 Обновить данные</button>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number" id="totalMints">-</div>
                    <div class="stat-label">Всего минтов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="todayMints">-</div>
                    <div class="stat-label">Сегодня</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="percentComplete">-</div>
                    <div class="stat-label">% от 400</div>
                </div>
            </div>
            
            <h2>📋 Список заминченных кошельков</h2>
            <div id="loading" class="loading">Загрузка данных...</div>
            <table id="walletsTable" style="display: none;">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Адрес кошелька</th>
                        <th>Транзакция</th>
                        <th>Дата минта</th>
                    </tr>
                </thead>
                <tbody id="walletsBody">
                </tbody>
            </table>
        </div>

        <script>
            async function loadData() {
                try {
                    document.getElementById('loading').style.display = 'block';
                    document.getElementById('walletsTable').style.display = 'none';
                    
                    // Загружаем статистику
                    const countResponse = await fetch('/api/mint-count');
                    const countData = await countResponse.json();
                    
                    // Загружаем список кошельков
                    const walletsResponse = await fetch('/api/minted-wallets');
                    const walletsData = await walletsResponse.json();
                    
                    // Обновляем статистику
                    document.getElementById('totalMints').textContent = countData.count;
                    document.getElementById('percentComplete').textContent = Math.round((countData.count / 400) * 100) + '%';
                    
                    // Считаем минты за сегодня
                    const today = new Date().toDateString();
                    const todayMints = walletsData.wallets.filter(wallet => {
                        const mintDate = new Date(wallet.created_at).toDateString();
                        return mintDate === today;
                    }).length;
                    document.getElementById('todayMints').textContent = todayMints;
                    
                    // Заполняем таблицу
                    const tbody = document.getElementById('walletsBody');
                    tbody.innerHTML = '';
                    
                    walletsData.wallets.forEach((wallet, index) => {
                        const row = tbody.insertRow();
                        row.innerHTML = \`
                            <td>\${index + 1}</td>
                            <td class="wallet-address">\${wallet.wallet_address}</td>
                            <td>
                                \${wallet.transaction_signature ? 
                                    \`<a href="https://fogoscan.com/tx/\${wallet.transaction_signature}?cluster=testnet" target="_blank" class="transaction-link">Посмотреть</a>\` : 
                                    'Нет данных'
                                }
                            </td>
                            <td>\${new Date(wallet.created_at).toLocaleString('ru-RU')}</td>
                        \`;
                    });
                    
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('walletsTable').style.display = 'table';
                    
                } catch (error) {
                    console.error('Ошибка загрузки данных:', error);
                    document.getElementById('loading').textContent = 'Ошибка загрузки данных: ' + error.message;
                }
            }
            
            // Загружаем данные при загрузке страницы
            loadData();
            
            // Автообновление каждые 30 секунд
            setInterval(loadData, 30000);
        </script>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database path: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
