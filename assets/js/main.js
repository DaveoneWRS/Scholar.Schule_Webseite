/* scholar.schule – Main JavaScript */

document.addEventListener('DOMContentLoaded', () => {

  // --- Dynamic year in footer ---
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Scroll-spy: active nav link ---
  const header   = document.querySelector('header');
  const navLinks = [...document.querySelectorAll('nav a[data-spy]')];
  const targets  = navLinks
    .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter(t => t.section);

  if (targets.length) {
    const updateSpy = () => {
      const offset  = (header ? header.offsetHeight : 0) + 24;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const visible = targets.filter(t => t.section.offsetHeight > 0);

      let current = null;
      visible.forEach(t => {
        if (t.section.getBoundingClientRect().top <= offset) current = t;
      });
      if (atBottom && visible.length) current = visible[visible.length - 1];

      navLinks.forEach(link => link.classList.toggle('nav-active', !!current && link === current.link));
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { updateSpy(); ticking = false; });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateSpy();
  }

  // --- Pflichtangabe "Interesse an": Custom-Validity zurücksetzen ---
  const produktBoxes = [...document.querySelectorAll('input[name="produkt"]')];
  produktBoxes.forEach(cb => cb.addEventListener('change', () => {
    produktBoxes.forEach(other => other.setCustomValidity(''));
  }));

});

// --- Clipboard copy helper ---
function copyToClipboard(text, btnEl) {
  // Label einmalig sichern, damit schnelle Mehrfachklicks es nicht überschreiben
  if (!btnEl.dataset.origLabel) btnEl.dataset.origLabel = btnEl.textContent.trim();

  const flash = (label) => {
    clearTimeout(Number(btnEl.dataset.resetTimer));
    btnEl.textContent = label;
    btnEl.disabled = true;
    btnEl.dataset.resetTimer = String(setTimeout(() => {
      btnEl.textContent = btnEl.dataset.origLabel;
      btnEl.disabled = false;
    }, 2000));
  };

  // Fallback für alte Browser und unsichere Kontexte (http://)
  const legacyCopy = () => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  // navigator.clipboard existiert nur in sicheren Kontexten – sonst wirft der
  // Zugriff sofort und der Button bliebe ohne Reaktion.
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => flash('Kopiert ✓'))
      .catch(() => flash(legacyCopy() ? 'Kopiert ✓' : 'Fehler'));
  } else {
    flash(legacyCopy() ? 'Kopiert ✓' : 'Fehler');
  }
}

// --- Formspree AJAX submission ---
async function submitForm(formEl, successId, errorId) {
  const successEl = document.getElementById(successId);
  const errorEl   = document.getElementById(errorId);

  if (successEl) successEl.classList.add('hidden');
  if (errorEl)   errorEl.classList.add('hidden');

  // Checkbox-Gruppe "Interesse an" ist Pflicht, lässt sich aber nicht über
  // required abbilden (das würde jede einzelne Box erzwingen).
  const produktBoxes = [...formEl.querySelectorAll('input[name="produkt"]')];
  if (produktBoxes.length && !produktBoxes.some(cb => cb.checked)) {
    produktBoxes[0].setCustomValidity('Bitte wählen Sie mindestens ein Produkt aus.');
    produktBoxes[0].reportValidity();
    return;
  }

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
      if (successEl) {
        successEl.classList.remove('hidden');
        successEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
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
