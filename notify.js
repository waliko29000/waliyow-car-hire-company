/* notify.js — adds a 🔔 bell with the unread-message count to the user header.
   Add this line just before </body> on every USER page:
       <script src="notify.js"></script>
*/
(function () {
  function getUser() {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch (e) { return {}; }
  }
  function myEmail() {
    return String(getUser().email || '').toLowerCase();
  }
  function allMessages() {
    try { return JSON.parse(localStorage.getItem('adminMessages') || '[]'); } catch (e) { return []; }
  }
  function readIds(email) {
    try { return JSON.parse(localStorage.getItem('msgRead_' + email) || '[]'); } catch (e) { return []; }
  }
  function unreadCount() {
    var email = myEmail();
    if (!email) return 0;
    var read = readIds(email);
    return allMessages().filter(function (m) {
      return String(m.to).toLowerCase() === email && read.indexOf(m.id) === -1;
    }).length;
  }

  function injectStyle() {
    if (document.getElementById('notifyStyle')) return;
    var s = document.createElement('style');
    s.id = 'notifyStyle';
    s.textContent =
      '.notif-bell{position:relative;display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:#fff;padding:7px 13px;border-radius:25px;font-size:0.78em;font-weight:500;text-decoration:none;}' +
      '.notif-bell:hover{background:rgba(255,255,255,0.3);}' +
      '.notif-badge{background:#e74c3c;color:#fff;border-radius:10px;font-size:0.85em;font-weight:700;padding:1px 7px;min-width:18px;text-align:center;}';
    document.head.appendChild(s);
  }

  function render() {
    if (localStorage.getItem('isLoggedIn') !== 'true' && !localStorage.getItem('isLoggedIn')) return;
    var nav = document.querySelector('header nav');
    if (!nav) return;
    injectStyle();
    var bell = document.getElementById('notifBell');
    if (!bell) {
      bell = document.createElement('a');
      bell.id = 'notifBell';
      bell.className = 'notif-bell';
      bell.href = 'messages.html';
      var logout = document.getElementById('logoutBtn');
      if (logout && logout.parentNode === nav) nav.insertBefore(bell, logout);
      else nav.appendChild(bell);
    }
    var n = unreadCount();
    bell.innerHTML = '\uD83D\uDD14 Messages' + (n > 0 ? ' <span class="notif-badge">' + n + '</span>' : '');
  }

  render();
  window.addEventListener('storage', render);
  setInterval(render, 15000);
})();
