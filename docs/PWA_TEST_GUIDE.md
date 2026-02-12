# PWA Test Qilish Yo'riqnomasi

## Development Muhitida Test Qilish

### 1. Service Worker Tekshirish

Server ishlayotganida (`http://localhost:3000`):

1. **Chrome DevTools** ni oching: `F12` yoki `Ctrl+Shift+I`
2. **Application** tabiga o'ting
3. **Service Workers** bo'limini tanlang
4. Quyidagilarni tekshiring:
   - ✅ Service Worker ro'yxatdan o'tgan
   - ✅ Status: **activated**
   - ✅ Source: `/sw.js`

### 2. Manifest Tekshirish

DevTools > Application > Manifest:
- ✅ Name: "Mendeleyev - Ta'lim Platformasi"
- ✅ Short name: "Mendeleyev"
- ✅ Start URL: `/`
- ✅ Display: `standalone`
- ✅ Theme color: `#3b82f6`
- ✅ Icons: 192x192 va 512x512

### 3. Favicon Tekshirish

Browser tabida favicon ko'rinishi kerak:
- Favicon yangilanmasa: `Ctrl+Shift+R` (hard refresh)
- Yoki DevTools > Application > Storage > Clear site data

### 4. Cache Storage

DevTools > Application > Cache Storage:
- `mendeleyev-static-v1` - statik fayllar
- `mendeleyev-dynamic-v1` - dinamik fayllar

### 5. Lighthouse Audit

DevTools > Lighthouse:
1. **Progressive Web App** ni belgilang
2. **Desktop** yoki **Mobile** tanlang
3. **Analyze page load** bosing
4. 90+ ball olish kerak

## PWA Install Test

### Desktop (Chrome)

1. Address bar'da **Install** tugmasi paydo bo'ladi
2. Yoki o'ng pastda **"Ilovani o'rnatish"** tugmasi
3. Bosganda Chrome App sifatida o'rnatiladi

### Mobile (Android)

1. Chrome'da **"Add to Home Screen"** banner paydo bo'ladi
2. Yoki Chrome Menu > Add to Home screen
3. Home screen'da icon paydo bo'ladi
4. Ochganda standalone mode'da ishlaydi (browser UI siz)

### iOS (Safari)

1. Safari'da Share tugmasini bosing
2. **"Add to Home Screen"** tanlang
3. Icon Home screen'da paydo bo'ladi

## Offline Mode Test

1. DevTools > Network tabini oching
2. **Offline** checkboxni belgilang
3. Sahifani yangilang: `F5`
4. Keshlanganlar ko'rinishi kerak

## Console Tekshirish

Browser Console'da (`F12` > Console):
```
SW registered: ServiceWorkerRegistration
```

## Production Build Test

Production build qilish:
```bash
npm run build
npm run start
```

Server: `http://localhost:3000`

## Muammolarni Hal Qilish

### Service Worker ishlamayapti
```javascript
// Console'da tekshiring:
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registered SWs:', regs);
});
```

### Favicon yangilanmayapti
1. `Ctrl+Shift+R` (hard refresh)
2. Browser cache'ni tozalash
3. DevTools > Application > Clear storage

### PWA o'rnatilmayapti
Tekshirish:
- ✅ Manifest mavjud
- ✅ Service Worker registered
- ✅ HTTPS (production'da)
- ✅ 512x512 icon mavjud
- ✅ Start URL to'g'ri

## PWA Deployment

Production'da deploy qilganda:
- ✅ HTTPS majburiy
- ✅ Valid SSL certificate
- ✅ Service Worker ishlashi kerak

## Foydali Linklar

- [PWA Builder](https://www.pwabuilder.com/) - PWA test qilish
- Chrome DevTools - Application tab
- Lighthouse - PWA audit
