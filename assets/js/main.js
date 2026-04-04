/* scholar.schule – Main JavaScript */

document.addEventListener('DOMContentLoaded', () => {

  // --- Dynamic year in footer ---
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Scroll-spy: active nav link ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[data-spy]');

  if (sections.length && navLinks.length) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            const active = link.getAttribute('href') === '#' + entry.target.id;
            link.classList.toggle('text-blue-600', active);
            link.classList.toggle('font-semibold', active);
          });
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(s => spyObserver.observe(s));
  }

});

// --- Clipboard copy helper ---
function copyToClipboard(text, btnEl) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btnEl.textContent;
    btnEl.textContent = 'Kopiert ✓';
    btnEl.disabled = true;
    setTimeout(() => {
      btnEl.textContent = orig;
      btnEl.disabled = false;
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    const orig = btnEl.textContent;
    btnEl.textContent = 'Kopiert ✓';
    setTimeout(() => btnEl.textContent = orig, 2000);
  });
}

// --- Formspree AJAX submission ---
async function submitForm(formEl, successId, errorId) {
  const successEl = document.getElementById(successId);
  const errorEl   = document.getElementById(errorId);

  if (successEl) successEl.classList.add('hidden');
  if (errorEl)   errorEl.classList.add('hidden');

  const submitBtn = formEl.querySelector('[type="submit"]');
  const origText  = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet…';
  }

  try {
    const res = await fetch(formEl.action, {
      method: 'POST',
      body: new FormData(formEl),
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      if (successEl) successEl.classList.remove('hidden');
      formEl.reset();
    } else {
      if (errorEl) errorEl.classList.remove('hidden');
    }
  } catch {
    if (errorEl) errorEl.classList.remove('hidden');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
    }
  }
}
