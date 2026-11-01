/* Belief Project — sending an order.

   BeliefOrders.submit(order) posts an order to the order service named in content.js
   (orders.endpoint). It resolves only when the service confirms that the notification email
   has left, and it throws when anything else happens, so a checkout page can show
   "order confirmed" on success and nothing but success.

     try {
       const { orderNumber } = await BeliefOrders.submit({
         customer: { name, email, phone, city },   // extra fields are passed through
         items: [{ product: 'T-shirt', color: 'ice-blue', size: 'M', quantity: 1, customization: { … } }],
         notes: '',
       });
       // confirmed: show orderNumber
     } catch (err) {
       // err.code says why; err.orderNumber is set when the order was saved but not emailed.
       // Calling submit again with the same order object retries without creating a second order.
     }
*/
window.BeliefOrders = (() => {
  'use strict';

  const C = window.BELIEF || {};

  class OrderError extends Error {
    constructor(code, message, orderNumber) {
      super(message);
      this.name = 'OrderError';
      this.code = code;
      this.orderNumber = orderNumber || '';
    }
  }

  // The product photograph that goes into the email, as a small JPEG.
  // A photo that cannot be prepared is left out; it never stops the order.
  function photo(src, width = 480) {
    return new Promise(resolve => {
      if (!src) return resolve('');
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, width / img.naturalWidth);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.naturalWidth * scale);
          canvas.height = Math.round(img.naturalHeight * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', .82));
        } catch (err) {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = src;
    });
  }

  const newRef = () => (window.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12));

  async function submit(order, { timeout = 45000 } = {}) {
    const endpoint = C.orders?.endpoint;
    if (!endpoint) throw new OrderError('not_configured', 'The order service has not been connected yet.');

    // one reference per order: a retry of the same order is recognised, not counted twice
    order.clientRef = order.clientRef || newRef();
    const tones = C.shop?.colors || [];
    const items = await Promise.all((order.items || []).map(async item => {
      const tone = tones.find(t => t.id === item.color || t.label === item.color);
      const { image, ...rest } = item;
      return { ...rest, photo: item.photo || await photo(image || tone?.image) };
    }));

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeout);
    let answer;
    try {
      // sent as plain text so the browser needs no permission round-trip with Google
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...order, items }),
        redirect: 'follow',
        signal: abort.signal,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      answer = await res.json();
    } catch (err) {
      // no answer: the order may or may not have arrived, so nothing is confirmed
      throw new OrderError('no_answer', 'The order could not be confirmed. Please check your connection and try again.');
    } finally {
      clearTimeout(timer);
    }

    if (answer && answer.ok === true && answer.emailSent === true && answer.orderNumber) return { orderNumber: answer.orderNumber };
    throw new OrderError(answer?.error || 'refused', answer?.message || 'The order could not be confirmed.', answer?.orderNumber);
  }

  return { submit, photo, OrderError };
})();
