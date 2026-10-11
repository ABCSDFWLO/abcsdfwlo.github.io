document.getElementById('theme-toggle').onclick = () => {
  const dark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
};
const copyBtn = document.getElementById('copy-markdown');
const markdownSource = document.getElementById('post-markdown-source');
if (copyBtn) copyBtn.onclick = async () => {
  try {
    const markdown = markdownSource.value
      .replace(/\{\{<\s*details\s+summary="([^"]*)"\s*>\}\}/g, '<details>\n<summary>$1</summary>')
      .replace(/\{\{<\s*\/details\s*>\}\}/g, '</details>');
    await navigator.clipboard.writeText(markdown);
    const label = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = label), 1500);
  } catch (error) {
    copyBtn.textContent = 'Copy failed';
    copyBtn.title = error instanceof Error ? error.message : String(error);
  }
};

document.querySelectorAll('.post-content pre').forEach((pre) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'code-block';
  pre.parentNode.insertBefore(wrapper, pre);
  wrapper.append(pre);

  const button = document.createElement('button');
  button.className = 'copy-code-button';
  button.type = 'button';
  button.textContent = 'Copy code';
  button.addEventListener('click', async () => {
    const code = pre.querySelector('code');
    try {
      await navigator.clipboard.writeText(code ? code.innerText : pre.innerText);
      button.textContent = 'Copied!';
      button.title = '';
    } catch (error) {
      button.textContent = 'Copy failed';
      button.title = error instanceof Error ? error.message : String(error);
    }
    setTimeout(() => {
      button.textContent = 'Copy code';
    }, 1500);
  });
  wrapper.append(button);
});

const layout = document.querySelector('.layout');
const sidebar = layout?.querySelector('aside');
const resizer = layout?.querySelector('.sidebar-resizer');
if (layout && sidebar && resizer) {
  const minWidth = 160;
  const maxAllowedWidth = () => Math.max(minWidth, Math.min(480, layout.clientWidth - 240));
  const setWidth = (width) => {
    const clampedWidth = Math.max(minWidth, Math.min(maxAllowedWidth(), width));
    layout.style.setProperty('--sidebar-width', `${clampedWidth}px`);
    resizer.setAttribute('aria-valuemax', String(maxAllowedWidth()));
    resizer.setAttribute('aria-valuenow', String(clampedWidth));
    return clampedWidth;
  };
  const savedWidth = Number(localStorage.getItem('sidebar-width'));
  setWidth(Number.isFinite(savedWidth) && savedWidth > 0 ? savedWidth : sidebar.getBoundingClientRect().width);

  let pointerStartX = 0;
  let widthStart = 0;
  resizer.addEventListener('pointerdown', (event) => {
    pointerStartX = event.clientX;
    widthStart = sidebar.getBoundingClientRect().width;
    layout.classList.add('is-resizing');
    resizer.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  resizer.addEventListener('pointermove', (event) => {
    if (!resizer.hasPointerCapture(event.pointerId)) return;
    setWidth(widthStart + event.clientX - pointerStartX);
  });
  const endResize = (event) => {
    if (!resizer.hasPointerCapture(event.pointerId)) return;
    resizer.releasePointerCapture(event.pointerId);
    layout.classList.remove('is-resizing');
    localStorage.setItem('sidebar-width', resizer.getAttribute('aria-valuenow'));
  };
  resizer.addEventListener('pointerup', endResize);
  resizer.addEventListener('pointercancel', endResize);
  resizer.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 48 : 16;
    const currentWidth = sidebar.getBoundingClientRect().width;
    let nextWidth;
    if (event.key === 'ArrowLeft') nextWidth = currentWidth - step;
    else if (event.key === 'ArrowRight') nextWidth = currentWidth + step;
    else if (event.key === 'Home') nextWidth = minWidth;
    else if (event.key === 'End') nextWidth = maxAllowedWidth();
    else return;
    event.preventDefault();
    setWidth(nextWidth);
    localStorage.setItem('sidebar-width', resizer.getAttribute('aria-valuenow'));
  });
  window.addEventListener('resize', () => setWidth(sidebar.getBoundingClientRect().width));
}