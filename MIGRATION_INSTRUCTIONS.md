# Migration'ı Uygulama Talimatları

## Sorun
`column tickets.won does not exist` hatası alınıyor. Bu, veritabanında `won` ve `won_at` kolonlarının henüz oluşturulmadığı anlamına gelir.

## Çözüm

### Yöntem 1: Supabase Dashboard (Önerilen - En Kolay)

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. **Projenizi seçin**
3. **Sol menüden "SQL Editor" sekmesine tıklayın**
4. **"New query" butonuna tıklayın**
5. **Aşağıdaki SQL'i yapıştırın:**

```sql
-- Add won and won_at fields to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS won BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS won_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_won ON tickets(won) WHERE won = true;
CREATE INDEX IF NOT EXISTS idx_tickets_won_at ON tickets(won_at) WHERE won_at IS NOT NULL;
```

6. **"Run" butonuna tıklayın** (veya Ctrl+Enter)
7. **Başarı mesajını görüntüleyin**

### Yöntem 2: Supabase CLI (Eğer kuruluysa)

```bash
# Supabase CLI ile migration çalıştırma
npx supabase migration up
```

## Migration Sonrası

Migration'ı çalıştırdıktan sonra:

1. ✅ Sayfayı yenileyin (F5 veya Cmd+R)
2. ✅ Bir bileti "Kazanıldı" sütununa sürükleyin
3. ✅ "Performans İstatistikleri" modalını açın
4. ✅ İstatistiklerin güncellendiğini kontrol edin

## Kontrol

Migration'ın başarılı olduğunu kontrol etmek için SQL Editor'da şu sorguyu çalıştırın:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets'
AND column_name IN ('won', 'won_at');
```

Bu sorgu `won` ve `won_at` kolonlarının varlığını ve tipini gösterecektir.
