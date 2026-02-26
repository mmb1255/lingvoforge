# ⚡ LingvoForge – AI Dil Metin Üreticisi

Muhammed Mustafa Bayraktar tarafından geliştirilmiştir.

AI destekli İngilizce ve Almanca metin üreticisi. CEFR seviyesine uygun metinler, gramer analizi, kelime listesi, çeviri ve sesli okuma.

---

## 🚀 Vercel'e Deploy Etme (Adım Adım)

### 1. Ön Gereksinimler

Bunlara ihtiyacın var:
- **GitHub hesabı** → [github.com](https://github.com) (ücretsiz)
- **Vercel hesabı** → [vercel.com](https://vercel.com) (GitHub ile giriş yap, ücretsiz)
- **Anthropic API Key** → [console.anthropic.com](https://console.anthropic.com) (ücretsiz kredi ile başla)

### 2. GitHub'a Yükleme

#### Seçenek A: GitHub Web (En Kolay)
1. [github.com/new](https://github.com/new) adresine git
2. Repository adı: `lingvoforge`
3. "Create repository" tıkla
4. "uploading an existing file" linkine tıkla
5. Bu ZIP'in içindeki TÜM dosyaları sürükle-bırak
6. "Commit changes" tıkla

#### Seçenek B: Git Komut Satırı
```bash
# Bu klasörde terminali aç
cd lingvoforge
git init
git add .
git commit -m "LingvoForge ilk sürüm"
git branch -M main
git remote add origin https://github.com/SENIN-KULLANICIADIN/lingvoforge.git
git push -u origin main
```

### 3. Vercel'e Bağlama

1. [vercel.com](https://vercel.com) → "Log in" → GitHub ile giriş yap
2. "Add New..." → "Project" tıkla
3. GitHub repo listesinden **lingvoforge** seç → "Import"
4. Framework: **Vite** otomatik algılanacak
5. **⚠️ ÖNEMLİ: Environment Variables ekle:**
   - "Environment Variables" bölümünü aç
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (API anahtarını yapıştır)
   - "Add" tıkla
6. "Deploy" butonuna bas!

### 4. Tamamlandı! 🎉

Vercel sana bir URL verecek: `https://lingvoforge-xxxxx.vercel.app`

Bu URL'yi herkesle paylaşabilirsin!

---

## 🔑 API Anahtarı Nereden Alınır?

1. [console.anthropic.com](https://console.anthropic.com) adresine git
2. Hesap oluştur (Google ile giriş yapabilirsin)
3. Sol menüden "API Keys" tıkla
4. "Create Key" → İsim ver → Kopyala
5. Bu anahtarı Vercel'deki Environment Variables'a yapıştır

**Not:** Anthropic yeni hesaplara ücretsiz kredi veriyor. Başlangıç için yeterli.

---

## 📁 Proje Yapısı

```
lingvoforge/
├── api/
│   └── chat.js          ← Vercel serverless fonksiyon (API proxy)
├── src/
│   ├── App.jsx          ← Ana uygulama
│   └── main.jsx         ← Giriş noktası
├── index.html           ← HTML şablonu
├── package.json         ← Bağımlılıklar
├── vite.config.js       ← Vite ayarları
├── vercel.json          ← Vercel ayarları
└── .gitignore           ← Git'e yüklenmeyecek dosyalar
```

---

## 🛡️ Güvenlik Notu

API anahtarın **asla** frontend kodunda görünmez. `api/chat.js` dosyası Vercel'in sunucusunda çalışır ve anahtarı güvenli tutar. Kullanıcılar sadece `/api/chat` endpoint'ini görür.

---

## 💡 Özelleştirme

Daha sonra ekleyebileceğin özellikler:
- Özel domain bağlama (Vercel Settings → Domains)
- Daha fazla dil ekleme (Fransızca, İspanyolca vb.)
- Kullanıcı kayıt sistemi
- Metin geçmişini veritabanında saklama

---

© 2025 Muhammed Mustafa Bayraktar | Claude AI ile güçlendirilmiştir
