/* Waliko store credit + refunds — TEST version (localStorage).
   All logic lives here. For live, replace the functions in CR with server calls. */
const CR = (() => {
  const J = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const S = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KES = n => 'Ksh ' + Number(n || 0).toLocaleString();
  const bid = id => '#' + String(id ?? '').replace(/^#+/, '');
  const me = () => (J('currentUser', {}).email || '').toLowerCase();

  // ── Credit ledger (balance = sum of rows) ──
  const ledger = e => J('credit_' + e, []);
  const balance = e => ledger(e).reduce((s, t) => s + t.amount, 0);
  const post = (e, amount, type, ref, note) => {
    const l = ledger(e);
    l.push({ at: new Date().toLocaleString(), amount, type, ref, note });
    S('credit_' + e, l);
  };
  const use = (amt, ref) => {
    const e = me();
    if (!e || !(amt > 0) || balance(e) < amt) return false;
    post(e, -amt, 'used', ref, 'Booking payment');
    return true;
  };

  // ── Bookings helpers ──
  const bookings = () => J('bookings', []);
  const saveBooking = (id, patch) => S('bookings', bookings().map(b => String(b.bookingId) === String(id) ? { ...b, ...patch } : b));
  const days = b => b.pickup && b.endDate ? Math.max(1, Math.ceil((new Date(b.endDate) - new Date(b.pickup)) / 864e5)) : 1;
  const cap = b => { const total = (b.price || 0) * days(b), dep = Number(b.paidAmount) || 0; return b.balancePaid && dep < total ? total : dep; };
  const locked = b => ['requested', 'refunded'].includes(b.refundStatus);

  // ── Refund requests ──
  const requestRefund = (id, reason) => {
    const e = me(), b = bookings().find(x => String(x.bookingId) === String(id));
    if (!e || !b || (b.email || '').toLowerCase() !== e || b.paymentStatus !== 'paid' || locked(b)) return 'This booking is not eligible for a refund.';
    const r = J('refundRequests', []);
    r.push({ id: 'R' + Date.now(), bookingId: id, email: e, carName: b.carName || '', amount: cap(b), reason, status: 'pending', at: new Date().toLocaleString() });
    S('refundRequests', r);
    saveBooking(id, { refundStatus: 'requested' });
    return '';
  };

  // Admin: approve (adds store credit once) or reject
  const decide = (rid, ok, amt) => {
    const r = J('refundRequests', []), q = r.find(x => x.id === rid);
    if (!q || q.status !== 'pending') return 'Already handled.';
    const b = bookings().find(x => String(x.bookingId) === String(q.bookingId));
    const max = b ? cap(b) : q.amount;
    if (ok) {
      amt = Math.floor(Number(amt));
      if (!(amt > 0) || amt > max) return 'Amount must be between 1 and ' + max;
      post(q.email, amt, 'refund_credit', q.bookingId, 'Refund approved');
      q.amount = amt;
    }
    q.status = ok ? 'approved' : 'rejected';
    q.decidedAt = new Date().toLocaleString();
    S('refundRequests', r);
    saveBooking(q.bookingId, { refundStatus: ok ? 'refunded' : 'rejected' });
    return '';
  };

  // ── Customer page (#creditApp) ──
  function customer() {
    const el = document.getElementById('creditApp'); if (!el) return;
    const e = me();
    if (!e) { el.innerHTML = '<div class="cr-card">Please <a href="signin.html">sign in</a> first.</div>'; return; }
    const bs = bookings().filter(b => (b.email || '').toLowerCase() === e && b.paymentStatus === 'paid');
    const rq = J('refundRequests', []).filter(r => r.email === e).reverse();
    const lg = ledger(e).slice().reverse().slice(0, 15);
    el.innerHTML =
      `<div class="cr-card cr-bal"><small>Store credit balance</small><h2>${KES(balance(e))}</h2></div>` +
      `<div class="cr-card"><h3>Paid bookings</h3>${bs.length ? bs.map(b =>
        `<div class="cr-row"><span>${esc(b.carName)} · ${esc(bid(b.bookingId))}<br><small>Paid ${KES(cap(b))}${b.refundStatus ? ' · refund ' + esc(b.refundStatus) : ''}</small></span>` +
        (locked(b) ? '' : `<button onclick="CR.ask('${esc(b.bookingId)}')">Request refund</button>`) + '</div>').join('') : '<p>No paid bookings yet.</p>'}</div>` +
      `<div class="cr-card"><h3>My refund requests</h3>${rq.length ? rq.map(r =>
        `<div class="cr-row"><span>${esc(r.carName)} · ${esc(bid(r.bookingId))}<br><small>${esc(r.at)}</small></span><span class="cr-tag cr-${esc(r.status)}">${esc(r.status)} · ${KES(r.amount)}</span></div>`).join('') : '<p>None.</p>'}</div>` +
      `<div class="cr-card"><h3>Credit history</h3>${lg.length ? lg.map(t =>
        `<div class="cr-row"><span>${esc(t.note)}<br><small>${esc(t.at)}</small></span><span class="cr-tag" style="color:${t.amount > 0 ? '#1b8a3d' : '#c0392b'}">${t.amount > 0 ? '+' : ''}${KES(t.amount)}</span></div>`).join('') : '<p>No credit activity.</p>'}</div>`;
  }
  const ask = id => {
    const reason = prompt('Reason for the refund?'); if (reason === null) return;
    const m = requestRefund(id, reason.trim()); if (m) alert(m);
    customer();
  };

  // ── Admin page (#adminApp) — TEST ONLY: add your admin login check here ──
  function admin() {
    const el = document.getElementById('adminApp'); if (!el) return;
    const all = J('refundRequests', []).slice().reverse();
    const pend = all.filter(r => r.status === 'pending'), done = all.filter(r => r.status !== 'pending');
    el.innerHTML =
      `<div class="cr-card"><h3>Pending (${pend.length})</h3>${pend.length ? pend.map(r =>
        `<div class="cr-req"><div class="cr-grid"><span>Customer</span><b>${esc(r.email)}</b><span>Car</span><b>${esc(r.carName)}</b><span>Booking</span><b>${esc(bid(r.bookingId))}</b><span>Amount</span><b>${KES(r.amount)}</b><span>Reason</span><b>${esc(r.reason || 'No reason given')}</b><span>Requested</span><b>${esc(r.at)}</b></div>` +
        `<div class="cr-act"><button onclick="CR.act('${r.id}',true)">Approve</button><button class="no" onclick="CR.act('${r.id}',false)">Reject</button></div></div>`).join('') : '<p>No pending requests.</p>'}</div>` +
      `<div class="cr-card"><h3>History</h3>${done.length ? done.map(r =>
        `<div class="cr-row"><span>${esc(r.email)} · ${esc(bid(r.bookingId))}<br><small>${esc(r.decidedAt || '')}</small></span><span class="cr-tag cr-${esc(r.status)}">${esc(r.status)} · ${KES(r.amount)}</span></div>`).join('') : '<p>Nothing yet.</p>'}</div>`;
  }
  const act = (id, ok) => {
    let amt = 0;
    if (ok) { const q = J('refundRequests', []).find(x => x.id === id); amt = prompt('Credit amount to give (Ksh):', q ? q.amount : ''); if (amt === null) return; }
    else if (!confirm('Reject this refund request?')) return;
    const m = decide(id, ok, amt); if (m) alert(m);
    admin();
  };

  // ── Payment gateway hook: adds "Pay with Store Credit" ──
  function payHook() {
    const m = document.getElementById('mpesaBtn');
    if (!m || typeof markBookingPaid !== 'function' || paymentLocked || !amount || !bookingId) return;
    const e = me(), bal = balance(e);
    if (!e || bal <= 0) return;
    const d = document.createElement('div');
    d.className = 'payment-method'; d.id = 'creditBtn';
    d.innerHTML = '<span style="font-size:1.4em">💰</span> Pay with Store Credit <small style="margin-left:6px;color:#1b8a3d">(' + KES(bal) + ' available)</small><span class="method-arrow">›</span>';
    d.onclick = () => {
      if (paymentLocked) return;
      const need = Number(amount);
      if (balance(e) < need) { alert('Not enough credit. You need ' + KES(need) + ' but have ' + KES(balance(e)) + '.'); return; }
      if (!confirm('Pay ' + KES(need) + ' with store credit?')) return;
      if (!use(need, bookingId)) return;
      markBookingPaid(bookingId, 'CREDIT-' + Date.now(), amount, null);
      announceSuccess('CREDIT');
      d.remove();
    };
    m.parentNode.insertBefore(d, m);
  }

  // ── Init ──
  if (document.getElementById('creditApp') || document.getElementById('adminApp')) {
    const st = document.createElement('style');
    st.textContent = "body{margin:0;background:#f0f4ff;font-family:Poppins,sans-serif;color:#333}.cr-wrap{max-width:560px;margin:0 auto;padding:16px}.cr-wrap h1{color:#1464dd;font-size:1.2em}.cr-wrap a{color:#1464dd;font-weight:600;text-decoration:none;font-size:.85em}.cr-card{background:#fff;border-radius:14px;padding:16px 18px;margin:12px 0;box-shadow:0 3px 16px rgba(20,100,221,.09)}.cr-card h3{margin:0 0 8px;font-size:.95em;color:#1464dd}.cr-card p{font-size:.85em;color:#888}.cr-bal h2{margin:2px 0 0;color:#1b8a3d}.cr-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed #e2e7f3;font-size:.85em}.cr-row:last-child{border:0}.cr-row button,.cr-act button{background:#1464dd;color:#fff;border:0;border-radius:8px;padding:7px 12px;font:600 .8em Poppins,sans-serif;cursor:pointer}.cr-row button.no,.cr-act button.no{background:#fff0f0;color:#c0392b;border:1px solid #ffcccc}.cr-req{padding:12px 0;border-bottom:1px dashed #e2e7f3}.cr-req:last-child{border:0}.cr-grid{display:grid;grid-template-columns:88px 1fr;gap:5px 10px;font-size:.85em}.cr-grid span{color:#8a97b8}.cr-grid b{font-weight:600;word-break:break-word}.cr-act{display:flex;gap:8px;margin-top:10px}.cr-tag.cr-approved{color:#1b8a3d;background:#e6fff0;border:1px solid #27ae60;padding:3px 10px;border-radius:20px}.cr-tag.cr-rejected{color:#c0392b;background:#fff0f0;border:1px solid #f5a3a3;padding:3px 10px;border-radius:20px}.cr-tag.cr-pending{color:#b35c00;background:#fff5e6;border:1px solid #ffc87a;padding:3px 10px;border-radius:20px}.cr-tag{font-size:.78em;font-weight:700;white-space:nowrap}";
    document.head.appendChild(st);
  }
  customer(); admin(); payHook();

  return { balance, requestRefund, decide, use, ask, act };
})();
