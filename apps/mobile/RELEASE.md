# Cómo generar la versión de Google Play (AAB) y el APK

La carpeta `android/` no se sube al repo: se genera con `npx expo prebuild -p android`.
Estos son los pasos completos para reproducir la compilación firmada.

## Requisitos

- Node 18+, JDK 17, Android SDK con `platforms;android-35` y `build-tools;35.0.0`
- La **clave de subida** `fitcoach-upload.keystore` (guárdala fuera del repo; si se
  pierde, se puede restablecer desde Google Play Console → Play App Signing)

## Pasos

```bash
cd apps/mobile
npm install
npx expo prebuild -p android          # regenera android/ desde app.json
```

En `android/gradle.properties` añade (Google Play exige target API 35):

```properties
android.compileSdkVersion=35
android.targetSdkVersion=35
android.buildToolsVersion=35.0.0
android.suppressUnsupportedCompileSdk=35
```

En `android/app/build.gradle`, dentro de `signingConfigs`, añade la configuración
de release (lee la clave por propiedades, sin contraseñas en el código):

```groovy
release {
    if (findProperty('FITCOACH_UPLOAD_STORE_FILE')) {
        storeFile file(findProperty('FITCOACH_UPLOAD_STORE_FILE'))
        storePassword findProperty('FITCOACH_UPLOAD_STORE_PASSWORD')
        keyAlias findProperty('FITCOACH_UPLOAD_KEY_ALIAS')
        keyPassword findProperty('FITCOACH_UPLOAD_KEY_PASSWORD')
    }
}
```

y en `buildTypes.release` usa `signingConfigs.release` cuando la propiedad esté
definida (con la de debug como reserva para desarrollo).

Compila firmando con la clave de subida:

```bash
cd android
./gradlew :app:bundleRelease :app:assembleRelease \
  -PFITCOACH_UPLOAD_STORE_FILE=/ruta/a/fitcoach-upload.keystore \
  -PFITCOACH_UPLOAD_STORE_PASSWORD=... \
  -PFITCOACH_UPLOAD_KEY_ALIAS=fitcoach-upload \
  -PFITCOACH_UPLOAD_KEY_PASSWORD=...
```

Resultados:

- **AAB para Google Play**: `android/app/build/outputs/bundle/release/app-release.aab`
- **APK para instalar directo**: `android/app/build/outputs/apk/release/app-release.apk`

## Nueva versión

Antes de cada subida a Play incrementa en `app.json`:

- `expo.version` (ej. 1.1.0 → 1.2.0)
- `expo.android.versionCode` (ej. 2 → 3; Play exige que siempre suba)

## Nota sobre pagos

La app **no** enlaza a la pasarela de pago externa (política de Google Play para
suscripciones digitales): la pantalla de inicio solo informa de que la
suscripción se gestiona desde la web.
