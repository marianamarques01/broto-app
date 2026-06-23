import { assertEquals } from 'jsr:@std/assert@1'
import { parseSupabaseStorageObjectUrl } from './material-storage-fetch.ts'

Deno.test('parseSupabaseStorageObjectUrl: URL pública do bucket materials', () => {
  const ref = parseSupabaseStorageObjectUrl(
    'https://lfhsugwhnjqudqomzegp.supabase.co/storage/v1/object/public/materials/b0c00000/file.pdf',
  )
  assertEquals(ref, { bucket: 'materials', path: 'b0c00000/file.pdf' })
})

Deno.test('parseSupabaseStorageObjectUrl: retorna null para URL externa', () => {
  assertEquals(parseSupabaseStorageObjectUrl('https://example.com/doc.pdf'), null)
})
