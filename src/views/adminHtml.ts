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
      max-width: 600px;
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

    <!-- Mode Selector: Create or Update Tabs -->
    <div class="tab-navigation">
      <button class="tab-btn active" id="btn-tab-create" type="button">
        ✨ Buat Kartu Baru
      </button>
      <button class="tab-btn" id="btn-tab-update" type="button">
        🔄 Update Kartu
      </button>
    </div>

    <form id="cardForm">
      <!-- Admin API Key -->
      <div class="form-group">
        <label for="apiKey">Admin API Key <span style="color:var(--text-muted); font-weight:400;">(x-api-key)</span></label>
        <input type="password" id="apiKey" placeholder="Masukkan ADMIN_API_KEY jika diaktifkan..." autocomplete="off">
      </div>

      <!-- Short Code -->
      <div class="form-group">
        <label for="shortCode">
          <span id="shortCodeLabel">Short Code</span> <span style="color:var(--danger)">*</span>
        </label>
        <div class="input-wrapper">
          <span class="input-prefix">/r/</span>
          <input type="text" id="shortCode" class="has-prefix" placeholder="contoh: k-001, kopi-senja" required pattern="[a-zA-Z0-9-_]+" title="Hanya huruf, angka, tanda strip (-) dan garis bawah (_)">
          <button type="button" class="fetch-btn" id="fetchCardBtn">🔍 Muat Data</button>
        </div>
      </div>

      <!-- Target URL -->
      <div class="form-group">
        <label for="targetUrl">Target Google Review URL <span style="color:var(--danger)">*</span></label>
        <input type="url" id="targetUrl" placeholder="https://maps.app.goo.gl/..." required>
      </div>

      <!-- Auto Google Review Parameter Checkbox -->
      <div class="option-card">
        <label class="checkbox-group" for="autoReviewParam">
          <input type="checkbox" id="autoReviewParam" checked>
          <span>Tambahkan parameter Google Review otomatis (?action=system_redirect atau parameter review Google Maps)</span>
        </label>
        <p class="checkbox-hint">
          💡 Otomatis memformat URL agar langsung membuka dialog ulasan saat di-tap pengguna (misal menambahkan <code>?action=system_redirect</code> atau <code>/review</code>). Jika tidak dicentang, URL akan disimpan apa adanya (as-is).
        </p>
        <div id="urlPreviewBox" class="url-preview-tag" style="display: none;">
          <span class="url-preview-label">URL Tersimpan:</span>
          <span id="formattedUrlPreview"></span>
        </div>
      </div>

      <!-- Active Status Checkbox -->
      <div class="form-group">
        <label class="checkbox-group" for="isActive">
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
    document.addEventListener('DOMContentLoaded', function() {
      // State
      var currentMode = 'CREATE';

      // DOM Elements
      var btnTabCreate = document.getElementById('btn-tab-create');
      var btnTabUpdate = document.getElementById('btn-tab-update');
      var form = document.getElementById('cardForm');
      var apiKeyInput = document.getElementById('apiKey');
      var shortCodeInput = document.getElementById('shortCode');
      var shortCodeLabel = document.getElementById('shortCodeLabel');
      var fetchCardBtn = document.getElementById('fetchCardBtn');
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
      var copyBtn = document.getElementById('copyBtn');
      var testBtn = document.getElementById('testBtn');

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

        if (mode === 'CREATE') {
          btnTabCreate.className = 'tab-btn active';
          btnTabUpdate.className = 'tab-btn';
          btnText.textContent = 'Simpan Kartu Baru';
          shortCodeLabel.textContent = 'Short Code';
          fetchCardBtn.style.display = 'none';
        } else {
          btnTabUpdate.className = 'tab-btn active';
          btnTabCreate.className = 'tab-btn';
          btnText.textContent = 'Update Kartu';
          shortCodeLabel.textContent = 'Short Code yang Diupdate';
          fetchCardBtn.style.display = 'block';
        }
      }

      // Explicit Click Listeners on Tabs
      btnTabCreate.onclick = function(e) {
        if (e && e.preventDefault) e.preventDefault();
        selectTab('CREATE');
      };

      btnTabUpdate.onclick = function(e) {
        if (e && e.preventDefault) e.preventDefault();
        selectTab('UPDATE');
      };

      // Fetch Card Data Handler for Update Mode
      fetchCardBtn.onclick = async function(e) {
        if (e && e.preventDefault) e.preventDefault();
        var shortCode = (shortCodeInput.value || '').trim().toLowerCase();
        var apiKey = (apiKeyInput.value || '').trim();

        if (!shortCode) {
          showAlert('error', 'Silakan masukkan Short Code terlebih dahulu.');
          shortCodeInput.focus();
          return;
        }

        fetchCardBtn.textContent = 'Memuat...';
        hideAlert();

        var headers = {};
        if (apiKey) {
          headers['x-api-key'] = apiKey;
        }

        try {
          var response = await fetch('/api/cards/' + encodeURIComponent(shortCode), {
            method: 'GET',
            headers: headers
          });

          var data = await response.json().catch(function() { return {}; });

          if (!response.ok || !data.success || !data.data) {
            throw new Error(data.error || 'Kartu "' + shortCode + '" tidak ditemukan.');
          }

          var card = data.data;
          targetUrlInput.value = card.target_url || '';
          isActiveInput.checked = (card.is_active !== false);

          updateUrlPreview();
          showAlert('success', '✅ Data kartu "' + shortCode + '" berhasil dimuat. Ubah URL lalu klik tombol "Update Kartu".');
        } catch (err) {
          showAlert('error', err.message || 'Gagal memuat data kartu.');
        } finally {
          fetchCardBtn.textContent = '🔍 Muat Data';
        }
      };

      // Google Review URL formatter without fragile regex escaping
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

      // Form Submit (POST vs PATCH)
      form.onsubmit = async function(e) {
        e.preventDefault();
        hideAlert();

        var apiKey = (apiKeyInput.value || '').trim();
        var shortCode = (shortCodeInput.value || '').trim().toLowerCase();
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
          if (currentMode === 'CREATE') {
            // Method: POST /api/cards
            response = await fetch('/api/cards', {
              method: 'POST',
              headers: headers,
              body: JSON.stringify({
                short_code: shortCode,
                target_url: finalTargetUrl,
                is_active: isActive
              })
            });
          } else {
            // Method: PATCH /api/cards/:short_code
            response = await fetch('/api/cards/' + encodeURIComponent(shortCode), {
              method: 'PATCH',
              headers: headers,
              body: JSON.stringify({
                target_url: finalTargetUrl,
                is_active: isActive
              })
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

        } catch (err) {
          showAlert('error', err.message || 'Terjadi kesalahan saat menghubungi server.');
          resultBox.classList.remove('show');
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
    });
  </script>
</body>
</html>`;
}
