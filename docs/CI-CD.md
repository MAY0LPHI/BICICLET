# 🔄 Guia de CI/CD com GitHub Actions

Este documento descreve os workflows de CI/CD configurados para o Sistema de Gerenciamento de Bicicletário.

## Índice

- [Visão Geral](#visão-geral)
- [Workflow de CI](#workflow-de-ci)
- [Workflow de Release](#workflow-de-release)
- [Configuração de Secrets](#configuração-de-secrets)
- [Disparando Builds Manualmente](#disparando-builds-manualmente)
- [Artefatos](#artefatos)

---

## Visão Geral

O projeto utiliza dois workflows principais:

| Workflow | Arquivo | Trigger | Propósito |
|----------|---------|---------|-----------|
| CI Pipeline | `ci.yml` | Push/PR para `main` | Validação contínua |
| Release Pipeline | `release.yml` | Tags `v*` | Build de produção |

---

## Workflow de CI

### Localização
`.github/workflows/ci.yml`

### Triggers

- **Push** para branch `main`
- **Pull Request** para branch `main`

### Jobs

#### 1. Lint
Verifica a qualidade do código com ESLint.

```yaml
- Checkout do código
- Setup Node.js 18
- Instalação de dependências
- Execução do ESLint
```

#### 2. Test
Executa testes automatizados (quando disponíveis).

```yaml
- Checkout do código
- Setup Node.js 18
- Instalação de dependências
- Execução dos testes
```

#### 3. Build Desktop (Windows)
Compila a aplicação Electron para Windows.

```yaml
- Checkout do código
- Setup Node.js 18
- Instalação de dependências
- Build com electron-builder
- Upload do artefato .exe
```

#### 4. Build Mobile (Android)
Compila a aplicação Capacitor para Android.

```yaml
- Checkout do código
- Setup Node.js 18
- Setup Java JDK 17
- Setup Android SDK
- Instalação de dependências
- Inicialização do Capacitor
- Sync do Capacitor
- Build do APK de debug
- Upload do artefato .apk
```

### Fluxo de Execução

```
Push/PR → Lint → Test → Build Desktop
                    ↘ Build Mobile
```

---

## Workflow de Release

### Localização
`.github/workflows/release.yml`

### Triggers

Tags que começam com `v`, exemplo:
- `v1.0.0`
- `v2.0.0-beta`
- `v3.1.2`

### Como Criar uma Release

```bash
# Criar tag
git tag v1.0.0

# Push da tag
git push origin v1.0.0
```

### Jobs

#### 1. Build Desktop Release
- Compila o executável Windows de produção
- Gera instalador NSIS

#### 2. Build Mobile Release
- Compila APK de release (assinado)
- Compila AAB para Google Play Store

#### 3. Create Release
- Cria uma Release no GitHub
- Anexa todos os artefatos:
  - `.exe` (Windows)
  - `.apk` (Android APK)
  - `.aab` (Android App Bundle)

---

## Configuração de Secrets

### Secrets Obrigatórios

Nenhum secret é obrigatório para builds de debug.

### Secrets para Release Assinado

Para builds de release Android assinados, configure:

| Secret | Descrição |
|--------|-----------|
| `ANDROID_KEYSTORE` | Keystore em Base64 |
| `KEYSTORE_PASSWORD` | Senha do keystore |
| `KEY_ALIAS` | Alias da chave |
| `KEY_PASSWORD` | Senha da chave |

### Como Configurar Secrets

1. Vá em **Settings** do repositório
2. Clique em **Secrets and variables > Actions**
3. Clique em **New repository secret**
4. Adicione cada secret

### Converter Keystore para Base64

```bash
base64 -i release-key.keystore -o keystore-base64.txt
```

Cole o conteúdo do arquivo como valor do secret `ANDROID_KEYSTORE`.

---

## Disparando Builds Manualmente

### Via GitHub UI

1. Vá na aba **Actions**
2. Selecione o workflow desejado
3. Clique em **Run workflow**
4. Selecione a branch
5. Clique em **Run workflow**

### Via GitHub CLI

```bash
# CI Pipeline
gh workflow run ci.yml

# Release (requer tag)
git tag v1.0.0
git push origin v1.0.0
```

---

## Artefatos

### Download de Artefatos

1. Vá na aba **Actions**
2. Clique no workflow run desejado
3. Role até a seção **Artifacts**
4. Clique para baixar

### Artefatos Disponíveis

| Nome | Conteúdo | Retenção |
|------|----------|----------|
| `desktop-windows` | Instalador .exe | 7 dias |
| `android-debug-apk` | APK de debug | 7 dias |
| `desktop-windows-release` | Instalador .exe de produção | 30 dias |
| `android-release-apk` | APK de release | 30 dias |
| `android-release-aab` | AAB para Play Store | 30 dias |

---

## Status Badges

Adicione ao README para mostrar status do CI:

```markdown
![CI](https://github.com/SEU_USUARIO/BICICLETARIO/actions/workflows/ci.yml/badge.svg)
```

### Badges Disponíveis

```markdown
# CI Status
![CI](https://github.com/SEU_USUARIO/BICICLETARIO/actions/workflows/ci.yml/badge.svg)

# Release Status
![Release](https://github.com/SEU_USUARIO/BICICLETARIO/actions/workflows/release.yml/badge.svg)

# Latest Release
![GitHub release](https://img.shields.io/github/v/release/SEU_USUARIO/BICICLETARIO)
```

---

## Matriz de Compatibilidade

### Versões de Node.js

| Job | Node.js |
|-----|---------|
| Lint | 18 LTS |
| Test | 18 LTS |
| Build Desktop | 18 LTS |
| Build Mobile | 18 LTS |

### Versões do Android

| Componente | Versão |
|------------|--------|
| Java JDK | 17 |
| Android SDK | API 33+ |
| Gradle | 8.x |
| Capacitor | 5.x |

### Runners

| Plataforma | Runner |
|------------|--------|
| Linux | ubuntu-latest |
| Windows | windows-latest |

---

## Troubleshooting

### Build Desktop Falha

- Verifique se todas as dependências estão no `package.json`
- Verifique os logs de erro do electron-builder

### Build Mobile Falha

- Verifique se o Android SDK está configurado corretamente
- Verifique se o Capacitor está sincronizado

### Artefatos Não Aparecem

- Verifique se o job completou com sucesso
- Verifique o caminho do artefato no workflow

### Release Não Cria

- Verifique se a tag segue o padrão `v*`
- Verifique as permissões do `GITHUB_TOKEN`

---

## Personalização

### Adicionar Notificações

```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    fields: repo,message,author
```

### Adicionar Cache

```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Build para Outras Plataformas

```yaml
# macOS
- runs-on: macos-latest
- npm run build:mac

# Linux
- runs-on: ubuntu-latest
- npm run build:linux
```

---

## Links Úteis

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Electron Builder](https://www.electron.build/)
- [Capacitor Android](https://capacitorjs.com/docs/android)
