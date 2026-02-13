# Supabase Kurulum ve Deploy

Proje klasöründe sırayla çalıştırın. Her komut **ayrı satırda**, tek tek çalıştırılmalıdır.

## 1. Supabase'e giriş

```bash
npx supabase login
```

Tarayıcı açılır, Supabase hesabınızla giriş yapın.

## 2. Projeyi bağla

```bash
npx supabase link --project-ref cidvdsiajhgdwqypltsl
```

Database şifresi sorulursa: Supabase Dashboard → Project Settings → Database → Connection string içindeki şifreyi kullanın.

## 3. Migration'ları uygula

```bash
npx supabase db push
```

## 4. Auth Edge Function'ı deploy et

```bash
npx supabase functions deploy auth
```

## 5. Uygulamayı başlat

```bash
npm run dev
```

---

**Özet (kopyala-yapıştır için):**

```bash
npx supabase login
npx supabase link --project-ref cidvdsiajhgdwqypltsl
npx supabase db push
npx supabase functions deploy auth
npm run dev
```
