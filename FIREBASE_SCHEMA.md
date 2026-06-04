# SmileFlow Firebase Schema

Firestore crea colecciones cuando se escribe el primer documento, pero este es el modelo esperado.

## users/{uid}

Perfil y rol de usuarios autenticados.

```json
{
  "displayName": "Dra. Smile",
  "email": "dentista@example.com",
  "phone": "525512345678",
  "role": "admin",
  "createdAt": "serverTimestamp"
}
```

Roles:

- `admin`: dentista o personal del consultorio. Puede editar disponibilidad y ver citas.
- `client`: paciente. Puede ver su perfil e historial de citas propias.

Para el primer admin, crea el usuario en Firebase Auth y despues crea manualmente `users/{uid}` con `role: "admin"`.

## clinicAvailability/{dayKey}

Horarios de atencion por dia. `dayKey` usa `0` domingo a `6` sabado.

```json
{
  "dayKey": "1",
  "dayName": "Lunes",
  "enabled": true,
  "startTime": "11:00",
  "endTime": "19:00",
  "slotMinutes": 60,
  "updatedAt": "serverTimestamp"
}
```

## appointments/{appointmentId}

Citas creadas por landing, dashboard o chatbot.

```json
{
  "name": "Ana Martinez",
  "phone": "525512345678",
  "patientUid": "firebase-auth-uid-or-null",
  "serviceTitle": "Consulta dental",
  "date": "2026-06-15",
  "time": "11:00",
  "startsAt": "timestamp",
  "status": "confirmed",
  "reminded": false,
  "todayReminderSent": false,
  "source": "web-chatbot",
  "createdAt": "serverTimestamp"
}
```

Estados sugeridos:

- `pending`
- `confirmed`
- `cancelled`
- `realizada`
- `no_llego`
