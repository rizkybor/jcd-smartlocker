Marks realtime data in the dashboard header and on unit rows. The halo is the only infinite animation in the system.

```jsx
<StatusPulse status="available">Realtime - diperbarui 2 detik lalu</StatusPulse>
<StatusPulse status="offline" live={false}>Koneksi terputus</StatusPulse>
```

Freeze it (`live={false}`) the moment the stream drops — a pulsing dot on stale data is a lie.
