(function() {
  'use strict';

  /* 1 — HTTPS enforcement */
  if (location.protocol !== 'https:' &&
      location.hostname !== 'localhost' &&
      !location.hostname.startsWith('127.')) {
    location.replace('https:' + window.location.href.substring(window.location.protocol.length));
  }

  /* 2 — Anti-clickjacking / frame-busting */
  if (top !== self) {
    try { top.location = self.location; } catch(e) { document.body.innerHTML = ''; }
  }

  /* 3 — Self-XSS console warning */
  console.log('%c⚠️ Stop!', 'color:red;font-size:40px;font-weight:bold;');
  console.log('%cThis is a browser feature for developers. Pasting anything here could give attackers access to your account.', 'font-size:14px;');

  /* 4 — HTML entity sanitiser */
  function sanitize(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
  }

  /* 5 — Email & phone regex */
  const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const phoneRe = /^[\d\s\-\+\(\)\.]{7,20}$/;

  /* 6 — Contact form: honeypot + rate-limit + validation */
  const form    = document.getElementById('contactForm');
  const formMsg = document.getElementById('formMsg');
  let lastSubmit = 0;
  let submitToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);

  function showMsg(type, text) {
    formMsg.className = 'form-msg ' + type;
    formMsg.textContent = text;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    /* Honeypot */
    if (form.querySelector('[name="website_url"]').value.length > 0) return;

    /* Rate limit: 60 seconds */
    if (Date.now() - lastSubmit < 60000) {
      showMsg('error', 'Please wait a moment before submitting again.'); return;
    }

    /* One-time token (double-submit prevention) */
    const token = submitToken;
    submitToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);

    const name  = sanitize(document.getElementById('cf-name').value.trim());
    const biz   = sanitize(document.getElementById('cf-biz').value.trim());
    const email = document.getElementById('cf-email').value.trim();
    const phone = document.getElementById('cf-phone').value.trim();

    if (!name)               { showMsg('error', 'Please enter your name.');            return; }
    if (name.length > 100)   { showMsg('error', 'Name is too long.');                  return; }
    if (!biz)                { showMsg('error', 'Please enter your business name.');   return; }
    if (!emailRe.test(email)){ showMsg('error', 'Please enter a valid email address.');return; }
    if (phone && !phoneRe.test(phone)){ showMsg('error','Please enter a valid phone number.'); return; }

    lastSubmit = Date.now();
    showMsg('success', '✅ Message received! Robin will be in touch within 24 hours.');
    form.reset();
  });

  /* 7 — Stripe payment links: validate destination before navigating */
  document.querySelectorAll('a[href^="https://buy.stripe.com"]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      const dest = btn.getAttribute('href');
      /* Only allow known buy.stripe.com domain */
      try {
        const url = new URL(dest);
        if (url.hostname !== 'buy.stripe.com') { e.preventDefault(); return; }
      } catch(_) { e.preventDefault(); }
    });
  });

  /* 8 — External links: force noopener noreferrer */
  document.querySelectorAll('a[href^="http"]').forEach(function(a) {
    a.setAttribute('rel', 'noopener noreferrer');
  });

  /* 9 — FAQ accordion */
  document.querySelectorAll('.faq-item').forEach(function(item) {
    item.querySelector('.faq-question').addEventListener('click', function() {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function(i){ i.classList.remove('open'); });
      if (!open) item.classList.add('open');
    });
  });

  /* 10 — Subresource Integrity check placeholder (enforced via CSP) */

})();

/* ══════════════════════════════════════
   SUBSCRIPTION REQUEST MODAL
══════════════════════════════════════ */
/* ── HTML entity escaper — prevents XSS when inserting user data into DOM ── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ── Attach subscribe buttons via data attributes (no onclick needed) ── */
document.querySelectorAll('.hcc-sub-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    openSubscribeModal(this.dataset.plan, this.dataset.price);
  });
});
document.getElementById('subCloseBtn').addEventListener('click', closeSubscribeModal);

function openSubscribeModal(plan, price) {
  document.getElementById('subModalTitle').textContent = 'Apply for ' + plan + ' Plan';
  document.getElementById('subModalDesc').textContent = 'Fill in your details below and your secure Stripe payment link will be sent straight to your email — instantly.';
  document.getElementById('subPlanBadge').innerHTML = '<span>' + escHtml(plan) + ' Plan — ' + escHtml(price) + '/month</span>';
  document.getElementById('sub-plan-hidden').value = plan;
  document.getElementById('sub-price-hidden').value = price;
  document.getElementById('subFormMsg').className = 'sub-form-msg';
  document.getElementById('subFormMsg').textContent = '';
  document.getElementById('subForm').reset();
  document.getElementById('sub-plan-hidden').value = plan;
  document.getElementById('sub-price-hidden').value = price;
  document.getElementById('subOverlay').classList.add('open');
}
function closeSubscribeModal() {
  document.getElementById('subOverlay').classList.remove('open');
}
document.getElementById('subOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeSubscribeModal();
});

const emailRe2 = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
let subLastSubmit = 0;

// ⚙️ EMAILJS SETUP — replace these three values with your own from emailjs.com
// See the emailjs_setup_guide.html file for step-by-step instructions
var EMAILJS_SERVICE_ID  = 'service_17rgqbt';
var EMAILJS_CUSTOMER_TEMPLATE = 'template_sam7jzg';
var EMAILJS_NOTIFY_TEMPLATE   = 'template_l45g5gh';

var STRIPE_LINKS = {
  Starter:   'https://buy.stripe.com/8x2fZhdYEb9Y071gqT0Jq01',
  Growth:    'https://buy.stripe.com/3cI00jg6Mema9HBgqT0Jq02',
  Authority: 'https://buy.stripe.com/cNi5kDdYE3HwcTN0rV0Jq03'
};

document.getElementById('subForm').addEventListener('submit', function(e) {
  e.preventDefault();
  if (this.querySelector('[name="hp_url"]').value) return;
  if (Date.now() - subLastSubmit < 30000) {
    showSubMsg('error', 'Please wait before submitting again.'); return;
  }

  var name  = document.getElementById('sub-name').value.trim();
  var biz   = document.getElementById('sub-biz').value.trim();
  var email = document.getElementById('sub-email').value.trim();
  var phone = document.getElementById('sub-phone').value.trim();
  var type  = document.getElementById('sub-type').value;
  var plan  = document.getElementById('sub-plan-hidden').value;
  var price = document.getElementById('sub-price-hidden').value;
  var msg   = document.getElementById('sub-msg').value.trim();

  if (!name)               { showSubMsg('error','Please enter your name.'); return; }
  if (!biz)                { showSubMsg('error','Please enter your business name.'); return; }
  if (!emailRe2.test(email)){ showSubMsg('error','Please enter a valid email address.'); return; }
  if (!phone)              { showSubMsg('error','Please enter your phone number.'); return; }
  if (!type)               { showSubMsg('error','Please select your business type.'); return; }

  var paymentLink = STRIPE_LINKS[plan] || STRIPE_LINKS['Starter'];
  // Generate 7-day expiring refund link — embedded in the customer email
  var refundExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
  var refundLink = 'https://dhitalrk.github.io/harrisburg-content-co-website/refund.html?expires=' + refundExpiry + '&plan=' + encodeURIComponent(plan);
  var btn = document.getElementById('subSubmitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Sending your payment link...';
  subLastSubmit = Date.now();

  // Check if EmailJS has been configured
  var emailjsReady = (
    EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
    EMAILJS_CUSTOMER_TEMPLATE !== 'YOUR_CUSTOMER_TEMPLATE_ID'
  );

  function showPaymentFallback() {
    showSubMsg('success',
      '✅ Application received!<br><br>' +
      'Here is your secure payment link for the <strong>' + escHtml(plan) + ' Plan</strong>:<br><br>' +
      '<a href="' + escHtml(paymentLink) + '" target="_blank" rel="noopener noreferrer" ' +
      'style="display:inline-block;background:#e05c2f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px 0;">' +
      '💳 Complete Payment — ' + escHtml(price) + '/mo →</a><br><br>' +
      '<small style="color:#7a7a8c;">Bookmark this link. Robin will also follow up at <strong>' + escHtml(email) + '</strong> shortly.</small><br><br>' +
      'Questions? Call or text <a href="tel:7174613210">(717) 461-3210</a>.'
    );
    btn.disabled = false;
    btn.textContent = 'Send My Application →';
  }

  var emailjsAvailable = (typeof emailjs !== 'undefined');

  if (emailjsAvailable && emailjsReady) {
    // ── Automated path: send payment link directly to customer ──
    var customerParams = {
      to_email:     email,
      to_name:      name,
      plan_name:    plan,
      plan_price:   price + '/month',
      payment_link: paymentLink,
      refund_link:  refundLink,
      biz_name:     biz,
      reply_to:     'dhital.robin33@gmail.com'
    };
    var notifyParams = {
      client_name:  name,
      client_biz:   biz,
      client_email: email,
      client_phone: phone,
      biz_type:     type,
      plan_name:    plan,
      plan_price:   price + '/month',
      payment_link: paymentLink,
      client_msg:   msg || 'Not provided',
      submitted_at: new Date().toLocaleString()
    };

    try {
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CUSTOMER_TEMPLATE, customerParams)
        .then(function() {
          return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_NOTIFY_TEMPLATE, notifyParams);
        })
        .then(function() {
          showSubMsg('success',
            '🎉 Your payment link has been sent to <strong>' + email + '</strong>!<br><br>' +
            'Check your inbox (and spam folder just in case) for an email from Harrisburg Content Co. ' +
            'with your secure Stripe payment link for the <strong>' + escHtml(plan) + ' Plan</strong>.<br><br>' +
            'Questions? Call or text <a href="tel:7174613210">(717) 461-3210</a>.'
          );
          btn.disabled = false;
          btn.textContent = 'Send My Application →';
          document.getElementById('subForm').reset();
          document.getElementById('sub-plan-hidden').value = plan;
          document.getElementById('sub-price-hidden').value = price;
        })
        .catch(function(err) {
          console.error('EmailJS send error:', err);
          showPaymentFallback();
        });
    } catch(e) {
      console.error('EmailJS exception:', e);
      showPaymentFallback();
    }

  } else {
    // ── Fallback: show payment link on screen + open Robin's email ──
    var subjectLine = encodeURIComponent('NEW APPLICATION — ' + biz + ' (' + plan + ' Plan)');
    var emailBody = encodeURIComponent(
      'NEW SUBSCRIPTION APPLICATION\n\n' +
      'Plan: ' + plan + ' — ' + price + '/month\n' +
      'Name: ' + name + '\nBusiness: ' + biz + '\nType: ' + type +
      '\nEmail: ' + email + '\nPhone: ' + phone +
      '\n\nAbout: ' + (msg || 'Not provided') +
      '\n\nPayment link to send them:\n' + paymentLink +
      '\n\nSubmitted: ' + new Date().toLocaleString()
    );
    try { window.open('mailto:dhital.robin33@gmail.com?subject=' + subjectLine + '&body=' + emailBody); } catch(e) {}
    setTimeout(showPaymentFallback, 600);
  }
});

function showSubMsg(type, html) {
  const m = document.getElementById('subFormMsg');
  m.className = 'sub-form-msg ' + type;
  m.innerHTML = html;
}

/* ══════════════════════════════════════
   AI CHAT WIDGET
══════════════════════════════════════ */
(function() {
  'use strict';

  const PLANS = {
    Starter:   { price:'$497/mo',  link:'https://buy.stripe.com/8x2fZhdYEb9Y071gqT0Jq01' },
    Growth:    { price:'$997/mo',  link:'https://buy.stripe.com/3cI00jg6Mema9HBgqT0Jq02' },
    Authority: { price:'$1,997/mo',link:'https://buy.stripe.com/cNi5kDdYE3HwcTN0rV0Jq03' }
  };

  const KB = [
    { keys:['hello','hi','hey','good morning','good afternoon','good evening','howdy'],
      reply:"Hey there! 👋 Welcome to Harrisburg Content Co.! I'm here to answer any questions about our social media services. What can I help you with today?",
      quick:['What do you do?','How much does it cost?','How do I get started?'] },
    { keys:['what do you do','what is','who are you','tell me about','what services','what you offer'],
      reply:"We're a social media content agency serving local Harrisburg businesses! 🎨\n\nWe create everything for your social media — captions, branded graphics, hashtags, and post scheduling — every single month. You send us photos, we handle the rest. Starting at just $497/month.",
      quick:['See pricing plans','How does it work?','What businesses do you serve?'] },
    { keys:['price','cost','how much','pricing','plans','packages','rate','fee','charge'],
      reply:"We have 3 simple monthly plans:\n\n🔹 <strong>Starter — $497/mo</strong>\n12 posts, 3 graphics, 1 platform\n\n🔸 <strong>Growth — $997/mo</strong> ⭐ Most Popular\n30 posts, 8 graphics, 2 platforms, Reel scripts\n\n🔺 <strong>Authority — $1,997/mo</strong>\n60 posts, 16 graphics, 3 platforms, blog + newsletter\n\nAll plans include a 7-day money-back guarantee!",
      quick:['Apply for Starter','Apply for Growth','Apply for Authority'] },
    { keys:['how does it work','process','steps','how it works','what happens'],
      reply:"Super simple — 4 steps:\n\n1️⃣ <strong>Fill out our intake form</strong> (10 min, one-time)\n2️⃣ <strong>Send us phone photos</strong> each month\n3️⃣ <strong>We build your content</strong> — captions, graphics, calendar\n4️⃣ <strong>We schedule everything</strong> — your page stays active all month\n\nYour only job? Reply to the customers who reach out! 😊",
      quick:['What does it cost?','How do I sign up?','Do you post for me?'] },
    { keys:['starter','497'],
      reply:"The <strong>Starter Plan</strong> at $497/month is perfect for getting started! You get:\n\n✅ 12 posts per month\n✅ 3 branded graphics\n✅ 1 platform (Instagram or Facebook)\n✅ Full captions + hashtags\n✅ Content calendar + scheduling\n✅ 7-day money-back guarantee\n\nReady to apply?",
      quick:['Apply for Starter','Tell me about Growth plan','How do I apply?'] },
    { keys:['growth','997'],
      reply:"The <strong>Growth Plan</strong> at $997/month is our most popular! You get:\n\n✅ 30 posts per month\n✅ 8 branded graphics\n✅ Instagram + Facebook (2 platforms)\n✅ 4 Reel/TikTok video scripts\n✅ 4 Google Business posts\n✅ Monthly performance review\n✅ 7-day money-back guarantee",
      quick:['Apply for Growth','Tell me about Authority plan','How does it work?'] },
    { keys:['authority','1997','1,997'],
      reply:"The <strong>Authority Plan</strong> at $1,997/month is for businesses that want to dominate Harrisburg! You get:\n\n✅ 60 posts per month\n✅ 16 branded graphics\n✅ 3 platforms covered\n✅ 8 video scripts\n✅ Monthly blog post\n✅ Email newsletter\n✅ Monthly strategy call with Robin",
      quick:['Apply for Authority','See all plans','How does it work?'] },
    { keys:['apply','sign up','get started','subscribe','join','start'],
      reply:"Great — let's get you started! 🎉\n\nJust click the button below for your chosen plan. You'll fill out a quick form and Robin will personally email you your secure payment link within a few hours.",
      quick:['Apply for Starter ($497)','Apply for Growth ($997)','Apply for Authority ($1,997)'] },
    { keys:['refund','money back','guarantee','cancel','cancellation'],
      reply:"We offer a <strong>7-day money-back guarantee</strong> on your first delivery — no questions asked.\n\nAfter that, you can cancel anytime with 30 days notice. No contracts, no cancellation fees.\n\nIf you ever need a refund, just email dhital.robin33@gmail.com or call (717) 461-3210 and we process it within 24 hours.",
      quick:['How do I request a refund?','See pricing plans','How does it work?'] },
    { keys:['refund request','request refund','want refund','need refund'],
      reply:"To request a refund, visit our <a href='refund.html'>Refund Request page</a> — it takes 2 minutes and Robin processes it within 24 hours.\n\nOr contact us directly:\n📞 (717) 461-3210\n📧 dhital.robin33@gmail.com",
      quick:['Open refund page','Talk to someone','See our policy'] },
    { keys:['contract','commitment','lock in','minimum','long term'],
      reply:"No contracts at all! 🙌\n\nAll our plans are <strong>month-to-month</strong>. Cancel anytime with 30 days notice. We earn your business every single month by delivering great results — not by locking you in.",
      quick:['See pricing plans','How does it work?','Apply for a plan'] },
    { keys:['instagram','facebook','tiktok','social media','platform','post','schedule'],
      reply:"Yes — we cover all the major platforms! 📱\n\n📸 Instagram\n👍 Facebook\n🎬 TikTok / Reels\n📍 Google Business Profile\n\nDepending on your plan, we manage 1–3 platforms. We write the captions, design the graphics, and schedule everything at the best times for engagement.",
      quick:['See what\'s in each plan','How does it work?','Get started'] },
    { keys:['photo','picture','image','i don\'t have photos','no photos'],
      reply:"No professional photos needed! 📸\n\nJust snap a few phone photos of your business, products, or team each month and send them to us via WhatsApp, email, or Google Drive.\n\nGood lighting + clean background = great content. We handle all the design and graphics on top of your photos.",
      quick:['How does it work?','See pricing plans','Get started'] },
    { keys:['restaurant','salon','gym','contractor','real estate','dentist','auto','retail','small business','local','business type'],
      reply:"We work with all kinds of Harrisburg local businesses! 🏙️\n\n🍽️ Restaurants & cafés\n💅 Salons & spas\n💪 Gyms & fitness studios\n🔨 Contractors & trades\n🏠 Real estate agents\n🦷 Dental & medical offices\n🚗 Auto shops\n🛍️ Retail & boutiques\n\nIf you serve local customers, we can help!",
      quick:['See pricing plans','How does it work?','Apply for a plan'] },
    { keys:['harrisburg','pennsylvania','pa','local','area','location','where'],
      reply:"We're right here in Harrisburg, PA! 📍\n\nWe serve businesses throughout Central Pennsylvania including Harrisburg, Camp Hill, Mechanicsburg, Hershey, York, and Lancaster.\n\nBeing local means we create content with real Harrisburg context that resonates with your community.",
      quick:['See our plans','Get started','Contact Robin'] },
    { keys:['results','work','effective','roi','does it work','testimonial','proof','reviews'],
      reply:"Our clients see real results! 📈\n\n✅ Most see improved engagement within 30 days\n✅ Real business results (calls, bookings, walk-ins) within 60–90 days\n✅ Consistent posting builds local brand recognition fast\n\nOne restaurant client tripled their Instagram engagement in month 1 and started getting reservation DMs from social media for the first time.",
      quick:['See pricing plans','Apply for a plan','How does it work?'] },
    { keys:['how long','timeline','when','turnaround','delivery','deliver'],
      reply:"We deliver fast! ⚡\n\n📦 <strong>72-hour delivery guarantee</strong> on your monthly content package\n✅ You review and approve before anything goes live\n📅 Full month scheduled before the month begins\n\nOnce you send us photos and approve content, everything is set for the entire month.",
      quick:['See pricing plans','How does it work?','Apply now'] },
    { keys:['contact','call','phone','email','talk','speak','robin','reach'],
      reply:"You can reach Robin directly:\n\n📞 <a href='tel:7174613210'>(717) 461-3210</a> — call or text anytime\n📧 dhital.robin33@gmail.com\n\nRobin responds within 24 hours, Monday–Saturday.",
      quick:['Apply for a plan','See pricing','How does it work?'] },
    { keys:['free','trial','demo','sample','example','see what you do'],
      reply:"We don't offer a free trial, but we do two things to make it risk-free:\n\n🛡️ <strong>7-day money-back guarantee</strong> — if you're not happy with your first delivery, full refund, no questions.\n\n📋 <strong>Review before posting</strong> — you see and approve every post before it goes live.\n\nYou've got nothing to lose!",
      quick:['Apply for Starter','See all plans','How does it work?'] },
    { keys:['payment','pay','stripe','card','billing','charge','invoice'],
      reply:"Payments are handled securely through <strong>Stripe</strong> — the same platform used by Amazon and Shopify. 🔒\n\nHere's how it works:\n1️⃣ Apply for your plan (fill out the form)\n2️⃣ Robin reviews and emails you a personal payment link\n3️⃣ You pay securely via Stripe\n4️⃣ We get started on your content!\n\nYou'll be billed monthly on the same date.",
      quick:['Apply for a plan','See pricing','Questions?'] },
  ];

  const QUICK_START = ['What do you do?','How much does it cost?','How do I get started?','I have a question'];
  let chatOpen = false;
  let greeted  = false;

  function addMsg(text, who, delay) {
    setTimeout(function() {
      const msgs = document.getElementById('chatMessages');
      const typing = msgs.querySelector('.chat-typing');
      if (typing) typing.remove();
      const div = document.createElement('div');
      div.className = 'chat-msg ' + who;
      div.innerHTML = text.replace(/\n/g,'<br/>');
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }, delay || 0);
  }

  function showTyping(duration) {
    const msgs = document.getElementById('chatMessages');
    const t = document.createElement('div');
    t.className = 'chat-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
    return duration;
  }

  function setQuickBtns(btns) {
    const c = document.getElementById('chatQuickBtns');
    c.innerHTML = '';
    (btns || []).forEach(function(label) {
      const b = document.createElement('button');
      b.className = 'chat-quick-btn';
      b.textContent = label;
      b.addEventListener('click', function() {
        handleUserInput(label);
      });
      c.appendChild(b);
    });
  }

  function toggleChat() {
    chatOpen = !chatOpen;
    const win = document.getElementById('chatWindow');
    const icon = document.getElementById('chatBubbleIcon');
    const unread = document.getElementById('chatUnread');
    if (chatOpen) {
      win.classList.add('open');
      icon.textContent = '✕';
      unread.style.display = 'none';
      if (!greeted) {
        greeted = true;
        setTimeout(function() {
          showTyping(800);
          addMsg("👋 Hi! Welcome to Harrisburg Content Co.!\n\nI'm here to answer any questions about our social media services. What can I help you with today?", 'bot', 900);
          setQuickBtns(QUICK_START);
        }, 300);
      }
    } else {
      win.classList.remove('open');
      icon.textContent = '💬';
    }
  }

  function getBotReply(input) {
    const low = input.toLowerCase();
    // Check apply shortcuts
    if (/apply.*starter|starter.*apply|get starter|want starter/i.test(low)) {
      return { reply: null, action: 'subscribe', plan:'Starter' };
    }
    if (/apply.*growth|growth.*apply|get growth|want growth/i.test(low)) {
      return { reply: null, action: 'subscribe', plan:'Growth' };
    }
    if (/apply.*authority|authority.*apply|get authority|want authority/i.test(low)) {
      return { reply: null, action: 'subscribe', plan:'Authority' };
    }
    if (/apply.*starter.*\$497|starter.*\$497/i.test(low)) {
      return { reply: null, action: 'subscribe', plan:'Starter' };
    }
    if (/apply.*growth.*\$997|growth.*\$997/i.test(low)) {
      return { reply: null, action: 'subscribe', plan:'Growth' };
    }
    if (/apply.*authority.*\$1,997|authority.*\$1,997/i.test(low)) {
      return { reply: null, action: 'subscribe', plan:'Authority' };
    }
    for (let i = 0; i < KB.length; i++) {
      if (KB[i].keys.some(function(k){ return low.includes(k); })) {
        return { reply: KB[i].reply, quick: KB[i].quick };
      }
    }
    return null;
  }

  function handleUserInput(text) {
    document.getElementById('chatQuickBtns').innerHTML = '';
    addMsg(text, 'user');
    const result = getBotReply(text);
    if (result && result.action === 'subscribe') {
      const plan = result.plan;
      const p = PLANS[plan];
      showTyping(700);
      addMsg("Great choice! 🎉 Let me open the application form for the <strong>" + plan + " Plan (" + p.price + ")</strong> right now.", 'bot', 800);
      setTimeout(function() {
        openSubscribeModal(plan, p.price, p.price.replace(/[^0-9]/g,''));
      }, 1200);
      setQuickBtns(['See all plans','How does it work?','Contact Robin']);
    } else if (result) {
      showTyping(700);
      addMsg(result.reply, 'bot', 800);
      if (result.quick) {
        setTimeout(function(){ setQuickBtns(result.quick); }, 900);
      }
    } else {
      // Fallback: capture message
      showTyping(900);
      addMsg("That's a great question! I'm not sure I have the exact answer, but Robin will! 😊\n\nI'll connect you directly — you can reach Robin at:\n📞 <a href='tel:7174613210'>(717) 461-3210</a>\n📧 dhital.robin33@gmail.com\n\nOr click below to send your question now:", 'bot', 1000);
      setTimeout(function() {
        const esc = text.replace(/[<>&"]/g,'');
        const sub = encodeURIComponent('Website Chat Inquiry — ' + esc.slice(0,40));
        const bd = encodeURIComponent('Hi Robin,\n\nA visitor asked this on your website chat:\n\n"' + esc + '"\n\nPlease follow up with them.');
        setQuickBtns(['📧 Email my question', 'See pricing plans', 'Apply for a plan']);
        document.querySelectorAll('.chat-quick-btn').forEach(function(btn) {
          if (btn.textContent === '📧 Email my question') {
            btn.addEventListener('click', function() {
              window.location.href = 'mailto:dhital.robin33@gmail.com?subject=' + sub + '&body=' + bd;
            });
          }
        });
      }, 1100);
    }
  }

  function sendUserMessage() {
    const inp = document.getElementById('chatInput');
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';
    handleUserInput(txt);
  }

  document.getElementById('chatInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendUserMessage();
  });
  document.getElementById('chatBubble').addEventListener('click', toggleChat);
  document.getElementById('chatCloseBtn').addEventListener('click', toggleChat);
  document.getElementById('chatSendBtn').addEventListener('click', sendUserMessage);

  // Show unread badge after 4 seconds
  setTimeout(function() {
    if (!chatOpen) document.getElementById('chatUnread').style.display = 'flex';
  }, 4000);

  window.toggleChat = toggleChat;
})();
