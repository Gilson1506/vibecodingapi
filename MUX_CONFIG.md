# 🎥 Finalizar Configuração do Mux

## O que falta no .env:

### 1️⃣ MUX_SIGNING_KEY (ID da chave)

No Mux Dashboard:
1. **Settings** → **Signing Keys**
2. Você deve ter criado uma chave
3. Copie o **Key ID** (exemplo: `abc123def456`)

**Substitua na linha 27:**
```env
MUX_SIGNING_KEY=SEU_KEY_ID_AQUI
```

---

### 2️⃣ MUX_PRIVATE_KEY (Chave RSA)

Você já me enviou a chave em Base64. Aqui está ela decodificada e formatada:

**Substitua na linha 28:**
```env
MUX_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEAohecSuEfZVsuYFSu+tBD/FankgpczYY/UyXSWP8Qhr1eJ0LQ\nIKFq5Jw/fFEo4nfHi1c/BdfpINXN5WoavUF1DZYNcBF6jZyDF8EXzb80rI0eALip\nNhMZDIFPiQksJOtg9ZFzFztkXctkbMdXo8Vht1Zq6Sosa2gzK4dP6jK1xrzUty2I\n5fm028JKOnDQ5hdhpDfqitHAOGdhadaxwgk3COV+7TVXfxipHjH9wPhVVWjMQfRt\nTWszlPvH8Io52TCbP4W1QgyL5LGLX1Bqo77TK5B8W0lD/WP0f2Q5i0xpdjjZYX+K\ngetQEUP4eYcZR/5HGyWBE7lJ7UYAGcSt84bDlQIDAQABAoIBAAnNc5bj9/+9044O\nifcLhktOco22fyWMwRBYk0Z/jc4XEvY9A6bCGgAomWxGvINONBqdOQxGD8hpo2Py\nTT+HfzpYd9FuR3VJYOIuqZ04X8l5oLXxdPP2b9m5G/YsiXmu9rQ3uGYHD9RL/6qN\nSaOcMt6O5SIj+iQmJfzqjuWZ2sVhmrhucA6JvQQefc0w3B97vkz5geVrEZGp5VYF\nT+6z2o+TQ0FqwbBzCC0cThgwat1Ntoqcr5cyuMdNpttYZxI0NWysHlMMJhEfWyLn\nZewh96Jgw57Y0yThKJrzT5h6+j+Cjz+IxFaJfI/5bkzWRgHU6JPPbSKu1SsbVCt/\nL11pu1cCgYEAyx/j2hTuys48m6AgXFey8NHm18SnQp52jmRWXC/CAx5PJ53nJuBU\n7rG317grcpsmPo0sfV6BLtCTEqKBWY6lU626Ze6Ko2cEm43XzJNdGpu/9iGQVnzl\nN37/gswZm83Y8TKRosLEADfPJugkiRzWmI7diBONMtGThDMVPc0BTTMCgYEAzElZ\nA9NP3Md6A7fgrER4ndLCFuh8IqexGZkR52eYycYRQ/BqMVqyw8jyLKVrrSE/FuV7\neHumBNbkMCBKplTqgKTa7WwRYJ5b+2enZJ8b3JKJ3/t5LSJ3hy9bZCb0p+6uKSYA\nN03ViXjt11ThgoApw4yZaGjhzjmYGCCencOr3BcCgYADhiUc1noiGJvik0+caoUX\nOn0Hx0ijlj42UDVTWhzCkxcKd+nXudKfZYPsASz3ywtJ0IcyEZ6qIkI684jM9fWW\nUxBFznKnTRU+YaKZ0QCvgn49Fe38IiST5ucl7MAQ9mxKGvd93GUsH8u/QA3KNy7d\n7LSZNMWhWRN3Gq/Gp7TbEwKBgH3mfmuzIbcJYRNFkbvZfxSVPXTs1wRsoOMLyVL6\nL9m6rg1W77t3EFFEWKtXT6MlqEIuMAgy/EBjR8K5RAh6sQOTljFYtuT68+lfGnUS\n8hLgZQSbcTT11wCDmSmCMKoGmWNWvi9XUtEkrEBXWZwZ7KNN1YXZjcCREkFcaSUF\n4LcFAoGAA/XOJotMXMyM0aOb38XgxZ/M2Lydy6gT/5bqNtlHbxAyDqWNSOtm/JVE\nUYaVwRLkt0S+K8WXsHMEP9hblK1jCVSgd/I1Hw55sf+PvyltSUQQyqwoaEzKG5ZK\nEznPlzK6UpC7cNKFSyGzsl3Lz9ZCjDzfs9Xjxgv3cfZsfJO2uWc=\n-----END RSA PRIVATE KEY-----"
```

---

## ✅ Depois de atualizar:

1. Salve o arquivo `.env`
2. Reinicie a API:
   ```bash
   # Ctrl+C no terminal da API
   npm run dev
   ```

3. Você deve ver:
   ```
   ✅ Supabase client initialized
   ✅ Brevo client initialized
   ✅ Mux client initialized
   🚀 API running on http://localhost:3001
   ```

---

## 📋 Status Atual:

- ✅ Supabase - Configurado
- ✅ Brevo - Configurado
- ✅ Mux Token ID/Secret - Configurado
- ✅ Mux Webhook Secret - Configurado
- ⏳ Mux Signing Key - **Falta adicionar**
- ⏳ Mux Private Key - **Falta adicionar**

Me avise quando terminar! 🚀
