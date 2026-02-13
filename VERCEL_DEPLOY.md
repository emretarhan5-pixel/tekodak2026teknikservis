# Vercel Deploy - Beyaz Sayfa Çözümü

Beyaz sayfa genellikle **ortam değişkenlerinin eksik** olmasından kaynaklanır. `.env.local` Vercel'e gönderilmez.

## Çözüm: Vercel'de Environment Variables Ekleyin

1. **Vercel Dashboard** → Projenizi seçin → **Settings** → **Environment Variables**

2. Şu değişkenleri ekleyin:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://cidvdsiajhgdwqypltsl.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZHZkc2lhamhnZHdxeXBsdHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjM1NjIsImV4cCI6MjA4NjQ5OTU2Mn0.WOdXig7_Vf-Ft8E4wyr3DhcdLVb4bO5WpPpdpS9uCjo` |

3. **Environment** için: Production, Preview, Development hepsini işaretleyin

4. **Redeploy** yapın:
   - **Deployments** sekmesi → Son deployment'ın sağındaki **⋯** → **Redeploy**

Vite build sırasında bu değişkenleri kullanır; eklemeden önce yapılan build'lerde `undefined` olur ve uygulama çökerek beyaz sayfa gösterir.
