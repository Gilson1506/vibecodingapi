# Configuração do Supabase Storage

## Buckets Criados

Este script cria 7 buckets de storage para a plataforma Vibe Coding:

| Bucket | Tipo | Descrição |
|--------|------|-----------|
| `avatars` | Público | Fotos de perfil dos usuários |
| `course-covers` | Público | Capas dos cursos |
| `lesson-thumbnails` | Público | Thumbnails das aulas |
| `materials` | Privado | Materiais de apoio (PDFs, arquivos) |
| `tool-files` | Privado | Arquivos de orientação de ferramentas |
| `tool-covers` | Público | Capas das ferramentas |
| `community-attachments` | Privado | Anexos da comunidade |

## Políticas de Acesso

### Avatars
- ✅ Usuários podem fazer upload do próprio avatar
- ✅ Qualquer um pode visualizar (público)
- ✅ Usuários podem atualizar/deletar próprio avatar

### Course Covers, Lesson Thumbnails, Tool Covers
- ✅ Admin pode fazer upload/atualizar/deletar
- ✅ Qualquer um pode visualizar (público)

### Materials, Tool Files
- ✅ Admin pode fazer upload/atualizar/deletar
- ✅ Apenas usuários com `has_access = true` podem visualizar

### Community Attachments
- ✅ Usuários com acesso podem fazer upload
- ✅ Apenas usuários com acesso podem visualizar
- ✅ Usuários podem deletar próprios anexos

## Como Executar

1. Acesse seu projeto Supabase
2. Vá em **SQL Editor**
3. Execute o arquivo `supabase-storage.sql`
4. Verifique em **Storage** se os 7 buckets foram criados

## Estrutura de Pastas Recomendada

```
avatars/
  └── {user_id}/
      └── avatar.jpg

course-covers/
  └── {course_id}.jpg

lesson-thumbnails/
  └── {lesson_id}.jpg

materials/
  └── {material_id}/
      └── file.pdf

tool-files/
  └── {tool_id}/
      └── guide.pdf

tool-covers/
  └── {tool_id}.jpg

community-attachments/
  └── {user_id}/
      └── {message_id}/
          └── file.jpg
```

## URLs de Acesso

### Buckets Públicos
```
https://{project}.supabase.co/storage/v1/object/public/avatars/{user_id}/avatar.jpg
https://{project}.supabase.co/storage/v1/object/public/course-covers/{course_id}.jpg
```

### Buckets Privados (requer token)
```
https://{project}.supabase.co/storage/v1/object/authenticated/materials/{material_id}/file.pdf
```

## Exemplo de Upload (Frontend)

```typescript
// Upload de avatar
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file, {
    cacheControl: '3600',
    upsert: true
  });

// Upload de material (admin)
const { data, error } = await supabase.storage
  .from('materials')
  .upload(`${materialId}/file.pdf`, file);

// Obter URL pública
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`);

// Obter URL autenticada
const { data } = await supabase.storage
  .from('materials')
  .createSignedUrl(`${materialId}/file.pdf`, 3600);
```
