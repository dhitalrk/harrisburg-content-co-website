/* ── EmailJS init ── */
(function(){
  var allowed = ['dhitalrk.github.io', 'localhost', '127.0.0.1'];
  if (allowed.indexOf(window.location.hostname) === -1) return;
  try { emailjs.init({ publicKey: 'gQb7RgQ2y8nBbxt3y' }); } catch(e) { console.warn('EmailJS init failed:', e); }
})();

(function(){
  'use strict';

  if(location.protocol!=='https:'&&location.hostname!=='localhost'&&!location.hostname.startsWith('127.')){
    location.replace('https:'+window.location.href.substring(window.location.protocol.length));
  }
  if(top!==self){try{top.location=self.location;}catch(e){document.body.innerHTML='';}}

  /* ── Check expiring link from subscription email ── */
  var params  = new URLSearchParams(window.location.search);
  var expires = parseInt(params.get('expires'), 10);
  var urlPlan = params.get('plan');
  var linkedFromEmail = !!expires;

  if (linkedFromEmail) {
    if (Date.now() > expires) {
      document.querySelector('.hero h1').textContent = '⏰ Refund Window Closed';
      document.querySelector('.hero p').textContent = 'Your 7-day money-back guarantee window has expired.';
      var formWrap = document.querySelector('.form-card') || document.getElementById('refundForm');
      if (formWrap) {
        formWrap.innerHTML =
          '<div style="text-align:center;padding:40px 20px;">' +
          '<div style="font-size:52px;margin-bottom:16px;">⏰</div>' +
          '<h2 style="font-size:22px;font-weight:900;color:#1a1a2e;margin-bottom:12px;">7-Day Refund Window Expired</h2>' +
          '<p style="color:#7a7a8c;font-size:15px;line-height:1.7;max-width:480px;margin:0 auto 20px;">' +
          'Your 7-day money-back guarantee window has passed. Per our refund policy, refunds are not available after this period ' +
          '<strong>unless we failed to deliver your content within the promised timeframe.</strong></p>' +
          '<p style="color:#7a7a8c;font-size:15px;line-height:1.7;max-width:480px;margin:0 auto 24px;">' +
          'If you believe your content was never delivered on time, please contact us directly and we\'ll review your case.</p>' +
          '<a href="mailto:dhital.robin33@gmail.com?subject=Refund%20Dispute%20-%20Late%20Delivery" ' +
          'style="display:inline-block;background:#e05c2f;color:#fff;padding:13px 28px;border-radius:30px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:12px;">' +
          '📧 Contact Robin About a Dispute</a><br/>' +
          '<a href="tel:7174613210" style="color:#e05c2f;font-weight:700;font-size:14px;">(717) 461-3210</a>' +
          '</div>';
      }
      return;
    } else {
      var daysLeft = Math.ceil((expires - Date.now()) / (1000 * 60 * 60 * 24));
      var banner = document.createElement('div');
      banner.style.cssText = 'background:#e8f7f0;border:2px solid #4caf8a;border-radius:10px;padding:14px 20px;margin-bottom:20px;text-align:center;font-size:14px;font-weight:600;color:#1a5a3a;';
      banner.innerHTML = '✅ Your 7-day refund window is active — <strong>' + daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' remaining</strong>';
      var formEl = document.getElementById('refundForm');
      if (formEl) formEl.insertAdjacentElement('beforebegin', banner);

      if (urlPlan) {
        var planSelect = document.getElementById('rf-plan');
        if (planSelect) {
          for (var i = 0; i < planSelect.options.length; i++) {
            if (planSelect.options[i].value.toLowerCase().indexOf(urlPlan.toLowerCase()) !== -1) {
              planSelect.selectedIndex = i; break;
            }
          }
        }
      }
    }
  }

  var form      = document.getElementById('refundForm');
  var resultBox = document.getElementById('resultBox');
  var submitBtn = document.getElementById('submitBtn');
  var lastSubmit = 0;

  var emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function showResult(type, msg){
    resultBox.className = 'result-box ' + type;
    resultBox.innerHTML = msg;
    resultBox.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();

    if(form.querySelector('[name="website_url"]').value) return;

    if(Date.now()-lastSubmit < 60000){
      showResult('error','Please wait before submitting again.'); return;
    }

    var name    = document.getElementById('rf-name').value.trim();
    var biz     = document.getElementById('rf-biz').value.trim();
    var email   = document.getElementById('rf-email').value.trim();
    var phone   = document.getElementById('rf-phone').value.trim();
    var plan    = document.getElementById('rf-plan').value;
    var amount  = document.getElementById('rf-amount').value;
    var date    = document.getElementById('rf-date').value;
    var reason  = document.getElementById('rf-reason').value;
    var details = document.getElementById('rf-details').value.trim();

    if(!name)               {showResult('error','Please enter your name.');return;}
    if(!biz)                {showResult('error','Please enter your business name.');return;}
    if(!emailRe.test(email)){showResult('error','Please enter a valid email address.');return;}
    if(!plan)               {showResult('error','Please select your plan.');return;}
    if(!amount)             {showResult('error','Please select the refund amount type.');return;}
    if(!date)               {showResult('error','Please enter your approximate payment date.');return;}
    if(!reason)             {showResult('error','Please select a reason for the refund.');return;}

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Submitting...';
    lastSubmit = Date.now();

    /* ── Build one-line import code for Command Center ── */
    var importData = {
      name: name, biz: biz, email: email, phone: phone,
      plan: plan, refundType: amount, reason: reason,
      date: new Date().toISOString().split('T')[0],
      paydate: date, details: details || ''
    };
    var importCode = btoa(unescape(encodeURIComponent(JSON.stringify(importData))));

    /* ── Send via EmailJS using the existing Robin notify template ── */
    var refundParams = {
      client_name:  name,
      client_biz:   '🔴 REFUND REQUEST — ' + biz,
      client_email: email,
      client_phone: phone || 'Not provided',
      biz_type:     reason,
      plan_name:    plan,
      plan_price:   amount,
      payment_link: 'N/A — Refund Request',
      client_msg:   'REFUND DETAILS\n' +
                    '--------------\n' +
                    'Client:       ' + name + '\n' +
                    'Business:     ' + biz + '\n' +
                    'Email:        ' + email + '\n' +
                    'Phone:        ' + (phone || 'Not provided') + '\n' +
                    'Plan:         ' + plan + '\n' +
                    'Refund Type:  ' + amount + '\n' +
                    'Reason:       ' + reason + '\n' +
                    'Payment Date: ' + date + '\n' +
                    'Details:      ' + (details || 'None provided') + '\n\n' +
                    '--------------------------------------------\n' +
                    '📋 TO ADD TO COMMAND CENTER:\n' +
                    'Open HCC Command Center → Refund Requests\n' +
                    '→ Click "Import from Email"\n' +
                    '→ Paste this code:\n\n' +
                    importCode,
      submitted_at: new Date().toLocaleString()
    };

    var emailjsAvailable = (typeof emailjs !== 'undefined');

    if (emailjsAvailable) {
      try {
        emailjs.send('service_17rgqbt', 'template_l45g5gh', refundParams)
          .then(function() {
            showResult('success',
              '<strong>✅ Refund request submitted successfully!</strong><br/><br/>' +
              'Robin has been notified and will process your refund within <strong>24 hours</strong>. ' +
              'You\'ll receive a Stripe confirmation email once it\'s issued.<br/><br/>' +
              'Questions? Call or text <a href="tel:7174613210" style="color:#0a7c4b;font-weight:700;">(717) 461-3210</a>'
            );
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Refund Request →';
            form.reset();
          })
          .catch(function(err) {
            var msg = (err && (err.text || err.message || JSON.stringify(err))) || 'Unknown error';
            showResult('error',
              '⚠️ Could not submit automatically. Error: <strong>' + escHtml(msg) + '</strong><br/><br/>' +
              'Please email Robin directly at <a href="mailto:dhital.robin33@gmail.com" style="color:#c04a22;font-weight:700;">dhital.robin33@gmail.com</a> ' +
              'or call <a href="tel:7174613210" style="color:#c04a22;font-weight:700;">(717) 461-3210</a>'
            );
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Refund Request →';
          });
      } catch(ex) {
        showResult('error', '⚠️ Submission error: ' + escHtml(ex.message || String(ex)));
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Refund Request →';
      }
    } else {
      /* EmailJS not available — fallback message */
      showResult('error',
        '⚠️ Could not connect to our submission system.<br/><br/>' +
        'Please email your refund request to <a href="mailto:dhital.robin33@gmail.com" style="color:#c04a22;font-weight:700;">dhital.robin33@gmail.com</a> ' +
        'or call <a href="tel:7174613210" style="color:#c04a22;font-weight:700;">(717) 461-3210</a>'
      );
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Refund Request →';
    }
  });
})();
