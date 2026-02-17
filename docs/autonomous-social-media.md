# Ejemplo: Social Media Manager autónomo

## Cómo funciona en la práctica

1. **Añades un Mini Jelly** desde la galería: plantilla "Social Media Manager". Le pones:
   - **Goals**: "3 posts por semana", "Responder comentarios en menos de 1 h", "Reportar analytics semanal".
   - **KPIs**: engagement > 3%, tiempo de respuesta < 1 h.
   - **Access**: "Metricool en .env", "Instagram login en .env" (o lo que uses).

2. **Pones en marcha el Signal Watcher** (recomendado): en `.env`:
   ```bash
   SIGNAL_WATCHER_ENABLED=true
   SIGNAL_WATCHER_INTERVAL_MS=1800000
   ```
   (1800000 = 30 min). Arrancas con `./start.sh`.

3. **Cada 30 minutos** el watcher pide a Vision "¿qué está pasando en el mundo?" (`/api/signals` → tendencias/noticias). Si el contenido **cambió** respecto a la última vez:
   - Se despierta a **todos** los Mini Jellys activos (incluido el Social Media Manager).
   - Reciben un mensaje sintético con esas tendencias y la instrucción: "Si ves una tendencia u oportunidad, actúa (crear contenido, post, programar). Usa tus herramientas. Luego reporta."

4. **El Social Media Manager** (su Core + Action):
   - Ve en su prompt las tendencias actuales y sus goals (3 posts/semana, etc.).
   - Puede decidir: "Hay un trend X → voy a redactar un post y programarlo en Metricool."
   - Emite intención `draft` o `metricool_schedule` (o `instagram_post` si está configurado).
   - Action ejecuta (Nano Banana para imágenes si pide, Metricool para programar, etc.).
   - El agente responde con un texto (reporte). Si tienes `SCHEDULER_REPORT_CONVERSATION_ID=telegram:TU_CHAT_ID`, ese reporte te llega por Telegram.

5. **No es un cron**: no es "a las 9:00 todos los días". Es "cada 30 min miro si el mundo cambió; si cambió, despierto a los agentes y ellos deciden si atacan". Si las tendencias no cambian, no se dispara.

## Sin watcher (solo eventos externos)

Si no quieres el watcher, no pongas `SIGNAL_WATCHER_ENABLED`. Entonces los agentes solo se despiertan cuando:
- Alguien les escribe (Telegram, dashboard), o
- Alguien llama **POST /api/trigger** (Zapier, n8n, tu script, webhook cuando detectes un trend).

Mismo flujo una vez despiertos: ven contexto (signals si los pasas), goals, KPIs, actúan y reportan.
