// iPadOS can identify itself as a Mac when requesting desktop websites.
export function usesAppleImageSharing() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export async function saveImage(blob, filename, { signal } = {}) {
  if (signal?.aborted) return 'cancelled';
  if (usesAppleImageSharing()) {
    const file = new File([blob], filename, { type: 'image/png' });
    const data = { files: [file] };
    // Never fall back to a blob download on iPad: it opens an external preview.
    if (!navigator.share || !navigator.canShare?.(data)) {
      throw new DOMException('Para guardar la imagen en este iPad, abrí el juego en una versión actualizada de Safari.', 'NotSupportedError');
    }
    if (navigator.userActivation?.isActive === false) return shareOnTap(data, signal);
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError' || signal?.aborted) return 'cancelled';
      // Rasterizing a large image can outlast Safari's transient activation.
      if (error.name === 'NotAllowedError') return shareOnTap(data, signal);
      throw error;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return 'downloaded';
}

// Ask for a fresh tap only when preparing the PNG used up the initial gesture.
// The file stays in memory until this prompt is closed; no gallery is created.
function shareOnTap(data, signal) {
  if (signal?.aborted) return Promise.resolve('cancelled');
  return new Promise((resolve, reject) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'image-save-dialog';
    dialog.setAttribute('aria-labelledby', 'image-save-title');
    dialog.setAttribute('aria-describedby', 'image-save-description');
    dialog.innerHTML = `<h2 id="image-save-title">¡Tu imagen está lista!</h2>
      <p id="image-save-description">Tocá Guardar y elegí Guardar imagen o Guardar en Archivos en el menú del iPad.</p>
      <div class="image-save-actions"><button class="secondary-button" data-save-cancel>Seguir jugando</button><button class="primary-button" data-save-confirm>Guardar</button></div>`;
    const finish = (result, error) => {
      signal?.removeEventListener('abort', cancel);
      dialog.remove();
      if (error) reject(error); else resolve(result);
    };
    const cancel = () => finish('cancelled');
    dialog.addEventListener('cancel', event => { event.preventDefault(); cancel(); });
    dialog.querySelector('[data-save-cancel]').addEventListener('click', cancel);
    dialog.querySelector('[data-save-confirm]').addEventListener('click', async event => {
      event.currentTarget.disabled = true;
      try {
        // Keep this call directly inside the tap, before any asynchronous work.
        await navigator.share(data);
        finish('shared');
      } catch (error) {
        if (error.name === 'AbortError') finish('cancelled');
        else finish(null, error);
      }
    });
    signal?.addEventListener('abort', cancel, { once: true });
    document.body.append(dialog); dialog.showModal();
  });
}

export function imageSaveMessage(result) {
  if (result === 'shared') return 'Podés seguir jugando. Si elegiste guardar, la imagen está en Fotos o Archivos.';
  if (result === 'downloaded') return '¡Imagen lista! Buscala en las descargas.';
  return 'Podés seguir jugando.';
}
