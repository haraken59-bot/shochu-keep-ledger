// Display-only release: deliberately does not load app.js, Auth, or any data client.
// Never reads/writes localStorage, starts synchronization, or migrates a baseline.
const panel = document.createElement('main');
panel.style.cssText = 'max-width:640px;margin:40px auto;padding:24px;line-height:1.8';
const title = document.createElement('h1');
title.textContent = 'Ver.35 baseline 1（基準更新専用）';
const message = document.createElement('p');
message.textContent = '表示確認専用・同期停止中。通常同期・ログイン・復元・基準更新は実行していません。';
const detail = document.createElement('p');
detail.textContent = '識別子：35.0-baseline-1-display2。実機表示の確認後、別途承認を受けて基準更新へ進みます。';
const button = document.createElement('button');
button.disabled = true;
button.textContent = '基準更新は未許可（実行できません）';
const swStatus = document.createElement('p');
swStatus.textContent = 'Service Worker更新を確認中…';
panel.append(title, message, detail, button, swStatus);
document.body.replaceChildren(panel);
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js', {updateViaCache:'none'})
    .then(async registration => {
      await registration.update();
      await navigator.serviceWorker.ready;
      const names = await caches.keys();
      swStatus.textContent = names.includes('shochu-keep-ledger-v35-baseline-1-display2')
        ? 'SWキャッシュ：shochu-keep-ledger-v35-baseline-1-display2'
        : 'SW更新中です。この画面を閉じてオンラインで開き直してください。';
    }).catch(() => { swStatus.textContent = 'SW更新は未確認です。オンラインで開き直してください。'; });
} else {
  swStatus.textContent = 'このブラウザではService Workerを確認できません。';
}
