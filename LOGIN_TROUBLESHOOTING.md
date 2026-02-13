# Giriş "Failed to Fetch" Hatası Çözümü

Giriş yaparken **"Sunucuya bağlanılamıyor"** veya **"Failed to fetch"** hatası alıyorsanız, büyük olasılıkla **Auth Edge Function** henüz Supabase'e deploy edilmemiştir.

## Çözüm: Auth Edge Function'ı Deploy Edin

### 1. Supabase CLI Kurulumu

```bash
npm install -g supabase
```

### 2. Supabase'e Giriş Yapın

```bash
supabase login
```

Tarayıcı açılacak, Supabase hesabınızla giriş yapın.

### 3. Projeyi Bağlayın

```bash
supabase link --project-ref ujcdozohhlgsudgerfoz
```

(Proje referansı `.env` dosyanızdaki Supabase URL'inden alınır: `ujcdozohhlgsudgerfoz`)

### 4. Auth Function'ı Deploy Edin

```bash
supabase functions deploy auth
```

### 5. Uygulamayı Yeniden Başlatın

```bash
npm run dev
```

---

## Diğer Olası Nedenler

- **İnternet bağlantısı**: Ağ bağlantınızı kontrol edin
- **Firewall / VPN**: Bazı kurumsal ağlar Supabase'i engelleyebilir
- **`.env` dosyası**: `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerinin doğru olduğundan emin olun
