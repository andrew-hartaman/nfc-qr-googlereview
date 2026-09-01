export function renderAdminHtml(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - Dynamic Review Card Engine</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-gradient: radial-gradient(circle at 10% 20%, #0f172a 0%, #020617 90%);
      --surface: rgba(30, 41, 59, 0.7);
      --surface-border: rgba(255, 255, 255, 0.1);
      --surface-hover: rgba(51, 65, 85, 0.8);
      --primary: #38bdf8;
      --primary-hover: #0ea5e9;
      --primary-glow: rgba(56, 189, 248, 0.25);
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
      max-width: 580px;
      background: var(--surface);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius);
      padding: 36px 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px var(--primary-glow);
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header {
      text-align: center;
      margin-bottom: 28px;
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

    .mode-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      background: rgba(15, 23, 42, 0.6);
      padding: 4px;
      border-radius: 12px;
      margin-bottom: 24px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .mode-btn {
      padding: 9px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mode-btn.active {
      background: var(--surface-hover);
      color: var(--text-main);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .form-group {
      margin-bottom: 18px;
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
    }

    .input-prefix {
      position: absolute;
      left: 14px;
      color: var(--text-muted);
      font-size: 0.88rem;
      font-family: 'JetBrains Mono', monospace;
      pointer-events: none;
      user-select: none;
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

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 6px;
      user-select: none;
      cursor: pointer;
    }

    .checkbox-group input {
      width: 18px;
      height: 18px;
      accent-color: var(--primary);
      cursor: pointer;
    }

    .checkbox-group span {
      font-size: 0.85rem;
      color: #cbd5e1;
    }

    button.submit-btn {
      width: 100%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: #0f172a;
      border: none;
      padding: 13px 20px;
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
      box-shadow: 0 10px 25px rgba(56, 189, 248, 0.4);
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
    }

    .action-btn {
      flex: 1;
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
      <h1>Review Card Engine</h1>
      <p class="subtitle">Buat atau perbarui pemetaan kartu ulasan Google ke URL target</p>
    </div>

    <!-- Mode Selector: Create or Update -->
    <div class="mode-toggle">
      <button class="mode-btn active" id="modeCreateBtn" type="button">✨ Buat Kartu Baru</button>
      <button class="mode-btn" id="modeUpdateBtn" type="button">🔄 Update Kartu</button>
    </div>

    <form id="cardForm">
      <!-- Admin API Key -->
      <div class="form-group">
        <label for="apiKey">Admin API Key <span style="color:var(--text-muted); font-weight:400;">(x-api-key)</span></label>
        <input type="password" id="apiKey" placeholder="Masukkan ADMIN_API_KEY jika diaktifkan..." autocomplete="off">
      </div>

      <!-- Short Code -->
      <div class="form-group">
        <label for="shortCode">Short Code <span style="color:var(--danger)">*</span></label>
        <div class="input-wrapper">
          <span class="input-prefix">/r/</span>
          <input type="text" id="shortCode" class="has-prefix" placeholder="contoh: k-001, kopi-senja" required pattern="[a-zA-Z0-9-_]+" title="Hanya huruf, angka, tanda strip (-) dan garis bawah (_)">
        </div>
      </div>

      <!-- Target URL -->
      <div class="form-group">
        <label for="targetUrl">Target Google Review URL <span style="color:var(--danger)">*</span></label>
        <input type="url" id="targetUrl" placeholder="https://maps.app.goo.gl/..." required>
      </div>

      <!-- Active Status Checkbox -->
      <div class="form-group">
        <label class="checkbox-group">
          <input type="checkbox" id="isActive" checked>
          <span>Aktifkan kartu fisik ini (Redirect Aktif)</span>
        </label>
      </div>

      <button type="submit" class="submit-btn" id="submitBtn">
        <span id="btnText">Simpan Kartu Baru</span>
      </button>
    </form>

    <!-- Alert / Toast -->
    <div class="alert" id="alertBox"></div>

    <!-- Result / Preview Box -->
    <div class="result-box" id="resultBox">
      <div class="result-title">🔗 URL Kartu Siap Digunakan:</div>
      <a href="#" target="_blank" class="result-url" id="resultLink"></a>
      <div class="result-actions">
        <button type="button" class="action-btn" id="copyBtn">📋 Salin Link</button>
        <a href="#" target="_blank" class="action-btn" id="testBtn">🚀 Buka Link</a>
      </div>
    </div>

    <div class="footer">
      Powered by Cloudflare Workers &bull; KV Edge Caching &bull; Supabase REST
    </div>
  </div>

  <script>
    const form = document.getElementById('cardForm');
    const modeCreateBtn = document.getElementById('modeCreateBtn');
    const modeUpdateBtn = document.getElementById('modeUpdateBtn');
    const apiKeyInput = document.getElementById('apiKey');
    const shortCodeInput = document.getElementById('shortCode');
    const targetUrlInput = document.getElementById('targetUrl');
    const isActiveInput = document.getElementById('isActive');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const alertBox = document.getElementById('alertBox');
    const resultBox = document.getElementById('resultBox');
    const resultLink = document.getElementById('resultLink');
    const copyBtn = document.getElementById('copyBtn');
    const testBtn = document.getElementById('testBtn');

    let currentMode = 'CREATE'; // 'CREATE' | 'UPDATE'

    // Load saved API key from localStorage
    const savedKey = localStorage.getItem('nfc_admin_api_key');
    if (savedKey) {
      apiKeyInput.value = savedKey;
    }

    // Switch to Create Mode
    modeCreateBtn.addEventListener('click', () => {
      currentMode = 'CREATE';
      modeCreateBtn.classList.add('active');
      modeUpdateBtn.classList.remove('active');
      btnText.textContent = 'Simpan Kartu Baru';
      hideAlert();
    });

    // Switch to Update Mode
    modeUpdateBtn.addEventListener('click', () => {
      currentMode = 'UPDATE';
      modeUpdateBtn.classList.add('active');
      modeCreateBtn.classList.remove('active');
      btnText.textContent = 'Update Kartu & Sync Cache';
      hideAlert();
    });

    function showAlert(type, message) {
      alertBox.className = 'alert ' + type;
      alertBox.textContent = message;
      alertBox.style.display = 'block';
    }

    function hideAlert() {
      alertBox.style.display = 'none';
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const apiKey = apiKeyInput.value.trim();
      const shortCode = shortCodeInput.value.trim().toLowerCase();
      const targetUrl = targetUrlInput.value.trim();
      const isActive = isActiveInput.checked;

      if (apiKey) {
        localStorage.setItem('nfc_admin_api_key', apiKey);
      }

      submitBtn.disabled = true;
      btnText.textContent = 'Memproses...';

      const headers = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      try {
        let response;
        if (currentMode === 'CREATE') {
          // POST /api/cards
          response = await fetch('/api/cards', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              short_code: shortCode,
              target_url: targetUrl,
              is_active: isActive,
            }),
          });
        } else {
          // PATCH /api/cards/:short_code
          response = await fetch('/api/cards/' + encodeURIComponent(shortCode), {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              target_url: targetUrl,
              is_active: isActive,
            }),
          });
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Terjadi kesalahan saat memproses data (' + response.status + ')');
        }

        const redirectFullUrl = window.location.origin + '/r/' + shortCode;
        showAlert('success', (currentMode === 'CREATE' ? '🎉 Kartu berhasil dibuat!' : '✅ Kartu & KV Cache berhasil diperbarui!'));

        // Show preview card
        resultLink.textContent = redirectFullUrl;
        resultLink.href = redirectFullUrl;
        testBtn.href = redirectFullUrl;
        resultBox.classList.add('show');

      } catch (err) {
        showAlert('error', err.message || 'Gagal terhubung ke server.');
        resultBox.classList.remove('show');
      } finally {
        submitBtn.disabled = false;
        btnText.textContent = currentMode === 'CREATE' ? 'Simpan Kartu Baru' : 'Update Kartu & Sync Cache';
      }
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', () => {
      const text = resultLink.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const original = copyBtn.textContent;
        copyBtn.textContent = '✅ Disalin!';
        setTimeout(() => { copyBtn.textContent = original; }, 2000);
      });
    });
  </script>
</body>
</html>`;
}
