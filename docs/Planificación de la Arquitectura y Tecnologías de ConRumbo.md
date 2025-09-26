# Planificación de la Arquitectura y Tecnologías de ConRumbo

## 1. Resumen de la Arquitectura
La aplicación ConRumbo se desarrollará como una **Aplicación Web Progresiva (PWA)** con un **backend en Flask** que expondrá una API RESTful. La PWA será `mobile-ready` y se enfocará en la compatibilidad con navegadores modernos y una experiencia de usuario fluida, incluso offline.

## 2. Componentes Principales

### 2.1 Frontend (PWA)
*   **Tecnologías:** HTML, CSS, JavaScript.
*   **Funcionalidades Clave:**
    *   **Web Speech API:** Para reconocimiento de voz (STT).
    *   **TTS nativo del navegador:** Para síntesis de voz (Text-to-Speech).
    *   **Service Worker:** Para caché estático (`index.html`, `style.css`, `script.js`, `manifest.webmanifest`, `sw.js`) y funcionalidad offline.
    *   **Mobile-ready:** Diseño responsivo y adaptativo para dispositivos móviles.
    *   **Almacenamiento local:** `localStorage` para el último protocolo, idioma y feedback offline.
*   **Despliegue:** Servidor estático (HTTP 5500 durante desarrollo).

### 2.2 Backend (API RESTful)
*   **Tecnologías:** Flask (Python).
*   **Funcionalidades Clave:**
    *   **Endpoints:**
        *   `/health`: Verificación de estado.
        *   `/understand`: Procesamiento de lenguaje natural (NLP) para interpretar la intención del usuario.
        *   `/protocol`: Gestión de protocolos de emergencia.
        *   `/next_step`: Avance en los pasos de un protocolo.
        *   `/feedback`: Recopilación de feedback.
    *   **CORS:** Habilitado para permitir solicitudes desde el frontend.
    *   **Rate-limiting:** Recomendado en producción (vía proxy).
*   **Datos:**
    *   `protocols.json`: Almacena los protocolos de emergencia.
    *   `metrics_log.csv`: Registro de métricas de uso.
*   **Despliegue:** HTTP 8000 durante desarrollo. En producción, Gunicorn detrás de un reverse proxy (Nginx/Caddy) con HTTPS.

## 3. Base de Datos / Almacenamiento de Datos
*   **Archivos JSON/CSV:** `protocols.json` y `metrics_log.csv` se utilizarán para almacenar datos estructurados. No se especifica una base de datos relacional o NoSQL, lo que sugiere un enfoque basado en archivos para el MVP.
*   **Almacenamiento en Cliente:** `localStorage` para datos temporales y offline.

## 4. Despliegue
*   **Desarrollo:** Servidor estático para frontend (HTTP 5500) y Flask para backend (HTTP 8000).
*   **Producción:**
    *   **Frontend:** Servidor web (Nginx/Caddy) sirviendo la PWA.
    *   **Backend:** Gunicorn como servidor WSGI para Flask, detrás de un reverse proxy (Nginx/Caddy) para HTTPS y balanceo de carga.

## 5. Consideraciones de Seguridad y Privacidad
*   Minimización de datos.
*   Anonimización de `session_id`.
*   HTTPS recomendado.
*   Gestión de secretos vía variables de entorno.
*   No almacenar contenido sensible.
*   Aviso legal claro.

## 6. Herramientas y Entorno de Desarrollo
*   **Python:** Para el backend Flask.
*   **JavaScript/HTML/CSS:** Para el frontend PWA.
*   **Control de Versiones:** Git.
*   **Entorno:** Sandbox de Ubuntu 22.04 con acceso a internet y herramientas de desarrollo estándar.
