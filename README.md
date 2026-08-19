# experiment — Live Video Call Website

Magandang, modern, at **pure client-side** video calling website.  
Walang backend, walang account, walang server na kailangan mo mag-maintain.

Gumagamit ng:
- **WebRTC** (peer-to-peer video + audio)
- **PeerJS** (signaling)
- Public STUN + free TURN servers (para mas reliable sa mahirap na network)

## Features

- Gumawa ng call → kumuha ng unique Peer ID → ibahagi sa kaibigan
- Sumali gamit ang Peer ID
- High quality video (hanggang 720p/1080p ideal)
- Echo cancellation + noise suppression
- Mute mic / toggle camera
- Magandang dark glassmorphism design
- Mobile responsive
- Fully static → perfect para sa **GitHub Pages**

## Paano i-host sa GitHub Pages (Libre)

1. Gumawa ng bagong repository sa GitHub (public)
2. I-upload ang 3 files:
   - `index.html`
   - `style.css`
   - `script.js`
3. Pumunta sa **Settings → Pages**
4. Source: **Deploy from a branch**
5. Branch: `main` (or `master`), folder: `/ (root)`
6. Save
7. Hintayin ng 1-2 minuto → makikita mo ang link:
   `https://yourusername.github.io/your-repo-name/`

## Paano gamitin

### Person A (Gagawa ng call)
1. Buksan ang website
2. Ilagay ang pangalan
3. Click **Gumawa ng Call**
4. Kopyahin ang Peer ID
5. Ipadala sa kaibigan (Messenger, SMS, etc.)

### Person B (Sasali)
1. Buksan ang same website
2. Ilagay ang pangalan
3. Click **Sumali sa Call**
4. I-paste ang Peer ID
5. Click **Sumali Ngayon**

Tapos na! Live video call na.

## Important Notes

- **Parehong browser** (Chrome / Edge / Firefox / Safari) ang recommended
- Kailangan ng camera + microphone permission
- Gumagana sa mobile (Android Chrome / iOS Safari)
- Kung may firewall / corporate network → minsan kailangan ng TURN (may free TURN na naka-include na)
- Max recommended: 1-on-1 (PeerJS free cloud ay para sa simple use)

## Local testing

Pwede mo i-open ang `index.html` diretso, pero **mas reliable** kung i-serve via local server:

```bash
# Python
python -m http.server 8000

# o Node
npx serve .
```

Tapos buksan `http://localhost:8000`

> Note: `getUserMedia` (camera) ay nangangailangan ng HTTPS o localhost.

## Customization

Gusto mong baguhin ang design? Edit lang ang `style.css`.  
Gusto ng mas mataas na video quality? Baguhin ang `MEDIA_CONSTRAINTS` sa `script.js`.

---

Libre at open source
