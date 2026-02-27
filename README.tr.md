<div align="center">

# LinkedIn Job Map

### İş aramanızı gerçekten *görün*.

LinkedIn iş ilanlarını interaktif, karanlık temalı bir harita üzerinde görüntüleyen bir Chrome Eklentisi -- böylece işlerin sadece ne olduğunu değil, *nerede* olduğunu da anlayabilirsiniz.

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/bhincffgniejoocchagkfcnocinjcohf?style=for-the-badge&logo=googlechrome&logoColor=white&label=Chrome%20Web%20Store&color=0a66c2)](https://chromewebstore.google.com/detail/linkedin-job-map/bhincffgniejoocchagkfcnocinjcohf)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-a855f7?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Uyumlu-0a66c2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/jobs/)

<p>
  <a href="README.md">English</a> | <b>Türkçe</b>
</p>

<br/>

<img src="docs/screenshots/hero.png" alt="LinkedIn Job Map - Ana Ekran Görüntüsü" width="820" />

<br/>

*İşaretçi kümeleme, renk kodlu çalışma türleri, yolculuk süresi tahmini ve güzel glassmorphism arayüzü -- hepsi LinkedIn sekmenizin içinde.*

</div>

---

## Özellikler

- **İnteraktif Harita Katmanı** -- LinkedIn iş sayfanızın içinde doğrudan görünen, karanlık Mapbox karoları ile tam Leaflet.js haritası
- **İşaretçi Kümeleme** -- Yüzlerce iş akıllı bir şekilde gruplanır; yakınlaştırarak tek tek pinleri görün
- **Çalışma Yeri Türü Filtreleme** -- Yerinde (mavi), Hibrit (yeşil) ve Uzaktan (mor) seçeneklerini canlı sayaçlarla açıp kapatın
- **Metin Arama** -- İş başlıkları, şirketler ve konumlar üzerinde gerçek zamanlı arama
- **Akıllı Sıralama** -- Konumunuza göre mesafe, şirket adı, çalışma türü veya ilan tarihi ile sıralama
- **Şirket Logoları** -- LinkedIn API'sinden doğrudan çekilir, hata durumunda baş harf yedeği
- **İş İlan Tarihleri** -- Kartlarda ve harita açılır pencerelerinde göreceli zaman damgaları ("2g önce", "1h önce")
- **CSV Dışa Aktarımı** -- Haritalanmış tüm işleri tek tıkla UTF-8 CSV dosyası olarak indirin
- **Klavye Kısayolları** -- Fareye dokunmadan iş listesinde gezinin
- **Yolculuk Süresi Tahmini** -- Gerçekçi tahminler için mesafeye dayalı seyahat süresi bölgeleri (şehir içi, banliyö, otoban)
- **Çift Yönlü Senkronizasyon** -- Bir iş kartına tıklayın, harita oraya uçsun; bir harita pinini tıklayın, kart vurgulansın
- **Tam Ekran Modu** -- Haritayı tüm görünüme genişletin, yandan kayar iş paneli ile
- **GPS ve Tıkla Konum** -- GPS butonu ile veya haritada herhangi bir yere tıklayarak konumunuzu belirleyin
- **OSRM Rotalama** -- Konumunuz ile herhangi bir iş arasında gerçek sürücülük/bisiklet rotası
- **İki Dilli Arayüz** -- Tam İngilizce ve Türkçe arayüz, tarayıcı dilinden otomatik algılanır
- **Karanlık Glassmorphism Teması** -- LinkedIn'in karanlık moduna uyumlu, modern ve cilalı tasarım
- **Önbellek Yönetimi** -- Geocoding sonuçları yerel olarak önbelleğe alınır; başlıktan tüm önbelleği temizleyin
- **Özel Mapbox Anahtarı** -- Yerleşik anahtarı kullanın veya daha yüksek hız limitleri için kendinizinkini yapılandırın

---

## Ekran Görüntüleri

<div align="center">
<table>
<tr>
<td align="center" width="50%">
<img src="docs/screenshots/map-overview.png" alt="Harita Genel Görünümü" width="400" /><br/>
<strong>Harita Genel Görünümü</strong><br/>
<sub>İşaretçi kümeleme ile tüm işler</sub>
</td>
<td align="center" width="50%">
<img src="docs/screenshots/fullscreen-panel.png" alt="Tam Ekran ve İş Paneli" width="400" /><br/>
<strong>Tam Ekran Modu</strong><br/>
<sub>Filtre çubuğu ile kart tabanlı iş paneli</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="docs/screenshots/filtering.png" alt="Çalışma Türü Filtreleme" width="400" /><br/>
<strong>Filtreleme ve Arama</strong><br/>
<sub>Sayaçlı renk kodlu çalışma türü çipleri</sub>
</td>
<td align="center">
<img src="docs/screenshots/route.png" alt="Rota ve Yolculuk" width="400" /><br/>
<strong>Rota ve Yolculuk</strong><br/>
<sub>Tahmini seyahat süresi ile OSRM rotalama</sub>
</td>
</tr>
</table>
</div>

> **Not:** Yukarıdaki yer tutucu resim yollarını gerçek ekran görüntüleri ile değiştirin. Önerilen boyut: 1280x800 veya benzer 16:10 oranı.

---

## Kurulum

### Chrome Web Mağaza'dan (Önerilen)

1. Chrome Web Mağaza'da [LinkedIn Job Map](https://chromewebstore.google.com/detail/linkedin-job-map/bhincffgniejoocchagkfcnocinjcohf) sayfasını ziyaret edin
2. **Chrome'a Ekle** butonuna tıklayın
3. Herhangi bir [LinkedIn Jobs sayfasına](https://www.linkedin.com/jobs/collections) (`linkedin.com/jobs/...`) gidin -- eklenti otomatik devreye girer ve **Haritayı Aç** butonu belirir

### Manuel Kurulum (Geliştirici Modu)

1. **İndirin**:
   ```bash
   git clone https://github.com/ofurkanuygur/linkedin-job-map.git
   ```
2. Chrome'da `chrome://extensions` adresine gidin
3. Sağ üst köşedeki **Geliştirici modu** toggle'ını aktif edin
4. **Paketlenmemiş öğe yükle** butonuna tıklayın ve klonlanan `linkedin-job-map` klasörünü seçin
5. Herhangi bir [LinkedIn Jobs sayfasına](https://www.linkedin.com/jobs/collections) gidin -- eklenti otomatik olarak etkinleşir

---

## Kullanım

1. **LinkedIn Jobs sayfasına gidin** -- Eklenti, `linkedin.com/jobs/...` sayfalarında otomatik olarak devreye girer (örn. [linkedin.com/jobs/collections](https://www.linkedin.com/jobs/collections)). Normalde yaptığınız gibi iş arayın.
2. Sayfanın alt kısmında görünen **"Haritayı Aç"** butonuna tıklayın
3. Harita paneli açılır -- işler otomatik olarak alınır, geocode edilir ve haritaya yerleştirilir
4. GPS butonu ile veya haritaya tıklayarak **konumunuzu belirleyin**
5. Renkli çiplerle (Yerinde / Hibrit / Uzaktan) çalışma türüne göre **filtreleyin**
6. Başlık, şirket veya konuma göre filtrelemek için arama çubuğuna **yazın**
7. Açılır menüyü kullanarak **sıralayın** (Mesafe, Şirket, Tür, Tarih)
8. Haritada konumuna uçmak için bir **iş kartına tıklayın** veya kartı vurgulamak için bir **harita işaretçisine tıklayın**
9. **İlana Git** tam LinkedIn ilanını açar; **Haritalar** konumu Google Haritalar'da açar
10. Dikkat dağıtıcı olmayan, tam ekran harita deneyimi için **tam ekran** butonuna basın
11. Harici analiz için sonuçlarınızı **CSV olarak dışa aktarın**

---

## Yapılandırma

### Mapbox Erişim Anahtarı

Eklenti, kutudan çıkar çıkmaz çalışan varsayılan bir Mapbox anahtarı ile gelir. Yoğun kullanım veya daha yüksek hız limitleri için kendinizinkini sağlayabilirsiniz:

1. [mapbox.com](https://www.mapbox.com/) adresinde ücretsiz bir hesap oluşturun
2. [Anahtarlar sayfasından](https://account.mapbox.com/access-tokens/) **varsayılan genel anahtarınızı** kopyalayın
3. Chrome'da LinkedIn Job Map eklenti simgesine sağ tıklayın ve **Seçenekler**'i seçin
4. Anahtarınızı yapıştırın ve **Kaydet**'e tıklayın
5. Çalıştığını doğrulamak için **Anahtarı Test Et** butonunu kullanın
6. Yeni anahtarı uygulamak için LinkedIn sekmenizi yeniden yükleyin

> Ücretsiz Mapbox katmanı ayda 100.000 geocoding isteği içerir; bu tipik iş aramaları için fazlasıyla yeterlidir.

---

## Teknoloji Yığını

| Bileşen | Teknoloji |
|---|---|
| Eklenti Platformu | Chrome Extension Manifest V3 |
| Harita Motoru | [Leaflet.js](https://leafletjs.com/) |
| İşaretçi Kümeleme | [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) |
| Harita Karoları | [Mapbox](https://www.mapbox.com/) (Karanlık tema) |
| Geocoding | [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/) |
| Rotalama | [OSRM](https://project-osrm.org/) (Açık Kaynaklı Rotalama Motoru) |
| İş Verileri | LinkedIn Voyager API (dahili, content script aracılığıyla) |
| Arayüz Tasarımı | Glassmorphism efektli özel CSS |
| Uluslararasılaştırma | Şablon ikameli özel `t()` yardımcısı |

---

## Klavye Kısayolları

| Tuş | İşlem |
|---|---|
| `Esc` | Harita panelini kapat veya tam ekrandan çık |
| `Yukarı Ok` | Önceki iş kartına git |
| `Aşağı Ok` | Sonraki iş kartına git |
| `Enter` | Seçili işin LinkedIn ilanını aç |

> Klavye kısayolları, bir metin girişi alanı odaklı olduğunda otomatik olarak devre dışı bırakılır.

---

## Kod Kalitesi

Bu proje **SonarQube** ve **Vitest** ile kod kalitesi altyapısı içerir.

### Testleri Çalıştırma

```bash
npm install
npm test                # Testleri çalıştır
npm run test:coverage   # Kapsam raporu ile çalıştır
```

### SonarQube Analizi

```bash
cp .env.example .env    # SONAR_TOKEN değerini düzenleyin
npm run sonar:full      # Docker ile SonarQube başlat + tarama yap
```

Detaylı kurulum için [SonarQube Dokümantasyonu](https://docs.sonarqube.org/latest/) sayfasına bakın.

---

## Gizlilik

LinkedIn Job Map, temel ilke olarak gizlilik ile tasarlanmıştır:

- **Veri toplama yok** -- Hiçbir analitik, telemetri veya herhangi bir izleme yapılmaz
- **Harici sunucu yok** -- Tüm işlemler tarayıcınızda yerel olarak gerçekleşir
- **Hesap gerektirmez** -- Eklenti kurulumdan hemen sonra çalışır
- **Yalnızca yerel önbellekleme** -- Geocoding sonuçları tarayıcınızın `localStorage`'ında saklanır ve asla iletilmez
- **Minimum izinler** -- Yalnızca `storage` ister; ağ erişimi Mapbox (geocoding/karolar) ve OSRM (rotalama) ile sınırlıdır

---

## Katkı

Katkılarınızı bekliyoruz! Başlamak için:

1. Bu depoyu **fork**'layın
2. Bir **özellik dalı** oluşturun (`git checkout -b feature/harika-ozellik`)
3. Değişikliklerinizi yapın ve bir LinkedIn İş sayfasında **test edin**
4. Değişikliklerinizi **commit**'leyin (`git commit -m 'Harika özellik ekle'`)
5. Dalınıza **push** yapın (`git push origin feature/harika-ozellik`)
6. Ne değiştirdiğinizi ve nedenini açıkça belirten bir **Pull Request** açın

### Geliştirme Notları

- Tüm content script, global kapsam kirliliğini önlemek için bir IIFE içine sarılmıştır
- `content.js` (~1.800 satır) tüm harita, arayüz ve API mantığı içerir
- `styles.css` (~1.000 satır) karanlık glassmorphism temasıyla ilgilenir
- Değişiklikleri `chrome://extensions` adresinde eklentiyi yeniden yükleyerek ve bir LinkedIn İş sayfasını yenileyerek test edin

---

## Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır -- ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.

---

<div align="center">

<br/>

**LinkedIn Job Map** ile yapılmıştır -- İş aramanızı harita üzerinde görüntüleyin.

</div>
