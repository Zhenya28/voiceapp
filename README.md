# 🎤 VoiceNotes - Notatnik Głosowy PWA

Progressive Web App do tworzenia notatek głosowych. Dyktuj, zapisuj i przeglądaj swoje notatki - nawet offline!

![VoiceNotes Screenshot](icons/icon-192.png)

## 📋 Spis treści

- [Opis projektu](#-opis-projektu)
- [Funkcjonalności](#-funkcjonalności)
- [Technologie](#-technologie)
- [Wymagania PWA](#-spełnione-wymagania-pwa)
- [Instalacja i uruchomienie](#-instalacja-i-uruchomienie)
- [Struktura projektu](#-struktura-projektu)
- [Natywne API przeglądarki](#-natywne-api-przeglądarki)
- [Strategia cache'owania](#-strategia-cacheowania)
- [Deployment](#-deployment)
- [Autor](#-autor)

## 📝 Opis projektu

VoiceNotes to Progressive Web App (PWA) umożliwiająca tworzenie notatek za pomocą głosu. Aplikacja wykorzystuje Web Speech API do rozpoznawania mowy w języku polskim i konwersji jej na tekst.

### Główne cechy:
- 🎤 Dyktowanie notatek głosem
- 📱 Instalowalna na urządzeniach mobilnych i desktopowych
- 🔌 Pełne działanie offline
- 🔔 Powiadomienia o zapisanych notatkach
- 🔍 Wyszukiwanie notatek
- ✏️ Edycja i usuwanie notatek

## ✨ Funkcjonalności

| Funkcja | Opis |
|---------|------|
| **Rozpoznawanie mowy** | Konwersja mowy na tekst w czasie rzeczywistym |
| **Powiadomienia** | Informacje o zapisanych notatkach |
| **Tryb offline** | Pełna funkcjonalność bez internetu |
| **Wyszukiwarka** | Szybkie znajdowanie notatek |
| **Responsywność** | Adaptacja do każdego rozmiaru ekranu |
| **Instalacja PWA** | Dodanie do ekranu głównego |

## 🛠 Technologie

- **HTML5** - struktura aplikacji
- **CSS3** - stylowanie, animacje, responsywność
- **JavaScript (Vanilla)** - logika aplikacji
- **Web Speech API** - rozpoznawanie mowy
- **Notifications API** - powiadomienia
- **Service Worker** - tryb offline
- **Cache API** - cache'owanie zasobów
- **localStorage** - przechowywanie notatek

## ✅ Spełnione wymagania PWA

| # | Wymaganie | Status | Implementacja |
|---|-----------|--------|---------------|
| 1 | Instalowalność | ✅ | `manifest.json` z ikonami, kolory, start_url |
| 2 | Natywne API (min. 2) | ✅ | Speech Recognition + Notifications |
| 3 | Tryb offline | ✅ | Service Worker + Cache API |
| 4 | Min. 3 widoki | ✅ | Lista → Nagrywanie → Szczegóły |
| 5 | Hosting HTTPS | ✅ | Netlify/Surge |
| 6 | Responsywność | ✅ | Mobile-first, media queries |
| 7 | Wydajność | ✅ | Lighthouse 90+ |
| 8 | Strategia cache | ✅ | Cache First dla statycznych |
| 9 | Jakość kodu | ✅ | Modularny, skomentowany |
| 10 | Dokumentacja | ✅ | README + komentarze |

## 🚀 Instalacja i uruchomienie

### Lokalne uruchomienie

1. **Sklonuj repozytorium:**
```bash
git clone https://github.com/twoj-username/voicenotes-pwa.git
cd voicenotes-pwa
```

2. **Uruchom lokalny serwer:**

Możesz użyć dowolnego serwera HTTP:

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve

# PHP
php -S localhost:8000

# VS Code - użyj rozszerzenia "Live Server"
```

3. **Otwórz w przeglądarce:**
```
http://localhost:8000
```

> ⚠️ **Ważne:** PWA wymaga serwera HTTP. Otwieranie pliku `index.html` bezpośrednio nie będzie działać poprawnie.

### Wymagania przeglądarki

- Chrome 33+ / Edge 79+ / Safari 14.1+ / Firefox 85+
- HTTPS (lub localhost do testów)
- Dostęp do mikrofonu (dla rozpoznawania mowy)

## 📁 Struktura projektu

```
voicenotes/
├── index.html          # Główny plik HTML z 3 widokami
├── manifest.json       # Manifest PWA (metadane aplikacji)
├── sw.js               # Service Worker (offline + cache)
├── css/
│   └── style.css       # Style aplikacji (responsywne)
├── js/
│   └── app.js          # Główna logika JavaScript
├── icons/
│   ├── icon-72.png     # Ikony w różnych rozmiarach
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png
└── README.md           # Dokumentacja
```

## 🔌 Natywne API przeglądarki

### 1. Web Speech API (Rozpoznawanie mowy)

```javascript
const recognition = new webkitSpeechRecognition();
recognition.lang = 'pl-PL';
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
    // Przetwarzanie wyników
};

recognition.start();
```

**Wykorzystanie w aplikacji:**
- Konwersja mowy na tekst w czasie rzeczywistym
- Obsługa języka polskiego
- Wyświetlanie tymczasowych wyników podczas mówienia

### 2. Notifications API (Powiadomienia)

```javascript
// Żądanie uprawnień
const permission = await Notification.requestPermission();

// Wyświetlenie powiadomienia
new Notification('VoiceNotes', {
    body: 'Notatka zapisana!',
    icon: './icons/icon-192.png'
});
```

**Wykorzystanie w aplikacji:**
- Informowanie o zapisaniu notatki
- Opcjonalny modal z pytaniem o uprawnienia

## 💾 Strategia cache'owania

### Cache First (dla zasobów statycznych)

```javascript
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    
    return response;
}
```

**Zastosowanie:**
- Pliki HTML, CSS, JavaScript
- Ikony i obrazy
- Manifest

### Inne dostępne strategie (przygotowane):
- **Network First** - dla danych API
- **Stale While Revalidate** - dla często aktualizowanych zasobów

## 🌐 Deployment

### Netlify (Rekomendowane)

1. Utwórz konto na [netlify.com](https://netlify.com)
2. Przeciągnij folder `voicenotes` na stronę Netlify
3. Gotowe! Otrzymasz URL z HTTPS

### Surge.sh

```bash
# Instalacja
npm install -g surge

# Deploy
cd voicenotes
surge
```

### GitHub Pages

1. Push do repozytorium GitHub
2. Settings → Pages → Source: main branch
3. Poczekaj na deployment

## 📊 Testowanie Lighthouse

1. Otwórz aplikację w Chrome
2. DevTools (F12) → Lighthouse
3. Zaznacz: Performance, Accessibility, Best Practices, SEO, PWA
4. Kliknij "Analyze page load"

**Oczekiwane wyniki:** 90+ w każdej kategorii

## 🧪 Testowanie offline

1. Otwórz aplikację
2. DevTools → Application → Service Workers
3. Zaznacz "Offline"
4. Odśwież stronę - aplikacja powinna działać!

## 📱 Instalacja jako aplikacja

### Desktop (Chrome/Edge):
1. Otwórz aplikację
2. Kliknij ikonę instalacji w pasku adresu (➕)
3. Potwierdź instalację

### Mobile (Android):
1. Otwórz aplikację w Chrome
2. Menu (⋮) → "Dodaj do ekranu głównego"
3. Potwierdź

### iOS (Safari):
1. Otwórz aplikację
2. Przycisk "Udostępnij"
3. "Dodaj do ekranu początkowego"

