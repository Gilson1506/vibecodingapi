-- Correção da aula travada (Race Condition Mux)
UPDATE public.lessons 
SET 
  mux_status = 'ready', 
  mux_asset_id = '4J000085hHHhqgKIdKRHxkjO1X00o02aHuGj7RjL8xApbaI',
  mux_playback_id = '2mbrl5lfuQLsetUR4xUx3gl2',
  duration_seconds = 5
WHERE id = '9c05fbfa-1bd9-4806-92ec-b25e5764381a';

-- Verificação
SELECT id, title, mux_status, mux_playback_id FROM public.lessons WHERE id = '9c05fbfa-1bd9-4806-92ec-b25e5764381a';
