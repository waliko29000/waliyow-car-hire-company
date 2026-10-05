/* ============================================
   WALIKO - SHARED USER HEADER
   Style copied exactly from account.html.
   Put this line right after <body> on every
   logged-in user page (replaces each page's own
   <header> automatically):

   <script src="user-header.js"></script>
   ============================================ */
(function(){
  var path = (window.location.pathname.split('/').pop() || '').toLowerCase();

  /* pages that belong under a nav item */
  var activeMap = {
    'user.html':'account.html', 'credit.html':'account.html', 'change-pass.html':'account.html'
  };
  var current = activeMap[path] || path;

  var links = [
    ['dashboard.html',    'How to use'],
    ['car-available.html','Cars'],
    ['bookings.html',     'My Bookings'],
    ['payments.html',     'Payments'],
    ['help.html',         'Help'],
    ['account.html',      'Settings'],
    ['feedback.html',     'Feedback']
  ];

  /* Poppins, only if the page didn't already load it */
  if(!document.querySelector('link[href*="family=Poppins"]')){
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(f);
  }

  /* ID-scoped styles so every page's own CSS is overridden */
  var st = document.createElement('style');
  st.textContent =
    '#wk-header{font-family:"Poppins",sans-serif;background:linear-gradient(135deg,#1464dd,#0d47a1);color:#fff;'
    +'padding:10px 20px;margin:0;width:auto;height:auto;display:flex;flex-wrap:wrap;align-items:center;'
    +'justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 3px 15px rgba(20,100,221,0.35);'
    +'box-sizing:border-box;line-height:normal;text-align:left;}'
    +'#wk-header h1{font-family:"Poppins",sans-serif;font-size:19.2px;font-weight:700;color:#fff;margin:0;padding:0;box-sizing:border-box;}'
    +'#wk-header nav{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;width:auto;background:none;box-sizing:border-box;}'
    +'#wk-header nav a{font-family:"Poppins",sans-serif;background:rgba(255,255,255,0.15);'
    +'border:1px solid rgba(255,255,255,0.25);color:#fff;padding:7px 13px;border-radius:25px;font-size:12.48px;'
    +'font-weight:500;box-sizing:border-box;text-decoration:none;transition:all 0.2s;margin:0;line-height:normal;display:inline-block;}'
    +'#wk-header nav a:hover,#wk-header nav a.active{background:rgba(255,255,255,0.3);border-color:rgba(255,255,255,0.6);}'
    +'#wk-header nav a.logout{border-color:rgba(255,100,100,0.4);color:#ffaaaa;}'
    +'#wk-header nav a.logout:hover{background:rgba(255,80,80,0.2);}'
    +'@media(max-width:600px){'
    +'#wk-header{flex-direction:column;align-items:flex-start;gap:8px;}'
    +'#wk-header h1{font-size:16px;}'
    +'#wk-header nav{width:100% !important;display:flex !important;flex-wrap:wrap !important;}'
    +'#wk-header nav a{flex:1 1 auto !important;text-align:center !important;font-size:11.2px;padding:6px 10px;}'
    +'#wk-header nav a.logout{flex:0 0 auto !important;margin-left:auto !important;padding:6px 18px;}}';
  document.head.appendChild(st);

  /* build the header */
  var h = document.createElement('header');
  h.id = 'wk-header';
  var nav = links.map(function(l){
    return '<a href="'+l[0]+'"'+(current===l[0]?' class="active"':'')+'>'+l[1]+'</a>';
  }).join('');
  h.innerHTML =
    '<h1>🚗 Waliko Car Hire</h1>'
    +'<nav>'+nav+'<a href="index.html" class="logout" id="logoutBtn">Logout</a></nav>';

  function mount(){
    /* drop the page's own old header(s) */
    document.querySelectorAll('header').forEach(function(x){ if(x!==h) x.parentNode.removeChild(x); });
    /* also drop old title bars that aren't <header> tags (e.g. "Waliko Car Hire | Dashboard") */
    Array.prototype.slice.call(document.body.children).forEach(function(x){
      if(x===h || /^(SCRIPT|STYLE|LINK)$/.test(x.tagName)) return;
      var t = (x.textContent || '').trim();
      if(t.length < 120 && /waliko car hire/i.test(t) && !x.querySelector('input,textarea,select,form,main')){
        x.parentNode.removeChild(x);
      }
    });
    if(!h.parentNode) document.body.insertBefore(h, document.body.firstChild);
  }
  if(document.body){ document.body.insertBefore(h, document.body.firstChild); }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', mount); } else { mount(); }

  /* logout (same behaviour as before) */
  h.querySelector('#logoutBtn').addEventListener('click', function(e){
    e.preventDefault();
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  });
})();
