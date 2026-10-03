// Bulletproof copy to clipboard with fallback for HTTP, local tunnels, and insecure contexts
export function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => {
      return fallbackCopy(text);
    });
  }
  return fallbackCopy(text);
}

function fallbackCopy(text) {
  return new Promise((resolve, reject) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        resolve();
      } else {
        reject(new Error('execCommand failed'));
      }
    } catch (err) {
      reject(err);
    }
  });
}
