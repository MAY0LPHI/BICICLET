# 📱 Guia de Build Mobile (Android)

Este documento descreve como configurar o ambiente e gerar o APK Android do Sistema de Gerenciamento de Bicicletário usando Capacitor.

## Índice

- [Requisitos](#requisitos)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Build de Debug](#build-de-debug)
- [Build de Release](#build-de-release)
- [Troubleshooting](#troubleshooting)

---

## Requisitos

### Software Necessário

| Software | Versão Mínima | Download |
|----------|--------------|----------|
| Node.js | 18 LTS | [nodejs.org](https://nodejs.org/) |
| Java JDK | 17 | [Adoptium](https://adoptium.net/) |
| Android Studio | Latest | [developer.android.com](https://developer.android.com/studio) |
| Android SDK | API 33+ | Via Android Studio |

### Variáveis de Ambiente (Windows)

```batch
set JAVA_HOME=C:\Program Files\Java\jdk-17
set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

### Variáveis de Ambiente (Linux/Mac)

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

---

## Configuração do Ambiente

### 1. Instalar Dependências do Projeto

```bash
npm install
```

### 2. Inicializar Capacitor (primeira vez)

```bash
npm run cap:init
npm run cap:add:android
```

### 3. Sincronizar Projeto

Sempre que alterar arquivos web:

```bash
npm run cap:sync
```

### 4. Abrir no Android Studio

```bash
npm run cap:open:android
```

---

## Build de Debug

### Método 1: Via NPM

```bash
npm run build:android
```

O APK será gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`

### Método 2: Via Android Studio

1. Abra o projeto: `npm run cap:open:android`
2. Aguarde a sincronização do Gradle
3. Clique em **Build > Build Bundle(s) / APK(s) > Build APK(s)**
4. O APK estará em `android/app/build/outputs/apk/debug/`

### Método 3: Via Linha de Comando

```bash
cd android
./gradlew assembleDebug
```

---

## Build de Release

### 1. Gerar Keystore (primeira vez)

```bash
keytool -genkey -v -keystore release-key.keystore -alias bicicletario -keyalg RSA -keysize 2048 -validity 10000
```

**Guarde a senha em local seguro!**

### 2. Configurar Assinatura

Crie o arquivo `android/keystore.properties`:

```properties
storeFile=../release-key.keystore
storePassword=SUA_SENHA_AQUI
keyAlias=bicicletario
keyPassword=SUA_SENHA_AQUI
```

### 3. Build Release

```bash
npm run build:android:release
```

Ou manualmente:

```bash
cd android
./gradlew assembleRelease
```

O APK assinado estará em: `android/app/build/outputs/apk/release/app-release.apk`

### 4. Build App Bundle (AAB) para Play Store

```bash
cd android
./gradlew bundleRelease
```

O AAB estará em: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Instalação do APK

### Via ADB

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via Dispositivo

1. Copie o APK para o dispositivo
2. Abra um gerenciador de arquivos
3. Toque no APK para instalar
4. Permita "Fontes desconhecidas" se solicitado

---

## Estrutura do Projeto Android

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/          # Código Java/Kotlin
│   │       ├── res/           # Recursos (ícones, layouts)
│   │       └── AndroidManifest.xml
│   ├── build.gradle           # Config do módulo
│   └── proguard-rules.pro     # Regras de ofuscação
├── gradle/
├── build.gradle               # Config do projeto
├── settings.gradle
└── gradlew                    # Wrapper do Gradle
```

---

## Customização

### Ícone do App

Substitua os arquivos em:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`

Ou use o **Image Asset Studio** no Android Studio:
1. Clique direito em `res` > **New > Image Asset**
2. Selecione a imagem fonte
3. Gere para todas as densidades

### Splash Screen

Configure em `capacitor.config.ts`:

```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    backgroundColor: '#3b82f6',
    showSpinner: true,
    spinnerColor: '#ffffff'
  }
}
```

### Cores do Tema

Edite `android/app/src/main/res/values/colors.xml`:

```xml
<resources>
    <color name="colorPrimary">#3b82f6</color>
    <color name="colorPrimaryDark">#2563eb</color>
    <color name="colorAccent">#60a5fa</color>
</resources>
```

---

## Troubleshooting

### Erro: "SDK location not found"

Crie o arquivo `android/local.properties`:

```properties
sdk.dir=C:\\Users\\SeuUsuario\\AppData\\Local\\Android\\Sdk
```

### Erro: "Could not find tools.jar"

Verifique se `JAVA_HOME` aponta para o JDK, não para o JRE.

### Erro: "License for package Android SDK not accepted"

```bash
cd $ANDROID_HOME/tools/bin
./sdkmanager --licenses
```

### Build muito lento

Adicione em `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=1024m
org.gradle.parallel=true
org.gradle.caching=true
```

### APK não instala no dispositivo

1. Verifique se a depuração USB está ativada
2. Verifique se o dispositivo está conectado: `adb devices`
3. Verifique se a versão do Android é compatível (API 21+)

### Erro: "Capacitor plugin not found"

```bash
npm install
npx cap sync android
```

---

## Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run cap:sync` | Sincroniza web assets com Android |
| `npm run cap:open:android` | Abre no Android Studio |
| `npm run build:android` | Build debug APK |
| `npm run build:android:release` | Build release APK |
| `adb devices` | Lista dispositivos conectados |
| `adb logcat` | Ver logs do dispositivo |

---

## Próximos Passos

Após gerar o APK de release:

1. **Teste em múltiplos dispositivos**
2. **Publique na Google Play Store** (requer conta de desenvolvedor)
3. **Configure CI/CD** para builds automáticos (ver [CI-CD.md](CI-CD.md))

---

## Links Úteis

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Documentação Android](https://developer.android.com/docs)
- [Guia de Publicação Play Store](https://support.google.com/googleplay/android-developer/answer/9859152)
