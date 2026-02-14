<div align="center">

# LinkedIn Job Map

### See your job search. Literally.

A Chrome Extension that brings LinkedIn job listings to life on an interactive, dark-themed map -- so you can finally understand *where* the jobs are, not just what they are.

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/placeholder?style=for-the-badge&logo=googlechrome&logoColor=white&label=Chrome%20Web%20Store&color=0a66c2)](https://chrome.google.com/webstore/detail/placeholder)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-a855f7?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Compatible-0a66c2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/jobs/)

<br/>

<img src="docs/screenshots/hero.png" alt="LinkedIn Job Map - Hero Screenshot" width="820" />

<br/>

*Marker clustering, color-coded workplace types, commute estimation, and a beautiful glassmorphism UI -- all inside your LinkedIn tab.*

</div>

---

## Features

- **Interactive Map Overlay** -- Full Leaflet.js map with dark Mapbox tiles, rendered directly inside your LinkedIn jobs page
- **Marker Clustering** -- Hundreds of jobs grouped intelligently; zoom in to reveal individual pins
- **Workplace Type Filtering** -- Toggle On-site (blue), Hybrid (green), and Remote (purple) with live counts on each chip
- **Text Search** -- Debounced real-time search across job titles, companies, and locations
- **Smart Sorting** -- Sort by distance from your location, company name, workplace type, or posting date
- **Company Logos** -- Pulled directly from LinkedIn's API with graceful initial-letter fallbacks
- **Job Posting Dates** -- Relative timestamps ("2d ago", "1w ago") displayed on cards and map popups
- **CSV Export** -- Download all mapped jobs as a UTF-8 CSV file with one click
- **Keyboard Shortcuts** -- Navigate the job list without touching your mouse
- **Commute Estimation** -- Distance-based travel time zones (urban, suburban, highway) for realistic estimates
- **Bidirectional Sync** -- Click a job card and the map flies to it; click a map pin and the card highlights
- **Fullscreen Mode** -- Expand the map to fill the entire viewport with a slide-out job panel
- **GPS & Click Location** -- Set your location via GPS or by clicking anywhere on the map
- **OSRM Routing** -- Real driving/cycling route overlay between your location and any job
- **Bilingual UI** -- Full English and Turkish interface, auto-detected from browser language
- **Dark Glassmorphism Theme** -- A polished, modern design that feels native to LinkedIn's dark mode
- **Cache Management** -- Geocoding results cached locally; clear per-job or all caches from the header
- **Custom Mapbox Token** -- Use the built-in token or configure your own for higher rate limits

---

## Screenshots

<div align="center">
<table>
<tr>
<td align="center" width="50%">
<img src="docs/screenshots/map-overview.png" alt="Map Overview" width="400" /><br/>
<strong>Map Overview</strong><br/>
<sub>All jobs plotted with marker clustering</sub>
</td>
<td align="center" width="50%">
<img src="docs/screenshots/fullscreen-panel.png" alt="Fullscreen with Job Panel" width="400" /><br/>
<strong>Fullscreen Mode</strong><br/>
<sub>Card-based job panel with filter bar</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="docs/screenshots/filtering.png" alt="Workplace Type Filtering" width="400" /><br/>
<strong>Filtering & Search</strong><br/>
<sub>Color-coded workplace type chips with counts</sub>
</td>
<td align="center">
<img src="docs/screenshots/route.png" alt="Route & Commute" width="400" /><br/>
<strong>Route & Commute</strong><br/>
<sub>OSRM routing with estimated travel time</sub>
</td>
</tr>
</table>
</div>

> **Note:** Replace the placeholder image paths above with actual screenshots. Recommended size: 1280x800 or similar 16:10 ratio.

---

## Installation

### From Chrome Web Store (Recommended)

1. Visit the [LinkedIn Job Map](https://chrome.google.com/webstore/detail/placeholder) listing on the Chrome Web Store
2. Click **Add to Chrome**
3. Navigate to any [LinkedIn Jobs search page](https://www.linkedin.com/jobs/) and click the **Open Job Map** button that appears

### Manual Installation (Developer Mode)

1. **Download** this repository:
   ```bash
   git clone https://github.com/ofurkanuygur/linkedin-job-map.git
   ```
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the cloned `linkedin-job-map` folder
5. Navigate to any [LinkedIn Jobs search page](https://www.linkedin.com/jobs/) -- the extension activates automatically

---

## Usage

1. **Search for jobs** on LinkedIn as you normally would (`linkedin.com/jobs/...`)
2. A floating **"Open Job Map"** button appears at the bottom of the page
3. Click it to open the map panel -- jobs are automatically fetched, geocoded, and plotted
4. **Set your location** by clicking the GPS button or clicking directly on the map
5. **Filter** by workplace type using the colored chips (On-site / Hybrid / Remote)
6. **Search** by typing in the search bar to filter by title, company, or location
7. **Sort** using the dropdown (Distance, Company, Type, Date)
8. **Click any job card** to fly to its location on the map, or click a **map marker** to highlight the card
9. **View Job** opens the full LinkedIn posting; **Maps** opens the location in Google Maps
10. Press the **fullscreen** button for a distraction-free, immersive map experience
11. **Export** your results as CSV for external analysis

---

## Configuration

### Mapbox Access Token

The extension ships with a default Mapbox token that works out of the box. For heavy usage or higher rate limits, you can provide your own:

1. Create a free account at [mapbox.com](https://www.mapbox.com/)
2. Copy your **default public token** from the [tokens page](https://account.mapbox.com/access-tokens/)
3. Right-click the LinkedIn Job Map extension icon in Chrome and select **Options**
4. Paste your token and click **Save**
5. Use the **Test Token** button to verify it works
6. Reload your LinkedIn tab to apply the new token

> The free Mapbox tier includes 100,000 geocoding requests/month, which is more than sufficient for typical job searches.

---

## Tech Stack

| Component | Technology |
|---|---|
| Extension Platform | Chrome Extension Manifest V3 |
| Map Engine | [Leaflet.js](https://leafletjs.com/) |
| Marker Clustering | [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) |
| Map Tiles | [Mapbox](https://www.mapbox.com/) (Dark theme) |
| Geocoding | [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/) |
| Routing | [OSRM](https://project-osrm.org/) (Open Source Routing Machine) |
| Job Data | LinkedIn Voyager API (internal, via content script) |
| UI Design | Custom CSS with glassmorphism effects |
| Internationalization | Custom `t()` helper with template substitution |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Esc` | Close the map panel or exit fullscreen |
| `Up Arrow` | Navigate to the previous job card |
| `Down Arrow` | Navigate to the next job card |
| `Enter` | Open the selected job's LinkedIn posting |

> Keyboard shortcuts are automatically disabled when a text input field is focused.

---

## Privacy

LinkedIn Job Map is built with privacy as a core principle:

- **No data collection** -- Zero analytics, telemetry, or tracking of any kind
- **No external servers** -- All processing happens locally in your browser
- **No account required** -- The extension works immediately after installation
- **Local caching only** -- Geocoding results are stored in your browser's `localStorage` and never transmitted
- **Minimal permissions** -- Only requests `activeTab` and `storage`; network access is limited to Mapbox (geocoding/tiles) and OSRM (routing)

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** this repository
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and test them on a LinkedIn Jobs page
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to your branch (`git push origin feature/amazing-feature`)
6. **Open a Pull Request** with a clear description of what you changed and why

### Development Notes

- The entire content script is wrapped in an IIFE to avoid global scope pollution
- `content.js` (~1,800 lines) contains all map, UI, and API logic
- `styles.css` (~1,000 lines) handles the dark glassmorphism theme
- Test changes by reloading the extension at `chrome://extensions` and refreshing a LinkedIn Jobs page

---

## License

This project is licensed under the **MIT License** -- see the [LICENSE](LICENSE) file for details.

---

---

<div align="center">

## Turkce

### Is aramanizi gercekten *gorun*.

LinkedIn is ilanlarini interaktif, karanlik temali bir harita uzerinde gorunturlestiren bir Chrome Eklentisi -- boylece islerin sadece ne oldugunu degil, *nerede* oldugunu da anlayabilirsiniz.

</div>

---

### Ozellikler

- **Interaktif Harita Katmani** -- LinkedIn is sayfanizin icinde dogrudan gorunen, karanlik Mapbox karolari ile tam Leaflet.js haritasi
- **Isaretci Kumeleme** -- Yuzlerce is akilli bir sekilde gruplanir; yakinlastirarak tek tek pinleri gorun
- **Calisma Yeri Turu Filtreleme** -- Yerinde (mavi), Hibrit (yesil) ve Uzaktan (mor) seceneklerini canli sayaclarla acip kapatin
- **Metin Arama** -- Is basliklari, sirketler ve konumlar uzerinde gercek zamanli arama
- **Akilli Siralama** -- Konumunuza gore mesafe, sirket adi, calisma turu veya ilan tarihi ile siralama
- **Sirket Logolari** -- LinkedIn API'sinden dogrudan cekilir, hata durumunda bas harf yedegi
- **Is Ilan Tarihleri** -- Kartlarda ve harita acilir pencerelerinde goreceli zaman damgalari ("2g once", "1h once")
- **CSV Disa Aktarimi** -- Haritalanmis tum isleri tek tikla UTF-8 CSV dosyasi olarak indirin
- **Klavye Kisayollari** -- Fareye dokunmadan is listesinde gezinin
- **Yolculuk Suresi Tahmini** -- Gercekci tahminler icin mesafeye dayali seyahat suresi bolgelerini kullanir (sehir ici, banliyö, otoban)
- **Cift Yonlu Senkronizasyon** -- Bir is kartina tiklayin, harita oraya ucusun; bir harita pinini tiklayin, kart vurgulansin
- **Tam Ekran Modu** -- Haritayi tum gorunume genisletin, yandan kayar is paneli ile
- **GPS ve Tikla Konum** -- GPS butonu ile veya haritada herhangi bir yere tiklayarak konumunuzu belirleyin
- **OSRM Rotalama** -- Konumunuz ile herhangi bir is arasinda gercek suruculuk/bisiklet rotasi
- **Iki Dilli Arayuz** -- Tam Ingilizce ve Turkce arayuz, tarayici dilinden otomatik algilanir
- **Karanlik Glassmorphism Temasi** -- LinkedIn'in karanlik moduna uyumlu, modern ve cilali tasarim
- **Onbellek Yonetimi** -- Geocoding sonuclari yerel olarak onbellege alinir; basliktan tum onbellegi temizleyin
- **Ozel Mapbox Anahtari** -- Yerlesik anahtari kullanin veya daha yuksek hiz limitleri icin kendinizinkini yapilandirin

---

### Ekran Goruntuleri

<div align="center">
<table>
<tr>
<td align="center" width="50%">
<img src="docs/screenshots/map-overview.png" alt="Harita Genel Gorunumu" width="400" /><br/>
<strong>Harita Genel Gorunumu</strong><br/>
<sub>Isaretci kumeleme ile tum isler</sub>
</td>
<td align="center" width="50%">
<img src="docs/screenshots/fullscreen-panel.png" alt="Tam Ekran ve Is Paneli" width="400" /><br/>
<strong>Tam Ekran Modu</strong><br/>
<sub>Filtre cubugu ile kart tabanli is paneli</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="docs/screenshots/filtering.png" alt="Calisma Turu Filtreleme" width="400" /><br/>
<strong>Filtreleme ve Arama</strong><br/>
<sub>Sayacli renk kodlu calisma turu cipleri</sub>
</td>
<td align="center">
<img src="docs/screenshots/route.png" alt="Rota ve Yolculuk" width="400" /><br/>
<strong>Rota ve Yolculuk</strong><br/>
<sub>Tahmini seyahat suresi ile OSRM rotalama</sub>
</td>
</tr>
</table>
</div>

> **Not:** Yukaridaki yer tutucu resim yollarini gercek ekran goruntuleri ile degistirin. Onerilen boyut: 1280x800 veya benzer 16:10 orani.

---

### Kurulum

#### Chrome Web Magaza'dan (Onerilen)

1. Chrome Web Magaza'da [LinkedIn Job Map](https://chrome.google.com/webstore/detail/placeholder) sayfasini ziyaret edin
2. **Chrome'a Ekle** butonuna tiklayin
3. Herhangi bir [LinkedIn Is Arama sayfasina](https://www.linkedin.com/jobs/) gidin ve gorunen **Haritayi Ac** butonuna tiklayin

#### Manuel Kurulum (Gelistirici Modu)

1. **Indirin**:
   ```bash
   git clone https://github.com/ofurkanuygur/linkedin-job-map.git
   ```
2. Chrome'da `chrome://extensions` adresine gidin
3. Sag ust kosedeki **Gelistirici modu** toggla'ini aktif edin
4. **Paketlenmemis oge yukle** butonuna tiklayin ve klonlanan `linkedin-job-map` klasorunu secin
5. Herhangi bir [LinkedIn Is Arama sayfasina](https://www.linkedin.com/jobs/) gidin -- eklenti otomatik olarak etkinlesir

---

### Kullanim

1. LinkedIn'de normalde yaptiginiz gibi **is arayin** (`linkedin.com/jobs/...`)
2. Sayfanin alt kisminda gorunen **"Haritayi Ac"** butonuna tiklayin
3. Harita paneli acilir -- isler otomatik olarak alinir, geocode edilir ve haritaya yerlestirilir
4. GPS butonu ile veya haritaya tiklayarak **konumunuzu belirleyin**
5. Renkli ciplerle (Yerinde / Hibrit / Uzaktan) calisma turunne gore **filtreleyin**
6. Baslik, sirket veya konuma gore filtrelemek icin arama cuubuguna **yazin**
7. Acilir menuyu kullanarak **siralin** (Mesafe, Sirket, Tur, Tarih)
8. Haritada konumuna ucmak icin bir **is kartina tiklayin** veya karti vurgulamak icin bir **harita isaretcisine tiklayin**
9. **Ilana Git** tam LinkedIn ilanini acar; **Haritalar** konumu Google Haritalar'da acar
10. Dikkat dagitici olmayan, tam ekran harita deneyimi icin **tam ekran** butonuna basin
11. Harici analiz icin sonuclarinizi **CSV olarak disa aktarin**

---

### Yapilandirma

#### Mapbox Erisim Anahtari

Eklenti, kutudan cikar cikkmaz calisan varsayilan bir Mapbox anahtari ile gelir. Yogun kullanim veya daha yuksek hiz limitleri icin kendinizinkini saglayabilirsiniz:

1. [mapbox.com](https://www.mapbox.com/) adresinde ucretsiz bir hesap olusturun
2. [Anahtarlar sayfasindan](https://account.mapbox.com/access-tokens/) **varsayilan genel anahtarinizi** kopyalayin
3. Chrome'da LinkedIn Job Map eklenti simgesine sag tiklayin ve **Secenekler**'i secin
4. Anahtarinizi yapistirin ve **Kaydet**'e tiklayin
5. Calistigini dogrulamak icin **Anahtari Test Et** butonunu kullanin
6. Yeni anahtari uygulamak icin LinkedIn sekmenizi yeniden yukleyin

> Ucretsiz Mapbox katmani ayda 100.000 geocoding istegi icerir; bu tipik is aramalari icin fazlasiyla yeterlidir.

---

### Teknoloji Yigini

| Bilesen | Teknoloji |
|---|---|
| Eklenti Platformu | Chrome Extension Manifest V3 |
| Harita Motoru | [Leaflet.js](https://leafletjs.com/) |
| Isaretci Kumeleme | [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) |
| Harita Karolari | [Mapbox](https://www.mapbox.com/) (Karanlik tema) |
| Geocoding | [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/) |
| Rotalama | [OSRM](https://project-osrm.org/) (Acik Kaynakli Rotalama Motoru) |
| Is Verileri | LinkedIn Voyager API (dahili, content script araciligiyla) |
| Arayuz Tasarimi | Glassmorphism efektli ozel CSS |
| Uluslararasilastirma | Sablon ikameli ozel `t()` yardimcisi |

---

### Klavye Kisayollari

| Tus | Islem |
|---|---|
| `Esc` | Harita panelini kapat veya tam ekrandan cik |
| `Yukari Ok` | Onceki is kartina git |
| `Asagi Ok` | Sonraki is kartina git |
| `Enter` | Secili isin LinkedIn ilanini ac |

> Klavye kisayollari, bir metin girisi alani odakli oldugunda otomatik olarak devre disi birakilir.

---

### Gizlilik

LinkedIn Job Map, temel ilke olarak gizlilik ile tasarlanmistir:

- **Veri toplama yok** -- Hicbir analitik, telemetri veya herhangi bir izleme yapilmaz
- **Harici sunucu yok** -- Tum islemler tarayicinizda yerel olarak gerceklesir
- **Hesap gerektirmez** -- Eklenti kurulumdan hemen sonra calisir
- **Yalnizca yerel onbellekleme** -- Geocoding sonuclari tarayicinizin `localStorage`'inda saklanir ve asla iletilmez
- **Minimum izinler** -- Yalnizca `activeTab` ve `storage` ister; ag erisimi Mapbox (geocoding/karolar) ve OSRM (rotalama) ile sinirlidir

---

### Katki

Katkilarinizi bekliyoruz! Baslamak icin:

1. Bu depoyu **fork**'layin
2. Bir **ozellik dali** olusturun (`git checkout -b feature/harika-ozellik`)
3. Degisikliklerinizi yapin ve bir LinkedIn Is sayfasinda **test edin**
4. Degisikliklerinizi **commit**'leyin (`git commit -m 'Harika ozellik ekle'`)
5. Daliniza **push** yapin (`git push origin feature/harika-ozellik`)
6. Ne degistirdiginizi ve nedenini acikca belirten bir **Pull Request** acin

#### Gelistirme Notlari

- Tum content script, global kapsam kirliligini onlemek icin bir IIFE icine sarilmistir
- `content.js` (~1.800 satir) tum harita, arayuz ve API mantigi icerir
- `styles.css` (~1.000 satir) karanlik glassmorphism temasiyla ilgilenir
- Degisiklikleri `chrome://extensions` adresinde eklentiyi yeniden yukleyerek ve bir LinkedIn Is sayfasini yenileyerek test edin

---

### Lisans

Bu proje **MIT Lisansi** ile lisanslanmistir -- ayrintilar icin [LICENSE](LICENSE) dosyasina bakin.

---

<div align="center">

<br/>

**LinkedIn Job Map** ile yapilmistir -- Is aramanizi harita uzerinde gorunturlestirin.

<br/>

Built with **LinkedIn Job Map** -- Visualize your job search on a map.

</div>
