export function renderAdminHtml(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - Dynamic Review Card Engine v3</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
  <style>
    :root {
      --bg-gradient: radial-gradient(circle at 10% 20%, #0f172a 0%, #020617 90%);
      --surface: rgba(30, 41, 59, 0.85);
      --surface-border: rgba(255, 255, 255, 0.12);
      --surface-hover: rgba(51, 65, 85, 0.9);
      --primary: #38bdf8;
      --primary-hover: #0ea5e9;
      --primary-glow: rgba(56, 189, 248, 0.4);
      --accent: #818cf8;
      --success: #34d399;
      --danger: #f87171;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --radius: 16px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    }

    body {
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
    }

    .container {
      width: 100%;
      max-width: 620px;
      background: var(--surface);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius);
      padding: 36px 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px var(--primary-glow);
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header {
      text-align: center;
      margin-bottom: 24px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(56, 189, 248, 0.12);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .badge::before {
      content: '';
      width: 7px;
      height: 7px;
      background: var(--primary);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--primary);
    }

    h1 {
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }

    p.subtitle {
      color: var(--text-muted);
      font-size: 0.88rem;
    }

    /* Tab Switcher Navigation */
    .tab-navigation {
      display: flex;
      gap: 8px;
      background: rgba(15, 23, 42, 0.9);
      padding: 6px;
      border-radius: 12px;
      margin-bottom: 22px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      position: relative;
      z-index: 100;
    }

    .tab-btn {
      flex: 1;
      padding: 12px 14px;
      border: 1px solid transparent;
      background: transparent;
      color: #94a3b8;
      font-size: 0.9rem;
      font-weight: 700;
      border-radius: 9px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      user-select: none;
      outline: none;
      position: relative;
      z-index: 101;
    }

    .tab-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }

    .tab-btn.active {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(129, 140, 248, 0.35) 100%);
      color: #ffffff !important;
      border: 1px solid rgba(56, 189, 248, 0.6);
      box-shadow: 0 4px 16px rgba(56, 189, 248, 0.35);
    }

    .form-group {
      margin-bottom: 18px;
    }

    .option-card {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 16px;
      margin-top: -4px;
      margin-bottom: 18px;
      transition: border-color 0.2s ease;
    }

    .option-card:hover {
      border-color: rgba(56, 189, 248, 0.3);
    }

    label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 6px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .input-prefix {
      position: absolute;
      left: 14px;
      color: var(--text-muted);
      font-size: 0.88rem;
      font-family: 'JetBrains Mono', monospace;
      pointer-events: none;
      user-select: none;
      z-index: 2;
    }

    input[type="text"],
    input[type="url"],
    input[type="password"] {
      width: 100%;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: var(--text-main);
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 0.92rem;
      transition: all 0.2s ease;
      outline: none;
    }

    input.has-prefix {
      padding-left: 56px;
      font-family: 'JetBrains Mono', monospace;
    }

    input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
      background: rgba(15, 23, 42, 0.95);
    }

    .fetch-btn {
      padding: 11px 14px;
      background: rgba(56, 189, 248, 0.18);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      display: none;
      flex-shrink: 0;
    }

    .fetch-btn:hover {
      background: rgba(56, 189, 248, 0.3);
      border-color: var(--primary);
    }

    .checkbox-group {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      user-select: none;
      cursor: pointer;
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--primary);
      cursor: pointer;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .checkbox-group span {
      font-size: 0.84rem;
      color: #e2e8f0;
      line-height: 1.4;
    }

    .checkbox-hint {
      margin-top: 6px;
      margin-left: 28px;
      font-size: 0.76rem;
      color: var(--text-muted);
      line-height: 1.45;
    }

    .checkbox-hint code {
      font-family: 'JetBrains Mono', monospace;
      color: var(--primary);
      background: rgba(56, 189, 248, 0.1);
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 0.74rem;
    }

    .url-preview-tag {
      margin-top: 10px;
      margin-left: 28px;
      padding: 8px 12px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px dashed rgba(56, 189, 248, 0.35);
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: #7dd3fc;
      word-break: break-all;
      animation: fadeIn 0.2s ease;
    }

    .url-preview-label {
      color: var(--text-muted);
      font-weight: 600;
      margin-right: 4px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    button.submit-btn {
      width: 100%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: #0f172a;
      border: none;
      padding: 14px 20px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 10px;
      box-shadow: 0 8px 20px rgba(56, 189, 248, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    button.submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 25px rgba(56, 189, 248, 0.45);
      filter: brightness(1.05);
    }

    button.submit-btn:active {
      transform: translateY(1px);
    }

    button.submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .alert {
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 10px;
      font-size: 0.88rem;
      display: none;
      animation: fadeIn 0.3s ease-out;
    }

    .alert.success {
      display: block;
      background: rgba(52, 211, 153, 0.12);
      border: 1px solid rgba(52, 211, 153, 0.3);
      color: var(--success);
    }

    .alert.error {
      display: block;
      background: rgba(248, 113, 113, 0.12);
      border: 1px solid rgba(248, 113, 113, 0.3);
      color: var(--danger);
    }

    .result-box {
      margin-top: 18px;
      padding: 16px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      display: none;
    }

    .result-box.show {
      display: block;
      animation: fadeIn 0.3s ease-out;
    }

    .result-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .result-url {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--primary);
      word-break: break-all;
      background: rgba(56, 189, 248, 0.08);
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px dashed rgba(56, 189, 248, 0.3);
      margin-bottom: 12px;
      display: block;
      text-decoration: none;
    }

    .result-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-btn {
      flex: 1;
      min-width: 100px;
      padding: 8px 12px;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid var(--surface-border);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: center;
      text-decoration: none;
    }

    .action-btn:hover {
      background: var(--surface-hover);
      border-color: var(--primary);
      color: var(--primary);
    }

    /* QR Code Section */
    .qr-section {
      margin-top: 16px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      text-align: center;
      display: none;
    }

    .qr-section.show {
      display: block;
      animation: fadeIn 0.3s ease-out;
    }

    .qr-section .result-title {
      margin-bottom: 12px;
    }

    #qrCanvas {
      background: #ffffff;
      border-radius: 8px;
      padding: 12px;
      display: inline-block;
    }

    .qr-download-row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      justify-content: center;
    }

    /* List View Styles */
    .filter-row {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .filter-btn {
      flex: 1;
      padding: 8px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--text-muted);
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .filter-btn.active {
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--primary);
      color: var(--primary);
      font-weight: 600;
    }

    .card-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 4px;
    }

    /* Custom Scrollbar for Card List */
    .card-list::-webkit-scrollbar { width: 6px; }
    .card-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
    .card-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
    .card-list::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

    .card-item {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .card-item:hover {
      background: rgba(15, 23, 42, 0.8);
      border-color: var(--primary);
    }
    
    .card-item-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .card-code {
      font-weight: 700;
      color: var(--text-main);
      font-size: 0.95rem;
    }
    .card-nfc {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    
    .status-badge {
      font-size: 0.7rem;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-unassigned {
      background: rgba(250, 204, 21, 0.15);
      color: #facc15;
      border: 1px solid rgba(250, 204, 21, 0.3);
    }
    .status-active {
      background: rgba(52, 211, 153, 0.15);
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.3);
    }
    .status-inactive {
      background: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .refresh-btn {
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .refresh-btn:hover { text-decoration: underline; }

    .assign-title {
      font-size: 1.1rem;
      color: #facc15;
      margin-bottom: 16px;
      display: none;
      text-align: center;
    }

    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">NFC / QR Management</div>
      <h1>Review Card Engine <span style="font-size:0.7em;opacity:0.6;">v3</span></h1>
      <p class="subtitle">Buat atau perbarui pemetaan kartu ulasan Google ke URL target</p>
    </div>

    <!-- Mode Selector: Tabs -->
    <div class="tab-navigation">
      <button class="tab-btn active" id="btn-tab-list" type="button">
        🗂️ Daftar Kartu
      </button>
      <button class="tab-btn" id="btn-tab-create" type="button">
        ✨ Buat Manual
      </button>
      <button class="tab-btn" id="btn-tab-batch" type="button">
        📦 Batch Gen
      </button>
    </div>

    <!-- Admin API Key (Global) -->
    <div class="form-group" style="border-bottom:1px solid var(--surface-border); padding-bottom:16px; margin-bottom:16px;">
      <label for="apiKey">Admin API Key <span style="color:var(--text-muted); font-weight:400;">(x-api-key)</span></label>
      <input type="password" id="apiKey" placeholder="Masukkan ADMIN_API_KEY jika diaktifkan..." autocomplete="off">
    </div>

    <!-- Alert / Toast -->
    <div class="alert" id="alertBox"></div>

    <!-- SECTION: LIST CARDS -->
    <div id="sectionList" style="display:block;">
      <div class="list-header">
        <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">Data Kartu (<span id="totalCards">0</span>)</div>
        <button class="refresh-btn" id="refreshListBtn">🔄 Refresh</button>
      </div>
      
      <div class="filter-row">
        <button class="filter-btn active" data-filter="all">Semua</button>
        <button class="filter-btn" data-filter="unassigned">🟡 Unassigned</button>
        <button class="filter-btn" data-filter="active">🟢 Active</button>
      </div>

      <div class="form-group" style="margin-bottom: 12px;">
        <input type="text" id="searchInput" placeholder="Cari short code, NFC UID, atau label..." autocomplete="off">
      </div>

      <div class="card-list" id="cardListContainer">
        <!-- Cards injected via JS -->
        <div style="text-align:center; padding: 20px; color: var(--text-muted); font-size:0.85rem;">Memuat data...</div>
      </div>
      
      <div style="text-align:center; margin-top: 12px;">
        <button type="button" class="action-btn" id="loadMoreBtn" style="display:none; width:auto; padding:8px 24px;">Load More</button>
      </div>
    </div>

    <!-- SECTION: FORM (CREATE / ASSIGN / UPDATE) -->
    <div id="sectionForm" style="display:none;">
      <div class="assign-title" id="assignTitle">✨ Assign URL untuk Kartu Baru</div>
      <form id="cardForm">
        
        <!-- Short Code -->
        <div class="form-group">
          <label for="shortCode">
            <span id="shortCodeLabel">Short Code</span> <span style="color:var(--danger)">*</span>
          </label>
          <div class="input-wrapper">
            <span class="input-prefix">/r/</span>
            <input type="text" id="shortCode" class="has-prefix" placeholder="contoh: k-001" required pattern="[a-zA-Z0-9\\-_]+">
            <button type="button" class="fetch-btn" id="fetchCardBtn">🔍 Muat Data</button>
          </div>
        </div>

        <!-- Label (Opsional) -->
        <div class="form-group">
          <label for="cardLabel">Label <span style="color:var(--text-muted); font-weight:400;">(opsional)</span></label>
          <input type="text" id="cardLabel" placeholder="Contoh: Meja 5, Cabang Kemang" autocomplete="off">
        </div>

        <!-- NFC UID -->
        <div class="form-group">
          <label for="nfcUid">NFC UID <span style="color:var(--text-muted); font-weight:400;">(opsional)</span></label>
          <input type="text" id="nfcUid" placeholder="Contoh: 04:A3:2B:1C:5D:6E:7F" autocomplete="off">
        </div>

        <!-- Target URL -->
        <div class="form-group">
          <label for="targetUrl">Target Google Review URL <span style="color:var(--text-muted); font-weight:400;">(opsional)</span></label>
          <input type="url" id="targetUrl" placeholder="https://maps.app.goo.gl/...">
        </div>

        <!-- Auto Google Review Parameter Checkbox -->
        <div class="option-card">
          <label class="checkbox-group" for="autoReviewParam">
            <input type="checkbox" id="autoReviewParam" checked>
            <span>Tambahkan parameter Google Review otomatis</span>
          </label>
          <p class="checkbox-hint">💡 Memformat URL agar langsung membuka dialog ulasan.</p>
          <div id="urlPreviewBox" class="url-preview-tag" style="display: none;">
            <span class="url-preview-label">URL Tersimpan:</span>
            <span id="formattedUrlPreview"></span>
          </div>
        </div>

        <!-- Active Status -->
        <div class="form-group">
          <label class="checkbox-group" for="isActive">
            <input type="checkbox" id="isActive">
            <span>Aktifkan kartu fisik ini (Redirect Aktif)</span>
          </label>
        </div>

        <button type="submit" class="submit-btn" id="submitBtn">
          <span id="btnText">Simpan Kartu Baru</span>
        </button>
      </form>

      <!-- Result / Preview Box -->
      <div class="result-box" id="resultBox">
        <div class="result-title">🔗 URL Kartu Siap Digunakan:</div>
        <a href="#" target="_blank" class="result-url" id="resultLink"></a>
        <div id="nfcResultRow" style="display:none; margin-bottom: 12px;">
          <div class="result-title" style="margin-top:8px;">📡 NFC Redirect URL:</div>
          <a href="#" target="_blank" class="result-url" id="nfcResultLink"></a>
        </div>
        <div class="result-actions">
          <button type="button" class="action-btn" id="copyBtn">📋 Salin</button>
          <a href="#" target="_blank" class="action-btn" id="testBtn">🚀 Buka</a>
        </div>
      </div>

      <!-- QR Code Section -->
      <div class="qr-section" id="qrSection">
        <div class="result-title">📱 QR Code untuk Cetak</div>
        <div id="qrCanvas"></div>
        <div class="qr-download-row">
          <button type="button" class="action-btn" id="downloadSvgBtn">⬇️ SVG</button>
          <button type="button" class="action-btn" id="downloadPngBtn">⬇️ PNG</button>
        </div>
      </div>
    </div>

    <!-- SECTION: BATCH GENERATE -->
    <div id="sectionBatch" style="display:none;" class="bulk-section">
      <div class="result-title" style="margin-bottom:12px;">📦 Bulk Generate QR Cards (ZIP / PDF)</div>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">Buat ratusan kartu sekaligus dan export QR code-nya secara instan.</p>
      
      <div style="display:flex; gap:12px; justify-content:center; align-items:center; margin-bottom: 16px;">
        <input type="number" id="bulkCount" min="1" max="500" value="50" style="width:100px; text-align:center; padding:10px; border-radius:8px; border:1px solid var(--surface-border); background:rgba(15,23,42,0.8); color:#fff;" placeholder="Jumlah">
        <input type="text" id="bulkLabel" style="width:150px; padding:10px; border-radius:8px; border:1px solid var(--surface-border); background:rgba(15,23,42,0.8); color:#fff;" placeholder="Label (Opsional)">
        <button type="button" class="action-btn" id="bulkZipBtn" style="background:rgba(56,189,248,0.1); border-color:var(--primary); color:var(--primary);">
          ⬇️ Export ZIP
        </button>
        <button type="button" class="action-btn" id="bulkPdfBtn" style="background:rgba(52,211,153,0.1); border-color:var(--success); color:var(--success);">
          🖨️ Cetak PDF
        </button>
      </div>
      <div id="bulkProgress" style="display:none; font-size:0.85rem; color:var(--primary); font-weight:600; margin-top:12px; text-align:center;">
        Memproses: 0%
      </div>
    </div>

    <!-- QR Code Section [v3] -->
    <div class="qr-section" id="qrSection">
      <div class="result-title">📱 QR Code untuk Cetak Akrilik</div>
      <div id="qrCanvas"></div>
      <div class="qr-download-row">
        <button type="button" class="action-btn" id="downloadSvgBtn">⬇️ Download SVG</button>
        <button type="button" class="action-btn" id="downloadPngBtn">⬇️ Download PNG</button>
      </div>
    </div>

    <div class="footer">
      Powered by Cloudflare Workers &bull; KV Edge Caching &bull; Supabase REST &bull; v3
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // State
      var currentMode = 'LIST';
      var allCards = [];
      var currentFilter = 'all'; // all | active | unassigned

      // DOM Elements
      var btnTabList = document.getElementById('btn-tab-list');
      var btnTabCreate = document.getElementById('btn-tab-create');
      var btnTabBatch = document.getElementById('btn-tab-batch');
      var sectionList = document.getElementById('sectionList');
      var sectionForm = document.getElementById('sectionForm');
      var sectionBatch = document.getElementById('sectionBatch');
      var cardListContainer = document.getElementById('cardListContainer');
      var totalCardsSpan = document.getElementById('totalCards');
      var refreshListBtn = document.getElementById('refreshListBtn');
      var filterBtns = document.querySelectorAll('.filter-btn');
      var searchInput = document.getElementById('searchInput');
      var loadMoreBtn = document.getElementById('loadMoreBtn');
      var assignTitle = document.getElementById('assignTitle');
      
      var form = document.getElementById('cardForm');
      var apiKeyInput = document.getElementById('apiKey');
      var shortCodeInput = document.getElementById('shortCode');
      var shortCodeLabel = document.getElementById('shortCodeLabel');
      var fetchCardBtn = document.getElementById('fetchCardBtn');
      var cardLabelInput = document.getElementById('cardLabel');
      var nfcUidInput = document.getElementById('nfcUid');
      var targetUrlInput = document.getElementById('targetUrl');
      var autoReviewParamInput = document.getElementById('autoReviewParam');
      var urlPreviewBox = document.getElementById('urlPreviewBox');
      var formattedUrlPreview = document.getElementById('formattedUrlPreview');
      var isActiveInput = document.getElementById('isActive');
      var submitBtn = document.getElementById('submitBtn');
      var btnText = document.getElementById('btnText');
      var alertBox = document.getElementById('alertBox');
      var resultBox = document.getElementById('resultBox');
      var resultLink = document.getElementById('resultLink');
      var nfcResultRow = document.getElementById('nfcResultRow');
      var nfcResultLink = document.getElementById('nfcResultLink');
      var copyBtn = document.getElementById('copyBtn');
      var testBtn = document.getElementById('testBtn');
      var qrSection = document.getElementById('qrSection');
      var qrCanvas = document.getElementById('qrCanvas');
      var downloadSvgBtn = document.getElementById('downloadSvgBtn');
      var downloadPngBtn = document.getElementById('downloadPngBtn');

      // Load saved API key from localStorage
      try {
        var savedKey = localStorage.getItem('nfc_admin_api_key');
        if (savedKey) {
          apiKeyInput.value = savedKey;
        }
      } catch (e) {}

      // Tab Switch Handler
      function selectTab(mode) {
        currentMode = mode;
        hideAlert();
        resultBox.classList.remove('show');
        qrSection.classList.remove('show');

        // Reset tab active states
        btnTabList.className = 'tab-btn';
        btnTabCreate.className = 'tab-btn';
        btnTabBatch.className = 'tab-btn';

        // Hide all sections
        sectionList.style.display = 'none';
        sectionForm.style.display = 'none';
        sectionBatch.style.display = 'none';

        if (mode === 'LIST') {
          btnTabList.className = 'tab-btn active';
          sectionList.style.display = 'block';
          if (allCards.length === 0) {
            currentPage = 1;
            fetchAllCards(false);
          }
        } else if (mode === 'CREATE') {
          btnTabCreate.className = 'tab-btn active';
          sectionForm.style.display = 'block';
          assignTitle.style.display = 'none';
          btnText.textContent = 'Simpan Kartu Baru';
          shortCodeLabel.textContent = 'Short Code';
          shortCodeInput.readOnly = false;
          fetchCardBtn.style.display = 'none';
          cardLabelInput.value = '';
          form.reset();
          updateUrlPreview();
        } else if (mode === 'UPDATE') {
          // UPDATE is just FORM mode but prefilled
          btnTabList.className = 'tab-btn'; // Not a main tab button, so keep them inactive or keep list active? Keep all inactive is fine, or active list. We'll leave them inactive.
          sectionForm.style.display = 'block';
          btnText.textContent = 'Update Kartu';
          shortCodeLabel.textContent = 'Short Code';
          shortCodeInput.readOnly = true;
          fetchCardBtn.style.display = 'none';
        } else if (mode === 'BATCH') {
          btnTabBatch.className = 'tab-btn active';
          sectionBatch.style.display = 'block';
        }
      }

      // Explicit Click Listeners on Tabs
      btnTabList.onclick = function(e) { e.preventDefault(); selectTab('LIST'); };
      btnTabCreate.onclick = function(e) { e.preventDefault(); selectTab('CREATE'); };
      btnTabBatch.onclick = function(e) { e.preventDefault(); selectTab('BATCH'); };

      refreshListBtn.onclick = function(e) { e.preventDefault(); currentPage = 1; fetchAllCards(false); };

      // Filters
      filterBtns.forEach(function(btn) {
        btn.onclick = function(e) {
          e.preventDefault();
          filterBtns.forEach(function(b) { b.classList.remove('active'); });
          this.classList.add('active');
          currentFilter = this.getAttribute('data-filter');
          currentPage = 1;
          fetchAllCards(false);
        };
      });

      // Search
      var searchTimeout;
      searchInput.oninput = function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() {
          currentPage = 1;
          fetchAllCards(false);
        }, 500);
      };

      // Load More
      var currentPage = 1;
      loadMoreBtn.onclick = function(e) {
        e.preventDefault();
        currentPage++;
        fetchAllCards(true);
      };

      // API: Fetch All Cards
      async function fetchAllCards(isAppend = false) {
        var apiKey = (apiKeyInput.value || '').trim();
        var headers = {};
        if (apiKey) headers['x-api-key'] = apiKey;

        try {
          if (!isAppend) {
            cardListContainer.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted); font-size:0.85rem;">Memuat data...</div>';
            refreshListBtn.textContent = '⏳ ...';
          } else {
            loadMoreBtn.textContent = '⏳ ...';
          }

          var query = new URLSearchParams({
            page: currentPage,
            limit: 20,
            status: currentFilter
          });
          if (searchInput.value.trim()) {
            query.append('search', searchInput.value.trim());
          }

          var response = await fetch('/api/cards?' + query.toString(), { headers: headers });
          var data = await response.json().catch(function(){});
          
          if (!response.ok || !data.success) {
            throw new Error(data?.error || 'Gagal memuat data');
          }
          
          if (!isAppend) {
            allCards = data.data || [];
          } else {
            allCards = allCards.concat(data.data || []);
          }
          
          totalCardsSpan.textContent = data.pagination.total;
          
          if (data.pagination.has_more) {
            loadMoreBtn.style.display = 'inline-block';
          } else {
            loadMoreBtn.style.display = 'none';
          }

          renderCardList(isAppend, data.data || []);
        } catch(e) {
          showAlert('error', e.message);
          if (!isAppend) {
            cardListContainer.innerHTML = '<div style="color:var(--danger);text-align:center;padding:20px;">' + e.message + '</div>';
          }
        } finally {
          refreshListBtn.innerHTML = '🔄 Refresh';
          loadMoreBtn.textContent = 'Load More';
        }
      }

      function renderCardList(isAppend, newCards) {
        if (!isAppend) {
          cardListContainer.innerHTML = '';
        }
        
        var cardsToRender = isAppend ? newCards : allCards;

        if (allCards.length === 0) {
          cardListContainer.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">Tidak ada kartu.</div>';
          return;
        }

        cardsToRender.forEach(function(card) {
          var el = document.createElement('div');
          el.className = 'card-item';
          
          var isAssigned = !!card.target_url;
          var statusClass = isAssigned ? (card.is_active ? 'status-active' : 'status-inactive') : 'status-unassigned';
          var statusText = isAssigned ? (card.is_active ? 'Aktif' : 'Inaktif') : 'Unassigned';
          var nfcText = card.nfc_uid ? 'NFC: ' + card.nfc_uid : 'NFC: -';
          var labelText = card.label ? '<div class="card-nfc" style="color:var(--text-bright);font-weight:bold;">🏷️ ' + card.label + '</div>' : '';

          el.innerHTML = 
            '<div class="card-item-left">' +
              '<div class="card-code">/r/' + card.short_code + '</div>' +
              labelText +
              '<div class="card-nfc">' + nfcText + '</div>' +
            '</div>' +
            '<div class="status-badge ' + statusClass + '">' + statusText + '</div>';
          
          el.onclick = function() {
            openCardEditor(card);
          };
          
          cardListContainer.appendChild(el);
        });
      }

      function openCardEditor(card) {
        selectTab('UPDATE');
        
        shortCodeInput.value = card.short_code;
        cardLabelInput.value = card.label || '';
        nfcUidInput.value = card.nfc_uid || '';
        targetUrlInput.value = card.target_url || '';
        isActiveInput.checked = (card.is_active === true);
        
        if (!card.target_url) {
          assignTitle.style.display = 'block';
          assignTitle.textContent = '✨ Assign URL: /r/' + card.short_code;
        } else {
          assignTitle.style.display = 'block';
          assignTitle.textContent = '✏️ Edit: /r/' + card.short_code;
          assignTitle.style.color = 'var(--text-main)';
        }

        updateUrlPreview();
      }

      // Initial tab load
      selectTab('LIST');

      // We can remove the old "Fetch Card" handler since we now fetch all cards and click to edit.
      // But we will keep it hidden/functional just in case (the HTML element is still there for now).
      if (fetchCardBtn) {
        fetchCardBtn.style.display = 'none';
      }

      // Google Review URL formatter (uses string methods, no regex escaping issues)
      function processReviewUrl(rawUrl, autoEnabled) {
        if (!rawUrl) return '';
        var trimmed = rawUrl.trim();
        if (!autoEnabled) return trimmed;

        try {
          var validUrl = trimmed;
          if (validUrl.indexOf('http://') !== 0 && validUrl.indexOf('https://') !== 0) {
            validUrl = 'https://' + validUrl;
          }

          var urlObj = new URL(validUrl);

          // Case 1: g.page shortlink
          if (urlObj.hostname.indexOf('g.page') !== -1) {
            if (!urlObj.pathname.endsWith('/review') && !urlObj.pathname.endsWith('/review/')) {
              while (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
                urlObj.pathname = urlObj.pathname.slice(0, -1);
              }
              urlObj.pathname = urlObj.pathname + '/review';
            }
            return urlObj.toString();
          }

          // Case 2: Google Maps / general URL
          if (!urlObj.searchParams.has('action') && !urlObj.searchParams.has('review')) {
            urlObj.searchParams.set('action', 'system_redirect');
          }

          return urlObj.toString();
        } catch (err) {
          if (trimmed.indexOf('?') !== -1) {
            return (trimmed.indexOf('action=') !== -1) ? trimmed : (trimmed + '&action=system_redirect');
          }
          return trimmed + '?action=system_redirect';
        }
      }

      // Real-time URL preview updater
      function updateUrlPreview() {
        var rawUrl = (targetUrlInput.value || '').trim();
        var autoEnabled = autoReviewParamInput.checked;

        if (!rawUrl) {
          urlPreviewBox.style.display = 'none';
          return;
        }

        var finalUrl = processReviewUrl(rawUrl, autoEnabled);
        if (finalUrl !== rawUrl && autoEnabled) {
          formattedUrlPreview.textContent = finalUrl;
          urlPreviewBox.style.display = 'block';
        } else {
          urlPreviewBox.style.display = 'none';
        }
      }

      targetUrlInput.oninput = updateUrlPreview;
      autoReviewParamInput.onchange = updateUrlPreview;

      function showAlert(type, message) {
        alertBox.className = 'alert ' + type;
        alertBox.textContent = message;
        alertBox.style.display = 'block';
      }

      function hideAlert() {
        alertBox.style.display = 'none';
      }

      // ── QR Code Generator (using qrcode-generator CDN) ──
      function generateQRCodeSVG(text, size) {
        if (typeof qrcode === 'undefined') {
          console.error("QR Code library not loaded");
          return '';
        }
        
        var qr = qrcode(0, 'M'); // 0 = auto size, M = medium error correction (15%)
        qr.addData(text);
        qr.make();
        
        var moduleCount = qr.getModuleCount();
        var cellSize = Math.max(1, Math.floor(size / (moduleCount + 8))); // +8 for quiet zone
        var margin = 4;
        var offset = margin * cellSize;
        var svgSize = (moduleCount * cellSize) + (offset * 2);
        
        var rects = '';
        for (var row = 0; row < moduleCount; row++) {
          for (var col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
              rects += '<rect x="' + (col * cellSize + offset) + '" y="' + (row * cellSize + offset) + '" width="' + cellSize + '" height="' + cellSize + '" fill="#000000"/>';
            }
          }
        }

        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + svgSize + ' ' + svgSize + '" width="' + size + '" height="' + size + '">' +
          '<rect width="100%" height="100%" fill="#ffffff"/>' +
          rects +
          '</svg>';
      }

      // Store last generated SVG for downloads
      var lastQrSvg = '';
      var lastShortCode = '';

      function showQRCode(shortCode) {
        lastShortCode = shortCode;
        var fullUrl = window.location.origin + '/r/' + shortCode;
        var svgString = generateQRCodeSVG(fullUrl, 200);
        lastQrSvg = svgString;
        qrCanvas.innerHTML = svgString;
        qrSection.classList.add('show');
      }

      // Download SVG
      downloadSvgBtn.onclick = function() {
        if (!lastQrSvg) return;
        var blob = new Blob([lastQrSvg], { type: 'image/svg+xml' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'qr-' + lastShortCode + '.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      // Download PNG
      downloadPngBtn.onclick = function() {
        if (!lastQrSvg) return;
        var svgBlob = new Blob([lastQrSvg], { type: 'image/svg+xml' });
        var url = URL.createObjectURL(svgBlob);
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 800;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 800, 800);
          ctx.drawImage(img, 0, 0, 800, 800);
          canvas.toBlob(function(blob) {
            var pngUrl = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'qr-' + lastShortCode + '.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
          }, 'image/png');
          URL.revokeObjectURL(url);
        };
        img.src = url;
      };

      // Form Submit (POST vs PATCH)
      form.onsubmit = async function(e) {
        e.preventDefault();
        hideAlert();

        var apiKey = (apiKeyInput.value || '').trim();
        var shortCode = (shortCodeInput.value || '').trim().toLowerCase();
        var label = (cardLabelInput.value || '').trim();
        var nfcUid = (nfcUidInput.value || '').trim().toUpperCase();
        var rawTargetUrl = (targetUrlInput.value || '').trim();
        var autoReviewParam = autoReviewParamInput.checked;
        var isActive = isActiveInput.checked;

        var finalTargetUrl = processReviewUrl(rawTargetUrl, autoReviewParam);

        if (apiKey) {
          try {
            localStorage.setItem('nfc_admin_api_key', apiKey);
          } catch (err) {}
        }

        submitBtn.disabled = true;
        btnText.textContent = 'Memproses...';

        var headers = {
          'Content-Type': 'application/json'
        };
        if (apiKey) {
          headers['x-api-key'] = apiKey;
        }

        try {
          var response;
          var bodyData;

          if (currentMode === 'CREATE') {
            bodyData = {
              short_code: shortCode,
              target_url: finalTargetUrl,
              is_active: isActive
            };
            if (nfcUid) bodyData.nfc_uid = nfcUid;
            if (label) bodyData.label = label;

            response = await fetch('/api/cards', {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(bodyData)
            });
          } else {
            bodyData = {
              target_url: finalTargetUrl,
              is_active: isActive
            };
            // Send nfc_uid even if empty (to allow unlinking)
            bodyData.nfc_uid = nfcUid || null;
            bodyData.label = label || null;

            response = await fetch('/api/cards/' + encodeURIComponent(shortCode), {
              method: 'PATCH',
              headers: headers,
              body: JSON.stringify(bodyData)
            });
          }

          var data = await response.json().catch(function() { return {}; });

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Gagal memproses kartu (Status: ' + response.status + ')');
          }

          var redirectFullUrl = window.location.origin + '/r/' + shortCode;
          showAlert(
            'success',
            currentMode === 'CREATE'
              ? '🎉 Kartu "' + shortCode + '" berhasil dibuat!'
              : '✅ Kartu "' + shortCode + '" dan KV Cache berhasil diperbarui!'
          );

          resultLink.textContent = redirectFullUrl;
          resultLink.href = redirectFullUrl;
          testBtn.href = redirectFullUrl;
          resultBox.classList.add('show');

          // Show NFC URL if nfc_uid exists
          if (nfcUid) {
            var nfcFullUrl = window.location.origin + '/nfc/' + encodeURIComponent(nfcUid);
            nfcResultLink.textContent = nfcFullUrl;
            nfcResultLink.href = nfcFullUrl;
            nfcResultRow.style.display = 'block';
          } else {
            nfcResultRow.style.display = 'none';
          }

          // Generate and show QR Code
          showQRCode(shortCode);

          // Update the list if successful so it reflects new state without reload
          if (currentMode === 'UPDATE') {
             var idx = allCards.findIndex(function(c) { return c.short_code === shortCode; });
             if (idx > -1) {
                allCards[idx].target_url = finalTargetUrl;
                allCards[idx].nfc_uid = nfcUid || null;
                allCards[idx].is_active = isActive;
                allCards[idx].label = label || null;
             }
          }

        } catch (err) {
          showAlert('error', err.message || 'Terjadi kesalahan saat menghubungi server.');
          resultBox.classList.remove('show');
          qrSection.classList.remove('show');
        } finally {
          submitBtn.disabled = false;
          btnText.textContent = currentMode === 'CREATE' ? 'Simpan Kartu Baru' : 'Update Kartu';
        }
      };

      // Copy Link
      copyBtn.onclick = function() {
        var text = resultLink.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function() {
            var original = copyBtn.textContent;
            copyBtn.textContent = '✅ Disalin!';
            setTimeout(function() { copyBtn.textContent = original; }, 2000);
          });
        }
      };

      // Bulk Generate Batch (ZIP & PDF)
      var bulkZipBtn = document.getElementById('bulkZipBtn');
      var bulkPdfBtn = document.getElementById('bulkPdfBtn');
      var bulkCountInput = document.getElementById('bulkCount');
      var bulkLabelInput = document.getElementById('bulkLabel');
      var bulkProgress = document.getElementById('bulkProgress');

      async function doBulkGenerate(exportType) {
        hideAlert();
        var count = parseInt(bulkCountInput.value, 10) || 50;
        var label = (bulkLabelInput.value || '').trim();
        if (count < 1 || count > 500) {
          showAlert('error', 'Jumlah kartu harus antara 1 dan 500');
          return;
        }

        var apiKey = (apiKeyInput.value || '').trim();
        var headers = { 'Content-Type': 'application/json' };
        if (apiKey) headers['x-api-key'] = apiKey;

        try {
          bulkZipBtn.disabled = true;
          bulkPdfBtn.disabled = true;
          bulkProgress.style.display = 'block';
          bulkProgress.textContent = 'Menghubungi server (Membuat ' + count + ' kartu)...';

          var res = await fetch('/api/cards/generate-batch', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ count: count, label: label || null })
          });
          var data = await res.json().catch(function(){});
          if (!res.ok || !data.success) throw new Error(data?.error || 'Gagal generate kartu');

          var codes = data.data.map(function(c) { return c.short_code; });
          
          if (exportType === 'ZIP') {
            await exportZip(codes);
            showAlert('success', '🎉 Berhasil men-generate dan mengunduh ZIP untuk ' + codes.length + ' kartu.');
          } else {
            bulkProgress.textContent = 'Menyiapkan Print Preview...';
            await createPrintWindow(codes);
            showAlert('success', '🎉 Print Preview PDF untuk ' + codes.length + ' kartu telah dibuka.');
          }
        } catch(e) {
          showAlert('error', e.message);
        } finally {
          bulkZipBtn.disabled = false;
          bulkPdfBtn.disabled = false;
          bulkProgress.style.display = 'none';
        }
      }

      async function exportZip(codes) {
        if (typeof JSZip === 'undefined') {
          throw new Error('JSZip library failed to load.');
        }
        var zip = new JSZip();
        var imgFolder = zip.folder("qr_codes");
        
        for (var i = 0; i < codes.length; i++) {
          var code = codes[i];
          var fullUrl = window.location.origin + '/r/' + code;
          var svg = generateQRCodeSVG(fullUrl, 400);
          imgFolder.file(code + ".svg", svg);
          
          if (i % 20 === 0) {
             bulkProgress.textContent = 'Membuat ZIP: ' + Math.round((i/codes.length)*100) + '%';
             await new Promise(function(resolve) { setTimeout(resolve, 0); });
          }
        }
        
        bulkProgress.textContent = 'Menyimpan file ZIP...';
        var content = await zip.generateAsync({type:"blob"});
        var a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = "qr_cards_batch_" + Date.now() + ".zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      async function createPrintWindow(codes) {
        var printHtml = '<!DOCTYPE html><html><head><title>Print QR Codes</title><style>' +
          'body { font-family: sans-serif; margin: 0; padding: 20px; background: #f8fafc; }' +
          '.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }' +
          '.card { text-align: center; page-break-inside: avoid; background: #fff; border: 1px dashed #ccc; padding: 16px; border-radius: 12px; }' +
          '.card svg { width: 100%; height: auto; max-width: 150px; }' +
          '.code { margin-top: 12px; font-size: 15px; font-weight: bold; font-family: monospace; letter-spacing: 1.5px; color: #0f172a; }' +
          '.hint { text-align: center; margin-bottom: 20px; color: #64748b; }' +
          '@media print { @page { margin: 1cm; } body { padding: 0; background: #fff; } .hint { display: none; } .card { border: 1px solid #eee; } }' +
          '</style></head><body><div class="hint">Tekan <strong>Ctrl + P</strong> (atau Cmd + P) untuk menyimpan sebagai PDF atau mencetak.</div><div class="grid">';

        for (var i = 0; i < codes.length; i++) {
          var code = codes[i];
          var fullUrl = window.location.origin + '/r/' + code;
          var svg = generateQRCodeSVG(fullUrl, 150);
          printHtml += '<div class="card">' + svg + '<div class="code">' + code + '</div></div>';
        }

        printHtml += '</div><script>window.onload = function() { setTimeout(function(){ window.print(); }, 500); }</sc' + 'ript></body></html>';
        
        var win = window.open('', '_blank');
        if (win) {
          win.document.write(printHtml);
          win.document.close();
        } else {
          throw new Error('Popup diblokir oleh browser. Izinkan popup untuk mencetak PDF.');
        }
      }

      if (bulkZipBtn) {
        bulkZipBtn.onclick = function() { doBulkGenerate('ZIP'); };
      }
      if (bulkPdfBtn) {
        bulkPdfBtn.onclick = function() { doBulkGenerate('PDF'); };
      }
    });
  </script>
</body>
</html>`;
}
