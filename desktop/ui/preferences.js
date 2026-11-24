const $ = (id) => document.getElementById(id);
let saving = false;
const showError = (message) => { $('error').textContent = message; $('error').hidden = !message; };
window.desktopSettings.load().then((settings) => {
  $('gemini-model').value = settings.model;
  for (const [prefix, configured] of [['gemini', settings.geminiConfigured], ['rapid', settings.rapidApiConfigured]]) {
    $(`${prefix}-status`).textContent = configured ? '· Đã lưu' : '';
    $(`${prefix}-key`).placeholder = configured ? 'Để trống để giữ khóa đã lưu' : `Nhập khóa API ${prefix === 'gemini' ? 'Gemini' : 'RapidAPI'}`;
    $(`clear-${prefix}-label`).hidden = !configured;
  }
  $('cancel').textContent = settings.firstRun ? 'Để sau' : 'Đóng';
}).catch(() => showError('Không tải được cài đặt. Hãy đóng và mở lại cửa sổ này.'));
$('cancel').addEventListener('click', () => { if (!saving) void window.desktopSettings.close(); });
$('data-folder').addEventListener('click', () => void window.desktopSettings.openFolder());
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !saving) void window.desktopSettings.close(); });
$('settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (saving) return;
  saving = true; showError('');
  const controls = [...document.querySelectorAll('input, button, summary')];
  controls.forEach((control) => { control.disabled = true; });
  $('save').textContent = 'Đang lưu và kết nối lại…';
  try {
    const result = await window.desktopSettings.save({
      model: $('gemini-model').value, geminiKey: $('gemini-key').value, rapidApiKey: $('rapid-key').value,
      clearGemini: $('clear-gemini').checked, clearRapidApi: $('clear-rapid').checked,
    });
    if (result.error) { showError(result.error); return; }
    await window.desktopSettings.close();
  } catch { showError('Không lưu được cài đặt. Hãy kiểm tra quyền ghi dữ liệu và thử lại.'); }
  finally { saving = false; controls.forEach((control) => { control.disabled = false; }); $('save').textContent = 'Lưu cài đặt'; }
});
