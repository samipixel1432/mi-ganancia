# Mi Ganancia Diaria

App local sencilla para registrar ventas, ganancias, gastos e historiales.

## Cómo usarla local

Abre `index.html` directamente en el navegador, o levanta un servidor local:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Después entra a:

```text
http://127.0.0.1:4173/
```

## Qué hace

- Tiene una interfaz estilo dashboard beta, pensada para verse bien local y en celular.
- Agrega ventas con producto, precio vendido y ganancia real.
- Agrega gastos para restarlos del día.
- Permite escoger la fecha de cada venta o gasto.
- Muestra resumen diario, semanal y mensual.
- Permite navegar a periodos anteriores o siguientes.
- Muestra ganancia final, ganancia en ventas, total vendido y gastos por periodo.
- Muestra resumen por días dentro de la semana o el mes.
- Guarda los datos en el navegador con `localStorage`.
- Filtra movimientos por todos, ventas o gastos.
- Permite eliminar movimientos individuales o limpiar el periodo visible.

## Para subirla en línea

Sube estos archivos a tu hosting:

- `index.html`
- `styles.css`
- `app.js`

No necesita base de datos ni inicio de sesión.
